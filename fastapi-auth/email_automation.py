"""
Email Automation System for VoicePartnerAI
Handles automatic triggering of lifecycle emails based on events and conditions
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from database import get_db
from models import User, Workspace, WorkspaceMember, CallLog, APIKey
from email_templates import LifecycleEmailAutomation
from billing import CreditCalculator

logger = logging.getLogger(__name__)


class EmailAutomationTrigger:
    """Handles automatic email triggering based on system events."""
    
    def __init__(self):
        self.credit_warning_thresholds = [100, 50, 20, 10, 5]  # Credit levels to warn at
        self.credit_warning_sent = {}  # Track sent warnings to avoid spam
    
    async def trigger_welcome_email(self, user: User, db: Session) -> bool:
        """Trigger welcome email for new user registration."""
        try:
            automation = LifecycleEmailAutomation(db)
            return await automation.send_welcome_email(user)
        except Exception as e:
            logger.error(f"Welcome email trigger failed for user {user.id}: {e}")
            return False
    
    async def trigger_team_invitation_email(
        self,
        invitee_email: str,
        inviter_id: int,
        workspace_id: int,
        role: str,
        invitation_token: str,
        db: Session
    ) -> bool:
        """Trigger team invitation email."""
        try:
            automation = LifecycleEmailAutomation(db)
            
            # Get inviter and workspace
            inviter = db.query(User).filter(User.id == inviter_id).first()
            workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
            
            if not inviter or not workspace:
                logger.error(f"Inviter {inviter_id} or workspace {workspace_id} not found")
                return False
            
            return await automation.send_team_invitation_email(
                invitee_email=invitee_email,
                inviter=inviter,
                workspace=workspace,
                role=role,
                invitation_token=invitation_token
            )
        except Exception as e:
            logger.error(f"Team invitation email trigger failed: {e}")
            return False
    
    async def check_and_send_credit_warnings(self, db: Session) -> Dict[str, int]:
        """Check all users for low credits and send warnings if needed."""
        results = {"warnings_sent": 0, "users_checked": 0, "errors": 0}
        
        try:
            # Get all active users with workspaces
            users_query = db.query(User).join(WorkspaceMember).join(Workspace).filter(
                and_(
                    User.is_active == True,
                    WorkspaceMember.is_active == True,
                    Workspace.is_active == True
                )
            ).distinct()
            
            users = users_query.all()
            results["users_checked"] = len(users)
            
            for user in users:
                try:
                    # Calculate user's total credits across all workspaces
                    total_credits = await self._calculate_user_credits(user, db)
                    
                    # Check if user needs credit warning
                    warning_threshold = self._get_warning_threshold(total_credits)
                    
                    if warning_threshold and not self._warning_recently_sent(user.id, warning_threshold):
                        # Calculate usage statistics
                        usage_stats = await self._calculate_usage_stats(user, db)
                        
                        automation = LifecycleEmailAutomation(db)
                        success = await automation.send_credit_warning_email(
                            user=user,
                            credits_remaining=total_credits,
                            credits_used_week=usage_stats["credits_used_week"],
                            avg_daily_usage=usage_stats["avg_daily_usage"],
                            estimated_days=usage_stats["estimated_days"],
                            last_call_date=usage_stats["last_call_date"]
                        )
                        
                        if success:
                            results["warnings_sent"] += 1
                            # Mark warning as sent
                            self.credit_warning_sent[f"{user.id}_{warning_threshold}"] = datetime.now(timezone.utc)
                            logger.info(f"Credit warning sent to user {user.id} at {warning_threshold} credits")
                        else:
                            results["errors"] += 1
                            
                except Exception as e:
                    logger.error(f"Credit warning check failed for user {user.id}: {e}")
                    results["errors"] += 1
            
            logger.info(f"Credit warning check completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Credit warning batch check failed: {e}")
            results["errors"] += 1
            return results
    
    async def _calculate_user_credits(self, user: User, db: Session) -> float:
        """Calculate total credits for a user across all workspaces."""
        # This would integrate with your actual billing/credit system
        # For now, we'll simulate based on call logs and usage
        
        try:
            # Get user's workspaces
            workspaces = db.query(Workspace).join(WorkspaceMember).filter(
                and_(
                    WorkspaceMember.user_id == user.id,
                    WorkspaceMember.is_active == True
                )
            ).all()
            
            total_credits = 0.0
            
            for workspace in workspaces:
                # In a real system, you'd have a credits table or field
                # For simulation, we'll assume each workspace starts with 1000 credits
                # and subtract based on call logs
                initial_credits = 1000.0
                
                # Calculate consumed credits from call logs
                consumed_credits = db.query(func.sum(CallLog.credits_consumed)).filter(
                    CallLog.owner_id == user.id
                ).scalar() or 0.0
                
                workspace_credits = max(0, initial_credits - consumed_credits)
                total_credits += workspace_credits
            
            return total_credits
            
        except Exception as e:
            logger.error(f"Credit calculation failed for user {user.id}: {e}")
            return 0.0
    
    async def _calculate_usage_stats(self, user: User, db: Session) -> Dict[str, Any]:
        """Calculate usage statistics for credit warning email."""
        try:
            # Date ranges
            now = datetime.now(timezone.utc)
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Credits used this week
            credits_used_week = db.query(func.sum(CallLog.credits_consumed)).filter(
                and_(
                    CallLog.owner_id == user.id,
                    CallLog.start_time >= week_ago
                )
            ).scalar() or 0.0
            
            # Credits used this month for average calculation
            credits_used_month = db.query(func.sum(CallLog.credits_consumed)).filter(
                and_(
                    CallLog.owner_id == user.id,
                    CallLog.start_time >= month_ago
                )
            ).scalar() or 0.0
            
            # Average daily usage
            avg_daily_usage = credits_used_month / 30 if credits_used_month > 0 else 0.0
            
            # Estimated days remaining
            total_credits = await self._calculate_user_credits(user, db)
            estimated_days = int(total_credits / avg_daily_usage) if avg_daily_usage > 0 else 999
            
            # Last call date
            last_call = db.query(CallLog.start_time).filter(
                CallLog.owner_id == user.id
            ).order_by(CallLog.start_time.desc()).first()
            
            last_call_date = None
            if last_call:
                last_call_date = last_call[0].strftime("%d.%m.%Y %H:%M")
            
            return {
                "credits_used_week": credits_used_week,
                "avg_daily_usage": avg_daily_usage,
                "estimated_days": min(estimated_days, 999),
                "last_call_date": last_call_date
            }
            
        except Exception as e:
            logger.error(f"Usage stats calculation failed for user {user.id}: {e}")
            return {
                "credits_used_week": 0.0,
                "avg_daily_usage": 0.0,
                "estimated_days": 0,
                "last_call_date": None
            }
    
    def _get_warning_threshold(self, credits: float) -> Optional[int]:
        """Get the appropriate warning threshold for current credit level."""
        for threshold in self.credit_warning_thresholds:
            if credits <= threshold:
                return threshold
        return None
    
    def _warning_recently_sent(self, user_id: int, threshold: int, hours: int = 24) -> bool:
        """Check if warning was recently sent to avoid spam."""
        key = f"{user_id}_{threshold}"
        if key in self.credit_warning_sent:
            sent_time = self.credit_warning_sent[key]
            return (datetime.now(timezone.utc) - sent_time) < timedelta(hours=hours)
        return False
    
    async def trigger_password_reset_email(
        self,
        user: User,
        reset_token: str,
        db: Session
    ) -> bool:
        """Trigger password reset email."""
        try:
            automation = LifecycleEmailAutomation(db)
            return await automation.send_password_reset_email(user, reset_token)
        except Exception as e:
            logger.error(f"Password reset email trigger failed for user {user.id}: {e}")
            return False
    
    async def trigger_email_verification(
        self,
        user: User,
        verification_token: str,
        db: Session
    ) -> bool:
        """Trigger email verification email."""
        try:
            automation = LifecycleEmailAutomation(db)
            return await automation.send_account_verification_email(user, verification_token)
        except Exception as e:
            logger.error(f"Email verification trigger failed for user {user.id}: {e}")
            return False


class EmailScheduler:
    """Scheduled email automation tasks."""
    
    def __init__(self):
        self.automation_trigger = EmailAutomationTrigger()
        self.is_running = False
    
    async def start_scheduler(self):
        """Start the email automation scheduler."""
        if self.is_running:
            logger.warning("Email scheduler is already running")
            return
        
        self.is_running = True
        logger.info("Starting email automation scheduler")
        
        # Schedule periodic tasks
        asyncio.create_task(self._credit_warning_scheduler())
        asyncio.create_task(self._cleanup_scheduler())
    
    async def stop_scheduler(self):
        """Stop the email automation scheduler."""
        self.is_running = False
        logger.info("Email automation scheduler stopped")
    
    async def _credit_warning_scheduler(self):
        """Run credit warning checks periodically."""
        while self.is_running:
            try:
                logger.info("Running scheduled credit warning check")
                
                # Get database session
                db = next(get_db())
                try:
                    results = await self.automation_trigger.check_and_send_credit_warnings(db)
                    logger.info(f"Credit warning scheduler completed: {results}")
                finally:
                    db.close()
                
                # Wait 6 hours before next check
                await asyncio.sleep(6 * 60 * 60)
                
            except Exception as e:
                logger.error(f"Credit warning scheduler error: {e}")
                # Wait 1 hour before retrying on error
                await asyncio.sleep(60 * 60)
    
    async def _cleanup_scheduler(self):
        """Clean up old warning tracking data."""
        while self.is_running:
            try:
                # Clean up warning tracking older than 7 days
                cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
                
                keys_to_remove = []
                for key, sent_time in self.automation_trigger.credit_warning_sent.items():
                    if sent_time < cutoff_time:
                        keys_to_remove.append(key)
                
                for key in keys_to_remove:
                    del self.automation_trigger.credit_warning_sent[key]
                
                logger.info(f"Cleaned up {len(keys_to_remove)} old warning tracking entries")
                
                # Run cleanup daily
                await asyncio.sleep(24 * 60 * 60)
                
            except Exception as e:
                logger.error(f"Cleanup scheduler error: {e}")
                await asyncio.sleep(60 * 60)


# Global email automation instances
email_trigger = EmailAutomationTrigger()
email_scheduler = EmailScheduler()


# Convenience functions for easy integration
async def send_welcome_email(user: User, db: Session) -> bool:
    """Send welcome email to new user."""
    return await email_trigger.trigger_welcome_email(user, db)


async def send_team_invitation(
    invitee_email: str,
    inviter_id: int,
    workspace_id: int,
    role: str,
    invitation_token: str,
    db: Session
) -> bool:
    """Send team invitation email."""
    return await email_trigger.trigger_team_invitation_email(
        invitee_email, inviter_id, workspace_id, role, invitation_token, db
    )


async def send_password_reset(user: User, reset_token: str, db: Session) -> bool:
    """Send password reset email."""
    return await email_trigger.trigger_password_reset_email(user, reset_token, db)


async def send_email_verification(user: User, verification_token: str, db: Session) -> bool:
    """Send email verification email."""
    return await email_trigger.trigger_email_verification(user, verification_token, db)


async def check_credit_warnings(db: Session) -> Dict[str, int]:
    """Manually trigger credit warning check."""
    return await email_trigger.check_and_send_credit_warnings(db)