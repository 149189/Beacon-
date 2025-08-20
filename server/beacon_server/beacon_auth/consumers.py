import json
import logging
from datetime import datetime
from typing import Any, Dict

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from .models import PanicAlert, AlertLocation, User, UserProfile
from .serializers import (
    PanicAlertListSerializer, AlertLocationSerializer, 
    UserSerializer, UserProfileSerializer
)

logger = logging.getLogger(__name__)


class BaseWebSocketConsumer(AsyncWebsocketConsumer):
    """Base consumer with common WebSocket functionality"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Check if user is authenticated
        if isinstance(self.scope["user"], AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return
        
        # Accept the connection
        await self.accept()
        logger.info(f"WebSocket connected: {self.scope['user'].username}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected: {close_code}")
    
    async def send_error(self, message: str, code: str = "error"):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'code': code,
            'message': message,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def send_success(self, message: str, data: Dict[str, Any] = None):
        """Send success message to client"""
        payload = {
            'type': 'success',
            'message': message,
            'timestamp': timezone.now().isoformat()
        }
        if data:
            payload['data'] = data
        await self.send(text_data=json.dumps(payload))


class PanicAlertConsumer(BaseWebSocketConsumer):
    """Consumer for real-time panic alerts (Admin Dashboard)"""
    
    async def connect(self):
        # Only allow staff users to connect
        if not self.scope["user"].is_staff:
            await self.close(code=4003)  # Forbidden
            return
        
        # Join the panic alerts group
        self.group_name = 'panic_alerts'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await super().connect()
        
        # Send current active alerts
        await self.send_active_alerts()
        
        # Log connection
        logger.info(f"Admin connected to panic alerts: {self.scope['user'].username}")
    
    async def disconnect(self, close_code):
        # Leave the panic alerts group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_active_alerts':
                await self.send_active_alerts()
            elif message_type == 'acknowledge_alert':
                await self.acknowledge_alert(data.get('alert_id'))
            elif message_type == 'resolve_alert':
                await self.resolve_alert(data.get('alert_id'), data.get('notes', ''))
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
        except Exception as e:
            logger.error(f"Error in PanicAlertConsumer.receive: {e}")
            await self.send_error("Internal server error")
    
    @database_sync_to_async
    def get_active_alerts(self):
        """Get all active panic alerts"""
        alerts = PanicAlert.objects.filter(
            status__in=['active', 'acknowledged', 'responding']
        ).select_related('user', 'assigned_operator').order_by('-created_at')
        return PanicAlertListSerializer(alerts, many=True).data
    
    async def send_active_alerts(self):
        """Send active alerts to client"""
        try:
            alerts_data = await self.get_active_alerts()
            await self.send(text_data=json.dumps({
                'type': 'active_alerts',
                'alerts': alerts_data,
                'count': len(alerts_data),
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Error sending active alerts: {e}")
            await self.send_error("Failed to fetch active alerts")
    
    @database_sync_to_async
    def acknowledge_alert_db(self, alert_id: str):
        """Acknowledge alert in database"""
        try:
            alert = PanicAlert.objects.get(id=alert_id)
            if alert.status == 'active':
                alert.acknowledge(self.scope["user"])
                return PanicAlertListSerializer(alert).data
        except ObjectDoesNotExist:
            return None
    
    async def acknowledge_alert(self, alert_id: str):
        """Acknowledge a panic alert"""
        if not alert_id:
            await self.send_error("Alert ID is required")
            return
        
        alert_data = await self.acknowledge_alert_db(alert_id)
        if alert_data:
            # Broadcast update to all admin clients
            await self.channel_layer.group_send(self.group_name, {
                'type': 'alert_acknowledged',
                'alert': alert_data,
                'operator': self.scope["user"].username
            })
            await self.send_success("Alert acknowledged successfully")
        else:
            await self.send_error("Alert not found or cannot be acknowledged")
    
    @database_sync_to_async
    def resolve_alert_db(self, alert_id: str, notes: str):
        """Resolve alert in database"""
        try:
            alert = PanicAlert.objects.get(id=alert_id)
            if alert.is_active:
                alert.resolve(notes)
                return PanicAlertListSerializer(alert).data
        except ObjectDoesNotExist:
            return None
    
    async def resolve_alert(self, alert_id: str, notes: str = ''):
        """Resolve a panic alert"""
        if not alert_id:
            await self.send_error("Alert ID is required")
            return
        
        alert_data = await self.resolve_alert_db(alert_id, notes)
        if alert_data:
            # Broadcast update to all admin clients and user
            await self.channel_layer.group_send(self.group_name, {
                'type': 'alert_resolved',
                'alert': alert_data,
                'operator': self.scope["user"].username
            })
            await self.send_success("Alert resolved successfully")
        else:
            await self.send_error("Alert not found or cannot be resolved")
    
    # Group message handlers
    async def new_panic_alert(self, event):
        """Handle new panic alert broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'alert': event['alert'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def alert_acknowledged(self, event):
        """Handle alert acknowledgment broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'alert_acknowledged',
            'alert': event['alert'],
            'operator': event['operator'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def alert_resolved(self, event):
        """Handle alert resolution broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'alert_resolved',
            'alert': event['alert'],
            'operator': event['operator'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def location_update(self, event):
        """Handle location update broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'alert_id': event['alert_id'],
            'location': event['location'],
            'timestamp': timezone.now().isoformat()
        }))


class AlertConsumer(BaseWebSocketConsumer):
    """Consumer for specific alert updates"""
    
    async def connect(self):
        self.alert_id = self.scope['url_route']['kwargs']['alert_id']
        self.group_name = f'alert_{self.alert_id}'
        
        # Check if user has access to this alert
        has_access = await self.check_alert_access()
        if not has_access:
            await self.close(code=4003)  # Forbidden
            return
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()
        
        # Send current alert status
        await self.send_alert_status()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def check_alert_access(self):
        """Check if user has access to this alert"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id)
            user = self.scope["user"]
            return user.is_staff or alert.user == user
        except ObjectDoesNotExist:
            return False
    
    @database_sync_to_async
    def get_alert_data(self):
        """Get alert data"""
        try:
            alert = PanicAlert.objects.select_related(
                'user', 'assigned_operator'
            ).prefetch_related(
                'location_history', 'media_files'
            ).get(id=self.alert_id)
            return PanicAlertListSerializer(alert).data
        except ObjectDoesNotExist:
            return None
    
    async def send_alert_status(self):
        """Send current alert status"""
        alert_data = await self.get_alert_data()
        if alert_data:
            await self.send(text_data=json.dumps({
                'type': 'alert_status',
                'alert': alert_data,
                'timestamp': timezone.now().isoformat()
            }))
        else:
            await self.send_error("Alert not found")
    
    async def receive(self, text_data):
        """Handle incoming messages for specific alert"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_status':
                await self.send_alert_status()
            elif message_type == 'cancel_alert' and not self.scope["user"].is_staff:
                await self.cancel_alert()
            else:
                await self.send_error(f"Unknown or unauthorized message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
    
    @database_sync_to_async
    def cancel_alert_db(self):
        """Cancel alert in database"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id, user=self.scope["user"])
            if alert.is_active:
                alert.cancel()
                return PanicAlertListSerializer(alert).data
        except ObjectDoesNotExist:
            return None
    
    async def cancel_alert(self):
        """Cancel alert (user only)"""
        alert_data = await self.cancel_alert_db()
        if alert_data:
            # Broadcast to admin console
            await self.channel_layer.group_send('panic_alerts', {
                'type': 'alert_canceled',
                'alert': alert_data
            })
            await self.send_success("Alert canceled successfully")
        else:
            await self.send_error("Alert not found or cannot be canceled")
    
    # Group message handlers
    async def alert_update(self, event):
        """Handle alert update broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'alert_updated',
            'alert': event['alert'],
            'timestamp': timezone.now().isoformat()
        }))


class LocationConsumer(BaseWebSocketConsumer):
    """Consumer for real-time location tracking"""
    
    async def connect(self):
        self.alert_id = self.scope['url_route']['kwargs']['alert_id']
        self.group_name = f'location_{self.alert_id}'
        
        # Check access
        has_access = await self.check_location_access()
        if not has_access:
            await self.close(code=4003)
            return
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()
        
        # Send last known location
        await self.send_last_location()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
        
    @database_sync_to_async
    def get_last_location(self):
        """Get last known location for this alert"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id)
            location = AlertLocation.objects.filter(alert=alert).order_by('-timestamp').first()
            if location:
                return AlertLocationSerializer(location).data
            return None
        except ObjectDoesNotExist:
            return None
            
    async def send_last_location(self):
        """Send last known location to client"""
        location_data = await self.get_last_location()
        if location_data:
            await self.send(text_data=json.dumps({
                'type': 'last_location',
                'location': location_data,
                'timestamp': timezone.now().isoformat()
            }))
    
    @database_sync_to_async
    def check_location_access(self):
        """Check if user has access to location data"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id)
            user = self.scope["user"]
            return user.is_staff or alert.user == user
        except ObjectDoesNotExist:
            return False
    
    async def receive(self, text_data):
        """Handle location updates from mobile app"""
        if self.scope["user"].is_staff:
            await self.send_error("Unauthorized: Staff cannot send location updates")
            return
        
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'location_update':
                await self.handle_location_update(data.get('location'))
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
    
    @database_sync_to_async
    def save_location_update(self, location_data):
        """Save location update to database"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id, user=self.scope["user"])
            if not alert.is_active:
                return None
            
            location = AlertLocation.objects.create(
                alert=alert,
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                accuracy=location_data.get('accuracy', 0),
                altitude=location_data.get('altitude'),
                speed=location_data.get('speed'),
                heading=location_data.get('heading'),
                provider=location_data.get('provider', 'gps'),
                battery_level=location_data.get('battery_level')
            )
            
            # Update alert's main location
            alert.latitude = location.latitude
            alert.longitude = location.longitude
            alert.location_accuracy = location.accuracy
            alert.save(update_fields=['latitude', 'longitude', 'location_accuracy'])
            
            return AlertLocationSerializer(location).data
        except (ObjectDoesNotExist, KeyError, ValueError):
            return None
    
    async def handle_location_update(self, location_data):
        """Handle incoming location update"""
        if not location_data or 'latitude' not in location_data or 'longitude' not in location_data:
            await self.send_error("Invalid location data")
            return
        
        location_record = await self.save_location_update(location_data)
        if location_record:
            # Broadcast to admin dashboard
            await self.channel_layer.group_send('panic_alerts', {
                'type': 'location_update',
                'alert_id': self.alert_id,
                'location': location_record
            })
            
            # Broadcast to alert-specific group
            await self.channel_layer.group_send(f'alert_{self.alert_id}', {
                'type': 'location_updated',
                'location': location_record
            })
            
            await self.send_success("Location updated successfully")
        else:
            await self.send_error("Failed to update location")
    
    # Group message handlers
    async def location_updated(self, event):
        """Handle location update broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'location_updated',
            'location': event['location'],
            'timestamp': timezone.now().isoformat()
        }))


class UserConsumer(BaseWebSocketConsumer):
    """Consumer for user-specific real-time updates"""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # Users can only connect to their own channel, staff can connect to any
        if not self.scope["user"].is_staff and str(self.scope["user"].id) != self.user_id:
            await self.close(code=4003)
            return
        
        self.group_name = f'user_{self.user_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # Group message handlers
    async def alert_status_update(self, event):
        """Handle alert status update for user"""
        await self.send(text_data=json.dumps({
            'type': 'alert_status_update',
            'alert': event['alert'],
            'message': event.get('message', ''),
            'timestamp': timezone.now().isoformat()
        }))
    
    async def operator_message(self, event):
        """Handle message from operator"""
        await self.send(text_data=json.dumps({
            'type': 'operator_message',
            'message': event['message'],
            'operator': event['operator'],
            'timestamp': timezone.now().isoformat()
        }))


class AdminDashboardConsumer(BaseWebSocketConsumer):
    """Consumer for admin dashboard real-time updates"""
    
    async def connect(self):
        # Only allow staff users
        if not self.scope["user"].is_staff:
            await self.close(code=4003)
            return
        
        self.group_name = 'admin_dashboard'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()
        
        # Send dashboard stats
        await self.send_dashboard_stats()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def get_dashboard_stats(self):
        """Get dashboard statistics"""
        from django.db.models import Count
        from datetime import date
        
        today = timezone.now().date()
        
        return {
            'total_alerts': PanicAlert.objects.count(),
            'active_alerts': PanicAlert.objects.filter(
                status__in=['active', 'acknowledged', 'responding']
            ).count(),
            'alerts_today': PanicAlert.objects.filter(created_at__date=today).count(),
            'online_users': UserProfile.objects.filter(is_online=True).count(),
            'total_users': User.objects.count(),
        }
    
    async def send_dashboard_stats(self):
        """Send dashboard statistics"""
        try:
            stats = await self.get_dashboard_stats()
            await self.send(text_data=json.dumps({
                'type': 'dashboard_stats',
                'stats': stats,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Error sending dashboard stats: {e}")
            await self.send_error("Failed to fetch dashboard stats")
    
    # Group message handlers
    async def stats_update(self, event):
        """Handle dashboard stats update"""
        await self.send(text_data=json.dumps({
            'type': 'stats_updated',
            'stats': event['stats'],
            'timestamp': timezone.now().isoformat()
        }))


class MapAlertsConsumer(BaseWebSocketConsumer):
    """Consumer for real-time map alerts (Admin Dashboard Map)"""
    
    async def connect(self):
        # Only allow staff users to connect
        if not self.scope["user"].is_staff:
            await self.close(code=4003)  # Forbidden
            return
        
        # Join the map alerts group
        self.group_name = 'map_alerts'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await super().connect()
        
        # Send current map alerts
        await self.send_map_alerts()
        
        # Log connection
        logger.info(f"Admin connected to map alerts: {self.scope['user'].username}")
    
    async def disconnect(self, close_code):
        # Leave the map alerts group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def get_map_alerts(self):
        """Get all active alerts with location data for map"""
        alerts = PanicAlert.objects.filter(
            status__in=['active', 'acknowledged', 'responding'],
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('user', 'assigned_operator').order_by('-created_at')
        
        alerts_data = []
        for alert in alerts:
            alert_data = {
                'id': str(alert.id),
                'user': alert.user.username,
                'status': alert.status,
                'alert_type': alert.alert_type,
                'priority': alert.priority,
                'latitude': float(alert.latitude),
                'longitude': float(alert.longitude),
                'accuracy': alert.location_accuracy,
                'address': alert.address,
                'created_at': alert.created_at.isoformat(),
                'updated_at': alert.updated_at.isoformat(),
                'assigned_operator': alert.assigned_operator.username if alert.assigned_operator else None,
                'duration_seconds': (timezone.now() - alert.created_at).total_seconds()
            }
            alerts_data.append(alert_data)
        
        return alerts_data
    
    async def send_map_alerts(self):
        """Send map alerts to client"""
        try:
            alerts_data = await self.get_map_alerts()
            await self.send(text_data=json.dumps({
                'type': 'map_alerts',
                'alerts': alerts_data,
                'count': len(alerts_data),
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Error sending map alerts: {e}")
            await self.send_error("Failed to fetch map alerts")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_map_alerts':
                await self.send_map_alerts()
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
        except Exception as e:
            logger.error(f"Error in MapAlertsConsumer.receive: {e}")
            await self.send_error("Internal server error")
    
    # Group message handlers
    async def map_alert_update(self, event):
        """Handle map alert update broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'alert_update',
            'alert': event['alert'],
            'timestamp': event.get('timestamp', timezone.now().isoformat())
        }))


