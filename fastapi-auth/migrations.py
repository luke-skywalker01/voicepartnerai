"""
Database Migration Script für VoicePartnerAI Platform
Erstellt alle benötigten Tabellen für Assistants, Files, Tools und Phone Numbers
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from database import DATABASE_URL, Base
from models import User, Project, Assistant, File, Tool, PhoneNumber, assistant_tools, assistant_files

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Führt alle Datenbankmigrationen aus."""
    try:
        engine = create_engine(DATABASE_URL)
        
        # Erstelle alle Tabellen
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Führe zusätzliche Setup-Operationen aus
        setup_database_constraints(engine)
        create_indexes(engine)
        insert_sample_data(engine)
        
        logger.info("Database migration completed successfully!")
        
    except SQLAlchemyError as e:
        logger.error(f"Database migration failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during migration: {e}")
        raise

def setup_database_constraints(engine):
    """Erstellt zusätzliche Datenbankconstraints."""
    logger.info("Setting up database constraints...")
    
    with engine.connect() as conn:
        try:
            # Unique constraint für phone_number
            conn.execute(text("""
                ALTER TABLE phone_numbers 
                ADD CONSTRAINT unique_phone_number 
                UNIQUE (phone_number)
            """))
            conn.commit()
            logger.info("Added unique constraint for phone numbers")
        except Exception as e:
            # Constraint existiert möglicherweise bereits
            logger.warning(f"Could not add phone number constraint: {e}")
        
        try:
            # Check constraint für Assistant status
            conn.execute(text("""
                ALTER TABLE assistants 
                ADD CONSTRAINT check_assistant_status 
                CHECK (status IN ('draft', 'testing', 'deployed'))
            """))
            conn.commit()
            logger.info("Added status check constraint for assistants")
        except Exception as e:
            logger.warning(f"Could not add assistant status constraint: {e}")
        
        try:
            # Check constraint für File status
            conn.execute(text("""
                ALTER TABLE files 
                ADD CONSTRAINT check_file_status 
                CHECK (status IN ('uploading', 'processed', 'error'))
            """))
            conn.commit()
            logger.info("Added status check constraint for files")
        except Exception as e:
            logger.warning(f"Could not add file status constraint: {e}")

def create_indexes(engine):
    """Erstellt Performance-Indizes."""
    logger.info("Creating database indexes...")
    
    with engine.connect() as conn:
        indexes = [
            # Assistant Indizes
            "CREATE INDEX IF NOT EXISTS idx_assistants_owner_status ON assistants (owner_id, status)",
            "CREATE INDEX IF NOT EXISTS idx_assistants_active ON assistants (is_active)",
            "CREATE INDEX IF NOT EXISTS idx_assistants_created ON assistants (created_at DESC)",
            
            # File Indizes
            "CREATE INDEX IF NOT EXISTS idx_files_owner_status ON files (owner_id, status)",
            "CREATE INDEX IF NOT EXISTS idx_files_type ON files (file_type)",
            "CREATE INDEX IF NOT EXISTS idx_files_created ON files (created_at DESC)",
            
            # Tool Indizes
            "CREATE INDEX IF NOT EXISTS idx_tools_owner_category ON tools (owner_id, category)",
            "CREATE INDEX IF NOT EXISTS idx_tools_active ON tools (is_active)",
            "CREATE INDEX IF NOT EXISTS idx_tools_calls ON tools (total_calls DESC)",
            
            # Phone Number Indizes
            "CREATE INDEX IF NOT EXISTS idx_phone_numbers_owner ON phone_numbers (owner_id)",
            "CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers (status)",
            "CREATE INDEX IF NOT EXISTS idx_phone_numbers_assistant ON phone_numbers (assistant_id)",
            "CREATE INDEX IF NOT EXISTS idx_phone_numbers_country ON phone_numbers (country)",
            
            # Association Table Indizes
            "CREATE INDEX IF NOT EXISTS idx_assistant_tools_assistant ON assistant_tools (assistant_id)",
            "CREATE INDEX IF NOT EXISTS idx_assistant_tools_tool ON assistant_tools (tool_id)",
            "CREATE INDEX IF NOT EXISTS idx_assistant_files_assistant ON assistant_files (assistant_id)",
            "CREATE INDEX IF NOT EXISTS idx_assistant_files_file ON assistant_files (file_id)"
        ]
        
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                logger.info(f"Created index: {index_sql.split(' ')[5]}")
            except Exception as e:
                logger.warning(f"Could not create index: {e}")
        
        conn.commit()
        logger.info("Database indexes created successfully!")

