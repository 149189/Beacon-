from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def update_last_seen(self):
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])
    
    def set_online_status(self, status):
        self.is_online = status
        self.save(update_fields=['is_online'])

class Message(models.Model):
    MESSAGE_TYPES = [
        ('support', 'Support Request'),
        ('feedback', 'Feedback'),
        ('general', 'General'),
        ('bug_report', 'Bug Report'),
        ('feature_request', 'Feature Request'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    subject = models.CharField(max_length=200)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.IntegerField(default=1, help_text='1=Low, 2=Medium, 3=High, 4=Critical')
    is_read = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True, help_text='Internal notes for admins')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.user.username}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save(update_fields=['is_read'])
    
    def resolve_message(self):
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('message_sent', 'Message Sent'),
        ('profile_updated', 'Profile Updated'),
        ('password_changed', 'Password Changed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'User Activities'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()}"

class SystemNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    is_active = models.BooleanField(default=True)
    show_to_all = models.BooleanField(default=False, help_text='Show to all users')
    target_users = models.ManyToManyField(User, blank=True, help_text='Specific users to show notification to')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


# ======================== PANIC ALERT MODELS ========================

class PanicAlert(models.Model):
    """Main panic alert model"""
    ALERT_TYPES = [
        ('panic_button', 'Panic Button'),
        ('shake_to_alert', 'Shake to Alert'),
        ('decoy_screen', 'Decoy Screen'),
        ('manual', 'Manual Trigger'),
        ('scheduled', 'Scheduled Alert'),
    ]
    
    ALERT_STATUS = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('responding', 'Responding'),
        ('resolved', 'Resolved'),
        ('false_alarm', 'False Alarm'),
        ('canceled', 'Canceled'),
    ]
    
    PRIORITY_LEVELS = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
        (4, 'Critical'),
        (5, 'Emergency'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='panic_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, default='panic_button')
    status = models.CharField(max_length=20, choices=ALERT_STATUS, default='active')
    priority = models.IntegerField(choices=PRIORITY_LEVELS, default=4, help_text='Alert priority level')
    
    # Location data
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    location_accuracy = models.FloatField(null=True, blank=True, help_text='GPS accuracy in meters')
    address = models.TextField(blank=True, help_text='Reverse geocoded address')
    
    # Alert details
    description = models.TextField(blank=True, help_text='User description or automatic notes')
    is_silent = models.BooleanField(default=False, help_text='Silent alert without notifications')
    auto_call_emergency = models.BooleanField(default=False, help_text='Auto call emergency services')
    
    # Operator details
    assigned_operator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_alerts', help_text='Operator handling this alert'
    )
    operator_notes = models.TextField(blank=True, help_text='Operator internal notes')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Device info
    device_info = models.JSONField(default=dict, blank=True, help_text='Device and app information')
    network_info = models.JSONField(default=dict, blank=True, help_text='Network connectivity info')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['priority', 'created_at']),
        ]
    
    def __str__(self):
        return f"Alert {self.id} - {self.user.username} ({self.get_status_display()})"
    
    def acknowledge(self, operator=None):
        """Mark alert as acknowledged by operator"""
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        if operator:
            self.assigned_operator = operator
        self.save(update_fields=['status', 'acknowledged_at', 'assigned_operator'])
    
    def resolve(self, resolution_notes=''):
        """Mark alert as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        if resolution_notes:
            self.operator_notes = f"{self.operator_notes}\n\nResolution: {resolution_notes}"
        self.save(update_fields=['status', 'resolved_at', 'operator_notes'])
    
    def cancel(self):
        """Cancel alert (user initiated)"""
        self.status = 'canceled'
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])
    
    @property
    def is_active(self):
        return self.status in ['active', 'acknowledged', 'responding']
    
    @property
    def duration(self):
        """Get alert duration"""
        if self.resolved_at:
            return self.resolved_at - self.created_at
        return timezone.now() - self.created_at
    
    @property
    def location_coords(self):
        """Get location as tuple (lat, lng)"""
        if self.latitude and self.longitude:
            return (float(self.latitude), float(self.longitude))
        return None


class AlertLocation(models.Model):
    """Location tracking history for panic alerts"""
    alert = models.ForeignKey(PanicAlert, on_delete=models.CASCADE, related_name='location_history')
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    accuracy = models.FloatField(help_text='GPS accuracy in meters')
    altitude = models.FloatField(null=True, blank=True, help_text='Altitude in meters')
    speed = models.FloatField(null=True, blank=True, help_text='Speed in m/s')
    heading = models.FloatField(null=True, blank=True, help_text='Direction in degrees')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Additional location metadata
    provider = models.CharField(max_length=20, default='gps', help_text='Location provider (gps, network, etc.)')
    battery_level = models.IntegerField(null=True, blank=True, help_text='Device battery percentage')
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['alert', 'timestamp']),
        ]
    
    def __str__(self):
        return f"Location for {self.alert.id} at {self.timestamp}"
    
    @property
    def coords(self):
        return (float(self.latitude), float(self.longitude))


class AlertMedia(models.Model):
    """Media files associated with panic alerts"""
    MEDIA_TYPES = [
        ('audio', 'Audio Recording'),
        ('video', 'Video Recording'),
        ('photo', 'Photo'),
        ('screenshot', 'Screenshot'),
    ]
    
    UPLOAD_STATUS = [
        ('pending', 'Pending Upload'),
        ('uploading', 'Uploading'),
        ('uploaded', 'Uploaded'),
        ('failed', 'Upload Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(PanicAlert, on_delete=models.CASCADE, related_name='media_files')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    file_path = models.FileField(upload_to='alert_media/', null=True, blank=True)
    file_url = models.URLField(blank=True, help_text='Cloud storage URL')
    file_size = models.BigIntegerField(null=True, blank=True, help_text='File size in bytes')
    duration = models.DurationField(null=True, blank=True, help_text='Duration for audio/video')
    
    # Upload metadata
    upload_status = models.CharField(max_length=20, choices=UPLOAD_STATUS, default='pending')
    uploaded_at = models.DateTimeField(null=True, blank=True)
    upload_error = models.TextField(blank=True)
    
    # Recording metadata
    recorded_at = models.DateTimeField(auto_now_add=True)
    device_location = models.JSONField(default=dict, blank=True, help_text='Location when recorded')
    
    # Privacy and access control
    is_encrypted = models.BooleanField(default=True)
    access_key = models.CharField(max_length=255, blank=True, help_text='Encryption/access key')
    expiry_date = models.DateTimeField(null=True, blank=True, help_text='When media expires')
    
    class Meta:
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.get_media_type_display()} for Alert {self.alert.id}"
    
    def mark_uploaded(self, file_url=''):
        """Mark media as successfully uploaded"""
        self.upload_status = 'uploaded'
        self.uploaded_at = timezone.now()
        if file_url:
            self.file_url = file_url
        self.save(update_fields=['upload_status', 'uploaded_at', 'file_url'])
    
    def mark_failed(self, error_message=''):
        """Mark media upload as failed"""
        self.upload_status = 'failed'
        self.upload_error = error_message
        self.save(update_fields=['upload_status', 'upload_error'])


class EmergencyContact(models.Model):
    """Emergency contacts for users"""
    CONTACT_TYPES = [
        ('primary', 'Primary Emergency Contact'),
        ('secondary', 'Secondary Emergency Contact'),
        ('family', 'Family Member'),
        ('friend', 'Friend'),
        ('medical', 'Medical Contact'),
        ('legal', 'Legal Contact'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    relationship = models.CharField(max_length=20, choices=CONTACT_TYPES, default='primary')
    
    # Contact preferences
    notify_on_alert = models.BooleanField(default=True, help_text='Send notifications for alerts')
    can_receive_location = models.BooleanField(default=True, help_text='Can receive location updates')
    can_cancel_alert = models.BooleanField(default=False, help_text='Can cancel user alerts')
    
    # Additional info
    notes = models.TextField(blank=True, help_text='Additional information about contact')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['relationship', 'name']
        unique_together = ['user', 'phone']
    
    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()}) - {self.user.username}"


class AlertNotification(models.Model):
    """Notifications sent for panic alerts"""
    NOTIFICATION_TYPES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('push', 'Push Notification'),
        ('call', 'Phone Call'),
        ('webhook', 'Webhook'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('read', 'Read'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(PanicAlert, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    recipient = models.CharField(max_length=255, help_text='Phone, email, or user ID')
    
    # Message content
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    
    # Delivery tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    provider_response = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['alert', 'notification_type']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.recipient} for Alert {self.alert.id}"
    
    def mark_sent(self):
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_delivered(self):
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at'])
    
    def mark_failed(self, error_msg=''):
        self.status = 'failed'
        self.error_message = error_msg
        self.save(update_fields=['status', 'error_message'])
