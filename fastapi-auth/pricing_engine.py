#!/usr/bin/env python3
"""
VOICEPARTNERAI PRICING ENGINE
🚀 VAPI-Style Pricing System - Complete Implementation
✅ Provider Cost Tracking (Deepgram, OpenAI, ElevenLabs)
✅ Real-time Cost Calculation
✅ Usage-based Billing
✅ Advanced Analytics
"""

import os
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Provider(Enum):
    """AI Service Providers"""
    DEEPGRAM = "deepgram"           # Speech-to-Text
    OPENAI = "openai"               # Language Models  
    ELEVENLABS = "elevenlabs"       # Text-to-Speech
    PLAYHT = "playht"               # Alternative TTS
    VOICEPARTNER = "voicepartner"   # Our Platform Fee

class ServiceType(Enum):
    """Service Categories"""
    STT = "speech_to_text"          # Speech-to-Text
    LLM = "language_model"          # Language Models
    TTS = "text_to_speech"          # Text-to-Speech
    PLATFORM = "platform_fee"       # Our Platform Fee

@dataclass
class ProviderRate:
    """Provider pricing configuration"""
    provider: Provider
    service_type: ServiceType
    model_name: str
    cost_per_minute: Decimal
    cost_per_token: Optional[Decimal] = None
    cost_per_character: Optional[Decimal] = None
    currency: str = "EUR"
    effective_date: datetime = datetime.now()
    active: bool = True

@dataclass
class UsageRecord:
    """Single usage record for cost calculation"""
    session_id: str
    assistant_id: str
    user_email: str
    provider: Provider
    service_type: ServiceType
    model_name: str
    duration_seconds: int
    tokens_used: Optional[int] = None
    characters_processed: Optional[int] = None
    cost_amount: Decimal = Decimal('0.00')
    timestamp: datetime = datetime.now()

@dataclass
class CostBreakdown:
    """Detailed cost breakdown for a conversation"""
    session_id: str
    total_cost: Decimal
    duration_minutes: Decimal
    cost_per_minute: Decimal
    provider_costs: Dict[Provider, Decimal]
    service_costs: Dict[ServiceType, Decimal]
    timestamp: datetime = datetime.now()