def insert_sample_data(engine):
    """Fügt Beispieldaten für Entwicklung/Testing ein."""
    logger.info("Inserting sample data...")
    
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        try:
            # Prüfe ob bereits Daten vorhanden sind
            existing_users = session.query(User).count()
            if existing_users > 0:
                logger.info("Sample data already exists, skipping...")
                return
            
            # Demo User erstellen
            demo_user = User(
                email="demo@voicepartnerai.com",
                hashed_password="$2b$12$demo_hash_password"  # In Produktion richtig hashen
            )
            session.add(demo_user)
            session.flush()  # Um ID zu bekommen
            
            # Demo Files
            demo_files = [
                File(
                    filename="company_info.pdf",
                    original_name="Unternehmensinformationen.pdf",
                    file_type="application/pdf",
                    file_size=2456789,
                    s3_url="https://s3.amazonaws.com/voicepartner/files/company_info.pdf",
                    extracted_text="VoicePartnerAI ist ein führender Anbieter von Voice AI Lösungen...",
                    description="Allgemeine Unternehmensinformationen",
                    status="processed",
                    owner_id=demo_user.id
                ),
                File(
                    filename="faq_document.txt",
                    original_name="FAQ_Häufige_Fragen.txt",
                    file_type="text/plain",
                    file_size=456123,
                    extracted_text="Q: Wie kann ich einen Termin buchen? A: Sie können...",
                    description="FAQ-Dokument mit häufig gestellten Fragen",
                    status="processed",
                    owner_id=demo_user.id
                )
            ]
            
            for file in demo_files:
                session.add(file)
            
            # Demo Tools
            demo_tools = [
                Tool(
                    name="Kalender API",
                    description="Zugriff auf Google Calendar für Terminbuchungen",
                    endpoint="https://api.calendar.google.com/v3/events",
                    method="POST",
                    category="api",
                    parameters={
                        "summary": {"type": "string", "required": True},
                        "start": {"type": "datetime", "required": True},
                        "end": {"type": "datetime", "required": True}
                    },
                    authentication={
                        "type": "oauth2",
                        "scope": "https://www.googleapis.com/auth/calendar"
                    },
                    is_active=True,
                    total_calls=156,
                    owner_id=demo_user.id
                ),
                Tool(
                    name="CRM Integration",
                    description="Kundendaten aus Salesforce abrufen",
                    endpoint="https://api.salesforce.com/v1/customers",
                    method="GET",
                    category="api",
                    parameters={
                        "customer_id": {"type": "string", "required": True}
                    },
                    authentication={
                        "type": "bearer",
                        "token": "sf_token_placeholder"
                    },
                    is_active=True,
                    total_calls=89,
                    owner_id=demo_user.id
                )
            ]
            
            for tool in demo_tools:
                session.add(tool)
            
            session.flush()  # Um IDs zu bekommen
            
            # Demo Assistants
            demo_assistants = [
                Assistant(
                    name="Terminbuchung Assistant",
                    description="Professioneller Assistant für Terminbuchungen",
                    system_prompt="Du bist ein freundlicher Terminbuchungsassistent. Hilf Kunden bei Terminen.",
                    llm_provider="OpenAI",
                    llm_model="gpt-4o",
                    temperature=0.7,
                    max_tokens=1000,
                    voice_provider="ElevenLabs",
                    voice_id="german-female-professional",
                    voice_speed=1.0,
                    voice_pitch=1.0,
                    voice_stability=0.75,
                    language="de-DE",
                    fallback_language="en-US",
                    first_message="Guten Tag! Wie kann ich Ihnen bei der Terminbuchung helfen?",
                    interruption_sensitivity="medium",
                    silence_timeout=3000,
                    response_delay=500,
                    status="deployed",
                    is_active=True,
                    capabilities={
                        "book_appointments": True,
                        "access_calendar": True,
                        "send_emails": True,
                        "transfer_calls": False,
                        "access_crm": True
                    },
                    owner_id=demo_user.id
                ),
                Assistant(
                    name="Kundenservice Bot",
                    description="Allgemeiner Kundenservice Assistant",
                    system_prompt="Du bist ein hilfsbereiter Kundenservice-Assistant.",
                    llm_provider="OpenAI",
                    llm_model="gpt-4o-mini",
                    temperature=0.5,
                    max_tokens=800,
                    voice_provider="ElevenLabs", 
                    voice_id="german-male-warm",
                    voice_speed=0.9,
                    voice_pitch=1.1,
                    voice_stability=0.8,
                    language="de-DE",
                    fallback_language="en-US",
                    first_message="Hallo! Wie kann ich Ihnen behilflich sein?",
                    interruption_sensitivity="high",
                    silence_timeout=2500,
                    response_delay=300,
                    status="testing",
                    is_active=True,
                    capabilities={
                        "send_emails": True,
                        "transfer_calls": True,
                        "access_crm": True
                    },
                    owner_id=demo_user.id
                )
            ]
            
            for assistant in demo_assistants:
                session.add(assistant)
            
            session.flush()
            
            # Many-to-Many Beziehungen erstellen
            # Assistant 1 bekommt beide Tools und Files
            demo_assistants[0].tools.extend(demo_tools)
            demo_assistants[0].files.extend(demo_files)
            
            # Assistant 2 bekommt nur ein Tool und ein File
            demo_assistants[1].tools.append(demo_tools[1])
            demo_assistants[1].files.append(demo_files[1])
            
            # Demo Phone Numbers
            demo_phone = PhoneNumber(
                phone_number="+49 30 12345678",
                friendly_name="Berlin Hauptnummer",
                capabilities={
                    "voice": True,
                    "sms": True,
                    "mms": False,
                    "fax": False
                },
                country="DE",
                region="Berlin",
                locality="Berlin",
                provider="twilio",
                monthly_price=2.50,
                currency="EUR",
                configuration={
                    "webhook_url": "https://voicepartner.example.com/webhook",
                    "voice_method": "POST"
                },
                status="active",
                usage={
                    "total_calls": 156,
                    "total_sms": 23,
                    "monthly_minutes": 245,
                    "monthly_cost": 12.45
                },
                assistant_id=demo_assistants[0].id,
                owner_id=demo_user.id
            )
            session.add(demo_phone)
            
            session.commit()
            logger.info("Sample data inserted successfully!")
            
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to insert sample data: {e}")
            raise

def reset_database():
    """Löscht alle Tabellen und erstellt sie neu (nur für Entwicklung!)."""
    logger.warning("RESETTING DATABASE - ALL DATA WILL BE LOST!")
    
    try:
        engine = create_engine(DATABASE_URL)
        
        # Lösche alle Tabellen
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully!")
        
        # Erstelle sie neu
        run_migrations()
        
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        if input("Are you sure you want to reset the database? (yes/no): ").lower() == "yes":
            reset_database()
        else:
            logger.info("Database reset cancelled.")
    else:
        run_migrations()