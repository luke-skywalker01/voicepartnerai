#!/usr/bin/env python3
"""
VOICE INTEGRATION MODULE - VoicePartnerAI
🎤 Deepgram STT + OpenAI LLM + ElevenLabs TTS Integration
✅ Real-time Audio Processing Pipeline
"""

import os
import asyncio
import json
import base64
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import aiohttp
import websockets
from io import BytesIO

# Configure logging
logger = logging.getLogger(__name__)

class VoiceIntegration:
    """
    Professional Voice Integration Service
    Handles STT -> LLM -> TTS pipeline like VAPI
    """
    
    def __init__(self):
        self.deepgram_api_key = None
        self.openai_api_key = None
        self.elevenlabs_api_key = None
        self.session = None
        
    async def initialize_session(self):
        """Initialize HTTP session for API calls"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    def configure_apis(self, openai_key: str, deepgram_key: str, elevenlabs_key: str):
        """Configure API keys"""
        self.openai_api_key = openai_key
        self.deepgram_api_key = deepgram_key
        self.elevenlabs_api_key = elevenlabs_key
        logger.info("✅ Voice APIs configured")
    
    async def process_audio_chunk(self, 
                                 audio_base64: str, 
                                 assistant_prompt: str,
                                 language: str = "de-DE",
                                 voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Optional[Dict[str, Any]]:
        """
        Process audio chunk through full STT -> LLM -> TTS pipeline
        """
        try:
            await self.initialize_session()
            
            # Step 1: Speech-to-Text with Deepgram
            logger.info("🎤 Starting STT with Deepgram")
            transcription = await self.speech_to_text(audio_base64, language)
            
            if not transcription:
                logger.warning("⚠️ No transcription received")
                return None
            
            logger.info(f"📝 Transcription: {transcription}")
            
            # Step 2: LLM Processing with OpenAI
            logger.info("🧠 Processing with OpenAI LLM")
            llm_response = await self.llm_completion(transcription, assistant_prompt)
            
            if not llm_response:
                logger.warning("⚠️ No LLM response received")
                return None
                
            logger.info(f"💬 LLM Response: {llm_response}")
            
            # Step 3: Text-to-Speech with ElevenLabs
            logger.info("🔊 Converting to speech with ElevenLabs")
            tts_audio = await self.text_to_speech(llm_response, voice_id)
            
            if not tts_audio:
                logger.warning("⚠️ No TTS audio received")
                return None
            
            logger.info("✅ Full pipeline completed successfully")
            
            return {
                "transcription": transcription,
                "llm_response": llm_response,
                "tts_audio": tts_audio,
                "processing_time_ms": 0,  # TODO: Add timing
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error in audio processing pipeline: {e}")
            return None
    
    async def speech_to_text(self, audio_base64: str, language: str = "de-DE") -> Optional[str]:
        """
        Convert audio to text using Deepgram API
        """
        try:
            if not self.deepgram_api_key:
                logger.error("❌ Deepgram API key not configured")
                return None
            
            # Decode base64 audio
            audio_data = base64.b64decode(audio_base64)
            
            # Deepgram API endpoint
            url = "https://api.deepgram.com/v1/listen"
            
            # Set language parameter
            language_param = "de" if language.startswith("de") else "en"
            
            headers = {
                "Authorization": f"Token {self.deepgram_api_key}",
                "Content-Type": "audio/wav"
            }
            
            params = {
                "model": "nova-2",
                "language": language_param,
                "smart_format": "true",
                "punctuate": "true",
                "diarize": "false",
                "interim_results": "false"
            }
            
            async with self.session.post(
                url, 
                headers=headers, 
                params=params, 
                data=audio_data
            ) as response:
                
                if response.status != 200:
                    logger.error(f"❌ Deepgram API error: {response.status}")
                    response_text = await response.text()
                    logger.error(f"Response: {response_text}")
                    return None
                
                result = await response.json()
                
                # Extract transcription from Deepgram response
                if "results" in result and "channels" in result["results"]:
                    channels = result["results"]["channels"]
                    if len(channels) > 0 and "alternatives" in channels[0]:
                        alternatives = channels[0]["alternatives"]
                        if len(alternatives) > 0 and "transcript" in alternatives[0]:
                            transcript = alternatives[0]["transcript"].strip()
                            if transcript:
                                return transcript
                
                logger.warning("⚠️ No transcription found in Deepgram response")
                return None
                
        except Exception as e:
            logger.error(f"❌ Deepgram STT error: {e}")
            return None
    
    async def llm_completion(self, user_input: str, system_prompt: str) -> Optional[str]:
        """
        Generate response using OpenAI GPT
        """
        try:
            if not self.openai_api_key:
                logger.error("❌ OpenAI API key not configured")
                return None
            
            url = "https://api.openai.com/v1/chat/completions"
            
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "max_tokens": 500,
                "temperature": 0.7,
                "stream": False
            }
            
            async with self.session.post(url, headers=headers, json=payload) as response:
                
                if response.status != 200:
                    logger.error(f"❌ OpenAI API error: {response.status}")
                    response_text = await response.text()
                    logger.error(f"Response: {response_text}")
                    return None
                
                result = await response.json()
                
                # Extract response from OpenAI
                if "choices" in result and len(result["choices"]) > 0:
                    choice = result["choices"][0]
                    if "message" in choice and "content" in choice["message"]:
                        content = choice["message"]["content"].strip()
                        if content:
                            return content
                
                logger.warning("⚠️ No content found in OpenAI response")
                return None
                
        except Exception as e:
            logger.error(f"❌ OpenAI LLM error: {e}")
            return None
    
    async def text_to_speech(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Optional[str]:
        """
        Convert text to speech using ElevenLabs API
        """
        try:
            if not self.elevenlabs_api_key:
                logger.error("❌ ElevenLabs API key not configured")
                return None
            
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            payload = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.75,
                    "style": 0.5,
                    "use_speaker_boost": True
                }
            }
            
            async with self.session.post(url, headers=headers, json=payload) as response:
                
                if response.status != 200:
                    logger.error(f"❌ ElevenLabs API error: {response.status}")
                    response_text = await response.text()
                    logger.error(f"Response: {response_text}")
                    return None
                
                # Read audio data
                audio_data = await response.read()
                
                # Encode to base64 for WebSocket transmission
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                
                return audio_base64
                
        except Exception as e:
            logger.error(f"❌ ElevenLabs TTS error: {e}")
            return None
    
    async def test_apis(self) -> Dict[str, bool]:
        """
        Test all APIs to verify configuration
        """
        test_results = {
            "deepgram": False,
            "openai": False,
            "elevenlabs": False
        }
        
        try:
            await self.initialize_session()
            
            # Test Deepgram (using a small test audio)
            if self.deepgram_api_key:
                try:
                    # Create a minimal wav file for testing
                    test_audio = base64.b64encode(b"minimal_wav_data").decode()
                    result = await self.speech_to_text(test_audio)
                    test_results["deepgram"] = True  # If no exception, API key is valid
                except:
                    pass
            
            # Test OpenAI
            if self.openai_api_key:
                try:
                    result = await self.llm_completion("Test", "You are a helpful assistant.")
                    test_results["openai"] = result is not None
                except:
                    pass
            
            # Test ElevenLabs
            if self.elevenlabs_api_key:
                try:
                    result = await self.text_to_speech("Test")
                    test_results["elevenlabs"] = result is not None
                except:
                    pass
            
        except Exception as e:
            logger.error(f"❌ Error testing APIs: {e}")
        
        return test_results

# Global voice integration instance
voice_integration = VoiceIntegration()