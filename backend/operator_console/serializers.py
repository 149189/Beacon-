from rest_framework import serializers
from .models import Incident, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message_text', 'timestamp']


class IncidentSerializer(serializers.ModelSerializer):
    chat_messages = ChatMessageSerializer(many=True, read_only=True)
    acknowledged_by_username = serializers.CharField(source='acknowledged_by.username', read_only=True)
    
    class Meta:
        model = Incident
        fields = [
            'id', 'user', 'status', 'latitude', 'longitude', 
            'created_at', 'last_update_at', 'metadata',
            'acknowledged_by_username', 'acknowledged_at', 'chat_messages'
        ]
        read_only_fields = ['id', 'created_at', 'last_update_at']


class IncidentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for incident lists"""
    class Meta:
        model = Incident
        fields = ['id', 'user', 'status', 'latitude', 'longitude', 'created_at']


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message_text']
    
    def create(self, validated_data):
        incident_id = self.context['incident_id']
        sender = self.context['sender']
        
        return ChatMessage.objects.create(
            incident_id=incident_id,
            sender=sender,
            **validated_data
        )


class IncidentAcknowledgeSerializer(serializers.Serializer):
    """Serializer for acknowledging incidents"""
    pass  # No fields needed, just the action


class IncidentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new incidents"""
    class Meta:
        model = Incident
        fields = ['user', 'latitude', 'longitude', 'metadata']
    
    def create(self, validated_data):
        # Set default status to active
        validated_data['status'] = 'active'
        return super().create(validated_data)
