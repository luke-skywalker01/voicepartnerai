"""
Enhanced API Documentation for VoicePartnerAI
Provides comprehensive documentation with examples for external developers
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query, Body, Path
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from sqlalchemy.orm import Session

from database import get_db
from api_key_auth import get_current_user_flexible, AuthenticationResult, require_api_key_scope, APIKeyScope
from models import User, Assistant, Project, WorkspaceRole

def enhance_api_documentation(app: FastAPI):
    """
    Enhance the FastAPI application with comprehensive API documentation.
    """
    
    # Custom OpenAPI schema
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        
        openapi_schema = get_openapi(
            title="VoicePartnerAI Developer API",
            version="1.0.0",
            description="""
# VoicePartnerAI Developer API

**The Complete Voice AI Platform API for Developers**

VoicePartnerAI provides a comprehensive REST API that allows developers to:
- Create and manage AI voice assistants
- Handle phone calls and voice interactions
- Manage files, tools, and integrations
- Access analytics and usage data
- Collaborate in team workspaces

## Authentication Methods

### 1. JWT Token Authentication
For web applications and user-facing integrations:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. API Key Authentication
For server-to-server integrations and external applications:
```http
X-API-Key: vp_live_your_api_key_here
```

## API Key Scopes

| Scope | Description | Example Operations |
|-------|-------------|-------------------|
| `read` | Read-only access | Get assistants, view call logs, download files |
| `write` | Create and modify resources | Create assistants, upload files, start calls |
| `admin` | Administrative operations | Manage team members, workspace settings |
| `full_access` | Complete access | All operations (requires owner role) |

## Rate Limits

All API endpoints are subject to rate limiting based on your API key configuration:
- **Default**: 60 requests/minute, 1000 requests/hour, 10,000 requests/day
- **Custom limits** can be configured when creating API keys
- Rate limit headers are included in all responses

## Error Handling

All errors follow a consistent format:
```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "message": "Request validation failed",
    "timestamp": "2024-01-15T10:30:00Z",
    "status_code": 422,
    "error_id": "abc12345",
    "details": {
      "validation_errors": [...]
    }
  }
}
```

## Response Format

