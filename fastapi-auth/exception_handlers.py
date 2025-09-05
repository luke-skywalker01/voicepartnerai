"""
Global Exception Handlers for VoicePartnerAI FastAPI Application
Provides standardized error handling and logging for all application errors
"""

import logging
import traceback
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from pydantic import ValidationError as PydanticValidationError

# Configure logging
logger = logging.getLogger(__name__)

class StandardError:
    """Standard error response structure."""
    
    @staticmethod
    def create_error_response(
        error_type: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500,
        error_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a standardized error response."""
        error_response = {
            "success": False,
            "error": {
                "type": error_type,
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status_code": status_code
            }
        }
        
        if error_id:
            error_response["error"]["error_id"] = error_id
            
        if details:
            error_response["error"]["details"] = details
            
        return error_response


def setup_exception_handlers(app: FastAPI):
    """Sets up all global exception handlers for the FastAPI app."""
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Global exception handler for all unhandled exceptions.
        Prevents application crashes and provides standardized error responses.
        """
        # Generate unique error ID for tracking
        import uuid
        error_id = str(uuid.uuid4())[:8]
        
        # Log the full exception with traceback
        logger.error(
            f"Unhandled exception [{error_id}]: {type(exc).__name__}: {str(exc)}",
            extra={
                "error_id": error_id,
                "exception_type": type(exc).__name__,
                "url": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "traceback": traceback.format_exc()
            }
        )
        
        # Don't expose internal error details in production
        error_message = "An internal server error occurred. Please try again later."
        
        # In development, you might want to show more details
        # if settings.DEBUG:
        #     error_message = str(exc)
        
        error_response = StandardError.create_error_response(
            error_type="internal_server_error",
            message=error_message,
            status_code=500,
            error_id=error_id,
            details={
                "request_url": str(request.url),
                "request_method": request.method
            }
        )
        
        return JSONResponse(
            status_code=500,
            content=error_response
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """
        Handler for FastAPI HTTPExceptions.
        Provides consistent formatting for HTTP errors.
        """
        logger.warning(
            f"HTTP Exception: {exc.status_code} - {exc.detail}",
            extra={
                "status_code": exc.status_code,
                "url": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None
            }
        )
        
        error_response = StandardError.create_error_response(
            error_type="http_error",
            message=exc.detail,
            status_code=exc.status_code
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        """
        Handler for request validation errors.
        Provides detailed information about validation failures.
        """
        logger.warning(
            f"Request validation error: {exc.errors()}",
            extra={
                "validation_errors": exc.errors(),
                "url": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None
            }
        )
        
        # Format validation errors for better readability
        formatted_errors = []
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            formatted_errors.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"]
            })
        
        error_response = StandardError.create_error_response(
            error_type="validation_error",
            message="Request validation failed",
            status_code=422,
            details={
                "validation_errors": formatted_errors,
                "raw_errors": exc.errors()
            }
        )
        
        return JSONResponse(
            status_code=422,
            content=error_response
        )
    
    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_exception_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
        """
        Handler for Pydantic validation errors.
        """
        logger.warning(
            f"Pydantic validation error: {exc.errors()}",
            extra={
                "validation_errors": exc.errors(),
                "url": str(request.url),
                "method": request.method
            }
        )
        
        error_response = StandardError.create_error_response(
            error_type="validation_error",
            message="Data validation failed",
            status_code=422,
            details={"validation_errors": exc.errors()}
        )
        
        return JSONResponse(
            status_code=422,
            content=error_response
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        """
        Handler for database-related errors.
        """
        import uuid
        error_id = str(uuid.uuid4())[:8]
        
        logger.error(
            f"Database error [{error_id}]: {type(exc).__name__}: {str(exc)}",
            extra={
                "error_id": error_id,
                "exception_type": type(exc).__name__,
                "url": str(request.url),
                "method": request.method,
                "traceback": traceback.format_exc()
            }
        )
        
        # Determine specific error type and message
        if isinstance(exc, IntegrityError):
            error_type = "database_integrity_error"
            message = "A database constraint was violated. Please check your data."
            status_code = 409
        elif isinstance(exc, OperationalError):
            error_type = "database_operational_error"
            message = "Database operation failed. Please try again later."
            status_code = 503
        else:
            error_type = "database_error"
            message = "A database error occurred. Please try again later."
            status_code = 500
        
        error_response = StandardError.create_error_response(
            error_type=error_type,
            message=message,
            status_code=status_code,
            error_id=error_id
        )
        
        return JSONResponse(
            status_code=status_code,
            content=error_response
        )
    
    # Add custom exception handlers for specific business logic errors
    
    class WorkspaceError(Exception):
        """Custom exception for workspace-related errors."""
        pass
    
    class ExternalServiceError(Exception):
        """Custom exception for external service errors."""
        def __init__(self, service_name: str, message: str, original_error: Optional[Exception] = None):
            self.service_name = service_name
            self.message = message
            self.original_error = original_error
            super().__init__(message)
    
    @app.exception_handler(WorkspaceError)
    async def workspace_exception_handler(request: Request, exc: WorkspaceError) -> JSONResponse:
        """Handler for workspace-related business logic errors."""
        logger.warning(
            f"Workspace error: {str(exc)}",
            extra={
                "url": str(request.url),
                "method": request.method
            }
        )
        
        error_response = StandardError.create_error_response(
            error_type="workspace_error",
            message=str(exc),
            status_code=400
        )
        
        return JSONResponse(
            status_code=400,
            content=error_response
        )
    
    @app.exception_handler(ExternalServiceError)
    async def external_service_exception_handler(request: Request, exc: ExternalServiceError) -> JSONResponse:
        """Handler for external service errors."""
        import uuid
        error_id = str(uuid.uuid4())[:8]
        
        logger.error(
            f"External service error [{error_id}] - {exc.service_name}: {exc.message}",
            extra={
                "error_id": error_id,
                "service_name": exc.service_name,
                "url": str(request.url),
                "method": request.method,
                "original_error": str(exc.original_error) if exc.original_error else None
            }
        )
        
        error_response = StandardError.create_error_response(
            error_type="external_service_error",
            message=f"External service ({exc.service_name}) is currently unavailable. Please try again later.",
            status_code=503,
            error_id=error_id,
            details={
                "service_name": exc.service_name
            }
        )
        
        return JSONResponse(
            status_code=503,
            content=error_response
        )
    
    # Export custom exceptions for use in other modules
    app.state.WorkspaceError = WorkspaceError
    app.state.ExternalServiceError = ExternalServiceError
    
    logger.info("Global exception handlers registered successfully")


# Utility function for consistent error responses in route handlers
def create_error_response(message: str, error_type: str = "bad_request", status_code: int = 400) -> HTTPException:
    """
    Utility function to create consistent HTTPExceptions.
    
    Usage:
        raise create_error_response("User not found", "not_found", 404)
    """
    return HTTPException(
        status_code=status_code,
        detail=message
    )


# Logging middleware for request/response tracking
class LoggingMiddleware:
    """Middleware to log all requests and responses."""
    
    def __init__(self, app: FastAPI):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request_id = str(uuid.uuid4())[:8]
            
            # Log request
            logger.info(
                f"Request [{request_id}]: {scope['method']} {scope['path']}",
                extra={
                    "request_id": request_id,
                    "method": scope["method"],
                    "path": scope["path"],
                    "query_string": scope.get("query_string", b"").decode(),
                    "client_ip": scope.get("client", [None])[0] if scope.get("client") else None
                }
            )
            
            # Add request ID to scope for use in handlers
            scope["request_id"] = request_id
        
        await self.app(scope, receive, send)


def setup_logging():
    """Configure application logging."""
    import logging.config
    
    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s - %(extra)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "standard",
                "stream": "ext://sys.stdout"
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": "logs/error.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            }
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False
            },
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False
            }
        }
    }
    
    # Create logs directory if it doesn't exist
    import os
    os.makedirs("logs", exist_ok=True)
    
    logging.config.dictConfig(LOGGING_CONFIG)
    logger.info("Logging configuration completed")