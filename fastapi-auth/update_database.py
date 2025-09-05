"""
Update database with new User fields
"""

from database import engine, Base
from models import *  # Import all models

if __name__ == "__main__":
    print("Updating database schema...")
    
    # This will create any missing tables and columns
    Base.metadata.create_all(bind=engine)
    
    print("Database updated successfully!")
    print("New fields added to User model:")
    print("- is_active (Boolean, default: True)")
    print("- is_verified (Boolean, default: False)")