"""
Outbound Calling Service for VoicePartnerAI
Handles outbound call initiation, Twilio integration, and call management
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, Assistant, PhoneNumber, CallLog
from schemas import OutboundCallStart, OutboundCallResponse, CreditCheckResponse
from billing import CallLogger, CreditCalculator

logger = logging.getLogger(__name__)

class OutboundCallService:
    """Service für Outbound Call Management."""
    
    def __init__(self, db: Session):
        self.db = db
        self.call_logger = CallLogger(db)
        
        # Twilio Configuration (in production, these would be environment variables)
        self.twilio_account_sid = "your_twilio_account_sid"
        self.twilio_auth_token = "your_twilio_auth_token"
        self.webhook_base_url = "https://your-domain.com/webhooks/twilio"
        
    def check_user_credits(self, user_id: int, estimated_duration_minutes: float = 5.0) -> CreditCheckResponse:
        """
        Prüft ob der User genügend Credits für den Outbound-Anruf hat.
        """
        try:
            # Get user's current credit balance (in production, this would be from a credits table)
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Mock credit balance (in production, get from user credits table)
            current_credits = 50.0  # Mock: user has 50 credits
            monthly_limit = 100.0   # Mock: monthly limit is 100 credits
            
            # Calculate current month usage
            now = datetime.utcnow()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            monthly_usage = self.db.query(func.sum(CallLog.credits_consumed)).filter(
                CallLog.owner_id == user_id,
                CallLog.start_time >= month_start
            ).scalar() or 0.0
            
            # Estimate call cost
            estimated_call_cost = CreditCalculator.calculate_call_credits(
                duration_minutes=estimated_duration_minutes,
                voice_type='standard',
                ai_requests=int(estimated_duration_minutes * 2)  # Assume 2 AI requests per minute
            )
            
            has_sufficient_credits = current_credits >= estimated_call_cost
            remaining_credits = current_credits - estimated_call_cost
            
            warning_message = None
            if not has_sufficient_credits:
                warning_message = f"Insufficient credits. Need {estimated_call_cost:.1f}, have {current_credits:.1f}"
            elif remaining_credits < 5.0:
                warning_message = "Low credit balance. Consider topping up."
            elif (monthly_usage + estimated_call_cost) > (monthly_limit * 0.8):
                warning_message = "Approaching monthly credit limit."
            
            return CreditCheckResponse(
                has_sufficient_credits=has_sufficient_credits,
                current_credits=current_credits,
                estimated_call_cost=estimated_call_cost,
                remaining_credits_after_call=remaining_credits,
                monthly_limit=monthly_limit,
                monthly_usage=monthly_usage,
                warning_message=warning_message
            )
            
        except Exception as e:
            logger.error(f"Credit check failed: {e}")
            return CreditCheckResponse(
                has_sufficient_credits=False,
                current_credits=0.0,
                estimated_call_cost=estimated_call_cost,
                remaining_credits_after_call=0.0,
                monthly_usage=0.0,
                warning_message=f"Credit check failed: {str(e)}"
            )
    
    def initiate_outbound_call(self, call_request: OutboundCallStart, user_id: int) -> OutboundCallResponse:
        """
        Initiiert einen Outbound-Anruf über Twilio.
        """
        try:
            # 1. Validate Assistant
            assistant = self.db.query(Assistant).filter(
                Assistant.id == call_request.assistant_id,
                Assistant.owner_id == user_id,
                Assistant.is_active == True
            ).first()
            
            if not assistant:
                raise ValueError(f"Assistant {call_request.assistant_id} not found or not active")
            
            # 2. Get Phone Number to call from
            phone_number = None
            if call_request.phone_number_id:
                phone_number = self.db.query(PhoneNumber).filter(
                    PhoneNumber.id == call_request.phone_number_id,
                    PhoneNumber.owner_id == user_id,
                    PhoneNumber.status == "active"
                ).first()
            else:
                # Get the first available phone number
                phone_number = self.db.query(PhoneNumber).filter(
                    PhoneNumber.owner_id == user_id,
                    PhoneNumber.status == "active"
                ).first()
            
            if not phone_number:
                raise ValueError("No active phone number available for outbound calls")
            
            # 3. Credit Check
            credit_check = self.check_user_credits(user_id, call_request.max_duration_minutes or 5.0)
            if not credit_check.has_sufficient_credits:
                raise ValueError(credit_check.warning_message or "Insufficient credits")
            
            # 4. Generate Call ID and SID
            call_id = str(uuid.uuid4())
            call_sid = f"CA{uuid.uuid4().hex[:32]}"  # Mock Twilio Call SID format
            
            # 5. Create Call Log Entry
            call_log_data = {
                "call_sid": call_sid,
                "phone_number_id": phone_number.id,
                "assistant_id": assistant.id,
                "caller_number": phone_number.phone_number,  # We're calling FROM this number
                "called_number": call_request.phone_number_to_call,  # TO this number
                "direction": "outbound",
                "start_time": datetime.now(timezone.utc),
                "status": "initiated",
                "credits_consumed": 0.0  # Will be updated as call progresses
            }
            
            # Log the call start
            call_log = self.call_logger.start_call_from_dict(call_log_data, user_id)
            
            # 6. Initiate Twilio Call (Mock implementation)
            twilio_response = self._initiate_twilio_call(
                from_number=phone_number.phone_number,
                to_number=call_request.phone_number_to_call,
                assistant_id=assistant.id,
                call_id=call_id,
                webhook_url=f"{self.webhook_base_url}/outbound"
            )
            
            # 7. Update call log with Twilio response
            if twilio_response.get("success"):
                status = "queued"
                message = f"Outbound call initiated successfully to {call_request.phone_number_to_call}"
            else:
                status = "failed"
                message = f"Failed to initiate call: {twilio_response.get('error', 'Unknown error')}"
                # Update call log to failed
                self.call_logger.update_call(call_sid, {"status": "failed"})
            
            logger.info(f"Outbound call initiated: {call_sid} to {call_request.phone_number_to_call}")
            
            return OutboundCallResponse(
                call_id=call_id,
                call_sid=call_sid,
                status=status,
                phone_number_to_call=call_request.phone_number_to_call,
                phone_number_from=phone_number.phone_number,
                assistant_id=assistant.id,
                estimated_credits=credit_check.estimated_call_cost,
                created_at=datetime.now(timezone.utc),
                message=message
            )
            
        except Exception as e:
            logger.error(f"Failed to initiate outbound call: {e}")
            raise ValueError(f"Failed to initiate outbound call: {str(e)}")
    
    def _initiate_twilio_call(self, from_number: str, to_number: str, 
                             assistant_id: int, call_id: str, webhook_url: str) -> Dict[str, Any]:
        """
        Initiiert den tatsächlichen Twilio-Anruf.
        In production würde dies die echte Twilio API verwenden.
        """
        try:
            # Mock Twilio API call
            # In production, this would be:
            # from twilio.rest import Client
            # client = Client(self.twilio_account_sid, self.twilio_auth_token)
            # call = client.calls.create(
            #     to=to_number,
            #     from_=from_number,
            #     url=webhook_url,
            #     method='POST',
            #     status_callback=f"{webhook_url}/status",
            #     status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
            #     status_callback_method='POST'
            # )
            
            # Mock successful response
            logger.info(f"Mock Twilio call: FROM {from_number} TO {to_number}")
            
            return {
                "success": True,
                "call_sid": f"CA{uuid.uuid4().hex[:32]}",
                "status": "queued",
                "from": from_number,
                "to": to_number
            }
            
        except Exception as e:
            logger.error(f"Twilio API call failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_call_status(self, call_sid: str, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Ruft den aktuellen Status eines Outbound-Anrufs ab.
        """
        try:
            call_log = self.db.query(CallLog).filter(
                CallLog.call_sid == call_sid,
                CallLog.owner_id == user_id,
                CallLog.direction == "outbound"
            ).first()
            
            if not call_log:
                return None
            
            return {
                "call_sid": call_log.call_sid,
                "status": call_log.status,
                "start_time": call_log.start_time,
                "end_time": call_log.end_time,
                "duration_seconds": call_log.duration_seconds,
                "credits_consumed": call_log.credits_consumed,
                "cost_eur": call_log.cost_eur,
                "phone_number_to": call_log.called_number,
                "phone_number_from": call_log.caller_number,
                "assistant_id": call_log.assistant_id
            }
            
        except Exception as e:
            logger.error(f"Failed to get call status: {e}")
            return None
    
    def handle_twilio_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Verarbeitet Twilio Webhook-Events für Outbound-Anrufe.
        """
        try:
            call_sid = webhook_data.get('CallSid')
            call_status = webhook_data.get('CallStatus')
            duration = webhook_data.get('CallDuration')
            
            if not call_sid:
                logger.error("No CallSid in webhook data")
                return False
            
            # Find the call log
            call_log = self.db.query(CallLog).filter(
                CallLog.call_sid == call_sid
            ).first()
            
            if not call_log:
                logger.error(f"Call log not found for SID: {call_sid}")
                return False
            
            # Update call status
            update_data = {"status": call_status}
            
            if call_status in ["completed", "failed", "busy", "no-answer"]:
                # Call ended
                update_data["end_time"] = datetime.now(timezone.utc)
                
                if duration:
                    update_data["duration_seconds"] = int(duration)
                    
                    # Calculate final credits
                    duration_minutes = int(duration) / 60
                    final_credits = CreditCalculator.calculate_call_credits(
                        duration_minutes=duration_minutes,
                        voice_type='standard',
                        ai_requests=int(duration_minutes * 2)
                    )
                    update_data["credits_consumed"] = final_credits
            
            # Update the call log
            self.call_logger.update_call(call_sid, update_data)
            
            logger.info(f"Updated outbound call {call_sid} with status {call_status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to handle webhook: {e}")
            return False


# Extension to CallLogger class to add outbound call support
def extend_call_logger():
    """Extends the existing CallLogger class with outbound call methods."""
    
    def start_call_from_dict(self, call_data: Dict[str, Any], user_id: int) -> 'CallLog':
        """
        Startet ein Call Log aus einem Dictionary (für Outbound Calls).
        """
        try:
            from models import CallLog
            from datetime import datetime, timezone
            
            call_log = CallLog(
                call_sid=call_data["call_sid"],
                phone_number_id=call_data["phone_number_id"],
                assistant_id=call_data["assistant_id"],
                caller_number=call_data["caller_number"],
                called_number=call_data["called_number"],
                direction=call_data["direction"],
                start_time=call_data["start_time"],
                status=call_data["status"],
                credits_consumed=call_data["credits_consumed"],
                owner_id=user_id
            )
            
            self.db.add(call_log)
            self.db.commit()
            self.db.refresh(call_log)
            
            logger.info(f"Outbound call started: {call_data['call_sid']}")
            return call_log
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to start outbound call log: {e}")
            raise
    
    # Add method to existing CallLogger
    from billing import CallLogger
    CallLogger.start_call_from_dict = start_call_from_dict
    
# Call the extension when module is imported
extend_call_logger()