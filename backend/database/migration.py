"""
Database Migration Utilities for VoicePartnerAI
Handles database initialization and data migration
"""

from sqlalchemy.orm import Session
from datetime import datetime
import json

from .config import engine, SessionLocal, init_db
from .models import Base, User, Assistant, AssistantTemplate, DEFAULT_TEMPLATES

def create_tables():
    """Create all database tables"""
    print("🏗️ Creating database tables...")
    init_db()
    print("✅ Database tables created successfully")

def migrate_from_memory_storage(in_memory_assistants):
    """
    Migrate existing in-memory assistants to database
    This preserves existing data during the transition
    """
    db = SessionLocal()
    try:
        print("Starting migration from in-memory storage...")

        # Check if default user exists
        default_user = db.query(User).filter(User.email == "admin@voicepartnerai.com").first()

        if not default_user:
            # Create default admin user for existing assistants
            default_user = User(
                email="admin@voicepartnerai.com",
                password_hash="$2b$12$placeholder_admin_hash",
                name="System Admin",
                role="admin",
                is_active=True,
                email_verified=True,
                subscription_tier="enterprise",
                data_processing_consent=True,
                consent_timestamp=datetime.utcnow()
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            print("Created default admin user")

        # Migrate assistants
        migrated_count = 0
        for assistant_data in in_memory_assistants:
            try:
                # Check if assistant already exists
                existing = db.query(Assistant).filter(
                    Assistant.name == assistant_data.get("name"),
                    Assistant.user_id == default_user.id
                ).first()

                if existing:
                    print(f"Warning: Assistant '{assistant_data.get('name')}' already exists, skipping...")
                    continue

                assistant = Assistant(
                    user_id=default_user.id,
                    name=assistant_data.get("name", "Untitled Assistant"),
                    template=assistant_data.get("template", "custom"),
                    first_message=assistant_data.get("first_message", "Hello! How can I help you today?"),
                    system_prompt=assistant_data.get("system_prompt", "You are a helpful AI assistant."),
                    voice_model=assistant_data.get("voice_model", "default"),
                    language=assistant_data.get("language", "de-DE"),
                    status=assistant_data.get("status", "active"),
                    created_at=assistant_data.get("created_at", datetime.utcnow()),
                    updated_at=assistant_data.get("updated_at", datetime.utcnow()),
                    analytics_enabled=True,
                    recording_enabled=False
                )

                db.add(assistant)
                migrated_count += 1

            except Exception as e:
                print(f"❌ Error migrating assistant '{assistant_data.get('name', 'Unknown')}': {e}")
                continue

        db.commit()
        print(f"Migrated {migrated_count} assistants to database")

    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def seed_default_templates():
    """Seed database with default assistant templates"""
    db = SessionLocal()
    try:
        print("Seeding default assistant templates...")

        seeded_count = 0
        for template_data in DEFAULT_TEMPLATES:
            # Check if template already exists
            existing = db.query(AssistantTemplate).filter(
                AssistantTemplate.name == template_data["name"]
            ).first()

            if existing:
                print(f"Warning: Template '{template_data['name']}' already exists, skipping...")
                continue

            template = AssistantTemplate(
                name=template_data["name"],
                display_name=template_data["display_name"],
                description=template_data["description"],
                category=template_data["category"],
                default_first_message=template_data["default_first_message"],
                default_system_prompt=template_data["default_system_prompt"],
                industry=template_data.get("industry"),
                use_cases=template_data.get("use_cases", []),
                estimated_setup_time=template_data.get("estimated_setup_time", 5),
                is_active=True,
                is_premium=False,
                popularity_score=0
            )

            db.add(template)
            seeded_count += 1

        db.commit()
        print(f"Seeded {seeded_count} default templates")

    except Exception as e:
        print(f"Template seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def get_migration_status():
    """Get current migration status"""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        assistant_count = db.query(Assistant).count()
        template_count = db.query(AssistantTemplate).count()

        return {
            "database_initialized": True,
            "users": user_count,
            "assistants": assistant_count,
            "templates": template_count,
            "tables": list(Base.metadata.tables.keys())
        }
    except Exception as e:
        return {
            "database_initialized": False,
            "error": str(e)
        }
    finally:
        db.close()

def reset_database():
    """Reset database (for development only)"""
    print("Warning: Resetting database - ALL DATA WILL BE LOST!")

    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("Dropped all tables")

    # Recreate tables
    create_tables()

    # Seed default templates
    seed_default_templates()

    print("Database reset complete")

def backup_to_json(output_file="backup.json"):
    """Backup database to JSON file"""
    db = SessionLocal()
    try:
        backup_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "users": [],
            "assistants": [],
            "templates": []
        }

        # Backup users (excluding sensitive data)
        users = db.query(User).all()
        for user in users:
            backup_data["users"].append({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "subscription_tier": user.subscription_tier,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })

        # Backup assistants
        assistants = db.query(Assistant).all()
        for assistant in assistants:
            backup_data["assistants"].append({
                "id": assistant.id,
                "user_id": assistant.user_id,
                "name": assistant.name,
                "template": assistant.template,
                "first_message": assistant.first_message,
                "system_prompt": assistant.system_prompt,
                "voice_model": assistant.voice_model,
                "language": assistant.language,
                "status": assistant.status,
                "created_at": assistant.created_at.isoformat() if assistant.created_at else None
            })

        # Backup templates
        templates = db.query(AssistantTemplate).all()
        for template in templates:
            backup_data["templates"].append({
                "id": template.id,
                "name": template.name,
                "display_name": template.display_name,
                "description": template.description,
                "category": template.category,
                "default_first_message": template.default_first_message,
                "default_system_prompt": template.default_system_prompt
            })

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)

        print(f"Database backup saved to {output_file}")
        return output_file

    except Exception as e:
        print(f"Backup failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "init":
            create_tables()
            seed_default_templates()
        elif command == "reset":
            reset_database()
        elif command == "status":
            status = get_migration_status()
            print("📊 Migration Status:")
            for key, value in status.items():
                print(f"  {key}: {value}")
        elif command == "backup":
            output_file = sys.argv[2] if len(sys.argv) > 2 else "backup.json"
            backup_to_json(output_file)
        else:
            print("Available commands: init, reset, status, backup")
    else:
        print("Usage: python migration.py [init|reset|status|backup]")