All successful responses include:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },  // For list endpoints
  "meta": {
    "request_id": "abc12345",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## SDKs and Libraries

Official SDKs are available for:
- **Python**: `pip install voicepartnerai`
- **JavaScript/Node.js**: `npm install voicepartnerai`
- **PHP**: `composer require voicepartnerai/php-sdk`

## Support

- **Documentation**: https://docs.voicepartnerai.com
- **API Status**: https://status.voicepartnerai.com  
- **Support**: support@voicepartnerai.com
- **GitHub**: https://github.com/voicepartnerai
            """,
            routes=app.routes,
        )
        
        # Add security schemes
        openapi_schema["components"]["securitySchemes"] = {
            "JWTAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT token authentication for web applications"
            },
            "APIKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API key authentication for server-to-server integrations"
            }
        }
        
        # Add global security requirements
        openapi_schema["security"] = [
            {"JWTAuth": []},
            {"APIKeyAuth": []}
        ]
        
        # Add custom tags
        openapi_schema["tags"] = [
            {
                "name": "Authentication",
                "description": "User authentication and session management"
            },
            {
                "name": "API Keys", 
                "description": "Manage API keys for external integrations"
            },
            {
                "name": "Assistants",
                "description": "Create and manage AI voice assistants"
            },
            {
                "name": "Workspaces",
                "description": "Team collaboration and workspace management"
            },
            {
                "name": "Phone Numbers",
                "description": "Manage phone numbers for voice calls"
            },
            {
                "name": "Calls",
                "description": "Voice call management and analytics"
            },
            {
                "name": "Files",
                "description": "File upload and management for AI training"
            },
            {
                "name": "Tools",
                "description": "Custom tools and integrations for assistants"
            },
            {
                "name": "Analytics",
                "description": "Usage analytics and reporting"
            },
            {
                "name": "Health",
                "description": "System health and monitoring endpoints"
            }
        ]
        
        app.openapi_schema = openapi_schema
        return app.openapi_schema
    
    app.openapi = custom_openapi

# Enhanced route documentation examples

class EnhancedAssistantRoutes:
    """Enhanced assistant routes with comprehensive documentation."""
    
    @staticmethod
    async def create_assistant(
        assistant_data: "AssistantCreate" = Body(
            ...,
            example={
                "name": "Customer Support Bot",
                "description": "AI assistant for handling customer inquiries",
                "system_prompt": "You are a helpful customer support assistant. Be polite, professional, and provide accurate information about our products and services.",
                "llm_model": "gpt-4",
                "temperature": 0.7,
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "language": "en-US",
                "first_message": "Hello! I'm here to help you with any questions about our services. How can I assist you today?",
                "capabilities": {
                    "can_transfer_calls": True,
                    "can_schedule_appointments": True,
                    "can_access_knowledge_base": True
                }
            }
        ),
        workspace_id: int = Query(
            ..., 
            description="Workspace ID where the assistant will be created",
            example=123
        ),
        auth_result: AuthenticationResult = Depends(get_current_user_flexible),
        db: Session = Depends(get_db)
    ):
        """
        Create a new AI voice assistant.
        
        ## Overview
        Creates a new AI voice assistant with customizable personality, voice, and capabilities.
        The assistant can be used for inbound calls, outbound campaigns, or API-based interactions.
        
        ## Required Permissions
        - **Scope**: `write` (for API key auth) or workspace member (for JWT auth)
        - **Role**: Member or higher in the target workspace
        
        ## Assistant Configuration
        
        ### AI Model Settings
        - **llm_model**: Choose from `gpt-4`, `gpt-3.5-turbo`, `claude-3`, etc.
        - **temperature**: Controls creativity (0.0 = deterministic, 1.0 = creative)
        - **max_tokens**: Maximum response length (default: 1000)
        
        ### Voice Settings  
        - **voice_id**: ElevenLabs voice ID or OpenAI voice name
        - **voice_speed**: Speaking rate (0.5 - 2.0)
        - **language**: Primary language code (e.g., "en-US", "de-DE")
        
        ### Behavior Settings
        - **system_prompt**: Defines the assistant's personality and behavior
        - **first_message**: Greeting message for inbound calls
        - **interruption_sensitivity**: How easily users can interrupt ("low", "medium", "high")
        
        ## Example Use Cases
        
        ### Customer Support Assistant
        ```json
        {
            "name": "Support Bot Pro",
            "system_prompt": "You are a customer support specialist. Help users with billing, technical issues, and product questions. Always be empathetic and solution-focused.",
            "capabilities": {
                "can_access_crm": true,
                "can_create_tickets": true,
                "escalation_triggers": ["refund", "cancel", "manager"]
            }
        }
        ```
        
        ### Sales Assistant
        ```json
        {
            "name": "Sales Qualifier",
            "system_prompt": "You are a friendly sales assistant. Qualify leads by understanding their needs and budget. Schedule demos for qualified prospects.",
            "capabilities": {
                "can_schedule_meetings": true,
                "can_access_pricing": true,
                "lead_scoring": true
            }
        }
        ```
        
        ### Appointment Booking Bot
        ```json
        {
            "name": "Booking Assistant",
            "system_prompt": "You help customers book appointments. Check availability, confirm details, and send confirmations.",
            "capabilities": {
                "calendar_integration": "google_calendar",
                "confirmation_methods": ["sms", "email"],
                "timezone_handling": true
            }
        }
        ```
        
        ## Response
        Returns the created assistant with a unique ID that can be used for:
        - Assigning to phone numbers for inbound calls
        - Starting outbound call campaigns  
        - API-based voice interactions
        - Training with custom files and tools
        
        ## Next Steps
        After creating an assistant:
        1. **Test the assistant** using the `/api/v1/assistants/{id}/test` endpoint
        2. **Upload training files** to improve responses
        3. **Add custom tools** for external integrations
        4. **Assign to phone numbers** for live calls
        5. **Monitor performance** through analytics
        """
        # Implementation would go here
        pass
    
    @staticmethod
    async def list_assistants(
        workspace_id: int = Query(
            ..., 
            description="Workspace ID to list assistants for",
            example=123
        ),
        status: Optional[str] = Query(
            None,
            description="Filter by assistant status",
            regex="^(draft|testing|deployed|archived)$",
            example="deployed"
        ),
        search: Optional[str] = Query(
            None,
            description="Search assistants by name or description",
            min_length=2,
            example="customer support"
        ),
        limit: int = Query(
            default=20,
            description="Number of assistants to return",
            ge=1,
            le=100,
            example=20
        ),
        offset: int = Query(
            default=0,
            description="Number of assistants to skip (for pagination)",
            ge=0,
            example=0
        ),
        auth_result: AuthenticationResult = Depends(get_current_user_flexible),
        db: Session = Depends(get_db)
    ):
        """
        List all assistants in a workspace.
        
        ## Overview  
        Retrieves a paginated list of AI assistants in the specified workspace.
        Results can be filtered by status, searched by name/description, and paginated.
        
        ## Filtering and Search
        
        ### Status Filter
        - `draft`: Assistants being configured (not ready for calls)
        - `testing`: Assistants being tested (limited access)  
        - `deployed`: Active assistants handling live calls
        - `archived`: Deactivated assistants (kept for historical data)
        
        ### Search
        Searches across:
        - Assistant names
        - Descriptions
        - System prompts (partial)
        - Tags and categories
        
        ## Pagination
        Use `limit` and `offset` parameters for pagination:
        ```
        GET /api/v1/assistants?limit=20&offset=0   # First page
        GET /api/v1/assistants?limit=20&offset=20  # Second page
        ```
        
        ## Response Format
        ```json
        {
            "success": true,
            "data": {
                "assistants": [
                    {
                        "id": 456,
                        "name": "Customer Support Bot",
                        "description": "Handles customer inquiries",
                        "status": "deployed",
                        "created_at": "2024-01-15T10:30:00Z",
                        "last_used": "2024-01-20T14:22:00Z",
                        "call_count": 1250,
                        "avg_rating": 4.7,
                        "languages": ["en-US"],
                        "capabilities": ["call_transfer", "appointment_booking"]
                    }
                ],
                "pagination": {
                    "total": 45,
                    "limit": 20,
                    "offset": 0,
                    "has_more": true
                }
            }
        }
        ```
        
        ## Performance Tips
        - Use smaller `limit` values for faster responses
        - Implement client-side caching for frequently accessed lists
        - Use status filters to reduce payload size
        - Consider using webhooks for real-time updates
        """
        # Implementation would go here
        pass

class EnhancedCallRoutes:
    """Enhanced call management routes with comprehensive documentation."""
    
    @staticmethod
    async def start_outbound_call(
        call_data: "OutboundCallCreate" = Body(
            ...,
            example={
                "phone_number": "+1234567890",
                "assistant_id": 456,
                "context_data": {
                    "customer_id": "cust_123",
                    "campaign": "follow_up_q1_2024",
                    "previous_interaction": "interested_in_demo",
                    "preferred_time": "afternoon",
                    "lead_score": 85
                },
                "max_duration_minutes": 10,
                "callback_url": "https://your-app.com/webhooks/call-complete"
            }
        ),
        workspace_id: int = Query(..., description="Workspace ID", example=123),
        auth_result: AuthenticationResult = Depends(require_api_key_scope(APIKeyScope.WRITE)),
        db: Session = Depends(get_db)
    ):
        """
        Start an outbound voice call with an AI assistant.
        
        ## Overview
        Initiates an outbound call where your AI assistant will speak with the recipient.
        Perfect for sales outreach, customer follow-ups, appointment reminders, and surveys.
        
        ## Required Setup
        Before making outbound calls:
        1. **Purchase phone numbers** via `/api/v1/phone-numbers/purchase`
        2. **Create and test assistants** via `/api/v1/assistants`
        3. **Configure compliance settings** for your region
        4. **Set up webhooks** for call status updates
        
        ## Context Data
        Provide relevant context to help your assistant personalize the conversation:
        
        ### Customer Context
        ```json
        {
            "customer_id": "cust_123",
            "name": "John Smith", 
            "company": "Acme Corp",
            "previous_purchases": ["pro_plan"],
            "last_interaction": "2024-01-10",
            "preferences": {
                "communication_style": "professional",
                "best_time_to_call": "morning"
            }
        }
        ```
        
        ### Campaign Context
        ```json
        {
            "campaign": "q1_2024_upgrade",
            "campaign_goal": "upsell_to_enterprise",
            "offer_expires": "2024-03-31",
            "discount_code": "UPGRADE20",
            "talking_points": [
                "new_enterprise_features",
                "volume_discount",
                "priority_support"
            ]
        }
        ```
        
        ### Lead Qualification
        ```json
        {
            "lead_score": 85,
            "lead_source": "webinar_signup",
            "interests": ["automation", "integrations"],
            "company_size": "50-200_employees",
            "budget_range": "enterprise",
            "decision_timeline": "this_quarter"
        }
        ```
        
        ## Call Management
        
        ### Duration Limits
        - Set reasonable `max_duration_minutes` to control costs
        - Typical ranges: 3-5 min (quick check-ins), 10-15 min (sales calls)
        - Assistant will gracefully wrap up as limit approaches
        
        ### Compliance
        Ensure compliance with local regulations:
        - **US**: Follow TCPA guidelines, maintain Do Not Call lists
        - **EU**: GDPR compliance, explicit consent required
        - **Canada**: CASL compliance for commercial calls
        
        ### Webhooks
        Receive real-time updates about call progress:
        ```json
        {
            "event": "call.completed",
            "call_id": "call_789",
            "status": "completed",  
            "duration_seconds": 425,
            "outcome": "appointment_scheduled",
            "transcript": "...",
            "analytics": {
                "sentiment": "positive",
                "intent_achieved": true,
                "follow_up_required": false
            }
        }
        ```
        
        ## Response Handling
        The API returns immediately with call details:
        ```json
        {
            "success": true,
            "data": {
                "call_id": "call_789",
                "status": "queued",
                "estimated_start_time": "2024-01-15T10:32:00Z",
                "max_duration_minutes": 10,
                "estimated_cost": 0.25,
                "webhook_url": "https://your-app.com/webhooks/call-complete"
            }
        }
        ```
        
        ## Best Practices
        
        ### Timing
        - Respect recipient time zones
        - Avoid calling outside business hours unless urgent
        - Consider cultural preferences (lunch times, holidays)
        
        ### Content
        - Keep initial message concise and clear
        - Provide value proposition within first 10 seconds
        - Have a clear call-to-action
        
        ### Follow-up
        - Always follow up on call outcomes
        - Update CRM with call results
        - Schedule next actions based on conversation outcome
        """
        # Implementation would go here
        pass

class EnhancedWebhookRoutes:
    """Documentation for webhook integrations."""
    
    @staticmethod
    def webhook_documentation():
        """
        ## Webhooks
        
        VoicePartnerAI sends real-time notifications about events in your account.
        Configure webhook URLs in your workspace settings to receive these updates.
        
        ### Webhook Events
        
        #### Call Events
        ```json
        {
            "event": "call.started",
            "timestamp": "2024-01-15T10:30:00Z",
            "data": {
                "call_id": "call_789",
                "direction": "outbound",
                "from": "+15551234567",
                "to": "+15559876543",
                "assistant_id": 456,
                "workspace_id": 123
            }
        }
        ```
        
        #### Assistant Events  
        ```json
        {
            "event": "assistant.updated", 
            "timestamp": "2024-01-15T10:30:00Z",
            "data": {
                "assistant_id": 456,
                "changes": ["system_prompt", "voice_settings"],
                "updated_by": "user_123"
            }
        }
        ```
        
        ### Webhook Security
        All webhooks include a signature header for verification:
        ```
        X-VoicePartnerAI-Signature: sha256=abc123...
        ```
        
        Verify the signature using your webhook secret:
        ```python
        import hmac
        import hashlib
        
        def verify_webhook(payload, signature, secret):
            expected = hmac.new(
                secret.encode(), 
                payload.encode(), 
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(f"sha256={expected}", signature)
        ```
        
        ### Retry Policy
        - **Timeout**: 10 seconds
        - **Retries**: 3 attempts with exponential backoff
        - **Success**: HTTP 200-299 response codes
        - **Failure**: After 3 failed attempts, webhooks are disabled
        """
        pass

# Enhanced Pydantic models with comprehensive examples

class AssistantCreate(BaseModel):
    """Schema for creating a new assistant with comprehensive validation and examples."""
    
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Human-readable name for the assistant",
        example="Customer Support Bot"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Brief description of the assistant's purpose and capabilities",
        example="AI assistant specialized in handling customer inquiries, technical support, and billing questions with empathy and professionalism."
    )
    
    system_prompt: str = Field(
        ...,
        min_length=10,
        max_length=4000,
        description="Detailed instructions that define the assistant's personality, behavior, and expertise",
        example="""You are a professional customer support representative for VoicePartnerAI. 

Your role:
- Help customers with account questions, billing issues, and technical problems
- Always be polite, patient, and empathetic  
- Provide accurate information and escalate complex issues when needed
- Aim to resolve issues on the first contact

Guidelines:
- Listen carefully to understand the customer's specific concern
- Ask clarifying questions if needed
- Explain solutions in simple, clear language
- If you can't help, offer to transfer to a specialist
- Always end with asking if there's anything else you can help with

Available actions:
- Look up account information
- Process refunds and billing adjustments  
- Create support tickets
- Transfer to specialists
- Schedule callbacks"""
    )
    
    llm_model: str = Field(
        default="gpt-4",
        description="AI language model to use for conversation",
        regex="^(gpt-4|gpt-3.5-turbo|claude-3|claude-2)$",
        example="gpt-4"
    )
    
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Controls response creativity. Lower = more consistent, Higher = more creative",
        example=0.7
    )
    
    voice_id: str = Field(
        ...,
        description="Voice ID from ElevenLabs or voice name from OpenAI",
        example="21m00Tcm4TlvDq8ikWAM"
    )
    
    language: str = Field(
        default="en-US",
        description="Primary language for the assistant",
        regex="^[a-z]{2}-[A-Z]{2}$",
        example="en-US"
    )
    
    first_message: Optional[str] = Field(
        None,
        max_length=500,
        description="Greeting message for inbound calls",
        example="Hello! Thank you for calling VoicePartnerAI support. I'm here to help you with any questions or issues you might have. How can I assist you today?"
    )
    
    capabilities: Optional[Dict[str, Any]] = Field(
        None,
        description="Custom capabilities and integrations for the assistant",
        example={
            "can_transfer_calls": True,
            "can_schedule_appointments": True,
            "can_access_knowledge_base": True,
            "can_process_payments": False,
            "escalation_triggers": ["refund", "cancel", "complaint"],
            "max_call_duration_minutes": 15,
            "transfer_destinations": {
                "technical_support": "+15551234567",
                "billing": "+15551234568", 
                "manager": "+15551234569"
            }
        }
    )

# Add comprehensive examples to existing routes
def add_comprehensive_examples():
    """Add detailed examples to existing API routes."""
    
    examples = {
        "workspace_create": {
            "summary": "Create a business workspace",
            "description": "Example of creating a workspace for a business team",
            "value": {
                "name": "Acme Corp Development",
                "description": "Workspace for the Acme Corp development team to collaborate on voice AI projects",
                "plan": "pro"
            }
        },
        
        "api_key_create": {
            "summary": "Create API key for production app",
            "description": "Example of creating an API key for a production mobile app",
            "value": {
                "name": "Mobile App Production",
                "description": "API key for iOS and Android app in production",
                "scopes": ["read", "write"],
                "rate_limit_per_minute": 200,
                "rate_limit_per_hour": 5000,
                "expires_in_days": 365,
                "allowed_ips": ["52.1.2.3", "52.1.2.4"]
            }
        },
        
        "outbound_call": {
            "summary": "Sales follow-up call",
            "description": "Example of starting a personalized sales follow-up call",
            "value": {
                "phone_number": "+15551234567",
                "assistant_id": 456,
                "context_data": {
                    "customer_name": "Sarah Johnson",
                    "company": "TechStart Inc",
                    "last_interaction": "demo_completed_2024_01_10",
                    "interest_level": "high",
                    "budget_discussed": "50k_annually",
                    "decision_timeline": "this_quarter",
                    "pain_points": ["manual_processes", "scaling_issues"],
                    "next_step": "pricing_discussion"
                },
                "max_duration_minutes": 12,
                "callback_url": "https://crm.yourcompany.com/webhooks/call-complete"
            }
        }
    }
    
    return examples

def setup_enhanced_documentation(app: FastAPI):
    """Set up enhanced documentation for the FastAPI app."""
    
    # Enhance OpenAPI documentation
    enhance_api_documentation(app)
    
    # Add custom docs endpoints with enhanced styling
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - Interactive API Documentation",
            oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
            swagger_favicon_url="https://voicepartnerai.com/favicon.ico"
        )
    
    @app.get("/redoc", include_in_schema=False) 
    async def redoc_html():
        return get_redoc_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - API Reference",
            redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js",
            redoc_favicon_url="https://voicepartnerai.com/favicon.ico"
        )
    
    # Add developer resources endpoint
    @app.get("/api/v1/developer/resources")
    async def get_developer_resources():
        """
        Get comprehensive developer resources and getting started guide.
        
        Returns links to SDKs, tutorials, code examples, and community resources.
        """
        return {
            "success": True,
            "data": {
                "getting_started": {
                    "quick_start": "https://docs.voicepartnerai.com/quickstart",
                    "authentication": "https://docs.voicepartnerai.com/auth",
                    "first_assistant": "https://docs.voicepartnerai.com/create-assistant"
                },
                "sdks": {
                    "python": {
                        "install": "pip install voicepartnerai",
                        "docs": "https://docs.voicepartnerai.com/python-sdk",
                        "github": "https://github.com/voicepartnerai/python-sdk"
                    },
                    "javascript": {
                        "install": "npm install voicepartnerai",
                        "docs": "https://docs.voicepartnerai.com/js-sdk", 
                        "github": "https://github.com/voicepartnerai/js-sdk"
                    },
                    "php": {
                        "install": "composer require voicepartnerai/php-sdk",
                        "docs": "https://docs.voicepartnerai.com/php-sdk",
                        "github": "https://github.com/voicepartnerai/php-sdk"
                    }
                },
                "examples": {
                    "code_samples": "https://github.com/voicepartnerai/examples",
                    "tutorials": "https://docs.voicepartnerai.com/tutorials",
                    "use_cases": "https://docs.voicepartnerai.com/use-cases"
                },
                "community": {
                    "discord": "https://discord.gg/voicepartnerai",
                    "github_discussions": "https://github.com/voicepartnerai/community",
                    "stackoverflow": "https://stackoverflow.com/questions/tagged/voicepartnerai"
                },
                "support": {
                    "status_page": "https://status.voicepartnerai.com",
                    "contact": "support@voicepartnerai.com",
                    "enterprise": "enterprise@voicepartnerai.com"
                }
            }
        }