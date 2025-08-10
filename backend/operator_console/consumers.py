import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from .models import Incident, ChatMessage

User = get_user_model()


class OperatorConsoleConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for operator console real-time updates
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from scope (assuming token-based auth)
        self.user = self.scope.get('user', AnonymousUser())
        
        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return
        
        # Accept the connection
        await self.accept()
        
        # Join the operators group
        await self.channel_layer.group_add('operators', self.channel_name)
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection.confirmed',
            'message': f'Connected as operator: {self.user.username}'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave the operators group
        await self.channel_layer.group_discard('operators', self.channel_name)
        
        # Leave any incident-specific groups
        if hasattr(self, 'incident_groups'):
            for group in self.incident_groups:
                await self.channel_layer.group_discard(group, self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'chat.send':
                await self.handle_chat_send(data)
            elif action == 'incident.acknowledge':
                await self.handle_incident_acknowledge(data)
            elif action == 'join.incident':
                await self.handle_join_incident(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown action: {action}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_chat_send(self, data):
        """Handle chat message from operator"""
        incident_id = data.get('incident_id')
        message_text = data.get('message')
        
        if not incident_id or not message_text:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing incident_id or message'
            }))
            return
        
        # Save chat message to database
        chat_message = await self.save_chat_message(incident_id, message_text)
        
        if chat_message:
            # Broadcast to all operators
            await self.channel_layer.group_send('operators', {
                'type': 'broadcast.chat.message',
                'incident_id': incident_id,
                'message': {
                    'id': str(chat_message.id),
                    'sender': 'operator',
                    'message_text': message_text,
                    'timestamp': chat_message.timestamp.isoformat()
                }
            })
            
            # Broadcast to incident-specific group
            await self.channel_layer.group_send(f'incident_{incident_id}', {
                'type': 'broadcast.chat.message',
                'incident_id': incident_id,
                'message': {
                    'id': str(chat_message.id),
                    'sender': 'operator',
                    'message_text': message_text,
                    'timestamp': chat_message.timestamp.isoformat()
                }
            })
    
    async def handle_incident_acknowledge(self, data):
        """Handle incident acknowledgment from operator"""
        incident_id = data.get('incident_id')
        
        if not incident_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing incident_id'
            }))
            return
        
        # Acknowledge incident in database
        success = await self.acknowledge_incident(incident_id)
        
        if success:
            # Broadcast acknowledgment to all operators
            await self.channel_layer.group_send('operators', {
                'type': 'broadcast.incident.acknowledged',
                'incident_id': incident_id,
                'acknowledged_by': self.user.username,
                'acknowledged_at': success.isoformat()
            })
            
            # Broadcast to incident-specific group
            await self.channel_layer.group_send(f'incident_{incident_id}', {
                'type': 'broadcast.incident.acknowledged',
                'incident_id': incident_id,
                'acknowledged_by': self.user.username,
                'acknowledged_at': success.isoformat()
            })
    
    async def handle_join_incident(self, data):
        """Handle operator joining an incident group"""
        incident_id = data.get('incident_id')
        
        if not incident_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Missing incident_id'
            }))
            return
        
        # Join incident-specific group
        group_name = f'incident_{incident_id}'
        await self.channel_layer.group_add(group_name, self.channel_name)
        
        # Track joined groups
        if not hasattr(self, 'incident_groups'):
            self.incident_groups = set()
        self.incident_groups.add(group_name)
        
        await self.send(text_data=json.dumps({
            'type': 'joined.incident',
            'incident_id': incident_id
        }))
    
    @database_sync_to_async
    def save_chat_message(self, incident_id, message_text):
        """Save chat message to database"""
        try:
            incident = Incident.objects.get(id=incident_id)
            chat_message = ChatMessage.objects.create(
                incident=incident,
                sender='operator',
                message_text=message_text
            )
            return chat_message
        except Incident.DoesNotExist:
            return None
    
    @database_sync_to_async
    def acknowledge_incident(self, incident_id):
        """Acknowledge incident in database"""
        try:
            incident = Incident.objects.get(id=incident_id)
            if incident.status != 'acknowledged':
                incident.acknowledge(self.user)
                return incident.acknowledged_at
            return None
        except Incident.DoesNotExist:
            return None
    
    # Broadcast message handlers
    async def broadcast_incident_created(self, event):
        """Broadcast incident created event"""
        await self.send(text_data=json.dumps({
            'type': 'incident.created',
            'incident': event['incident']
        }))
    
    async def broadcast_incident_updated(self, event):
        """Broadcast incident updated event"""
        await self.send(text_data=json.dumps({
            'type': 'incident.updated',
            'incident': event['incident']
        }))
    
    async def broadcast_incident_acknowledged(self, event):
        """Broadcast incident acknowledged event"""
        await self.send(text_data=json.dumps({
            'type': 'incident.acknowledged',
            'incident_id': event['incident_id'],
            'acknowledged_by': event['acknowledged_by'],
            'acknowledged_at': event['acknowledged_at']
        }))
    
    async def broadcast_chat_message(self, event):
        """Broadcast chat message event"""
        await self.send(text_data=json.dumps({
            'type': 'chat.message',
            'incident_id': event['incident_id'],
            'message': event['message']
        }))