class PricingEngine:
    """
    VoicePartnerAI Pricing Engine
    
    Implements VAPI-style pricing with:
    - Real-time cost calculation
    - Provider cost pass-through  
    - Platform fee management
    - Usage tracking & analytics
    """
    
    def __init__(self, db_path: str = "pricing.db"):
        self.db_path = db_path
        self.init_database()
        self.load_default_rates()
        
        logger.info("🚀 VoicePartnerAI Pricing Engine initialized")
    
    def init_database(self):
        """Initialize pricing database tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Provider rates table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS provider_rates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT NOT NULL,
                    service_type TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    cost_per_minute DECIMAL(10, 6) DEFAULT 0,
                    cost_per_token DECIMAL(10, 8) DEFAULT NULL,
                    cost_per_character DECIMAL(10, 8) DEFAULT NULL,
                    currency TEXT DEFAULT 'EUR',
                    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Usage records table  
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS usage_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    assistant_id TEXT NOT NULL,
                    user_email TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    service_type TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    duration_seconds INTEGER DEFAULT 0,
                    tokens_used INTEGER DEFAULT NULL,
                    characters_processed INTEGER DEFAULT NULL,
                    cost_amount DECIMAL(10, 6) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Cost breakdown table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_breakdowns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL UNIQUE,
                    assistant_id TEXT NOT NULL,
                    user_email TEXT NOT NULL,
                    total_cost DECIMAL(10, 6) NOT NULL,
                    duration_minutes DECIMAL(10, 3) NOT NULL,
                    cost_per_minute DECIMAL(10, 6) NOT NULL,
                    provider_costs TEXT DEFAULT '{}',  -- JSON
                    service_costs TEXT DEFAULT '{}',   -- JSON
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Billing records table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS billing_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL,
                    billing_period TEXT NOT NULL, -- YYYY-MM
                    total_cost DECIMAL(10, 2) NOT NULL,
                    total_minutes DECIMAL(10, 2) NOT NULL,
                    total_sessions INTEGER DEFAULT 0,
                    cost_breakdown TEXT DEFAULT '{}', -- JSON
                    invoice_generated BOOLEAN DEFAULT 0,
                    paid BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            logger.info("✅ Pricing database tables initialized")
    
    def load_default_rates(self):
        """Load default provider rates (VAPI-based pricing)"""
        default_rates = [
            # 🎤 SPEECH-TO-TEXT (STT)
            ProviderRate(
                Provider.DEEPGRAM, ServiceType.STT, "nova-2", 
                Decimal('0.01'), currency="EUR"  # €0.01/min
            ),
            
            # 🧠 LANGUAGE MODELS (LLM) 
            ProviderRate(
                Provider.OPENAI, ServiceType.LLM, "gpt-4o",
                Decimal('0.20'), cost_per_token=Decimal('0.00005'), currency="EUR"  # €0.20/min
            ),
            ProviderRate(
                Provider.OPENAI, ServiceType.LLM, "gpt-4o-mini", 
                Decimal('0.05'), cost_per_token=Decimal('0.000015'), currency="EUR"  # €0.05/min
            ),
            ProviderRate(
                Provider.OPENAI, ServiceType.LLM, "gpt-3.5-turbo",
                Decimal('0.02'), cost_per_token=Decimal('0.000001'), currency="EUR"  # €0.02/min
            ),
            
            # 🗣️ TEXT-TO-SPEECH (TTS)
            ProviderRate(
                Provider.ELEVENLABS, ServiceType.TTS, "eleven_multilingual_v2",
                Decimal('0.05'), cost_per_character=Decimal('0.00003'), currency="EUR"  # €0.05/min
            ),
            ProviderRate(
                Provider.PLAYHT, ServiceType.TTS, "PlayHT2.0-turbo",
                Decimal('0.07'), cost_per_character=Decimal('0.00004'), currency="EUR"  # €0.07/min
            ),
            
            # 🏢 PLATFORM FEE (VoicePartnerAI)
            ProviderRate(
                Provider.VOICEPARTNER, ServiceType.PLATFORM, "platform_fee",
                Decimal('0.05'), currency="EUR"  # €0.05/min (same as VAPI)
            )
        ]
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for rate in default_rates:
                # Check if rate already exists
                cursor.execute('''
                    SELECT id FROM provider_rates 
                    WHERE provider = ? AND service_type = ? AND model_name = ? AND active = 1
                ''', (rate.provider.value, rate.service_type.value, rate.model_name))
                
                if not cursor.fetchone():
                    cursor.execute('''
                        INSERT INTO provider_rates 
                        (provider, service_type, model_name, cost_per_minute, cost_per_token, cost_per_character, currency)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        rate.provider.value,
                        rate.service_type.value, 
                        rate.model_name,
                        float(rate.cost_per_minute),
                        float(rate.cost_per_token) if rate.cost_per_token else None,
                        float(rate.cost_per_character) if rate.cost_per_character else None,
                        rate.currency
                    ))
            
            conn.commit()
            logger.info("✅ Default provider rates loaded")
    
    def get_provider_rate(self, provider: Provider, service_type: ServiceType, model_name: str) -> Optional[ProviderRate]:
        """Get current rate for a provider/service/model combination"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM provider_rates 
                WHERE provider = ? AND service_type = ? AND model_name = ? AND active = 1
                ORDER BY effective_date DESC LIMIT 1
            ''', (provider.value, service_type.value, model_name))
            
            row = cursor.fetchone()
            if row:
                return ProviderRate(
                    provider=Provider(row['provider']),
                    service_type=ServiceType(row['service_type']),
                    model_name=row['model_name'],
                    cost_per_minute=Decimal(str(row['cost_per_minute'])),
                    cost_per_token=Decimal(str(row['cost_per_token'])) if row['cost_per_token'] else None,
                    cost_per_character=Decimal(str(row['cost_per_character'])) if row['cost_per_character'] else None,
                    currency=row['currency']
                )
            return None
    
    def calculate_conversation_cost(
        self, 
        session_id: str,
        assistant_id: str, 
        user_email: str,
        duration_seconds: int,
        stt_provider: str = "deepgram",
        llm_provider: str = "openai", 
        llm_model: str = "gpt-4o",
        tts_provider: str = "elevenlabs",
        tokens_used: Optional[int] = None,
        characters_generated: Optional[int] = None
    ) -> CostBreakdown:
        """
        Calculate total cost for a conversation
        
        This is the CORE function that calculates costs just like VAPI:
        - Platform fee: €0.05/min
        - Provider costs passed through at cost
        """
        
        duration_minutes = Decimal(duration_seconds) / Decimal(60)
        
        # Get provider rates
        stt_rate = self.get_provider_rate(Provider.DEEPGRAM, ServiceType.STT, "nova-2") 
        llm_rate = self.get_provider_rate(Provider.OPENAI, ServiceType.LLM, llm_model)
        tts_rate = self.get_provider_rate(Provider.ELEVENLABS, ServiceType.TTS, "eleven_multilingual_v2")
        platform_rate = self.get_provider_rate(Provider.VOICEPARTNER, ServiceType.PLATFORM, "platform_fee")
        
        provider_costs = {}
        service_costs = {}
        usage_records = []
        
        # 1. STT Cost (Deepgram)
        if stt_rate:
            stt_cost = (duration_minutes * stt_rate.cost_per_minute).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            provider_costs[Provider.DEEPGRAM] = stt_cost
            service_costs[ServiceType.STT] = stt_cost
            
            usage_records.append(UsageRecord(
                session_id=session_id,
                assistant_id=assistant_id,
                user_email=user_email,
                provider=Provider.DEEPGRAM,
                service_type=ServiceType.STT,
                model_name="nova-2",
                duration_seconds=duration_seconds,
                cost_amount=stt_cost
            ))
        
        # 2. LLM Cost (OpenAI)
        if llm_rate:
            if tokens_used and llm_rate.cost_per_token:
                llm_cost = (Decimal(tokens_used) * llm_rate.cost_per_token).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            else:
                llm_cost = (duration_minutes * llm_rate.cost_per_minute).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            
            provider_costs[Provider.OPENAI] = llm_cost
            service_costs[ServiceType.LLM] = llm_cost
            
            usage_records.append(UsageRecord(
                session_id=session_id,
                assistant_id=assistant_id,
                user_email=user_email,
                provider=Provider.OPENAI,
                service_type=ServiceType.LLM,
                model_name=llm_model,
                duration_seconds=duration_seconds,
                tokens_used=tokens_used,
                cost_amount=llm_cost
            ))
        
        # 3. TTS Cost (ElevenLabs)
        if tts_rate:
            if characters_generated and tts_rate.cost_per_character:
                tts_cost = (Decimal(characters_generated) * tts_rate.cost_per_character).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            else:
                tts_cost = (duration_minutes * tts_rate.cost_per_minute).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            
            provider_costs[Provider.ELEVENLABS] = tts_cost
            service_costs[ServiceType.TTS] = tts_cost
            
            usage_records.append(UsageRecord(
                session_id=session_id,
                assistant_id=assistant_id,
                user_email=user_email,
                provider=Provider.ELEVENLABS,
                service_type=ServiceType.TTS,
                model_name="eleven_multilingual_v2",
                duration_seconds=duration_seconds,
                characters_processed=characters_generated,
                cost_amount=tts_cost
            ))
        
        # 4. Platform Fee (VoicePartnerAI)
        if platform_rate:
            platform_cost = (duration_minutes * platform_rate.cost_per_minute).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
            provider_costs[Provider.VOICEPARTNER] = platform_cost
            service_costs[ServiceType.PLATFORM] = platform_cost
            
            usage_records.append(UsageRecord(
                session_id=session_id,
                assistant_id=assistant_id,
                user_email=user_email,
                provider=Provider.VOICEPARTNER,
                service_type=ServiceType.PLATFORM,
                model_name="platform_fee",
                duration_seconds=duration_seconds,
                cost_amount=platform_cost
            ))
        
        # Calculate total cost
        total_cost = sum(provider_costs.values())
        cost_per_minute = (total_cost / duration_minutes).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP) if duration_minutes > 0 else Decimal('0')
        
        # Store usage records
        self._store_usage_records(usage_records)
        
        # Create cost breakdown
        breakdown = CostBreakdown(
            session_id=session_id,
            total_cost=total_cost,
            duration_minutes=duration_minutes,
            cost_per_minute=cost_per_minute,
            provider_costs=provider_costs,
            service_costs=service_costs
        )
        
        # Store cost breakdown
        self._store_cost_breakdown(breakdown, assistant_id, user_email)
        
        logger.info(f"💰 Calculated cost for session {session_id}: €{total_cost} ({duration_minutes:.2f} min)")
        return breakdown
    
    def _store_usage_records(self, records: List[UsageRecord]):
        """Store usage records in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            for record in records:
                cursor.execute('''
                    INSERT INTO usage_records 
                    (session_id, assistant_id, user_email, provider, service_type, model_name, 
                     duration_seconds, tokens_used, characters_processed, cost_amount)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    record.session_id,
                    record.assistant_id,
                    record.user_email,
                    record.provider.value,
                    record.service_type.value,
                    record.model_name,
                    record.duration_seconds,
                    record.tokens_used,
                    record.characters_processed,
                    float(record.cost_amount)
                ))
            
            conn.commit()
    
    def _store_cost_breakdown(self, breakdown: CostBreakdown, assistant_id: str, user_email: str):
        """Store cost breakdown in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Convert dicts to JSON
            provider_costs_json = json.dumps({
                k.value: float(v) for k, v in breakdown.provider_costs.items()
            })
            service_costs_json = json.dumps({
                k.value: float(v) for k, v in breakdown.service_costs.items() 
            })
            
            cursor.execute('''
                INSERT OR REPLACE INTO cost_breakdowns
                (session_id, assistant_id, user_email, total_cost, duration_minutes, 
                 cost_per_minute, provider_costs, service_costs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                breakdown.session_id,
                assistant_id,
                user_email,
                float(breakdown.total_cost),
                float(breakdown.duration_minutes),
                float(breakdown.cost_per_minute),
                provider_costs_json,
                service_costs_json
            ))
            
            conn.commit()
    
    def get_user_monthly_costs(self, user_email: str, year_month: str = None) -> Dict:
        """Get monthly cost summary for user"""
        if not year_month:
            year_month = datetime.now().strftime('%Y-%m')
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get total costs for the month
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(total_cost) as total_cost,
                    SUM(duration_minutes) as total_minutes,
                    AVG(cost_per_minute) as avg_cost_per_minute
                FROM cost_breakdowns 
                WHERE user_email = ? AND strftime('%Y-%m', timestamp) = ?
            ''', (user_email, year_month))
            
            summary = cursor.fetchone()
            
            # Get provider breakdown
            cursor.execute('''
                SELECT provider, SUM(cost_amount) as provider_cost
                FROM usage_records 
                WHERE user_email = ? AND strftime('%Y-%m', timestamp) = ?
                GROUP BY provider
            ''', (user_email, year_month))
            
            provider_breakdown = {row[0]: float(row[1]) for row in cursor.fetchall()}
            
            return {
                "year_month": year_month,
                "total_sessions": summary[0] or 0,
                "total_cost": float(summary[1]) if summary[1] else 0.0,
                "total_minutes": float(summary[2]) if summary[2] else 0.0,
                "avg_cost_per_minute": float(summary[3]) if summary[3] else 0.0,
                "provider_breakdown": provider_breakdown
            }
    
    def get_assistant_costs(self, assistant_id: str, days: int = 30) -> Dict:
        """Get cost analytics for specific assistant"""
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(total_cost) as total_cost,
                    SUM(duration_minutes) as total_minutes,
                    AVG(cost_per_minute) as avg_cost_per_minute,
                    MIN(total_cost) as min_cost,
                    MAX(total_cost) as max_cost
                FROM cost_breakdowns 
                WHERE assistant_id = ? AND timestamp >= ?
            ''', (assistant_id, start_date))
            
            summary = cursor.fetchone()
            
            return {
                "assistant_id": assistant_id,
                "period_days": days,
                "total_sessions": summary[0] or 0,
                "total_cost": float(summary[1]) if summary[1] else 0.0,
                "total_minutes": float(summary[2]) if summary[2] else 0.0,
                "avg_cost_per_minute": float(summary[3]) if summary[3] else 0.0,
                "min_cost": float(summary[4]) if summary[4] else 0.0,
                "max_cost": float(summary[5]) if summary[5] else 0.0
            }
    
    def estimate_cost(
        self,
        duration_minutes: float,
        llm_model: str = "gpt-4o",
        estimated_tokens: int = None
    ) -> Dict:
        """Estimate cost for a planned conversation"""
        
        # Get rates
        stt_rate = self.get_provider_rate(Provider.DEEPGRAM, ServiceType.STT, "nova-2")
        llm_rate = self.get_provider_rate(Provider.OPENAI, ServiceType.LLM, llm_model) 
        tts_rate = self.get_provider_rate(Provider.ELEVENLABS, ServiceType.TTS, "eleven_multilingual_v2")
        platform_rate = self.get_provider_rate(Provider.VOICEPARTNER, ServiceType.PLATFORM, "platform_fee")
        
        duration_decimal = Decimal(str(duration_minutes))
        
        costs = {}
        
        if stt_rate:
            costs['stt_cost'] = float(duration_decimal * stt_rate.cost_per_minute)
        
        if llm_rate:
            if estimated_tokens and llm_rate.cost_per_token:
                costs['llm_cost'] = float(Decimal(estimated_tokens) * llm_rate.cost_per_token)
            else:
                costs['llm_cost'] = float(duration_decimal * llm_rate.cost_per_minute)
        
        if tts_rate:
            costs['tts_cost'] = float(duration_decimal * tts_rate.cost_per_minute)
        
        if platform_rate:
            costs['platform_cost'] = float(duration_decimal * platform_rate.cost_per_minute)
        
        total_cost = sum(costs.values())
        
        return {
            "duration_minutes": duration_minutes,
            "estimated_costs": costs,
            "total_cost": total_cost,
            "cost_per_minute": total_cost / duration_minutes if duration_minutes > 0 else 0
        }


# Usage example and testing
if __name__ == "__main__":
    pricing = PricingEngine()
    
    # Test cost calculation
    print("🧪 Testing VoicePartnerAI Pricing Engine")
    
    breakdown = pricing.calculate_conversation_cost(
        session_id="test-session-123",
        assistant_id="test-assistant-456", 
        user_email="test@voicepartner.ai",
        duration_seconds=300,  # 5 minutes
        llm_model="gpt-4o",
        tokens_used=1500,
        characters_generated=800
    )
    
    print(f"\n📊 Cost Breakdown:")
    print(f"Total Cost: €{breakdown.total_cost}")
    print(f"Duration: {breakdown.duration_minutes} minutes")
    print(f"Cost per minute: €{breakdown.cost_per_minute}")
    print(f"Provider Costs: {breakdown.provider_costs}")
    print(f"Service Costs: {breakdown.service_costs}")
    
    # Test estimation
    estimation = pricing.estimate_cost(10.0, "gpt-4o", 3000)
    print(f"\n💡 10-minute call estimation: €{estimation['total_cost']:.6f}")