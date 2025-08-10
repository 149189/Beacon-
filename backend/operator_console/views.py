from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Incident, ChatMessage
from .serializers import (
    IncidentSerializer, 
    IncidentListSerializer, 
    ChatMessageCreateSerializer,
    IncidentAcknowledgeSerializer,
    IncidentCreateSerializer
)


class IncidentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing incidents in the operator console
    """
    # Temporarily allow unauthenticated access for development
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Incident.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return IncidentListSerializer
        elif self.action == 'create':
            return IncidentCreateSerializer
        return IncidentSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new incident"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            incident = serializer.save()
            
            # Broadcast new incident to all operators
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'operators',
                {
                    'type': 'broadcast.incident.created',
                    'incident': IncidentSerializer(incident).data
                }
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get list of active incidents"""
        active_incidents = Incident.objects.filter(status='active').order_by('-created_at')
        serializer = IncidentListSerializer(active_incidents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def acknowledge(self, request, pk=None):
        """Mark incident as acknowledged"""
        incident = self.get_object()
        
        if incident.status == 'acknowledged':
            return Response(
                {'error': 'Incident already acknowledged'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Acknowledge the incident
        incident.acknowledge(request.user)
        
        # Broadcast acknowledgment to all operators
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'operators',
            {
                'type': 'broadcast.incident.acknowledged',
                'incident_id': str(incident.id),
                'acknowledged_by': request.user.username,
                'acknowledged_at': incident.acknowledged_at.isoformat()
            }
        )
        
        # Also broadcast to the specific incident group
        async_to_sync(channel_layer.group_send)(
            f'incident_{incident.id}',
            {
                'type': 'broadcast.incident.acknowledged',
                'incident_id': str(incident.id),
                'acknowledged_by': request.user.username,
                'acknowledged_at': incident.acknowledged_at.isoformat()
            }
        )
        
        serializer = IncidentSerializer(incident)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """Send a chat message for an incident"""
        incident = self.get_object()
        
        serializer = ChatMessageCreateSerializer(
            data=request.data,
            context={'incident_id': incident.id, 'sender': 'operator'}
        )
        
        if serializer.is_valid():
            chat_message = serializer.save()
            
            # Broadcast chat message to all operators and incident group
            channel_layer = get_channel_layer()
            
            # Message to send to operators
            message_data = {
                'type': 'broadcast.chat.message',
                'incident_id': str(incident.id),
                'message': {
                    'id': str(chat_message.id),
                    'sender': chat_message.sender,
                    'message_text': chat_message.message_text,
                    'timestamp': chat_message.timestamp.isoformat()
                }
            }
            
            # Broadcast to all operators
            async_to_sync(channel_layer.group_send)('operators', message_data)
            
            # Broadcast to incident-specific group
            async_to_sync(channel_layer.group_send)(f'incident_{incident.id}', message_data)
            
            return Response({'status': 'Message sent'}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, *args, **kwargs):
        """Get incident detail with last N chat messages"""
        incident = self.get_object()
        
        # Get last 50 chat messages for this incident
        chat_messages = incident.chat_messages.all()[:50]
        
        # Create a temporary incident instance with limited chat messages
        incident.chat_messages = chat_messages
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)
