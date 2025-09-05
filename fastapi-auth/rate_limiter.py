"""
Rate Limiting System for VoicePartnerAI
Protects critical endpoints from abuse and implements various rate limiting strategies
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple, Callable, Any
from dataclasses import dataclass
from enum import Enum
import hashlib
import json

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
from sqlalchemy.orm import Session

from audit_log import AuditLogger, AuditContext, AuditEventType, AuditSeverity

logger = logging.getLogger(__name__)


class RateLimitStrategy(str, Enum):
    """Rate limiting strategies."""
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"


class RateLimitScope(str, Enum):
    """Rate limiting scopes."""
    GLOBAL = "global"
    PER_IP = "per_ip"
    PER_USER = "per_user"
    PER_API_KEY = "per_api_key"
    PER_ENDPOINT = "per_endpoint"


@dataclass
class RateLimitRule:
    """Rate limiting rule configuration."""
    key: str
    requests: int
    window_seconds: int
    strategy: RateLimitStrategy = RateLimitStrategy.FIXED_WINDOW
    scope: RateLimitScope = RateLimitScope.PER_IP
    burst_allowance: int = 0  # Extra requests allowed in burst
    block_duration_seconds: int = 3600  # How long to block after limit exceeded


@dataclass
class RateLimitResult:
    """Result of rate limit check."""
    allowed: bool
    requests_remaining: int
    reset_time: int
    retry_after: Optional[int] = None
    current_usage: int = 0
    limit: int = 0


class RateLimitStorage:
    """Storage backend for rate limiting data."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.memory_storage = {}  # Fallback to memory if Redis unavailable
        self.use_redis = redis_client is not None
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get rate limit data for a key."""
        try:
            if self.use_redis:
                data = self.redis_client.get(key)
                return json.loads(data) if data else None
            else:
                return self.memory_storage.get(key)
        except Exception as e:
            logger.error(f"Failed to get rate limit data for {key}: {e}")
            return None
    
    async def set(self, key: str, data: Dict[str, Any], expire_seconds: int):
        """Set rate limit data for a key."""
        try:
            if self.use_redis:
                self.redis_client.setex(
                    key, 
                    expire_seconds, 
                    json.dumps(data, default=str)
                )
            else:
                # Simple memory storage with expiration
                expire_time = time.time() + expire_seconds
                self.memory_storage[key] = {
                    **data,
                    '_expire_time': expire_time
                }
        except Exception as e:
            logger.error(f"Failed to set rate limit data for {key}: {e}")
    
    async def increment(self, key: str, window_seconds: int) -> int:
        """Increment counter and return current value."""
        try:
            if self.use_redis:
                pipeline = self.redis_client.pipeline()
                pipeline.incr(key)
                pipeline.expire(key, window_seconds)
                results = pipeline.execute()
                return results[0]
            else:
                # Memory storage increment
                current_time = time.time()
                if key not in self.memory_storage:
                    self.memory_storage[key] = {
                        'count': 1,
                        '_expire_time': current_time + window_seconds
                    }
                    return 1
                
                data = self.memory_storage[key]
                if current_time > data.get('_expire_time', 0):
                    # Expired, reset
                    self.memory_storage[key] = {
                        'count': 1,
                        '_expire_time': current_time + window_seconds
                    }
                    return 1
                else:
                    data['count'] += 1
                    return data['count']
        except Exception as e:
            logger.error(f"Failed to increment rate limit counter for {key}: {e}")
            return 1
    
    async def cleanup_expired(self):
        """Clean up expired entries from memory storage."""
        if not self.use_redis:
            current_time = time.time()
            expired_keys = [
                key for key, data in self.memory_storage.items()
                if isinstance(data, dict) and current_time > data.get('_expire_time', 0)
            ]
            for key in expired_keys:
                del self.memory_storage[key]


class RateLimiter:
    """Advanced rate limiter with multiple strategies."""
    
    def __init__(self, storage: Optional[RateLimitStorage] = None):
        self.storage = storage or RateLimitStorage()
        self.rules: Dict[str, RateLimitRule] = {}
        self.blocked_ips: Dict[str, datetime] = {}
    
    def add_rule(self, rule: RateLimitRule):
        """Add a rate limiting rule."""
        self.rules[rule.key] = rule
        logger.info(f"Added rate limit rule: {rule.key} - {rule.requests}/{rule.window_seconds}s")
    
    async def check_rate_limit(
        self,
        request: Request,
        rule_key: str,
        identifier: Optional[str] = None
    ) -> RateLimitResult:
        """Check if request is within rate limits."""
        rule = self.rules.get(rule_key)
        if not rule:
            # No rule defined, allow request
            return RateLimitResult(
                allowed=True,
                requests_remaining=float('inf'),
                reset_time=int(time.time() + 3600),
                current_usage=0,
                limit=float('inf')
            )
        
        # Generate rate limit key based on scope
        rate_key = await self._generate_rate_key(request, rule, identifier)
        
        # Check if IP is blocked
        if await self._is_blocked(rate_key):
            return RateLimitResult(
                allowed=False,
                requests_remaining=0,
                reset_time=int(time.time() + rule.block_duration_seconds),
                retry_after=rule.block_duration_seconds,
                current_usage=rule.requests,
                limit=rule.requests
            )
        
        # Apply rate limiting strategy
        if rule.strategy == RateLimitStrategy.FIXED_WINDOW:
            return await self._fixed_window_check(rule, rate_key)
        elif rule.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return await self._sliding_window_check(rule, rate_key)
        elif rule.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return await self._token_bucket_check(rule, rate_key)
        else:
            # Default to fixed window
            return await self._fixed_window_check(rule, rate_key)
    
    async def _generate_rate_key(
        self,
        request: Request,
        rule: RateLimitRule,
        identifier: Optional[str]
    ) -> str:
        """Generate rate limiting key based on scope."""
        base_key = f"rate_limit:{rule.key}"
        
        if rule.scope == RateLimitScope.GLOBAL:
            return f"{base_key}:global"
        elif rule.scope == RateLimitScope.PER_IP:
            ip = request.client.host if request.client else "unknown"
            return f"{base_key}:ip:{ip}"
        elif rule.scope == RateLimitScope.PER_USER:
            user_id = identifier or "anonymous"
            return f"{base_key}:user:{user_id}"
        elif rule.scope == RateLimitScope.PER_API_KEY:
            api_key = identifier or "no_key"
            return f"{base_key}:api_key:{hashlib.md5(api_key.encode()).hexdigest()}"
        elif rule.scope == RateLimitScope.PER_ENDPOINT:
            endpoint = request.url.path
            ip = request.client.host if request.client else "unknown"
            return f"{base_key}:endpoint:{endpoint}:ip:{ip}"
        else:
            return f"{base_key}:default"
    
    async def _fixed_window_check(self, rule: RateLimitRule, rate_key: str) -> RateLimitResult:
        """Fixed window rate limiting."""
        window_start = int(time.time() // rule.window_seconds) * rule.window_seconds
        window_key = f"{rate_key}:{window_start}"
        
        current_count = await self.storage.increment(window_key, rule.window_seconds)
        
        allowed = current_count <= rule.requests + rule.burst_allowance
        requests_remaining = max(0, rule.requests - current_count)
        reset_time = window_start + rule.window_seconds
        
        if not allowed:
            await self._record_violation(rate_key, rule)
        
        return RateLimitResult(
            allowed=allowed,
            requests_remaining=requests_remaining,
            reset_time=reset_time,
            current_usage=current_count,
            limit=rule.requests
        )
    
    async def _sliding_window_check(self, rule: RateLimitRule, rate_key: str) -> RateLimitResult:
        """Sliding window rate limiting."""
        current_time = time.time()
        window_start = current_time - rule.window_seconds
        
        # Use Redis sorted sets for sliding window
        if self.storage.use_redis:
            try:
                # Remove old entries
                self.storage.redis_client.zremrangebyscore(rate_key, 0, window_start)
                
                # Count current requests
                current_count = self.storage.redis_client.zcard(rate_key)
                
                allowed = current_count < rule.requests + rule.burst_allowance
                
                if allowed:
                    # Add current request
                    self.storage.redis_client.zadd(rate_key, {str(current_time): current_time})
                    self.storage.redis_client.expire(rate_key, rule.window_seconds)
                    current_count += 1
                
                requests_remaining = max(0, rule.requests - current_count)
                
                if not allowed:
                    await self._record_violation(rate_key, rule)
                
                return RateLimitResult(
                    allowed=allowed,
                    requests_remaining=requests_remaining,
                    reset_time=int(current_time + rule.window_seconds),
                    current_usage=current_count,
                    limit=rule.requests
                )
            except Exception as e:
                logger.error(f"Sliding window check failed: {e}")
                # Fallback to fixed window
                return await self._fixed_window_check(rule, rate_key)
        else:
            # Fallback to fixed window for memory storage
            return await self._fixed_window_check(rule, rate_key)
    
    async def _token_bucket_check(self, rule: RateLimitRule, rate_key: str) -> RateLimitResult:
        """Token bucket rate limiting."""
        current_time = time.time()
        bucket_key = f"{rate_key}:bucket"
        
        bucket_data = await self.storage.get(bucket_key) or {
            'tokens': rule.requests,
            'last_refill': current_time
        }
        
        # Calculate tokens to add based on time passed
        time_passed = current_time - bucket_data['last_refill']
        refill_rate = rule.requests / rule.window_seconds  # tokens per second
        tokens_to_add = int(time_passed * refill_rate)
        
        # Update bucket
        bucket_data['tokens'] = min(
            rule.requests + rule.burst_allowance,
            bucket_data['tokens'] + tokens_to_add
        )
        bucket_data['last_refill'] = current_time
        
        allowed = bucket_data['tokens'] >= 1
        
        if allowed:
            bucket_data['tokens'] -= 1
        
        # Save updated bucket
        await self.storage.set(bucket_key, bucket_data, rule.window_seconds * 2)
        
        if not allowed:
            await self._record_violation(rate_key, rule)
        
        return RateLimitResult(
            allowed=allowed,
            requests_remaining=int(bucket_data['tokens']),
            reset_time=int(current_time + rule.window_seconds),
            current_usage=rule.requests - int(bucket_data['tokens']),
            limit=rule.requests
        )
    
    async def _is_blocked(self, rate_key: str) -> bool:
        """Check if key is currently blocked."""
        block_key = f"{rate_key}:blocked"
        block_data = await self.storage.get(block_key)
        
        if block_data:
            blocked_until = block_data.get('blocked_until', 0)
            return time.time() < blocked_until
        
        return False
    
    async def _record_violation(self, rate_key: str, rule: RateLimitRule):
        """Record rate limit violation."""
        violation_key = f"{rate_key}:violations"
        current_time = time.time()
        
        violations_data = await self.storage.get(violation_key) or {
            'count': 0,
            'first_violation': current_time,
            'last_violation': current_time
        }
        
        violations_data['count'] += 1
        violations_data['last_violation'] = current_time
        
        # Block if too many violations
        if violations_data['count'] >= 5:  # Block after 5 violations
            block_key = f"{rate_key}:blocked"
            block_data = {
                'blocked_at': current_time,
                'blocked_until': current_time + rule.block_duration_seconds,
                'reason': 'Repeated rate limit violations'
            }
            await self.storage.set(block_key, block_data, rule.block_duration_seconds)
            
            logger.warning(f"Blocked rate key {rate_key} for {rule.block_duration_seconds} seconds")
        
        await self.storage.set(violation_key, violations_data, 3600)  # Keep for 1 hour


# Pre-configured rate limiting rules
def get_default_rate_limits() -> Dict[str, RateLimitRule]:
    """Get default rate limiting rules for common endpoints."""
    return {
        "auth_login": RateLimitRule(
            key="auth_login",
            requests=5,
            window_seconds=300,  # 5 attempts per 5 minutes
            strategy=RateLimitStrategy.FIXED_WINDOW,
            scope=RateLimitScope.PER_IP,
            block_duration_seconds=1800  # Block for 30 minutes
        ),
        "auth_register": RateLimitRule(
            key="auth_register",
            requests=3,
            window_seconds=3600,  # 3 registrations per hour
            strategy=RateLimitStrategy.FIXED_WINDOW,
            scope=RateLimitScope.PER_IP,
            block_duration_seconds=3600
        ),
        "password_reset": RateLimitRule(
            key="password_reset",
            requests=3,
            window_seconds=3600,  # 3 reset requests per hour
            strategy=RateLimitStrategy.SLIDING_WINDOW,
            scope=RateLimitScope.PER_IP,
            block_duration_seconds=3600
        ),
        "api_key_creation": RateLimitRule(
            key="api_key_creation",
            requests=10,
            window_seconds=3600,  # 10 API keys per hour
            strategy=RateLimitStrategy.FIXED_WINDOW,
            scope=RateLimitScope.PER_USER,
            block_duration_seconds=7200
        ),
        "api_requests": RateLimitRule(
            key="api_requests",
            requests=1000,
            window_seconds=3600,  # 1000 requests per hour
            strategy=RateLimitStrategy.TOKEN_BUCKET,
            scope=RateLimitScope.PER_API_KEY,
            burst_allowance=100,  # Allow burst of 100 extra requests
            block_duration_seconds=3600
        ),
        "data_export": RateLimitRule(
            key="data_export",
            requests=2,
            window_seconds=86400,  # 2 exports per day
            strategy=RateLimitStrategy.FIXED_WINDOW,
            scope=RateLimitScope.PER_USER,
            block_duration_seconds=86400
        ),
        "workspace_creation": RateLimitRule(
            key="workspace_creation",
            requests=5,
            window_seconds=86400,  # 5 workspaces per day
            strategy=RateLimitStrategy.FIXED_WINDOW,
            scope=RateLimitScope.PER_USER,
            block_duration_seconds=86400
        )
    }


# Global rate limiter instance
try:
    # Try to connect to Redis
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=False,
        socket_timeout=1
    )
    redis_client.ping()  # Test connection
    storage = RateLimitStorage(redis_client)
    logger.info("Rate limiter initialized with Redis storage")
except Exception as e:
    logger.warning(f"Redis unavailable, using memory storage: {e}")
    storage = RateLimitStorage()

rate_limiter = RateLimiter(storage)

# Load default rules
for rule in get_default_rate_limits().values():
    rate_limiter.add_rule(rule)


# FastAPI dependency and middleware
async def rate_limit_dependency(
    request: Request,
    rule_key: str,
    identifier: Optional[str] = None
):
    """FastAPI dependency for rate limiting."""
    result = await rate_limiter.check_rate_limit(request, rule_key, identifier)
    
    if not result.allowed:
        # Log rate limit violation
        try:
            # Get database session from request state if available
            db = getattr(request.state, 'db', None)
            if db:
                context = AuditContext.from_request(request)
                audit_logger = AuditLogger(db)
                
                await audit_logger.log_security_event(
                    event_type=AuditEventType.RATE_LIMIT_EXCEEDED,
                    context=context,
                    action=f"Rate limit exceeded for {rule_key}",
                    description=f"Rate limit exceeded: {result.current_usage}/{result.limit}",
                    metadata={
                        "rule_key": rule_key,
                        "current_usage": result.current_usage,
                        "limit": result.limit,
                        "retry_after": result.retry_after
                    }
                )
        except Exception as e:
            logger.error(f"Failed to log rate limit violation: {e}")
        
        headers = {
            "X-RateLimit-Limit": str(result.limit),
            "X-RateLimit-Remaining": str(result.requests_remaining),
            "X-RateLimit-Reset": str(result.reset_time)
        }
        
        if result.retry_after:
            headers["Retry-After"] = str(result.retry_after)
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Try again in {result.retry_after} seconds.",
                "retry_after": result.retry_after,
                "limit": result.limit,
                "remaining": result.requests_remaining,
                "reset": result.reset_time
            },
            headers=headers
        )
    
    return result


# Convenience functions for specific endpoints
async def check_login_rate_limit(request: Request):
    """Rate limit for login attempts."""
    return await rate_limit_dependency(request, "auth_login")


async def check_registration_rate_limit(request: Request):
    """Rate limit for user registration."""
    return await rate_limit_dependency(request, "auth_register")


async def check_api_rate_limit(request: Request, api_key: str):
    """Rate limit for API requests."""
    return await rate_limit_dependency(request, "api_requests", api_key)


async def check_password_reset_rate_limit(request: Request):
    """Rate limit for password reset requests."""
    return await rate_limit_dependency(request, "password_reset")


# Rate limiting middleware
class RateLimitMiddleware:
    """Middleware to add rate limiting headers to all responses."""
    
    def __init__(self, app, default_rule_key: str = "api_requests"):
        self.app = app
        self.default_rule_key = default_rule_key
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Check rate limit for the request
            try:
                result = await rate_limiter.check_rate_limit(
                    request, 
                    self.default_rule_key
                )
                
                # Add rate limit headers to response
                async def send_wrapper(message):
                    if message["type"] == "http.response.start":
                        headers = dict(message.get("headers", []))
                        headers[b"x-ratelimit-limit"] = str(result.limit).encode()
                        headers[b"x-ratelimit-remaining"] = str(result.requests_remaining).encode()
                        headers[b"x-ratelimit-reset"] = str(result.reset_time).encode()
                        message["headers"] = list(headers.items())
                    
                    await send(message)
                
                await self.app(scope, receive, send_wrapper)
                
            except Exception as e:
                logger.error(f"Rate limiting middleware error: {e}")
                await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)