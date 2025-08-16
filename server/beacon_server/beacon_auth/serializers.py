from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    UserProfile, Message, UserActivity, SystemNotification,
    PanicAlert, AlertLocation, AlertMedia, EmergencyContact, AlertNotification
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_active']
        read_only_fields = ['id', 'date_joined']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'username', 'email', 'full_name', 'bio', 'location', 
            'birth_date', 'avatar', 'phone', 'is_online', 'last_seen', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'username', 'email', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username

class MessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    priority_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'user', 'username', 'user_email', 'subject', 'content', 
            'message_type', 'message_type_display', 'status', 'status_display',
            'priority', 'priority_display', 'is_read', 'admin_notes', 
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_priority_display(self, obj):
        priority_map = {
            1: 'Low',
            2: 'Medium', 
            3: 'High',
            4: 'Critical'
        }
        return priority_map.get(obj.priority, 'Unknown')

class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['subject', 'content', 'message_type', 'priority']

class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['status', 'admin_notes', 'is_read']

class UserActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'username', 'activity_type', 'activity_type_display',
            'description', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

class SystemNotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = SystemNotification
        fields = [
            'id', 'title', 'message', 'notification_type', 'notification_type_display',
            'is_active', 'show_to_all', 'target_users', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    unread_messages = serializers.IntegerField()
    messages_today = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    system_notifications = serializers.IntegerField()
    # Panic alert stats
    total_alerts = serializers.IntegerField(default=0)
    active_alerts = serializers.IntegerField(default=0)
    alerts_today = serializers.IntegerField(default=0)


# ======================== PANIC ALERT SERIALIZERS ========================

class AlertLocationSerializer(serializers.ModelSerializer):
    coords = serializers.ReadOnlyField()
    
    class Meta:
        model = AlertLocation
        fields = [
            'id', 'latitude', 'longitude', 'accuracy', 'altitude', 'speed',
            'heading', 'timestamp', 'provider', 'battery_level', 'coords'
        ]
        read_only_fields = ['id', 'timestamp']

class AlertMediaSerializer(serializers.ModelSerializer):
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    upload_status_display = serializers.CharField(source='get_upload_status_display', read_only=True)
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AlertMedia
        fields = [
            'id', 'media_type', 'media_type_display', 'file_path', 'file_url',
            'file_size', 'file_size_display', 'duration', 'upload_status', 
            'upload_status_display', 'uploaded_at', 'upload_error', 'recorded_at',
            'device_location', 'is_encrypted', 'expiry_date'
        ]
        read_only_fields = [
            'id', 'uploaded_at', 'recorded_at', 'upload_error', 'file_size'
        ]
    
    def get_file_size_display(self, obj):
        if obj.file_size:
            if obj.file_size > 1024 * 1024:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
            else:
                return f"{obj.file_size / 1024:.1f} KB"
        return "Unknown"

class AlertNotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AlertNotification
        fields = [
            'id', 'notification_type', 'notification_type_display', 'recipient',
            'subject', 'message', 'status', 'status_display', 'sent_at',
            'delivered_at', 'read_at', 'error_message', 'retry_count',
            'max_retries', 'created_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'delivered_at', 'read_at', 'error_message',
            'retry_count', 'created_at'
        ]

class EmergencyContactSerializer(serializers.ModelSerializer):
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)
    
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'phone', 'email', 'relationship', 'relationship_display',
            'notify_on_alert', 'can_receive_location', 'can_cancel_alert', 'notes',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PanicAlertSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assigned_operator = UserSerializer(read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    location_coords = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    duration = serializers.SerializerMethodField()
    location_history = AlertLocationSerializer(many=True, read_only=True)
    media_files = AlertMediaSerializer(many=True, read_only=True)
    notifications = AlertNotificationSerializer(many=True, read_only=True)
    
    class Meta:
        model = PanicAlert
        fields = [
            'id', 'user', 'alert_type', 'alert_type_display', 'status', 'status_display',
            'priority', 'priority_display', 'latitude', 'longitude', 'location_accuracy',
            'address', 'location_coords', 'description', 'is_silent', 'auto_call_emergency',
            'assigned_operator', 'operator_notes', 'created_at', 'updated_at',
            'acknowledged_at', 'resolved_at', 'device_info', 'network_info',
            'is_active', 'duration', 'location_history', 'media_files', 'notifications'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at', 'acknowledged_at', 'resolved_at'
        ]
    
    def get_duration(self, obj):
        duration = obj.duration
        if duration:
            return int(duration.total_seconds())
        return None

class PanicAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating panic alerts from mobile app"""
    
    class Meta:
        model = PanicAlert
        fields = [
            'alert_type', 'priority', 'latitude', 'longitude', 'location_accuracy',
            'address', 'description', 'is_silent', 'auto_call_emergency',
            'device_info', 'network_info'
        ]
    
    def validate(self, attrs):
        # Ensure location data is present for most alert types
        if attrs.get('alert_type') != 'manual' and not (attrs.get('latitude') and attrs.get('longitude')):
            raise serializers.ValidationError(
                "Location coordinates are required for this alert type."
            )
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class PanicAlertUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating panic alerts (operator actions)"""
    
    class Meta:
        model = PanicAlert
        fields = ['status', 'assigned_operator', 'operator_notes']
    
    def update(self, instance, validated_data):
        if 'status' in validated_data:
            new_status = validated_data['status']
            if new_status == 'acknowledged' and instance.status == 'active':
                instance.acknowledge(validated_data.get('assigned_operator'))
                validated_data.pop('status')  # Already handled by acknowledge method
            elif new_status == 'resolved' and instance.is_active:
                instance.resolve(validated_data.get('operator_notes', ''))
                validated_data.pop('status')  # Already handled by resolve method
        
        return super().update(instance, validated_data)

class AlertLocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating location updates"""
    
    class Meta:
        model = AlertLocation
        fields = [
            'latitude', 'longitude', 'accuracy', 'altitude', 'speed',
            'heading', 'provider', 'battery_level'
        ]

class AlertMediaCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading media files"""
    
    class Meta:
        model = AlertMedia
        fields = [
            'media_type', 'file_path', 'file_size', 'duration',
            'device_location', 'is_encrypted', 'access_key'
        ]

class PanicAlertListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for alert lists"""
    user = UserSerializer(read_only=True)
    assigned_operator = UserSerializer(read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    location_coords = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    duration = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    location_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PanicAlert
        fields = [
            'id', 'user', 'alert_type', 'alert_type_display', 'status', 'status_display',
            'priority', 'priority_display', 'latitude', 'longitude', 'location_coords',
            'address', 'description', 'is_silent', 'assigned_operator', 'created_at',
            'acknowledged_at', 'resolved_at', 'is_active', 'duration', 'media_count',
            'location_count'
        ]
    
    def get_duration(self, obj):
        duration = obj.duration
        if duration:
            return int(duration.total_seconds())
        return None
    
    def get_media_count(self, obj):
        return obj.media_files.count()
    
    def get_location_count(self, obj):
        return obj.location_history.count()

class PanicAlertStatsSerializer(serializers.Serializer):
    """Serializer for panic alert statistics"""
    total_alerts = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    acknowledged_alerts = serializers.IntegerField()
    resolved_alerts = serializers.IntegerField()
    alerts_today = serializers.IntegerField()
    alerts_this_week = serializers.IntegerField()
    alerts_this_month = serializers.IntegerField()
    average_response_time = serializers.FloatField()
    alert_types_breakdown = serializers.DictField()
    priority_breakdown = serializers.DictField()
