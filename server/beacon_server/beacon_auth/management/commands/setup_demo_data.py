from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from beacon_auth.models import UserProfile, Message, UserActivity, SystemNotification
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Set up demo data for the Beacon admin panel'

    def handle(self, *args, **options):
        self.stdout.write('Setting up demo data...')
        
        # Create admin user if it doesn't exist
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@beacon.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))
        else:
            self.stdout.write('Admin user already exists')
        
        # Create admin profile
        admin_profile, created = UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                'bio': 'System Administrator',
                'location': 'Headquarters',
                'is_online': True,
                'last_seen': timezone.now(),
            }
        )
        
        # Create demo users
        demo_users = [
            {'username': 'kaustubh', 'email': 'kaustubh@gmail.com', 'first_name': 'Kaustubh', 'last_name': 'Ratwadkar'},
            {'username': 'jane_smith', 'email': 'jane@example.com', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'username': 'mike_johnson', 'email': 'mike@example.com', 'first_name': 'Mike', 'last_name': 'Johnson'},
            {'username': 'sarah_wilson', 'email': 'sarah@example.com', 'first_name': 'Sarah', 'last_name': 'Wilson'},
            {'username': 'alex_brown', 'email': 'alex@example.com', 'first_name': 'Alex', 'last_name': 'Brown'},
        ]
        
        created_users = []
        for user_data in demo_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            if created:
                user.set_password('demo123')
                user.save()
                created_users.append(user)
                self.stdout.write(f'Created user: {user.username}')
        
        # Create user profiles
        for user in created_users:
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': f'Demo user {user.first_name}',
                    'location': random.choice(['New York', 'London', 'Tokyo', 'Paris', 'Sydney']),
                    'is_online': random.choice([True, False]),
                    'last_seen': timezone.now() - timedelta(hours=random.randint(1, 24)),
                }
            )
        
        # Create demo messages
        message_types = ['support', 'feedback', 'general', 'bug_report', 'feature_request']
        priorities = [1, 2, 3, 4]
        statuses = ['new', 'in_progress', 'resolved', 'closed']
        
        demo_messages = [
            {'subject': 'Need help with account setup', 'content': 'I\'m having trouble setting up my account. Can you help?', 'type': 'support', 'priority': 2},
            {'subject': 'Great user experience!', 'content': 'I love the new interface. It\'s much more intuitive now.', 'type': 'feedback', 'priority': 1},
            {'subject': 'Bug in search functionality', 'content': 'The search feature is not working properly on mobile devices.', 'type': 'bug_report', 'priority': 3},
            {'subject': 'Feature request: Dark mode', 'content': 'Would it be possible to add a dark mode option?', 'type': 'feature_request', 'priority': 2},
            {'subject': 'General inquiry', 'content': 'I have a question about the pricing plans.', 'type': 'general', 'priority': 1},
            {'subject': 'Critical issue with login', 'content': 'Users are unable to log in from certain browsers.', 'type': 'bug_report', 'priority': 4},
        ]
        
        for msg_data in demo_messages:
            user = random.choice(created_users)
            message = Message.objects.create(
                user=user,
                subject=msg_data['subject'],
                content=msg_data['content'],
                message_type=msg_data['type'],
                priority=msg_data['priority'],
                status=random.choice(statuses),
                is_read=random.choice([True, False]),
                created_at=timezone.now() - timedelta(hours=random.randint(1, 72)),
            )
        
        # Create user activities
        activity_types = ['login', 'logout', 'message_sent', 'profile_updated']
        
        for user in created_users:
            for _ in range(random.randint(3, 8)):
                UserActivity.objects.create(
                    user=user,
                    activity_type=random.choice(activity_types),
                    description=f'Demo activity for {user.username}',
                    ip_address=f'192.168.1.{random.randint(1, 255)}',
                    user_agent='Mozilla/5.0 (Demo Browser)',
                    created_at=timezone.now() - timedelta(hours=random.randint(1, 168)),
                )
        
        # Create system notifications
        notifications = [
            {'title': 'System Maintenance', 'message': 'Scheduled maintenance on Sunday at 2 AM UTC', 'type': 'info'},
            {'title': 'New Feature Available', 'message': 'Dark mode is now available for all users!', 'type': 'success'},
            {'title': 'Security Update', 'message': 'Please update your password for enhanced security', 'type': 'warning'},
        ]
        
        for notif_data in notifications:
            SystemNotification.objects.create(
                title=notif_data['title'],
                message=notif_data['message'],
                notification_type=notif_data['type'],
                is_active=True,
                show_to_all=True,
                expires_at=timezone.now() + timedelta(days=30),
            )
        
        self.stdout.write(self.style.SUCCESS('Demo data setup completed successfully!'))
        self.stdout.write('Admin credentials: username=admin, password=admin123')
        self.stdout.write('Demo user credentials: username=demo_username, password=demo123')