class ChatConsumer(BaseWebSocketConsumer):
    """Consumer for chat between user and operator"""
    
    async def connect(self):
        self.alert_id = self.scope['url_route']['kwargs']['alert_id']
        self.group_name = f'chat_{self.alert_id}'
        
        # Check access to this chat
        has_access = await self.check_chat_access()
        if not has_access:
            await self.close(code=4003)
            return
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def check_chat_access(self):
        """Check if user has access to this chat"""
        try:
            alert = PanicAlert.objects.get(id=self.alert_id)
            user = self.scope["user"]
            return user.is_staff or alert.user == user
        except ObjectDoesNotExist:
            return False
    
    async def receive(self, text_data):
        """Handle chat messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data.get('message', ''))
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON message")
    
    async def handle_chat_message(self, message: str):
        """Handle incoming chat message"""
        if not message.strip():
            await self.send_error("Empty message")
            return
        
        # Broadcast message to chat group
        await self.channel_layer.group_send(self.group_name, {
            'type': 'chat_message_broadcast',
            'message': message,
            'sender': self.scope["user"].username,
            'sender_id': self.scope["user"].id,
            'is_staff': self.scope["user"].is_staff,
            'timestamp': timezone.now().isoformat()
        })
    
    # Group message handlers
    async def chat_message_broadcast(self, event):
        """Handle chat message broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'is_staff': event['is_staff'],
            'timestamp': event['timestamp']
        }))


# Utility functions for sending WebSocket messages from views
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_new_panic_alert(alert_data):
    """Broadcast new panic alert to admin dashboard"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)('panic_alerts', {
        'type': 'new_panic_alert',
        'alert': alert_data
    })

def broadcast_alert_update(alert_id, alert_data):
    """Broadcast alert update to specific alert group"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(f'alert_{alert_id}', {
        'type': 'alert_update',
        'alert': alert_data
    })

def broadcast_dashboard_stats_update(stats):
    """Broadcast dashboard stats update"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)('admin_dashboard', {
        'type': 'stats_update',
        'stats': stats
    })

def send_user_notification(user_id, message, title=None, notification_type='info'):
    """Send notification to a specific user"""
    channel_layer = get_channel_layer()
    payload = {
        'type': 'user_notification',
        'message': message,
        'notification_type': notification_type,
        'timestamp': timezone.now().isoformat()
    }
    if title:
        payload['title'] = title
    
    async_to_sync(channel_layer.group_send)(f'user_{user_id}', payload)

def broadcast_map_alert_update(alert_data):
    """Broadcast alert update to map channel for all admins"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)('map_alerts', {
        'type': 'map_alert_update',
        'alert': alert_data,
        'timestamp': timezone.now().isoformat()
    })
