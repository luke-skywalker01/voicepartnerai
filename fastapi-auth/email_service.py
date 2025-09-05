"""
Email Service for VoicePartnerAI
Handles transactional emails via SendGrid with fallback to Amazon SES
"""

import os
import logging
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content, Substitution
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

logger = logging.getLogger(__name__)


class EmailProvider(Enum):
    """Available email providers."""
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    SMTP = "smtp"


@dataclass
class EmailTemplate:
    """Email template configuration."""
    template_id: str
    subject: str
    html_content: str
    text_content: str
    variables: Dict[str, Any] = None


@dataclass
class EmailAttachment:
    """Email attachment."""
    filename: str
    content: bytes
    content_type: str


class EmailServiceError(Exception):
    """Base exception for email service errors."""
    pass


class EmailDeliveryError(EmailServiceError):
    """Email delivery failed."""
    pass


class EmailConfigurationError(EmailServiceError):
    """Email service configuration error."""
    pass


class EmailService:
    """
    Unified email service supporting multiple providers.
    Primary: SendGrid, Fallback: Amazon SES
    """
    
    def __init__(self):
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "eu-central-1")
        
        self.from_email = os.getenv("FROM_EMAIL", "noreply@voicepartnerai.com")
        self.from_name = os.getenv("FROM_NAME", "VoicePartnerAI")
        
        # Initialize providers
        self.sendgrid_client = None
        self.ses_client = None
        
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available email providers."""
        # Initialize SendGrid
        if self.sendgrid_api_key:
            try:
                self.sendgrid_client = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
                logger.info("SendGrid client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid: {e}")
        
        # Initialize AWS SES
        if self.aws_access_key and self.aws_secret_key:
            try:
                self.ses_client = boto3.client(
                    'ses',
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                    region_name=self.aws_region
                )
                logger.info("AWS SES client initialized successfully")
            except (ClientError, NoCredentialsError) as e:
                logger.error(f"Failed to initialize AWS SES: {e}")
    
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        template_data: Optional[Dict[str, Any]] = None,
        priority: str = "normal"
    ) -> bool:
        """
        Send email with automatic provider fallback.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            attachments: List of attachments (optional)
            template_data: Template variables (optional)
            priority: Email priority (normal, high, low)
        
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Try SendGrid first
            if self.sendgrid_client:
                success = await self._send_via_sendgrid(
                    to, subject, body, html_body, attachments, template_data
                )
                if success:
                    logger.info(f"Email sent via SendGrid to {to}")
                    return True
                else:
                    logger.warning("SendGrid delivery failed, trying fallback")
            
            # Fallback to AWS SES
            if self.ses_client:
                success = await self._send_via_ses(
                    to, subject, body, html_body, attachments
                )
                if success:
                    logger.info(f"Email sent via AWS SES to {to}")
                    return True
                else:
                    logger.error("AWS SES delivery also failed")
            
            # No providers available
            raise EmailConfigurationError("No email providers configured")
            
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            raise EmailDeliveryError(f"Email delivery failed: {str(e)}")
    
    async def _send_via_sendgrid(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        template_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send email via SendGrid."""
        try:
            from_email = Email(self.from_email, self.from_name)
            to_email = To(to)
            
            # Use HTML body if provided, otherwise plain text
            content = Content("text/html", html_body) if html_body else Content("text/plain", body)
            
            mail = Mail(from_email, to_email, subject, content)
            
            # Add template data if provided
            if template_data:
                for key, value in template_data.items():
                    mail.add_substitution(Substitution(f"-{key}-", str(value)))
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    from sendgrid.helpers.mail import Attachment
                    import base64
                    
                    attached_file = Attachment()
                    attached_file.file_content = base64.b64encode(attachment.content).decode()
                    attached_file.file_type = attachment.content_type
                    attached_file.file_name = attachment.filename
                    attached_file.disposition = "attachment"
                    mail.add_attachment(attached_file)
            
            # Send email
            response = self.sendgrid_client.send(mail)
            
            if response.status_code in [200, 201, 202]:
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return False
                
        except Exception as e:
            logger.error(f"SendGrid sending failed: {e}")
            return False
    
    async def _send_via_ses(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None
    ) -> bool:
        """Send email via Amazon SES."""
        try:
            # SES basic email sending
            destination = {'ToAddresses': [to]}
            
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {}
            }
            
            if html_body:
                message['Body']['Html'] = {'Data': html_body, 'Charset': 'UTF-8'}
                message['Body']['Text'] = {'Data': body, 'Charset': 'UTF-8'}
            else:
                message['Body']['Text'] = {'Data': body, 'Charset': 'UTF-8'}
            
            # Send email
            response = self.ses_client.send_email(
                Source=f"{self.from_name} <{self.from_email}>",
                Destination=destination,
                Message=message
            )
            
            if response.get('MessageId'):
                return True
            else:
                logger.error(f"SES error: {response}")
                return False
                
        except ClientError as e:
            logger.error(f"SES sending failed: {e}")
            return False
    
    async def send_template_email(
        self,
        to: str,
        template: EmailTemplate,
        variables: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send email using a predefined template."""
        try:
            # Replace template variables
            final_variables = template.variables.copy() if template.variables else {}
            if variables:
                final_variables.update(variables)
            
            # Process subject
            subject = template.subject
            for key, value in final_variables.items():
                subject = subject.replace(f"{{{key}}}", str(value))
            
            # Process HTML content
            html_content = template.html_content
            for key, value in final_variables.items():
                html_content = html_content.replace(f"{{{key}}}", str(value))
            
            # Process text content
            text_content = template.text_content
            for key, value in final_variables.items():
                text_content = text_content.replace(f"{{{key}}}", str(value))
            
            return await self.send_email(
                to=to,
                subject=subject,
                body=text_content,
                html_body=html_content,
                template_data=final_variables
            )
            
        except Exception as e:
            logger.error(f"Template email sending failed: {e}")
            raise EmailDeliveryError(f"Template email failed: {str(e)}")
    
    async def send_bulk_email(
        self,
        recipients: List[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        max_concurrent: int = 10
    ) -> Dict[str, bool]:
        """
        Send bulk emails with concurrency control.
        
        Returns:
            Dict mapping email addresses to success status
        """
        results = {}
        
        # Create semaphore to limit concurrent sends
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def send_single_email(email: str) -> tuple[str, bool]:
            async with semaphore:
                try:
                    success = await self.send_email(email, subject, body, html_body)
                    return email, success
                except Exception as e:
                    logger.error(f"Bulk email failed for {email}: {e}")
                    return email, False
        
        # Send all emails concurrently
        tasks = [send_single_email(email) for email in recipients]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for result in results_list:
            if isinstance(result, tuple):
                email, success = result
                results[email] = success
            else:
                logger.error(f"Bulk email task failed: {result}")
        
        logger.info(f"Bulk email completed: {sum(results.values())}/{len(recipients)} successful")
        return results
    
    def get_available_providers(self) -> List[EmailProvider]:
        """Get list of available email providers."""
        providers = []
        
        if self.sendgrid_client:
            providers.append(EmailProvider.SENDGRID)
        
        if self.ses_client:
            providers.append(EmailProvider.AWS_SES)
        
        return providers
    
    async def verify_configuration(self) -> Dict[str, bool]:
        """Verify email service configuration."""
        status = {
            "sendgrid_configured": bool(self.sendgrid_api_key),
            "aws_ses_configured": bool(self.aws_access_key and self.aws_secret_key),
            "from_email_set": bool(self.from_email),
            "providers_available": len(self.get_available_providers()) > 0
        }
        
        # Test SendGrid connection
        if self.sendgrid_client:
            try:
                # Try to get API key info (this validates the key)
                response = self.sendgrid_client.api_keys.get()
                status["sendgrid_connection"] = response.status_code == 200
            except Exception as e:
                logger.error(f"SendGrid connection test failed: {e}")
                status["sendgrid_connection"] = False
        
        # Test AWS SES connection
        if self.ses_client:
            try:
                # Try to get sending quota (this validates credentials)
                response = self.ses_client.get_send_quota()
                status["aws_ses_connection"] = bool(response.get('Max24HourSend'))
            except Exception as e:
                logger.error(f"AWS SES connection test failed: {e}")
                status["aws_ses_connection"] = False
        
        return status


# Global email service instance
email_service = EmailService()


# Convenience function for easy access
async def send_email(
    to: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    attachments: Optional[List[EmailAttachment]] = None,
    template_data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Convenience function to send email.
    
    Args:
        to: Recipient email address  
        subject: Email subject
        body: Plain text body
        html_body: HTML body (optional)
        attachments: List of attachments (optional)
        template_data: Template variables (optional)
    
    Returns:
        bool: True if email was sent successfully
    """
    return await email_service.send_email(
        to=to,
        subject=subject,
        body=body,
        html_body=html_body,
        attachments=attachments,
        template_data=template_data
    )