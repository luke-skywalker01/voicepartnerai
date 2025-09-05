"""
PHASE 5: Fallback & Circuit Breaker System - Der Rettungsring
Intelligente Fallback-Logik und Circuit Breaker für hohe Verfügbarkeit
"""

import time
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Callable, Union
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class CircuitBreakerState(Enum):
    """Circuit Breaker States"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Circuit is open, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service is back

@dataclass
class CircuitBreakerConfig:
    """Circuit Breaker Configuration"""
    failure_threshold: int = 5           # Failures before opening circuit
    recovery_timeout: int = 60          # Seconds before trying half-open
    success_threshold: int = 3          # Successes needed to close circuit
    timeout_duration: float = 30.0     # Request timeout in seconds
    monitoring_window: int = 300        # Window for failure counting (seconds)

class CircuitBreakerError(Exception):
    """Exception raised when circuit breaker is open"""
    pass

class CircuitBreaker:
    """Circuit Breaker Implementation"""
    
    def __init__(self, name: str, config: CircuitBreakerConfig, redis_client: redis.Redis):
        self.name = name
        self.config = config
        self.redis = redis_client
        
        # Redis Keys
        self.state_key = f"circuit_breaker:{name}:state"
        self.failure_count_key = f"circuit_breaker:{name}:failures"
        self.last_failure_key = f"circuit_breaker:{name}:last_failure"
        self.success_count_key = f"circuit_breaker:{name}:successes"
    
    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        
        # Check current state
        state = await self._get_state()
        
        if state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has passed
            if await self._should_attempt_reset():
                await self._set_state(CircuitBreakerState.HALF_OPEN)
                logger.info(f"Circuit breaker {self.name} moved to HALF_OPEN")
            else:
                raise CircuitBreakerError(f"Circuit breaker {self.name} is OPEN")
        
        # Execute the function
        start_time = time.time()
        try:
            # Set timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.config.timeout_duration
            )
            
            # Success - record it
            await self._record_success()
            
            # If we were in HALF_OPEN, check if we can close
            if state == CircuitBreakerState.HALF_OPEN:
                success_count = await self._get_success_count()
                if success_count >= self.config.success_threshold:
                    await self._set_state(CircuitBreakerState.CLOSED)
                    await self._reset_counters()
                    logger.info(f"Circuit breaker {self.name} moved to CLOSED")
            
            return result
            
        except Exception as e:
            # Failure - record it
            await self._record_failure()
            
            # Check if we should open the circuit
            failure_count = await self._get_failure_count()
            if failure_count >= self.config.failure_threshold:
                await self._set_state(CircuitBreakerState.OPEN)
                logger.warning(f"Circuit breaker {self.name} moved to OPEN after {failure_count} failures")
            
            raise e
    
    async def _get_state(self) -> CircuitBreakerState:
        """Get current circuit breaker state"""
        state_str = await self.redis.get(self.state_key)
        if state_str:
            return CircuitBreakerState(state_str)
        return CircuitBreakerState.CLOSED
    
    async def _set_state(self, state: CircuitBreakerState):
        """Set circuit breaker state"""
        await self.redis.setex(self.state_key, 3600, state.value)
    
    async def _record_failure(self):
        """Record a failure"""
        current_time = time.time()
        
        # Increment failure count
        await self.redis.incr(self.failure_count_key)
        await self.redis.expire(self.failure_count_key, self.config.monitoring_window)
        
        # Update last failure time
        await self.redis.setex(self.last_failure_key, 3600, str(current_time))
        
        # Reset success count
        await self.redis.delete(self.success_count_key)
    
    async def _record_success(self):
        """Record a success"""
        # Increment success count
        await self.redis.incr(self.success_count_key)
        await self.redis.expire(self.success_count_key, self.config.monitoring_window)
        
        # Reset failure count if in normal operation
        state = await self._get_state()
        if state == CircuitBreakerState.CLOSED:
            await self.redis.delete(self.failure_count_key)
    
    async def _get_failure_count(self) -> int:
        """Get current failure count"""
        count = await self.redis.get(self.failure_count_key)
        return int(count) if count else 0
    
    async def _get_success_count(self) -> int:
        """Get current success count"""
        count = await self.redis.get(self.success_count_key)
        return int(count) if count else 0
    
    async def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        last_failure_str = await self.redis.get(self.last_failure_key)
        if not last_failure_str:
            return True
        
        last_failure_time = float(last_failure_str)
        return (time.time() - last_failure_time) > self.config.recovery_timeout
    
    async def _reset_counters(self):
        """Reset all counters"""
        await self.redis.delete(self.failure_count_key)
        await self.redis.delete(self.success_count_key)
        await self.redis.delete(self.last_failure_key)
    
    async def get_status(self) -> Dict[str, Any]:
        """Get circuit breaker status"""
        return {
            "name": self.name,
            "state": (await self._get_state()).value,
            "failure_count": await self._get_failure_count(),
            "success_count": await self._get_success_count(),
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "success_threshold": self.config.success_threshold,
                "timeout_duration": self.config.timeout_duration
            }
        }

class FallbackSystem:
    """Comprehensive Fallback System"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.circuit_breakers = {}
        
        # Default configurations
        self.default_cb_config = CircuitBreakerConfig()
        
        # Provider fallback chains
        self.fallback_chains = {
            "llm": [
                {"provider": "openai", "model": "gpt-4o", "priority": 1},
                {"provider": "openai", "model": "gpt-4o-mini", "priority": 2},
                {"provider": "openai", "model": "gpt-3.5-turbo", "priority": 3}
            ],
            "tts": [
                {"provider": "elevenlabs", "voice": "21m00Tcm4TlvDq8ikWAM", "priority": 1},
                {"provider": "elevenlabs", "voice": "EXAVITQu4vr4xnSDxMaL", "priority": 2}
            ],
            "stt": [
                {"provider": "deepgram", "model": "nova-2", "priority": 1},
                {"provider": "deepgram", "model": "base", "priority": 2},
                {"provider": "deepgram", "model": "enhanced", "priority": 3}
            ]
        }
        
        # Cache für Provider Verfügbarkeit
        self._provider_health_cache = {}
        self._cache_ttl = 300  # 5 Minuten
    
    def get_circuit_breaker(self, name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
        """Get or create circuit breaker"""
        if name not in self.circuit_breakers:
            cb_config = config or self.default_cb_config
            self.circuit_breakers[name] = CircuitBreaker(name, cb_config, self.redis)
        return self.circuit_breakers[name]
    
    async def execute_with_fallback(self, 
                                  service_type: str,
                                  operation: Callable,
                                  *args,
                                  **kwargs) -> Any:
        """
        Execute operation with fallback chain
        
        Args:
            service_type: Type of service (llm, tts, stt)
            operation: Function to execute
            *args, **kwargs: Arguments for the operation
        """
        
        if service_type not in self.fallback_chains:
            raise ValueError(f"Unknown service type: {service_type}")
        
        fallback_chain = await self._get_ordered_fallback_chain(service_type)
        last_exception = None
        
        for i, provider_config in enumerate(fallback_chain):
            provider_name = provider_config["provider"]
            cb_name = f"{service_type}_{provider_name}"
            
            # Get circuit breaker for this provider
            circuit_breaker = self.get_circuit_breaker(cb_name)
            
            try:
                logger.info(f"Attempting {service_type} operation with provider {provider_name} (attempt {i+1}/{len(fallback_chain)})")
                
                # Execute with circuit breaker protection
                result = await circuit_breaker.call(operation, provider_config, *args, **kwargs)
                
                # Success - update provider health
                await self._update_provider_health(service_type, provider_name, True)
                
                if i > 0:  # We used a fallback
                    logger.info(f"Fallback successful: {service_type} operation completed with {provider_name}")
                    await self._log_fallback_usage(service_type, provider_name, i)
                
                return result
                
            except CircuitBreakerError as e:
                logger.warning(f"Circuit breaker open for {provider_name}: {e}")
                last_exception = e
                continue
                
            except Exception as e:
                logger.error(f"Provider {provider_name} failed for {service_type}: {e}")
                await self._update_provider_health(service_type, provider_name, False)
                last_exception = e
                continue
        
        # All providers failed
        error_msg = f"All {service_type} providers failed"
        logger.error(error_msg)
        await self._log_complete_failure(service_type, str(last_exception))
        
        raise Exception(f"{error_msg}. Last error: {last_exception}")
    
    async def _get_ordered_fallback_chain(self, service_type: str) -> List[Dict[str, Any]]:
        """Get fallback chain ordered by health and priority"""
        base_chain = self.fallback_chains[service_type].copy()
        
        # Add health scores to chain
        for provider_config in base_chain:
            provider_name = provider_config["provider"]
            health_score = await self._get_provider_health_score(service_type, provider_name)
            provider_config["health_score"] = health_score
        
        # Sort by health score (desc) and then priority (asc)
        base_chain.sort(key=lambda x: (-x["health_score"], x["priority"]))
        
        return base_chain
    
    async def _get_provider_health_score(self, service_type: str, provider_name: str) -> float:
        """Get provider health score (0.0 - 1.0)"""
        cache_key = f"{service_type}_{provider_name}"
        current_time = time.time()
        
        # Check cache
        if cache_key in self._provider_health_cache:
            cached_data = self._provider_health_cache[cache_key]
            if current_time - cached_data["timestamp"] < self._cache_ttl:
                return cached_data["score"]
        
        # Calculate health score
        cb_name = f"{service_type}_{provider_name}"
        if cb_name in self.circuit_breakers:
            cb_status = await self.circuit_breakers[cb_name].get_status()
            
            if cb_status["state"] == "open":
                score = 0.0
            elif cb_status["state"] == "half_open": 
                score = 0.3
            else:
                # Calculate based on recent success rate
                failure_count = cb_status["failure_count"]
                success_count = cb_status["success_count"]
                total = failure_count + success_count
                
                if total == 0:
                    score = 1.0  # No data, assume healthy
                else:
                    score = success_count / total
        else:
            score = 1.0  # No circuit breaker data, assume healthy
        
        # Cache result
        self._provider_health_cache[cache_key] = {
            "score": score,
            "timestamp": current_time
        }
        
        return score
    
    async def _update_provider_health(self, service_type: str, provider_name: str, success: bool):
        """Update provider health tracking"""
        health_key = f"provider_health:{service_type}:{provider_name}"
        timestamp = datetime.now().isoformat()
        
        # Store health event
        health_event = {
            "timestamp": timestamp,
            "success": success,
            "service_type": service_type,
            "provider": provider_name
        }
        
        await self.redis.lpush(health_key, json.dumps(health_event))
        await self.redis.ltrim(health_key, 0, 100)  # Keep last 100 events
        await self.redis.expire(health_key, 86400)  # 24 hours TTL
    
    async def _log_fallback_usage(self, service_type: str, provider_name: str, fallback_position: int):
        """Log fallback usage for monitoring"""
        fallback_event = {
            "timestamp": datetime.now().isoformat(),
            "service_type": service_type,
            "fallback_provider": provider_name,
            "fallback_position": fallback_position
        }
        
        await self.redis.lpush("fallback_usage", json.dumps(fallback_event))
        await self.redis.ltrim("fallback_usage", 0, 1000)
        await self.redis.expire("fallback_usage", 86400 * 7)  # 7 days
    
    async def _log_complete_failure(self, service_type: str, error: str):
        """Log complete service failure"""
        failure_event = {
            "timestamp": datetime.now().isoformat(),
            "service_type": service_type,
            "error": error,
            "severity": "critical"
        }
        
        await self.redis.lpush("complete_failures", json.dumps(failure_event))
        await self.redis.ltrim("complete_failures", 0, 100)
        await self.redis.expire("complete_failures", 86400 * 30)  # 30 days
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        status = {
            "timestamp": datetime.now().isoformat(),
            "circuit_breakers": {},
            "provider_health": {},
            "fallback_usage": []
        }
        
        # Circuit breaker statuses
        for cb_name, cb in self.circuit_breakers.items():
            status["circuit_breakers"][cb_name] = await cb.get_status()
        
        # Provider health scores
        for service_type in self.fallback_chains:
            status["provider_health"][service_type] = {}
            for provider_config in self.fallback_chains[service_type]:
                provider_name = provider_config["provider"]
                health_score = await self._get_provider_health_score(service_type, provider_name)
                status["provider_health"][service_type][provider_name] = health_score
        
        # Recent fallback usage
        recent_fallbacks = await self.redis.lrange("fallback_usage", 0, 10)
        for fallback_str in recent_fallbacks:
            try:
                status["fallback_usage"].append(json.loads(fallback_str))
            except:
                continue
        
        return status
    
    async def reset_circuit_breaker(self, name: str) -> bool:
        """Manually reset a circuit breaker"""
        if name in self.circuit_breakers:
            cb = self.circuit_breakers[name]
            await cb._set_state(CircuitBreakerState.CLOSED)
            await cb._reset_counters()
            logger.info(f"Circuit breaker {name} manually reset")
            return True
        return False
    
    async def add_fallback_provider(self, service_type: str, provider_config: Dict[str, Any]):
        """Add new provider to fallback chain"""
        if service_type in self.fallback_chains:
            # Find appropriate priority
            max_priority = max(p["priority"] for p in self.fallback_chains[service_type])
            provider_config["priority"] = max_priority + 1
            
            self.fallback_chains[service_type].append(provider_config)
            logger.info(f"Added fallback provider to {service_type}: {provider_config}")
    
    async def remove_fallback_provider(self, service_type: str, provider_name: str):
        """Remove provider from fallback chain"""
        if service_type in self.fallback_chains:
            self.fallback_chains[service_type] = [
                p for p in self.fallback_chains[service_type] 
                if p["provider"] != provider_name
            ]
            logger.info(f"Removed fallback provider from {service_type}: {provider_name}")
    
    async def get_fallback_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get fallback usage statistics"""
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_timestamp = cutoff_date.isoformat()
        
        # Get all fallback usage events
        all_fallbacks = await self.redis.lrange("fallback_usage", 0, -1)
        
        stats = {
            "total_fallbacks": 0,
            "by_service": {},
            "by_provider": {},
            "by_position": {},
            "complete_failures": 0
        }
        
        for fallback_str in all_fallbacks:
            try:
                event = json.loads(fallback_str)
                if event["timestamp"] < cutoff_timestamp:
                    continue
                
                stats["total_fallbacks"] += 1
                
                service_type = event["service_type"]
                provider = event["fallback_provider"]
                position = event["fallback_position"]
                
                # By service
                if service_type not in stats["by_service"]:
                    stats["by_service"][service_type] = 0
                stats["by_service"][service_type] += 1
                
                # By provider
                if provider not in stats["by_provider"]:
                    stats["by_provider"][provider] = 0
                stats["by_provider"][provider] += 1
                
                # By position
                pos_key = f"position_{position}"
                if pos_key not in stats["by_position"]:
                    stats["by_position"][pos_key] = 0
                stats["by_position"][pos_key] += 1
                
            except:
                continue
        
        # Complete failures
        complete_failures = await self.redis.lrange("complete_failures", 0, -1)
        for failure_str in complete_failures:
            try:
                event = json.loads(failure_str)
                if event["timestamp"] >= cutoff_timestamp:
                    stats["complete_failures"] += 1
            except:
                continue
        
        return stats