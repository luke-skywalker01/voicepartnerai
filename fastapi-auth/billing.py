"""
Billing and Call Logging Module for VoicePartnerAI
Erweiterte Logik für Anruf-Logging und Credit-Verbrauch
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from models import CallLog, Assistant, PhoneNumber, User, AnalyticsSnapshot
from schemas import CallLogCreate, CallLogUpdate

logger = logging.getLogger(__name__)

class CallLogger:
    """Erweiterte Call Logging Klasse."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_call(self, call_data: CallLogCreate) -> CallLog:
        """
        Startet ein neues Call Log.
        Wird aufgerufen wenn ein Anruf beginnt.
        """
        try:
            # Validiere Phone Number
            phone_number = self.db.query(PhoneNumber).filter(
                PhoneNumber.id == call_data.phone_number_id
            ).first()
            
            if not phone_number:
                raise ValueError(f"Phone number {call_data.phone_number_id} not found")
            
            # Validiere Assistant falls zugewiesen
            assistant = None
            if call_data.assistant_id:
                assistant = self.db.query(Assistant).filter(
                    Assistant.id == call_data.assistant_id
                ).first()
                
                if not assistant:
                    logger.warning(f"Assistant {call_data.assistant_id} not found")
            
            # Extrahiere geografische Informationen aus Telefonnummer
            geo_info = self._extract_geo_info(call_data.caller_number)
            
            # Erstelle Call Log Entry
            call_log = CallLog(
                call_sid=call_data.call_sid,
                phone_number_id=call_data.phone_number_id,
                assistant_id=call_data.assistant_id,
                caller_number=call_data.caller_number,
                called_number=call_data.called_number,
                direction=call_data.direction,
                start_time=call_data.start_time,
                end_time=call_data.end_time,
                status=call_data.status,
                credits_consumed=call_data.credits_consumed,
                country_code=geo_info.get('country_code'),
                region=geo_info.get('region'),
                owner_id=phone_number.owner_id
            )
            
            self.db.add(call_log)
            self.db.commit()
            self.db.refresh(call_log)
            
            logger.info(f"Call started: {call_data.call_sid} from {call_data.caller_number}")
            
            return call_log
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to start call log: {e}")
            raise
    
    def update_call(self, call_sid: str, update_data: CallLogUpdate) -> Optional[CallLog]:
        """
        Aktualisiert ein bestehendes Call Log.
        Wird während und am Ende des Anrufs aufgerufen.
        """
        try:
            call_log = self.db.query(CallLog).filter(
                CallLog.call_sid == call_sid
            ).first()
            
            if not call_log:
                logger.error(f"Call log not found for SID: {call_sid}")
                return None
            
            # Update nur gesetzte Felder
            update_dict = update_data.model_dump(exclude_unset=True)
            
            for field, value in update_dict.items():
                setattr(call_log, field, value)
            
            # Berechne Dauer automatisch falls end_time gesetzt
            if update_data.end_time and not update_data.duration_seconds:
                duration = (update_data.end_time - call_log.start_time).total_seconds()
                call_log.duration_seconds = int(duration)
            
            # Berechne Kosten basierend auf Dauer und Credits
            if call_log.duration_seconds and call_log.credits_consumed:
                call_log.cost_usd = self._calculate_cost_usd(call_log.credits_consumed)
                call_log.cost_eur = self._calculate_cost_eur(call_log.credits_consumed)
            
            self.db.commit()
            self.db.refresh(call_log)
            
            logger.info(f"Call updated: {call_sid} - Status: {call_log.status}")
            
            # Trigger Analytics Update wenn Call beendet
            if call_log.status in ['completed', 'failed']:
                self._trigger_analytics_update(call_log)
            
            return call_log
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update call log: {e}")
            raise
    
    def end_call(self, call_sid: str, end_time: datetime, 
                 status: str = 'completed', hangup_cause: str = 'normal',
                 final_credits: float = 0.0) -> Optional[CallLog]:
        """
        Beendet einen Anruf mit finalen Metriken.
        """
        update_data = CallLogUpdate(
            end_time=end_time,
            status=status,
            hangup_cause=hangup_cause,
            credits_consumed=final_credits
        )
        
        call_log = self.update_call(call_sid, update_data)
        
        if call_log:
            logger.info(f"Call ended: {call_sid} - Duration: {call_log.duration_seconds}s - Credits: {final_credits}")
            
            # Update Phone Number Statistiken
            self._update_phone_number_stats(call_log)
            
            # Update Assistant Statistiken
            if call_log.assistant_id:
                self._update_assistant_stats(call_log)
        
        return call_log
    
    def log_ai_metrics(self, call_sid: str, 
                      response_time_ms: int,
                      confidence_score: float,
                      interruptions: int = 0,
                      conversation_turns: int = 0) -> bool:
        """Loggt AI-spezifische Metriken während des Anrufs."""
        try:
            call_log = self.db.query(CallLog).filter(
                CallLog.call_sid == call_sid
            ).first()
            
            if not call_log:
                return False
            
            call_log.ai_response_time_ms = response_time_ms
            call_log.ai_confidence_avg = confidence_score
            call_log.ai_interruptions = interruptions
            call_log.conversation_turns = conversation_turns
            
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to log AI metrics: {e}")
            return False
    
    def log_conversation_analytics(self, call_sid: str,
                                 sentiment_score: float,
                                 intent_detected: str,
                                 keywords: list,
                                 customer_satisfaction: Optional[int] = None) -> bool:
        """Loggt Konversations-Analytics."""
        try:
            call_log = self.db.query(CallLog).filter(
                CallLog.call_sid == call_sid
            ).first()
            
            if not call_log:
                return False
            
            call_log.sentiment_score = sentiment_score
            call_log.intent_detected = intent_detected
            call_log.keywords_extracted = {"keywords": keywords}
            if customer_satisfaction:
                call_log.customer_satisfaction = customer_satisfaction
            
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to log conversation analytics: {e}")
            return False
    
    def _extract_geo_info(self, phone_number: str) -> Dict[str, str]:
        """
        Extrahiert geografische Informationen aus der Telefonnummer.
        In Produktion würde dies eine externe API verwenden.
        """
        geo_info = {
            'country_code': 'Unknown',
            'region': 'Unknown'
        }
        
        if phone_number.startswith('+49'):
            geo_info['country_code'] = 'DE'
            geo_info['region'] = 'Germany'
        elif phone_number.startswith('+1'):
            geo_info['country_code'] = 'US'
            geo_info['region'] = 'United States'
        elif phone_number.startswith('+44'):
            geo_info['country_code'] = 'GB'
            geo_info['region'] = 'United Kingdom'
        elif phone_number.startswith('+33'):
            geo_info['country_code'] = 'FR'
            geo_info['region'] = 'France'
        
        return geo_info
    
    def _calculate_cost_usd(self, credits: float) -> float:
        """Berechnet Kosten in USD basierend auf Credits."""
        # Standard-Rate: 1 Credit = $0.01
        return credits * 0.01
    
    def _calculate_cost_eur(self, credits: float) -> float:
        """Berechnet Kosten in EUR basierend auf Credits."""
        # Wechselkurs: 1 USD ≈ 0.92 EUR (in Produktion dynamisch)
        return self._calculate_cost_usd(credits) * 0.92
    
    def _update_phone_number_stats(self, call_log: CallLog):
        """Aktualisiert Phone Number Statistiken."""
        try:
            phone_number = self.db.query(PhoneNumber).filter(
                PhoneNumber.id == call_log.phone_number_id
            ).first()
            
            if phone_number and phone_number.usage:
                usage = phone_number.usage.copy()
                usage['total_calls'] = usage.get('total_calls', 0) + 1
                
                if call_log.status == 'completed':
                    usage['total_minutes'] = usage.get('total_minutes', 0) + (call_log.duration_seconds or 0) / 60
                    usage['monthly_cost'] = usage.get('monthly_cost', 0) + (call_log.cost_eur or 0)
                
                phone_number.usage = usage
                phone_number.last_used = call_log.end_time or call_log.start_time
                
                self.db.commit()
                
        except Exception as e:
            logger.error(f"Failed to update phone number stats: {e}")
    
    def _update_assistant_stats(self, call_log: CallLog):
        """Aktualisiert Assistant Performance Statistiken."""
        # In Produktion würde dies detaillierte Assistant-Statistiken aktualisieren
        logger.info(f"Assistant {call_log.assistant_id} handled call {call_log.call_sid}")
    
    def _trigger_analytics_update(self, call_log: CallLog):
        """Triggert Update der Analytics Snapshots."""
        try:
            # Update täglichen Snapshot
            today = call_log.start_time.date()
            self._update_analytics_snapshot(call_log.owner_id, today, 'daily')
            
        except Exception as e:
            logger.error(f"Failed to trigger analytics update: {e}")
    
    def _update_analytics_snapshot(self, owner_id: int, date: Any, period: str):
        """Aktualisiert oder erstellt Analytics Snapshot."""
        try:
            snapshot = self.db.query(AnalyticsSnapshot).filter(
                and_(
                    AnalyticsSnapshot.owner_id == owner_id,
                    AnalyticsSnapshot.snapshot_date >= date,
                    AnalyticsSnapshot.time_period == period
                )
            ).first()
            
            if not snapshot:
                snapshot = AnalyticsSnapshot(
                    snapshot_date=datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc),
                    time_period=period,
                    owner_id=owner_id
                )
                self.db.add(snapshot)
            
            # Berechne aktuelle Statistiken
            stats = self._calculate_period_stats(owner_id, date, period)
            
            # Update Snapshot
            for key, value in stats.items():
                if hasattr(snapshot, key):
                    setattr(snapshot, key, value)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to update analytics snapshot: {e}")
    
    def _calculate_period_stats(self, owner_id: int, date: Any, period: str) -> Dict[str, Any]:
        """Berechnet Statistiken für einen bestimmten Zeitraum."""
        # Basis-Statistiken für den Tag
        start_date = datetime.combine(date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_date = datetime.combine(date, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        calls = self.db.query(CallLog).filter(
            and_(
                CallLog.owner_id == owner_id,
                CallLog.start_time >= start_date,
                CallLog.start_time <= end_date
            )
        ).all()
        
        if not calls:
            return {}
        
        total_calls = len(calls)
        successful_calls = len([c for c in calls if c.status == 'completed'])
        failed_calls = len([c for c in calls if c.status in ['failed', 'busy']])
        
        total_duration = sum([c.duration_seconds or 0 for c in calls])
        total_credits = sum([c.credits_consumed for c in calls])
        total_cost = sum([c.cost_eur or 0 for c in calls])
        
        return {
            'total_calls': total_calls,
            'successful_calls': successful_calls,
            'failed_calls': failed_calls,
            'total_duration': total_duration,
            'total_credits_consumed': total_credits,
            'total_cost_eur': total_cost,
            'avg_duration': total_duration / total_calls if total_calls > 0 else 0
        }


class CreditCalculator:
    """Credit-Berechnungslogik für verschiedene Services."""
    
    # Standard-Raten (Credits pro Minute)
    RATES = {
        'voice_call': 1.0,      # 1 Credit pro Minute Anruf
        'ai_processing': 0.5,   # 0.5 Credits pro AI-Anfrage
        'text_to_speech': 0.1,  # 0.1 Credits pro TTS-Request
        'transcription': 0.2,   # 0.2 Credits pro Minute Transkription
        'premium_voice': 2.0,   # 2 Credits pro Minute für Premium-Voices
    }
    
    @classmethod
    def calculate_call_credits(cls, duration_minutes: float, 
                             voice_type: str = 'standard',
                             ai_requests: int = 0) -> float:
        """Berechnet Credits für einen Anruf."""
        credits = 0.0
        
        # Basis-Anrufkosten
        credits += duration_minutes * cls.RATES['voice_call']
        
        # Voice-Typ Aufschlag
        if voice_type == 'premium':
            credits += duration_minutes * cls.RATES['premium_voice']
        
        # AI-Processing Kosten
        credits += ai_requests * cls.RATES['ai_processing']
        
        # TTS Kosten (angenommen 1 TTS pro Minute)
        credits += duration_minutes * cls.RATES['text_to_speech']
        
        return round(credits, 2)
    
    @classmethod
    def calculate_monthly_projection(cls, daily_usage: float) -> Dict[str, float]:
        """Berechnet monatliche Projektionen basierend auf täglicher Nutzung."""
        monthly_credits = daily_usage * 30  # 30 Tage Monat
        monthly_cost_usd = monthly_credits * 0.01  # $0.01 pro Credit
        monthly_cost_eur = monthly_cost_usd * 0.92  # EUR Conversion
        
        return {
            'monthly_credits': monthly_credits,
            'monthly_cost_usd': monthly_cost_usd,
            'monthly_cost_eur': monthly_cost_eur
        }