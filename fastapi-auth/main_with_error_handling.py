"""
Enhanced FastAPI Main Application with Comprehensive Error Handling
Demonstrates integration of all error handling and monitoring components
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

# Import our error handling and monitoring modules
from exception_handlers import setup_exception_handlers, setup_logging, LoggingMiddleware
from external_services import ExternalServiceFactory
from health_check import router as health_router, configure_health_checks, log_application_startup

# Import existing routers
from workspace_api import router as workspace_router
from ultra_simple_auth import router as auth_router
from security_routes import router as security_router

logger = logging.getLogger(__name__)

# Configuration - In production, load from environment variables
CONFIG = {
    "openai": {
        "api_key": "your_openai_api_key_here"  # os.getenv("OPENAI_API_KEY")
    },
    "twilio": {
        "account_sid": "your_twilio_account_sid",  # os.getenv("TWILIO_ACCOUNT_SID")
        "auth_token": "your_twilio_auth_token"  # os.getenv("TWILIO_AUTH_TOKEN")
    },
    "stripe": {
        "secret_key": "your_stripe_secret_key"  # os.getenv("STRIPE_SECRET_KEY")
    },
    "elevenlabs": {
        "api_key": "your_elevenlabs_api_key"  # os.getenv("ELEVENLABS_API_KEY")
    }
}

# Global service factory instance
service_factory = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    try:
        logger.info("Starting VoicePartnerAI application...")
        
        # Setup logging
        setup_logging()
        
        # Initialize service factory
        global service_factory
        service_factory = ExternalServiceFactory(CONFIG)
        
        # Configure health checks with service factory
        configure_health_checks(service_factory)
        
        # Log application startup
        log_application_startup()
        
        # Add service factory to app state for dependency injection
        app.state.service_factory = service_factory
        
        # Start email automation scheduler
        from email_automation import email_scheduler
        await email_scheduler.start_scheduler()
        
        logger.info("VoicePartnerAI application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    try:
        logger.info("Shutting down VoicePartnerAI application...")
        
        # Stop email automation scheduler
        from email_automation import email_scheduler
        await email_scheduler.stop_scheduler()
        
        # Cleanup external service connections
        if service_factory:
            # Close any open connections
            try:
                elevenlabs_service = service_factory._elevenlabs_service
                if elevenlabs_service:
                    await elevenlabs_service.close()
            except Exception as e:
                logger.warning(f"Error closing ElevenLabs service: {e}")
        
        logger.info("VoicePartnerAI application shutdown completed")
        
    except Exception as e:
        logger.error(f"Application shutdown error: {e}")

# Create FastAPI application with lifespan events
app = FastAPI(
    title="VoicePartnerAI",
    description="AI-Powered Voice Assistant Platform with Team Collaboration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Setup comprehensive error handling
setup_exception_handlers(app)

# Add logging middleware
# app.add_middleware(LoggingMiddleware)

# Add security and performance middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting middleware
from rate_limiter import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, default_rule_key="api_requests")

# Add custom middleware for request tracking
@app.middleware("http")
async def add_request_id_header(request: Request, call_next):
    """Add unique request ID to all requests for tracking."""
    import uuid
    request_id = str(uuid.uuid4())[:8]
    
    # Add request ID to request state
    request.state.request_id = request_id
    
    # Process request
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response

# Mount static files for the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")
# Mount assets directly for frontend compatibility
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Register API routers
app.include_router(health_router)
app.include_router(workspace_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(security_router, prefix="/api")

# Homepage - serve the React frontend
@app.get("/")
async def homepage():
    """Serve the main homepage from React build."""
    return FileResponse('static/index.html')

# API Root endpoint
@app.get("/api")
async def api_root():
    """API root endpoint with basic information."""
    return {
        "message": "Welcome to VoicePartnerAI API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

# Example of how to use the external services in your routes
@app.get("/api/test/openai")
async def test_openai(request: Request):
    """
    Test endpoint for OpenAI integration.
    Demonstrates how to use external services with error handling.
    """
    try:
        service_factory = request.app.state.service_factory
        openai_service = service_factory.get_openai_service()
        
        response = await openai_service.create_chat_completion(
            messages=[{"role": "user", "content": "Say hello!"}],
            model="gpt-3.5-turbo",
            max_tokens=50
        )
        
        return {
            "success": True,
            "response": response["content"],
            "tokens_used": response["usage"]["total_tokens"]
        }
        
    except Exception as e:
        # The global exception handler will catch this and format it properly
        raise e

@app.get("/api/test/twilio")
async def test_twilio(request: Request):
    """
    Test endpoint for Twilio integration.
    """
    try:
        service_factory = request.app.state.service_factory
        twilio_service = service_factory.get_twilio_service()
        
        # In a real scenario, you'd make an actual call
        # For testing, we'll just verify the client is configured
        account_info = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: twilio_service.client.api.accounts(twilio_service.account_sid).fetch()
        )
        
        return {
            "success": True,
            "account_status": account_info.status,
            "account_type": account_info.type
        }
        
    except Exception as e:
        raise e

# Example error endpoint for testing
@app.get("/api/test/error")
async def test_error():
    """Test endpoint to trigger an error for testing error handling."""
    raise Exception("This is a test error to verify error handling works!")

@app.get("/api/test/validation-error")
async def test_validation_error(number: int):
    """Test endpoint for validation errors."""
    if number < 0:
        from exception_handlers import create_error_response
        raise create_error_response("Number must be positive", "validation_error", 400)
    
    return {"number": number, "valid": True}

# Custom endpoint to demonstrate workspace error handling
@app.get("/api/test/workspace-error")
async def test_workspace_error(request: Request):
    """Test workspace-specific error handling."""
    # Access the custom exception class from app state
    WorkspaceError = request.app.state.WorkspaceError
    raise WorkspaceError("Test workspace error - user not authorized for this workspace")

# Catch-all route for React Router (SPA support)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA for all non-API routes."""
    # Don't serve SPA for API routes, docs, or health checks
    if full_path.startswith(("api/", "docs", "redoc", "health", "static/")):
        return {"error": "Not found"}, 404
    
    # Serve the React app for all other routes
    return FileResponse('static/index.html')

