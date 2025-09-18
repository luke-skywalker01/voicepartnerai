"""
Public API endpoints for Marketing Site Integration
VoicePartnerAI Backend - Marketing Statistics API
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/stats/overview")
async def get_public_stats() -> Dict[str, Any]:
    """
    Public statistics for Marketing Site
    Returns anonymized aggregated data
    """
    try:
        # In production, these would come from actual database queries
        # For now, return realistic demo data

        stats = {
            "total_assistants_created": "500+",
            "total_calls_processed": "2.1M+",
            "uptime_percentage": "99.9%",
            "active_enterprise_customers": "50+",
            "average_response_time": "245ms",
            "languages_supported": 12,
            "regions_covered": ["DE", "AT", "CH"],
            "last_updated": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "data": stats,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve public statistics: {str(e)}"
        )

@router.get("/health")
async def public_health_check() -> Dict[str, str]:
    """
    Public health check for Marketing Site monitoring
    """
    return {
        "status": "healthy",
        "service": "voicepartnerai-backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/features")
async def get_public_features() -> Dict[str, Any]:
    """
    Public feature list for Marketing Site
    """
    features = {
        "voice_providers": [
            {
                "name": "ElevenLabs",
                "status": "active",
                "quality": "premium"
            },
            {
                "name": "Azure Speech",
                "status": "active",
                "quality": "enterprise"
            },
            {
                "name": "Google Cloud",
                "status": "beta",
                "quality": "high"
            }
        ],
        "supported_languages": [
            {"code": "de-DE", "name": "Deutsch", "region": "Deutschland"},
            {"code": "de-AT", "name": "Österreichisch", "region": "Österreich"},
            {"code": "de-CH", "name": "Schweizerdeutsch", "region": "Schweiz"},
            {"code": "en-US", "name": "English", "region": "International"}
        ],
        "compliance": [
            "GDPR",
            "ISO 27001",
            "SOC 2 Type II",
            "CCPA"
        ],
        "integrations": [
            "Salesforce",
            "HubSpot",
            "Zapier",
            "Microsoft Teams",
            "Slack",
            "Webhooks"
        ]
    }

    return {
        "status": "success",
        "data": features,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/pricing/public")
async def get_public_pricing() -> Dict[str, Any]:
    """
    Public pricing information for Marketing Site
    """
    pricing_tiers = {
        "professional": {
            "name": "Professional",
            "price": "€199",
            "period": "month",
            "features": [
                "10,000 minutes included",
                "5 voice assistants",
                "Advanced analytics",
                "API access",
                "Email support"
            ],
            "popular": False
        },
        "enterprise": {
            "name": "Enterprise",
            "price": "€599",
            "period": "month",
            "features": [
                "50,000 minutes included",
                "Unlimited assistants",
                "Enterprise analytics",
                "Priority support",
                "Custom integrations",
                "Dedicated manager"
            ],
            "popular": True
        },
        "scale": {
            "name": "Scale",
            "price": "Custom",
            "period": "tailored pricing",
            "features": [
                "Unlimited everything",
                "White-label options",
                "Custom deployment",
                "24/7 phone support",
                "SLA guarantees",
                "On-premise option"
            ],
            "popular": False
        }
    }

    return {
        "status": "success",
        "data": {
            "currency": "EUR",
            "tiers": pricing_tiers,
            "trial_available": True,
            "trial_duration_days": 14
        },
        "timestamp": datetime.utcnow().isoformat()
    }