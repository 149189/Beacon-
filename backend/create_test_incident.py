#!/usr/bin/env python
"""
Script to create test incidents for development and testing
Run this script to populate the database with sample incidents
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beacon_backend.settings')
django.setup()

from operator_console.models import Incident, ChatMessage
from django.contrib.auth.models import User

def create_test_incidents():
    """Create test incidents with realistic data"""
    
    # Sample user names
    users = [
        "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis",
        "David Wilson", "Lisa Anderson", "Robert Taylor", "Jennifer White",
        "William Martinez", "Amanda Garcia"
    ]
    
    # Sample locations around NYC
    locations = [
        (40.7128, -74.0060, "Manhattan"),
        (40.7589, -73.9851, "Times Square"),
        (40.7505, -73.9934, "Midtown"),
        (40.7484, -73.9857, "5th Avenue"),
        (40.7829, -73.9654, "Upper East Side"),
        (40.7614, -73.9776, "Upper West Side"),
        (40.7505, -73.9934, "Chelsea"),
        (40.7265, -74.0043, "Greenwich Village"),
        (40.7182, -73.9582, "Lower East Side"),
        (40.7587, -73.9787, "Rockefeller Center")
    ]
    
    # Sample incident descriptions
    descriptions = [
        "Medical emergency - chest pain",
        "Fire alarm triggered",
        "Traffic accident with injuries",
        "Suspicious activity reported",
        "Medical emergency - difficulty breathing",
        "Domestic disturbance",
        "Medical emergency - unconscious person",
        "Fire in building",
        "Medical emergency - seizure",
        "Assault reported"
    ]
    
    # Create incidents
    incidents_created = 0
    
    for i in range(10):
        # Random location
        lat, lng, area = random.choice(locations)
        
        # Random user
        user = random.choice(users)
        
        # Random time within last 24 hours
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        created_at = datetime.now() - timedelta(hours=hours_ago, minutes=minutes_ago)
        
        # Random status (mostly active for testing)
        status = random.choices(['active', 'acknowledged', 'closed'], weights=[0.6, 0.3, 0.1])[0]
        
        # Create incident
        incident = Incident.objects.create(
            user=user,
            status=status,
            latitude=lat + random.uniform(-0.001, 0.001),  # Add small random offset
            longitude=lng + random.uniform(-0.001, 0.001),
            created_at=created_at,
            metadata={
                'description': random.choice(descriptions),
                'area': area,
                'priority': random.choice(['low', 'medium', 'high']),
                'source': 'test_script'
            }
        )
        
        # Add some chat messages for active incidents
        if status in ['active', 'acknowledged']:
            num_messages = random.randint(1, 5)
            for j in range(num_messages):
                message_time = created_at + timedelta(minutes=random.randint(5, 30))
                ChatMessage.objects.create(
                    incident=incident,
                    sender='user' if j == 0 else 'operator',
                    message_text=f"Test message {j+1} for incident {incident.id}",
                    timestamp=message_time
                )
        
        incidents_created += 1
        print(f"Created incident {incident.id} for {user} at {area}")
    
    print(f"\n✅ Created {incidents_created} test incidents")
    print("You can now view them in the operator console!")

if __name__ == '__main__':
    try:
        create_test_incidents()
    except Exception as e:
        print(f"❌ Error creating test incidents: {e}")
        sys.exit(1)
