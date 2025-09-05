"""
Email Templates for VoicePartnerAI Lifecycle Events
Contains all transactional email templates and automation logic
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from email_service import EmailTemplate, email_service
from models import User, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)


class EmailTemplates:
    """Pre-configured email templates for lifecycle events."""
    
    @staticmethod
    def get_welcome_template() -> EmailTemplate:
        """Welcome email template for new users."""
        return EmailTemplate(
            template_id="welcome",
            subject="Willkommen bei VoicePartnerAI! 🎉",
            html_content="""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Willkommen bei VoicePartnerAI</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .steps { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .step { margin: 15px 0; padding: 15px; border-left: 4px solid #667eea; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Willkommen bei VoicePartnerAI!</h1>
                        <p>Hallo {first_name}, schön dass du da bist!</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi {first_name},</p>
                        
                        <p>Herzlichen Glückwunsch! Du hast erfolgreich dein VoicePartnerAI-Konto erstellt. Du bist jetzt bereit, die Zukunft der KI-gestützten Telefonie zu erleben.</p>
                        
                        <a href="{dashboard_url}" class="button">Zur Plattform</a>
                        
                        <div class="steps">
                            <h3>📋 Deine nächsten Schritte:</h3>
                            
                            <div class="step">
                                <h4>1. 🤖 Ersten Assistenten erstellen</h4>
                                <p>Erstelle deinen ersten KI-Assistenten und konfiguriere seine Persönlichkeit und Fähigkeiten.</p>
                            </div>
                            
                            <div class="step">
                                <h4>2. 📞 Telefonnummer einrichten</h4>
                                <p>Erwerbe eine Telefonnummer und verbinde sie mit deinem Assistenten.</p>
                            </div>
                            
                            <div class="step">
                                <h4>3. 🚀 Ersten Testanruf tätigen</h4>
                                <p>Teste deinen Assistenten mit einem Anruf und erlebe die KI in Aktion.</p>
                            </div>
                        </div>
                        
                        <h3>💡 Hilfe und Ressourcen:</h3>
                        <ul>
                            <li><a href="{docs_url}">📚 Dokumentation</a> - Alles was du wissen musst</li>
                            <li><a href="{tutorial_url}">🎥 Video-Tutorials</a> - Schritt-für-Schritt Anleitungen</li>
                            <li><a href="{support_url}">💬 Support</a> - Wir helfen dir gerne weiter</li>
                        </ul>
                        
                        <p>Falls du Fragen hast, antworte einfach auf diese E-Mail. Unser Support-Team freut sich darauf, dir zu helfen!</p>
                        
                        <p>Viel Spaß beim Erkunden der Plattform!</p>
                        
                        <p>Dein VoicePartnerAI Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>VoicePartnerAI - Die Zukunft der KI-Telefonie</p>
                        <p>Diese E-Mail wurde an {email} gesendet.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            text_content="""
            Willkommen bei VoicePartnerAI!
            
            Hallo {first_name},
            
            Herzlichen Glückwunsch! Du hast erfolgreich dein VoicePartnerAI-Konto erstellt.
            
            Deine nächsten Schritte:
            
            1. Ersten Assistenten erstellen
               Erstelle deinen ersten KI-Assistenten und konfiguriere seine Persönlichkeit.
            
            2. Telefonnummer einrichten  
               Erwerbe eine Telefonnummer und verbinde sie mit deinem Assistenten.
            
            3. Ersten Testanruf tätigen
               Teste deinen Assistenten mit einem Anruf und erlebe die KI in Aktion.
            
            Hilfe und Ressourcen:
            - Dokumentation: {docs_url}
            - Video-Tutorials: {tutorial_url}
            - Support: {support_url}
            
            Zur Plattform: {dashboard_url}
            
            Falls du Fragen hast, antworte einfach auf diese E-Mail.
            
            Viel Spaß beim Erkunden der Plattform!
            
            Dein VoicePartnerAI Team
            """
        )
    
    @staticmethod
    def get_credit_warning_template() -> EmailTemplate:
        """Credit warning email template."""
        return EmailTemplate(
            template_id="credit_warning",
            subject="⚠️ Deine Credits gehen zur Neige - {credits_remaining} Credits übrig",
            html_content="""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Credit-Warnung</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Credit-Warnung</h1>
                        <p>Deine Credits gehen zur Neige</p>
                    </div>
                    
                    <div class="content">
                        <p>Hallo {first_name},</p>
                        
                        <div class="warning-box">
                            <h3>🚨 Wichtige Benachrichtigung</h3>
                            <p>Dein aktueller Credit-Stand ist niedrig. Du hast noch <strong>{credits_remaining} Credits</strong> übrig.</p>
                            <p>Bei deiner aktuellen Nutzung reichen diese Credits voraussichtlich noch für <strong>{estimated_days} Tage</strong>.</p>
                        </div>
                        
                        <div class="stats">
                            <h3>📊 Deine Nutzungsstatistiken:</h3>
                            <ul>
                                <li><strong>Aktuelle Credits:</strong> {credits_remaining}</li>
                                <li><strong>Credits diese Woche verbraucht:</strong> {credits_used_week}</li>
                                <li><strong>Durchschnittlicher Tagesverbrauch:</strong> {avg_daily_usage} Credits</li>
                                <li><strong>Letzter Anruf:</strong> {last_call_date}</li>
                            </ul>
                        </div>
                        
                        <h3>🔄 Was passiert als nächstes?</h3>
                        <p>Sobald deine Credits aufgebraucht sind, werden deine Telefonnummern temporär deaktiviert. Eingehende Anrufe können dann nicht mehr entgegengenommen werden.</p>
                        
                        <a href="{billing_url}" class="button">Credits aufladen</a>
                        
                        <h3>💡 Tipps zur Credit-Optimierung:</h3>
                        <ul>
                            <li>Verwende kürzere Begrüßungstexte</li>
                            <li>Optimiere deine KI-Prompts für Effizienz</li>
                            <li>Überprüfe deine Anrufweiterstellungen</li>
                        </ul>
                        
                        <p>Falls du Fragen zu deiner Abrechnung hast oder Hilfe beim Optimieren deiner Nutzung benötigst, kontaktiere gerne unser Support-Team.</p>
                        
                        <p>Beste Grüße,<br>Dein VoicePartnerAI Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>VoicePartnerAI - Nie wieder verpasste Anrufe</p>
                        <p>Diese E-Mail wurde an {email} gesendet.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            text_content="""
            ⚠️ Deine Credits gehen zur Neige
            
            Hallo {first_name},
            
            Dein aktueller Credit-Stand ist niedrig. Du hast noch {credits_remaining} Credits übrig.
            Bei deiner aktuellen Nutzung reichen diese Credits voraussichtlich noch für {estimated_days} Tage.
            
            Deine Nutzungsstatistiken:
            - Aktuelle Credits: {credits_remaining}
            - Credits diese Woche verbraucht: {credits_used_week}
            - Durchschnittlicher Tagesverbrauch: {avg_daily_usage} Credits
            - Letzter Anruf: {last_call_date}
            
            Was passiert als nächstes?
            Sobald deine Credits aufgebraucht sind, werden deine Telefonnummern temporär deaktiviert.
            
            Credits aufladen: {billing_url}
            
            Tipps zur Credit-Optimierung:
            - Verwende kürzere Begrüßungstexte
            - Optimiere deine KI-Prompts für Effizienz
            - Überprüfe deine Anrufweiterstellungen
            
            Falls du Fragen hast, kontaktiere gerne unser Support-Team.
            
            Beste Grüße,
            Dein VoicePartnerAI Team
            """
        )
    
    @staticmethod
    def get_team_invitation_template() -> EmailTemplate:
        """Team invitation email template."""
        return EmailTemplate(
            template_id="team_invitation",
            subject="🎉 Du wurdest zu '{workspace_name}' eingeladen!",
            html_content="""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Team-Einladung</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .invitation-box { background: white; border: 2px solid #4facfe; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; }
                    .button { display: inline-block; background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .workspace-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Team-Einladung</h1>
                        <p>Du wurdest zu einem Workspace eingeladen!</p>
                    </div>
                    
                    <div class="content">
                        <p>Hallo {invitee_email},</p>
                        
                        <div class="invitation-box">
                            <h2>🚀 Du bist eingeladen!</h2>
                            <p><strong>{inviter_name}</strong> hat dich eingeladen, dem VoicePartnerAI Workspace <strong>"{workspace_name}"</strong> beizutreten.</p>
                            <p>Deine Rolle: <strong>{role}</strong></p>
                        </div>
                        
                        <div class="workspace-info">
                            <h3>📋 Workspace-Details:</h3>
                            <ul>
                                <li><strong>Name:</strong> {workspace_name}</li>
                                <li><strong>Beschreibung:</strong> {workspace_description}</li>
                                <li><strong>Eingeladen von:</strong> {inviter_name} ({inviter_email})</li>
                                <li><strong>Deine Rolle:</strong> {role}</li>
                                <li><strong>Eingeladen am:</strong> {invitation_date}</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="{accept_url}" class="button">Einladung annehmen</a>
                        </div>
                        
                        <h3>🔑 Was kannst du als {role}?</h3>
                        {role_permissions}
                        
                        <h3>🚀 Nach dem Beitritt kannst du:</h3>
                        <ul>
                            <li>An den Workspace-Projekten mitarbeiten</li>
                            <li>Assistenten und Tools nutzen</li>
                            <li>Mit anderen Teammitgliedern zusammenarbeiten</li>
                            <li>Auf geteilte Ressourcen zugreifen</li>
                        </ul>
                        
                        <p><strong>Hinweis:</strong> Falls du noch kein VoicePartnerAI-Konto hast, wird automatisch eines für dich erstellt, wenn du die Einladung annimmst.</p>
                        
                        <p>Diese Einladung ist <strong>7 Tage</strong> gültig. Danach musst du eine neue Einladung anfordern.</p>
                        
                        <p>Wir freuen uns darauf, dich im Team zu begrüßen!</p>
                        
                        <p>Beste Grüße,<br>Das VoicePartnerAI Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>VoicePartnerAI - Zusammenarbeit in der KI-Telefonie</p>
                        <p>Diese Einladung wurde an {invitee_email} gesendet.</p>
                        <p>Falls du diese Einladung nicht erwartet hast, kannst du sie einfach ignorieren.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            text_content="""
            🎉 Du wurdest zu einem Team eingeladen!
            
            Hallo {invitee_email},
            
            {inviter_name} hat dich eingeladen, dem VoicePartnerAI Workspace "{workspace_name}" beizutreten.
            
            Workspace-Details:
            - Name: {workspace_name}
            - Beschreibung: {workspace_description}
            - Eingeladen von: {inviter_name} ({inviter_email})
            - Deine Rolle: {role}
            - Eingeladen am: {invitation_date}
            
            Einladung annehmen: {accept_url}
            
            Was kannst du als {role}?
            {role_permissions_text}
            
            Nach dem Beitritt kannst du:
            - An den Workspace-Projekten mitarbeiten
            - Assistenten und Tools nutzen
            - Mit anderen Teammitgliedern zusammenarbeiten
            - Auf geteilte Ressourcen zugreifen
            
            Hinweis: Falls du noch kein VoicePartnerAI-Konto hast, wird automatisch eines für dich erstellt.
            
            Diese Einladung ist 7 Tage gültig.
            
            Wir freuen uns darauf, dich im Team zu begrüßen!
            
            Beste Grüße,
            Das VoicePartnerAI Team
            """
        )


class LifecycleEmailAutomation:
    """Automation logic for lifecycle emails."""
    
    def __init__(self, db: Session):
        self.db = db
        self.base_url = os.getenv("BASE_URL", "https://app.voicepartnerai.com")
    
    async def send_welcome_email(self, user: User) -> bool:
        """Send welcome email to new user."""
        try:
            template = EmailTemplates.get_welcome_template()
            
            variables = {
                "first_name": user.first_name or "dort",
                "email": user.email,
                "dashboard_url": f"{self.base_url}/dashboard",
                "docs_url": f"{self.base_url}/docs",
                "tutorial_url": f"{self.base_url}/tutorials",
                "support_url": f"{self.base_url}/support"
            }
            
            success = await email_service.send_template_email(
                to=user.email,
                template=template,
                variables=variables
            )
            
            if success:
                logger.info(f"Welcome email sent to {user.email}")
            else:
                logger.error(f"Failed to send welcome email to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Welcome email automation failed for {user.email}: {e}")
            return False
    
    async def send_credit_warning_email(
        self, 
        user: User, 
        credits_remaining: float,
        credits_used_week: float,
        avg_daily_usage: float,
        estimated_days: int,
        last_call_date: Optional[str] = None
    ) -> bool:
        """Send credit warning email."""
        try:
            template = EmailTemplates.get_credit_warning_template()
            
            variables = {
                "first_name": user.first_name or "dort",
                "email": user.email,
                "credits_remaining": f"{credits_remaining:.1f}",
                "credits_used_week": f"{credits_used_week:.1f}",
                "avg_daily_usage": f"{avg_daily_usage:.1f}",
                "estimated_days": str(estimated_days),
                "last_call_date": last_call_date or "Nie",
                "billing_url": f"{self.base_url}/billing"
            }
            
            success = await email_service.send_template_email(
                to=user.email,
                template=template,
                variables=variables
            )
            
            if success:
                logger.info(f"Credit warning email sent to {user.email}")
            else:
                logger.error(f"Failed to send credit warning email to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Credit warning email automation failed for {user.email}: {e}")
            return False
    
    async def send_team_invitation_email(
        self,
        invitee_email: str,
        inviter: User,
        workspace: Workspace,
        role: str,
        invitation_token: str
    ) -> bool:
        """Send team invitation email."""
        try:
            template = EmailTemplates.get_team_invitation_template()
            
            # Role permission descriptions
            role_permissions_map = {
                "owner": "Als Owner hast du vollständige Kontrolle über den Workspace und kannst alle Einstellungen verwalten.",
                "admin": "Als Admin kannst du Mitglieder verwalten, Assistenten erstellen und die meisten Workspace-Einstellungen ändern.",
                "member": "Als Mitglied kannst du Assistenten erstellen, verwenden und an Projekten mitarbeiten.",
                "viewer": "Als Viewer kannst du den Workspace einsehen, aber keine Änderungen vornehmen."
            }
            
            role_permissions_text_map = {
                "owner": "Vollständige Kontrolle über den Workspace",
                "admin": "Mitglieder verwalten und Assistenten erstellen", 
                "member": "Assistenten erstellen und verwenden",
                "viewer": "Workspace einsehen (nur Lesezugriff)"
            }
            
            variables = {
                "invitee_email": invitee_email,
                "inviter_name": f"{inviter.first_name} {inviter.last_name}".strip() or inviter.email,
                "inviter_email": inviter.email,
                "workspace_name": workspace.name,
                "workspace_description": workspace.description or "Keine Beschreibung verfügbar",
                "role": role.title(),
                "role_permissions": role_permissions_map.get(role, "Standardberechtigungen"),
                "role_permissions_text": role_permissions_text_map.get(role, "Standardberechtigungen"),
                "invitation_date": datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M"),
                "accept_url": f"{self.base_url}/invite/accept?token={invitation_token}"
            }
            
            success = await email_service.send_template_email(
                to=invitee_email,
                template=template,
                variables=variables
            )
            
            if success:
                logger.info(f"Team invitation email sent to {invitee_email} for workspace {workspace.name}")
            else:
                logger.error(f"Failed to send team invitation email to {invitee_email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Team invitation email automation failed for {invitee_email}: {e}")
            return False
    
    async def send_password_reset_email(self, user: User, reset_token: str) -> bool:
        """Send password reset email."""
        try:
            subject = "🔐 Passwort zurücksetzen - VoicePartnerAI"
            
            html_body = f"""
            <h2>Passwort zurücksetzen</h2>
            <p>Hallo {user.first_name or 'dort'},</p>
            <p>Du hast eine Passwort-Zurücksetzung für dein VoicePartnerAI-Konto angefordert.</p>
            <p><a href="{self.base_url}/reset-password?token={reset_token}" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
               Passwort zurücksetzen</a></p>
            <p>Dieser Link ist 1 Stunde gültig.</p>
            <p>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
            """
            
            text_body = f"""
            Passwort zurücksetzen
            
            Hallo {user.first_name or 'dort'},
            
            Du hast eine Passwort-Zurücksetzung angefordert.
            
            Link: {self.base_url}/reset-password?token={reset_token}
            
            Dieser Link ist 1 Stunde gültig.
            """
            
            success = await email_service.send_email(
                to=user.email,
                subject=subject,
                body=text_body,
                html_body=html_body
            )
            
            if success:
                logger.info(f"Password reset email sent to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Password reset email failed for {user.email}: {e}")
            return False
    
    async def send_account_verification_email(self, user: User, verification_token: str) -> bool:
        """Send email verification email."""
        try:
            subject = "✅ E-Mail-Adresse bestätigen - VoicePartnerAI"
            
            html_body = f"""
            <h2>E-Mail-Adresse bestätigen</h2>
            <p>Hallo {user.first_name or 'dort'},</p>
            <p>Bitte bestätige deine E-Mail-Adresse, um dein VoicePartnerAI-Konto zu aktivieren.</p>
            <p><a href="{self.base_url}/verify-email?token={verification_token}"
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
               E-Mail bestätigen</a></p>
            <p>Falls du dich nicht bei VoicePartnerAI registriert hast, ignoriere diese E-Mail.</p>
            """
            
            text_body = f"""
            E-Mail-Adresse bestätigen
            
            Hallo {user.first_name or 'dort'},
            
            Bitte bestätige deine E-Mail-Adresse:
            {self.base_url}/verify-email?token={verification_token}
            
            Falls du dich nicht registriert hast, ignoriere diese E-Mail.
            """
            
            success = await email_service.send_email(
                to=user.email,
                subject=subject,
                body=text_body,
                html_body=html_body
            )
            
            if success:
                logger.info(f"Email verification sent to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Email verification failed for {user.email}: {e}")
            return False