# Development server configuration
if __name__ == "__main__":
    # Setup logging for development
    setup_logging()
    
    # Run with uvicorn
    uvicorn.run(
        "main_with_error_handling:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Only for development
        log_level="info",
        access_log=True
    )

"""
Deployment Notes:

1. Environment Variables:
   Set these in production:
   - OPENAI_API_KEY
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - STRIPE_SECRET_KEY
   - ELEVENLABS_API_KEY
   - DATABASE_URL
   - SECRET_KEY

2. Docker Deployment:
   FROM python:3.11-slim
   
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY . .
   
   # Create logs directory
   RUN mkdir -p logs
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:8000/health/live || exit 1
   
   CMD ["uvicorn", "main_with_error_handling:app", "--host", "0.0.0.0", "--port", "8000"]

3. Kubernetes Deployment:
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: voicepartnerai
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: voicepartnerai
     template:
       metadata:
         labels:
           app: voicepartnerai
       spec:
         containers:
         - name: app
           image: voicepartnerai:latest
           ports:
           - containerPort: 8000
           livenessProbe:
             httpGet:
               path: /health/live
               port: 8000
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /health/ready
               port: 8000
             initialDelaySeconds: 5
             periodSeconds: 5
           env:
           - name: DATABASE_URL
             valueFrom:
               secretKeyRef:
                 name: app-secrets
                 key: database-url

4. Monitoring Integration:
   - The /health endpoint provides comprehensive status
   - The /health/metrics endpoint can be scraped by Prometheus
   - Logs are structured for easy parsing by log aggregation tools
   - Request IDs enable distributed tracing
"""