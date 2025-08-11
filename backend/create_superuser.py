#!/usr/bin/env python
"""
Script to create a superuser for Beacon application
Run this after setting up the database and running migrations
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beacon_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import User

def create_superuser():
    """Create a superuser if it doesn't exist"""
    User = get_user_model()
    
    # Check if superuser already exists
    if User.objects.filter(is_superuser=True).exists():
        print("Superuser already exists!")
        return
    
    try:
        # Create superuser
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@beacon.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        
        # Set additional fields
        superuser.is_operator = True
        superuser.is_emergency_responder = True
        superuser.save()
        
        print("Superuser created successfully!")
        print(f"Username: {superuser.username}")
        print(f"Email: {superuser.email}")
        print(f"Password: admin123")
        
    except Exception as e:
        print(f"Error creating superuser: {e}")

def create_demo_user():
    """Create a demo user for testing"""
    User = get_user_model()
    
    # Check if demo user already exists
    if User.objects.filter(email='demo@beacon.com').exists():
        print("Demo user already exists!")
        return
    
    try:
        # Create demo user
        demo_user = User.objects.create_user(
            username='demo',
            email='demo@beacon.com',
            password='demo123',
            first_name='Demo',
            last_name='User'
        )
        
        print("Demo user created successfully!")
        print(f"Username: {demo_user.username}")
        print(f"Email: {demo_user.email}")
        print(f"Password: demo123")
        
    except Exception as e:
        print(f"Error creating demo user: {e}")

if __name__ == '__main__':
    print("Creating users for Beacon application...")
    print("-" * 40)
    
    create_superuser()
    print()
    create_demo_user()
    
    print("-" * 40)
    print("User creation completed!")
