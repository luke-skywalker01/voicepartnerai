"""
PHASE 5: Security & Resilienz - Der Wächter
Rate Limiting, Input Validation, Security Headers und Monitoring
"""

import time
import json
import logging
from typing import Dict, Any, Optional, Set
from datetime import datetime, timedelta
import hashlib
import secrets
from functools import wraps

from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive Security Middleware für Production"""
    
    def __init__(self, app, redis_client: redis.Redis, config: Dict[str, Any] = None):
        super().__init__(app)
        self.redis = redis_client
        self.config = config or {}
        
        # Security Configuration
        self.rate_limit_requests = self.config.get("rate_limit_requests", 1000)
        self.rate_limit_window = self.config.get("rate_limit_window", 3600)  # 1 Stunde
        self.max_request_size = self.config.get("max_request_size", 10 * 1024 * 1024)  # 10MB
        self.blocked_ips: Set[str] = set(self.config.get("blocked_ips", []))
        self.allowed_origins = self.config.get("allowed_origins", ["*"])
        
        # Threat Detection
        self.suspicious_patterns = [
            r"union\s+select",
            r"<script",
            r"javascript:",
            r"eval\s*\(",
            r"exec\s*\(",
            r"subprocess",
            r"system\s*\(",
            r"\.\.\/",
            r"__import__"
        ]
        
        # Security Headers
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Hauptverarbeitung der Security Middleware"""
        start_time = time.time()
        
        try:
            # 1. IP Blocking Check
            client_ip = self._get_client_ip(request)
            if client_ip in self.blocked_ips:
                logger.warning(f"Blocked IP attempted access: {client_ip}")
                raise HTTPException(status_code=403, detail="Access denied")
            
            # 2. Rate Limiting
            await self._check_rate_limit(client_ip, request.url.path)
            
            # 3. Request Size Check
            await self._check_request_size(request)
            
            # 4. Malicious Content Detection
            await self._check_malicious_content(request)
            
            # 5. API Key Validation (für API Routes)
            if request.url.path.startswith("/api/"):
                await self._validate_api_request(request)
            
            # Request weiterleiten
            response = await call_next(request)
            
            # 6. Security Headers hinzufügen
            self._add_security_headers(response)
            
            # 7. Response Monitoring
            await self._log_request_response(request, response, start_time)
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            # Bei kritischen Fehlern: Sicher versagen
            raise HTTPException(status_code=500, detail="Security check failed")
    
    async def _check_rate_limit(self, client_ip: str, path: str):
        """Rate Limiting pro IP und Endpoint"""
        try:
            # Verschiedene Rate Limits für verschiedene Endpoints
            if path.startswith("/api/calls/"):
                limit = 100  # Weniger für Call-Endpoints
                window = 3600
            elif path.startswith("/api/"):
                limit = self.rate_limit_requests
                window = self.rate_limit_window
            else:
                limit = 2000  # Mehr für Frontend
                window = 3600
            
            # Redis Key für Rate Limiting
            key = f"rate_limit:{client_ip}:{path.split('/')[1] if '/' in path else 'root'}"
            
            # Sliding Window Rate Limiting
            current_time = int(time.time())
            window_start = current_time - window
            
            # Aktuelle Requests in Window zählen
            await self.redis.zremrangebyscore(key, 0, window_start)
            current_requests = await self.redis.zcard(key)
            
            if current_requests >= limit:
                # Rate Limit exceeded - in Redis loggen
                await self.redis.setex(f"rate_limit_exceeded:{client_ip}", 300, current_time)
                logger.warning(f"Rate limit exceeded for IP {client_ip} on path {path}")
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Max {limit} requests per {window} seconds.",
                    headers={"Retry-After": str(window)}
                )
            
            # Request zu Window hinzufügen
            await self.redis.zadd(key, {str(current_time): current_time})
            await self.redis.expire(key, window)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Bei Redis-Fehlern: Durchlassen (Fail Open für Verfügbarkeit)
    
    async def _check_request_size(self, request: Request):
        """Request Size Validation"""
        try:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_request_size:
                logger.warning(f"Request too large: {content_length} bytes from {self._get_client_ip(request)}")
                raise HTTPException(status_code=413, detail="Request entity too large")
        except ValueError:
            # Invalid content-length header
            pass
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Request size check error: {e}")
    
    async def _check_malicious_content(self, request: Request):
        """Erkennung von Malicious Content"""
        try:
            # Query Parameters prüfen
            query_string = str(request.url.query).lower()
            
            # Headers prüfen
            suspicious_headers = []
            for header_name, header_value in request.headers.items():
                suspicious_headers.append(f"{header_name}: {header_value}".lower())
            
            # Content prüfen (falls verfügbar)
            content_to_check = [query_string] + suspicious_headers
            
            for content in content_to_check:
                for pattern in self.suspicious_patterns:
                    if pattern in content:
                        client_ip = self._get_client_ip(request)
                        logger.critical(f"Malicious content detected from IP {client_ip}: Pattern '{pattern}' in '{content[:100]}'")
                        
                        # IP temporär blockieren
                        await self._add_to_temp_blocklist(client_ip, f"Malicious pattern: {pattern}")
                        
                        raise HTTPException(status_code=400, detail="Malicious content detected")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Malicious content check error: {e}")
    
    async def _validate_api_request(self, request: Request):
        """API Request Validation"""
        try:
            # Skip für öffentliche Endpoints
            if request.url.path in ["/api/health", "/docs", "/redoc", "/openapi.json"]:
                return
            
            # Authorization Header prüfen
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
            
            # API Key extrahieren und validieren
            api_key = auth_header.replace("Bearer ", "")
            if not self._validate_api_key_format(api_key):
                client_ip = self._get_client_ip(request)
                logger.warning(f"Invalid API key format from IP {client_ip}")
                raise HTTPException(status_code=401, detail="Invalid API key format")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"API request validation error: {e}")
    
    def _validate_api_key_format(self, api_key: str) -> bool:
        """Validiert API Key Format"""
        # Mindestlänge und Format prüfen
        if len(api_key) < 10 or len(api_key) > 100:
            return False
        
        # Nur alphanumerische Zeichen und Bindestriche
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
        return all(c in allowed_chars for c in api_key)
    
    async def _add_to_temp_blocklist(self, ip: str, reason: str):
        """Fügt IP temporär zur Blocklist hinzu"""
        try:
            await self.redis.setex(f"temp_blocked:{ip}", 3600, reason)  # 1 Stunde
            logger.info(f"Temporarily blocked IP {ip}: {reason}")
        except Exception as e:
            logger.error(f"Failed to add IP to temp blocklist: {e}")
    
    def _add_security_headers(self, response: Response):
        """Fügt Security Headers zur Response hinzu"""
        for header_name, header_value in self.security_headers.items():
            response.headers[header_name] = header_value
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrahiert Client IP aus Request"""
        # X-Forwarded-For Header (für Reverse Proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # X-Real-IP Header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback: Direct Client IP
        return request.client.host if request.client else "unknown"
    
    async def _log_request_response(self, request: Request, response: Response, start_time: float):
        """Loggt Request/Response für Monitoring"""
        try:
            duration = time.time() - start_time
            client_ip = self._get_client_ip(request)
            
            log_data = {
                "timestamp": datetime.now().isoformat(),
                "client_ip": client_ip,
                "method": request.method,
                "path": str(request.url.path),
                "query_params": str(request.url.query) if request.url.query else None,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "user_agent": request.headers.get("user-agent", "unknown")[:200],
                "response_size": response.headers.get("content-length")
            }
            
            # Kritische Events loggen
            if response.status_code >= 400:
                logger.warning(f"HTTP {response.status_code}: {request.method} {request.url.path} from {client_ip}")
            
            # Performance Monitoring
            if duration > 5.0:  # Langsame Requests
                logger.warning(f"Slow request: {duration:.2f}s for {request.method} {request.url.path}")
            
            # Monitoring Data in Redis speichern
            await self._store_monitoring_data(log_data)
            
        except Exception as e:
            logger.error(f"Failed to log request/response: {e}")
    
    async def _store_monitoring_data(self, log_data: Dict[str, Any]):
        """Speichert Monitoring-Daten in Redis"""
        try:
            # Tägliche Statistiken
            date_key = datetime.now().strftime("%Y-%m-%d")
            monitoring_key = f"monitoring:{date_key}"
            
            # Request Counter erhöhen
            await self.redis.hincrby(monitoring_key, "total_requests", 1)
            await self.redis.hincrby(monitoring_key, f"status_{log_data['status_code']}", 1)
            
            # Fehler-Tracking
            if log_data["status_code"] >= 400:
                error_key = f"errors:{date_key}"
                await self.redis.lpush(error_key, json.dumps(log_data))
                await self.redis.ltrim(error_key, 0, 1000)  # Nur letzte 1000 Fehler
                await self.redis.expire(error_key, 86400 * 7)  # 7 Tage
            
            # TTL für Monitoring Keys
            await self.redis.expire(monitoring_key, 86400 * 30)  # 30 Tage
            
        except Exception as e:
            logger.error(f"Failed to store monitoring data: {e}")


class APIKeyManager:
    """API Key Management mit Redis Backend"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def generate_api_key(self, user_id: str, plan: str = "standard") -> str:
        """Generiert neuen API Key für User"""
        try:
            # Sicheren API Key generieren
            api_key = f"vpai_{secrets.token_urlsafe(32)}"
            
            # API Key Metadaten
            key_data = {
                "user_id": user_id,
                "plan": plan,
                "created_at": datetime.now().isoformat(),
                "last_used": None,
                "requests_count": 0,
                "status": "active"
            }
            
            # In Redis speichern
            await self.redis.hset(f"api_key:{api_key}", mapping=key_data)
            await self.redis.sadd(f"user_keys:{user_id}", api_key)
            
            logger.info(f"Generated API key for user {user_id}")
            return api_key
            
        except Exception as e:
            logger.error(f"Failed to generate API key: {e}")
            raise
    
    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validiert API Key und gibt User-Daten zurück"""
        try:
            key_data = await self.redis.hgetall(f"api_key:{api_key}")
            
            if not key_data or key_data.get("status") != "active":
                return None
            
            # Last used aktualisieren
            await self.redis.hset(f"api_key:{api_key}", "last_used", datetime.now().isoformat())
            await self.redis.hincrby(f"api_key:{api_key}", "requests_count", 1)
            
            return {
                "user_id": key_data["user_id"],
                "plan": key_data["plan"],
                "api_key": api_key
            }
            
        except Exception as e:
            logger.error(f"Failed to validate API key: {e}")
            return None
    
    async def revoke_api_key(self, api_key: str) -> bool:
        """Widerruft API Key"""
        try:
            # Status auf revoked setzen
            await self.redis.hset(f"api_key:{api_key}", "status", "revoked")
            await self.redis.hset(f"api_key:{api_key}", "revoked_at", datetime.now().isoformat())
            
            logger.info(f"Revoked API key: {api_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke API key: {e}")
            return False


def security_monitoring_decorator(redis_client: redis.Redis):
    """Decorator für zusätzliches Function-Level Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            function_name = func.__name__
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Performance Monitoring
                await redis_client.lpush(
                    f"function_performance:{function_name}",
                    json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "duration_ms": round(duration * 1000, 2),
                        "status": "success"
                    })
                )
                await redis_client.ltrim(f"function_performance:{function_name}", 0, 100)
                
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                
                # Error Monitoring
                await redis_client.lpush(
                    f"function_errors:{function_name}",
                    json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "duration_ms": round(duration * 1000, 2),
                        "error": str(e),
                        "status": "error"
                    })
                )
                await redis_client.ltrim(f"function_errors:{function_name}", 0, 100)
                
                raise
        
        return wrapper
    return decorator