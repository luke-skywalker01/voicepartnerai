"""
Health Check System for VoicePartnerAI
Provides comprehensive health monitoring for the application and its dependencies
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from database import get_db
from external_services import (
    ExternalServiceFactory, 
    ServiceUnavailableError, 
    ServiceConfigurationError,
    RateLimitError
)

logger = logging.getLogger(__name__)

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"

class ComponentHealth(BaseModel):
    name: str
    status: HealthStatus
    message: str
    response_time_ms: Optional[int] = None
    last_checked: datetime
    details: Optional[Dict[str, Any]] = None

class HealthCheckResponse(BaseModel):
    status: HealthStatus
    timestamp: datetime
    version: str
    uptime_seconds: int
    components: List[ComponentHealth]
    overall_message: str

# Global health check state
app_start_time = datetime.now(timezone.utc)

router = APIRouter(prefix="/health", tags=["health"])

class HealthChecker:
    """Centralized health checking service."""
    
    def __init__(self, service_factory: Optional[ExternalServiceFactory] = None):
        self.service_factory = service_factory
        self.last_check_cache = {}
        self.cache_duration = 30  # Cache results for 30 seconds
    
    async def check_database(self, db: Session) -> ComponentHealth:
        """Check database connectivity and performance."""
        start_time = datetime.now()
        
        try:
            # Simple connectivity test
            result = db.execute(text("SELECT 1")).scalar()
            
            # More comprehensive test - check if we can query user table
            user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ComponentHealth(
                name="database",
                status=HealthStatus.HEALTHY,
                message="Database is accessible and responsive",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc),
                details={
                    "user_count": user_count,
                    "connection_pool_info": "Active"  # Could add real pool stats
                }
            )
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return ComponentHealth(
                name="database",
                status=HealthStatus.UNHEALTHY,
                message=f"Database connection failed: {str(e)[:100]}",
                last_checked=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    async def check_openai(self) -> ComponentHealth:
        """Check OpenAI service availability."""
        if not self.service_factory:
            return self._create_skipped_component("openai", "Service factory not configured")
        
        start_time = datetime.now()
        
        try:
            openai_service = self.service_factory.get_openai_service()
            
            # Simple test with minimal token usage
            response = await openai_service.create_chat_completion(
                messages=[{"role": "user", "content": "Hi"}],
                model="gpt-3.5-turbo",
                max_tokens=1
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ComponentHealth(
                name="openai",
                status=HealthStatus.HEALTHY,
                message="OpenAI API is accessible",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc),
                details={
                    "model_used": "gpt-3.5-turbo",
                    "tokens_used": response.get("usage", {}).get("total_tokens", 0)
                }
            )
            
        except ServiceConfigurationError as e:
            return ComponentHealth(
                name="openai",
                status=HealthStatus.UNHEALTHY,
                message="OpenAI configuration error",
                last_checked=datetime.now(timezone.utc),
                details={"error": "API key not configured or invalid"}
            )
            
        except RateLimitError as e:
            return ComponentHealth(
                name="openai",
                status=HealthStatus.DEGRADED,
                message="OpenAI rate limit exceeded",
                last_checked=datetime.now(timezone.utc),
                details={"error": "Rate limited - service may be slow"}
            )
            
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return ComponentHealth(
                name="openai",
                status=HealthStatus.UNHEALTHY,
                message="OpenAI service unavailable",
                last_checked=datetime.now(timezone.utc),
                details={"error": str(e)[:100]}
            )
    
    async def check_twilio(self) -> ComponentHealth:
        """Check Twilio service availability."""
        if not self.service_factory:
            return self._create_skipped_component("twilio", "Service factory not configured")
        
        start_time = datetime.now()
        
        try:
            twilio_service = self.service_factory.get_twilio_service()
            
            # Check account info instead of making a call
            account_info = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: twilio_service.client.api.accounts(twilio_service.account_sid).fetch()
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ComponentHealth(
                name="twilio",
                status=HealthStatus.HEALTHY,
                message="Twilio API is accessible",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc),
                details={
                    "account_status": account_info.status,
                    "account_type": account_info.type
                }
            )
            
        except ServiceConfigurationError as e:
            return ComponentHealth(
                name="twilio",
                status=HealthStatus.UNHEALTHY,
                message="Twilio configuration error",
                last_checked=datetime.now(timezone.utc),
                details={"error": "Credentials not configured or invalid"}
            )
            
        except Exception as e:
            logger.error(f"Twilio health check failed: {e}")
            return ComponentHealth(
                name="twilio",
                status=HealthStatus.UNHEALTHY,
                message="Twilio service unavailable",
                last_checked=datetime.now(timezone.utc),
                details={"error": str(e)[:100]}
            )
    
    async def check_stripe(self) -> ComponentHealth:
        """Check Stripe service availability."""
        if not self.service_factory:
            return self._create_skipped_component("stripe", "Service factory not configured")
        
        start_time = datetime.now()
        
        try:
            # Simple account check - doesn't charge anything
            import stripe
            account = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: stripe.Account.retrieve()
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ComponentHealth(
                name="stripe",
                status=HealthStatus.HEALTHY,
                message="Stripe API is accessible",
                response_time_ms=response_time,
                last_checked=datetime.now(timezone.utc),
                details={
                    "account_id": account.id,
                    "charges_enabled": account.charges_enabled,
                    "payouts_enabled": account.payouts_enabled
                }
            )
            
        except ServiceConfigurationError as e:
            return ComponentHealth(
                name="stripe",
                status=HealthStatus.UNHEALTHY,
                message="Stripe configuration error",
                last_checked=datetime.now(timezone.utc),
                details={"error": "API key not configured or invalid"}
            )
            
        except Exception as e:
            logger.error(f"Stripe health check failed: {e}")
            return ComponentHealth(
                name="stripe",
                status=HealthStatus.UNHEALTHY,
                message="Stripe service unavailable",
                last_checked=datetime.now(timezone.utc),
                details={"error": str(e)[:100]}
            )
    
    async def check_redis(self) -> ComponentHealth:
        """Check Redis cache availability (if configured)."""
        try:
            # This would be implemented if Redis is used
            # import redis.asyncio as redis
            # redis_client = redis.from_url("redis://localhost")
            # await redis_client.ping()
            
            return ComponentHealth(
                name="redis",
                status=HealthStatus.HEALTHY,
                message="Redis cache is not configured",
                last_checked=datetime.now(timezone.utc),
                details={"configured": False}
            )
            
        except Exception as e:
            return ComponentHealth(
                name="redis",
                status=HealthStatus.UNHEALTHY,
                message="Redis cache unavailable",
                last_checked=datetime.now(timezone.utc),
                details={"error": str(e)[:100]}
            )
    
    def _create_skipped_component(self, name: str, reason: str) -> ComponentHealth:
        """Create a health component for skipped checks."""
        return ComponentHealth(
            name=name,
            status=HealthStatus.HEALTHY,
            message=f"Skipped: {reason}",
            last_checked=datetime.now(timezone.utc),
            details={"skipped": True, "reason": reason}
        )
    
    async def run_all_checks(self, db: Session, include_external: bool = True) -> HealthCheckResponse:
        """Run all health checks and return comprehensive status."""
        start_time = datetime.now()
        components = []
        
        # Always check database
        db_health = await self.check_database(db)
        components.append(db_health)
        
        if include_external:
            # Check external services in parallel for speed
            external_checks = await asyncio.gather(
                self.check_openai(),
                self.check_twilio(), 
                self.check_stripe(),
                self.check_redis(),
                return_exceptions=True
            )
            
            for check_result in external_checks:
                if isinstance(check_result, ComponentHealth):
                    components.append(check_result)
                else:
                    # Handle unexpected errors in health checks
                    logger.error(f"Health check error: {check_result}")
                    components.append(ComponentHealth(
                        name="unknown",
                        status=HealthStatus.UNHEALTHY,
                        message=f"Health check failed: {str(check_result)[:100]}",
                        last_checked=datetime.now(timezone.utc)
                    ))
        
        # Determine overall status
        overall_status = self._determine_overall_status(components)
        
        # Calculate uptime
        uptime_seconds = int((datetime.now(timezone.utc) - app_start_time).total_seconds())
        
        # Create overall message
        healthy_count = sum(1 for c in components if c.status == HealthStatus.HEALTHY)
        total_count = len(components)
        
        if overall_status == HealthStatus.HEALTHY:
            overall_message = f"All systems operational ({healthy_count}/{total_count} components healthy)"
        elif overall_status == HealthStatus.DEGRADED:
            overall_message = f"Some systems degraded ({healthy_count}/{total_count} components healthy)"
        else:
            overall_message = f"System issues detected ({healthy_count}/{total_count} components healthy)"
        
        return HealthCheckResponse(
            status=overall_status,
            timestamp=datetime.now(timezone.utc),
            version="1.0.0",  # Could be loaded from config
            uptime_seconds=uptime_seconds,
            components=components,
            overall_message=overall_message
        )
    
    def _determine_overall_status(self, components: List[ComponentHealth]) -> HealthStatus:
        """Determine overall system status from component statuses."""
        if not components:
            return HealthStatus.UNHEALTHY
        
        # Database is critical - if it's down, system is unhealthy
        db_component = next((c for c in components if c.name == "database"), None)
        if db_component and db_component.status == HealthStatus.UNHEALTHY:
            return HealthStatus.UNHEALTHY
        
        # Count statuses
        unhealthy_count = sum(1 for c in components if c.status == HealthStatus.UNHEALTHY)
        degraded_count = sum(1 for c in components if c.status == HealthStatus.DEGRADED)
        
        if unhealthy_count > 0:
            return HealthStatus.UNHEALTHY
        elif degraded_count > 0:
            return HealthStatus.DEGRADED
        else:
            return HealthStatus.HEALTHY


# Initialize health checker (could be injected via dependency)
health_checker = HealthChecker()

@router.get("/", response_model=HealthCheckResponse)
async def health_check(
    response: Response,
    include_external: bool = True,
    db: Session = Depends(get_db)
):
    """
    Comprehensive health check endpoint.
    
    - **include_external**: Whether to check external services (default: true)
    - Returns detailed status of all system components
    """
    try:
        health_result = await health_checker.run_all_checks(db, include_external)
        
        # Set HTTP status code based on health
        if health_result.status == HealthStatus.HEALTHY:
            response.status_code = 200
        elif health_result.status == HealthStatus.DEGRADED:
            response.status_code = 200  # Still serving requests
        else:
            response.status_code = 503  # Service unavailable
        
        return health_result
        
    except Exception as e:
        logger.error(f"Health check endpoint failed: {e}")
        response.status_code = 500
        return HealthCheckResponse(
            status=HealthStatus.UNHEALTHY,
            timestamp=datetime.now(timezone.utc),
            version="1.0.0",
            uptime_seconds=int((datetime.now(timezone.utc) - app_start_time).total_seconds()),
            components=[
                ComponentHealth(
                    name="health_check",
                    status=HealthStatus.UNHEALTHY,
                    message=f"Health check system error: {str(e)[:100]}",
                    last_checked=datetime.now(timezone.utc)
                )
            ],
            overall_message="Health check system failure"
        )

@router.get("/live")
async def liveness_probe():
    """
    Simple liveness probe for Kubernetes/Docker.
    Returns 200 if the application is running.
    """
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/ready")
async def readiness_probe(db: Session = Depends(get_db)):
    """
    Readiness probe for Kubernetes/Docker.
    Returns 200 if the application is ready to serve requests.
    """
    try:
        # Quick database connectivity check
        db.execute(text("SELECT 1")).scalar()
        return {"status": "ready", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        raise HTTPException(
            status_code=503,
            detail={"status": "not_ready", "reason": "Database connectivity issue"}
        )

@router.get("/metrics")
async def metrics_endpoint(db: Session = Depends(get_db)):
    """
    Basic metrics endpoint for monitoring tools.
    Could be extended with Prometheus metrics.
    """
    try:
        # Collect basic metrics
        uptime_seconds = int((datetime.now(timezone.utc) - app_start_time).total_seconds())
        
        # Database metrics
        user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        workspace_count = db.execute(text("SELECT COUNT(*) FROM workspaces")).scalar()
        
        # Could add more metrics like:
        # - Active connections
        # - Request rates
        # - Error rates
        # - Response times
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": uptime_seconds,
            "metrics": {
                "users_total": user_count,
                "workspaces_total": workspace_count,
                "app_info": {
                    "version": "1.0.0",
                    "environment": "production"  # Could be from config
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Metrics endpoint failed: {e}")
        raise HTTPException(status_code=500, detail="Metrics collection failed")


# Health check configuration
def configure_health_checks(service_factory: ExternalServiceFactory):
    """Configure health checker with service factory."""
    global health_checker
    health_checker = HealthChecker(service_factory)


# Startup event to log application start
def log_application_startup():
    """Log application startup information."""
    global app_start_time
    app_start_time = datetime.now(timezone.utc)
    logger.info(f"VoicePartnerAI application started at {app_start_time.isoformat()}")
    logger.info("Health check endpoints available at /health, /health/live, /health/ready, /health/metrics")