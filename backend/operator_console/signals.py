from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Incident, ChatMessage


@receiver(post_save, sender=Incident)
def broadcast_incident_update(sender, instance, created, **kwargs):
    """Broadcast incident updates to operators"""
    channel_layer = get_channel_layer()
    
    if created:
        # New incident created
        incident_data = {
            'id': str(instance.id),
            'latitude': float(instance.latitude),
            'longitude': float(instance.longitude),
            'status': instance.status,
            'created_at': instance.created_at.isoformat(),
            'summary': f"Incident from {instance.user}"
        }
        
        async_to_sync(channel_layer.group_send)('operators', {
            'type': 'broadcast.incident.created',
            'incident': incident_data
        })
    else:
        # Incident updated
        incident_data = {
            'id': str(instance.id),
            'latitude': float(instance.latitude),
            'longitude': float(instance.longitude),
            'status': instance.status,
            'created_at': instance.created_at.isoformat(),
            'summary': f"Incident from {instance.user}"
        }
        
        async_to_sync(channel_layer.group_send)('operators', {
            'type': 'broadcast.incident.updated',
            'incident': incident_data
        })
        
        # Also broadcast to incident-specific group
        async_to_sync(channel_layer.group_send)(f'incident_{instance.id}', {
            'type': 'broadcast.incident.updated',
            'incident': incident_data
        })


@receiver(post_save, sender=ChatMessage)
def broadcast_chat_message(sender, instance, created, **kwargs):
    """Broadcast chat messages to operators"""
    if created:
        channel_layer = get_channel_layer()
        
        message_data = {
            'type': 'broadcast.chat.message',
            'incident_id': str(instance.incident.id),
            'message': {
                'id': str(instance.id),
                'sender': instance.sender,
                'message_text': instance.message_text,
                'timestamp': instance.timestamp.isoformat()
            }
        }
        
        # Broadcast to all operators
        async_to_sync(channel_layer.group_send)('operators', message_data)
        
        # Broadcast to incident-specific group
        async_to_sync(channel_layer.group_send)(f'incident_{instance.incident.id}', message_data)
