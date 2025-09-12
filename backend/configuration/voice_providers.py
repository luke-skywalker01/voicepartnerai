"""
Voice Provider Configurations for VoicePartnerAI
"""

import os
from typing import Dict, Any

# ElevenLabs Configuration
ELEVENLABS_CONFIG = {
    "api_key": os.getenv("ELEVENLABS_API_KEY"),
    "base_url": "https://api.elevenlabs.io/v1",
    "default_voice_id": os.getenv("ELEVENLABS_DEFAULT_VOICE", "21m00Tcm4TlvDq8ikWAM"),
    "default_model": "eleven_multilingual_v2",
}

# Azure Speech Configuration
AZURE_CONFIG = {
    "subscription_key": os.getenv("AZURE_SPEECH_KEY"),
    "region": os.getenv("AZURE_SPEECH_REGION", "westeurope"),
    "endpoint": f"https://{os.getenv('AZURE_SPEECH_REGION', 'westeurope')}.tts.speech.microsoft.com/",
    "default_voice": "de-DE-KatjaNeural",
}

# Google Cloud Speech Configuration
GOOGLE_CONFIG = {
    "credentials_path": os.getenv("GOOGLE_CREDENTIALS_PATH"),
    "project_id": os.getenv("GOOGLE_PROJECT_ID"),
    "location": os.getenv("GOOGLE_LOCATION", "europe-west3"),
    "default_voice": "de-DE-Wavenet-C",
}

# Amazon Polly Configuration
AMAZON_CONFIG = {
    "access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
    "region": os.getenv("AWS_REGION", "eu-central-1"),
    "default_voice": "Marlene",
}

# Voice Provider Mapping
VOICE_PROVIDERS = {
    "eleven-labs": {
        "name": "ElevenLabs",
        "config": ELEVENLABS_CONFIG,
        "supported_languages": ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT"],
    },
    "azure": {
        "name": "Azure Speech Services",
        "config": AZURE_CONFIG,
        "supported_languages": ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT"],
    },
    "google": {
        "name": "Google Cloud Text-to-Speech",
        "config": GOOGLE_CONFIG,
        "supported_languages": ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT"],
    },
    "amazon": {
        "name": "Amazon Polly",
        "config": AMAZON_CONFIG,
        "supported_languages": ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT"],
    }
}

def get_provider_config(provider_name: str) -> Dict[str, Any]:
    """Get configuration for a specific voice provider"""
    return VOICE_PROVIDERS.get(provider_name, {}).get("config", {})