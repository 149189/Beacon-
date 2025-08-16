from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    UserProfile, Message, UserActivity, SystemNotification,
    PanicAlert, AlertLocation, AlertMedia, EmergencyContact, AlertNotification
)

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'location', 'is_online', 'last_seen', 'created_at')
    list_filter = ('is_online', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    def full_name(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    full_name.short_description = 'Full Name'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'message_type', 'status', 'priority', 'is_read', 'created_at')
    list_filter = ('message_type', 'status', 'priority', 'is_read', 'created_at')
    search_fields = ('subject', 'content', 'user__username', 'user__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_editable = ('status', 'priority', 'is_read')
    actions = ['mark_as_read', 'resolve_messages']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} messages marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def resolve_messages(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='resolved', resolved_at=timezone.now())
        self.message_user(request, f'{updated} messages resolved.')
    resolve_messages.short_description = "Resolve selected messages"

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'description', 'ip_address', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

@admin.register(SystemNotification)
class SystemNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'is_active', 'show_to_all', 'created_at', 'expires_at')
    list_filter = ('notification_type', 'is_active', 'show_to_all', 'created_at')
    search_fields = ('title', 'message')
    list_editable = ('is_active', 'show_to_all')
    filter_horizontal = ('target_users',)
    readonly_fields = ('created_at',)


# ======================== PANIC ALERT ADMIN ========================

class AlertLocationInline(admin.TabularInline):
    model = AlertLocation
    extra = 0
    readonly_fields = ('timestamp', 'coords_display')
    fields = ('latitude', 'longitude', 'accuracy', 'provider', 'battery_level', 'timestamp', 'coords_display')
    
    def coords_display(self, obj):
        if obj.latitude and obj.longitude:
            return f"{obj.latitude}, {obj.longitude}"
        return "No coordinates"
    coords_display.short_description = "Coordinates"

class AlertMediaInline(admin.TabularInline):
    model = AlertMedia
    extra = 0
    readonly_fields = ('id', 'recorded_at', 'uploaded_at', 'file_size_display')
    fields = ('media_type', 'upload_status', 'file_size_display', 'duration', 'recorded_at')
    
    def file_size_display(self, obj):
        if obj.file_size:
            return f"{obj.file_size / 1024:.1f} KB"
        return "Unknown"
    file_size_display.short_description = "File Size"

class AlertNotificationInline(admin.TabularInline):
    model = AlertNotification
    extra = 0
    readonly_fields = ('id', 'created_at', 'sent_at', 'delivered_at')
    fields = ('notification_type', 'recipient', 'status', 'sent_at', 'delivered_at')

@admin.register(PanicAlert)
class PanicAlertAdmin(admin.ModelAdmin):
    list_display = (
        'id_short', 'user', 'alert_type', 'status', 'priority', 'location_display',
        'assigned_operator', 'created_at', 'duration_display'
    )
    list_filter = (
        'status', 'alert_type', 'priority', 'created_at', 'is_silent',
        'auto_call_emergency', 'assigned_operator'
    )
    search_fields = ('user__username', 'user__email', 'description', 'address', 'operator_notes')
    readonly_fields = (
        'id', 'created_at', 'updated_at', 'duration_display', 'location_display',
        'device_info_display', 'network_info_display'
    )
    list_editable = ('status', 'assigned_operator')
    inlines = [AlertLocationInline, AlertMediaInline, AlertNotificationInline]
    actions = ['acknowledge_alerts', 'resolve_alerts', 'assign_to_me']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'alert_type', 'status', 'priority')
        }),
        ('Location Data', {
            'fields': ('latitude', 'longitude', 'location_accuracy', 'address', 'location_display'),
            'classes': ('collapse',)
        }),
        ('Alert Details', {
            'fields': ('description', 'is_silent', 'auto_call_emergency')
        }),
        ('Operator Management', {
            'fields': ('assigned_operator', 'operator_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'acknowledged_at', 'resolved_at', 'duration_display'),
            'classes': ('collapse',)
        }),
        ('Technical Information', {
            'fields': ('device_info_display', 'network_info_display'),
            'classes': ('collapse',)
        }),
    )
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'Alert ID'
    
    def location_display(self, obj):
        if obj.latitude and obj.longitude:
            return f"{obj.latitude}, {obj.longitude}"
        return "No location"
    location_display.short_description = 'Location'
    
    def duration_display(self, obj):
        duration = obj.duration
        if duration:
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            if hours > 0:
                return f"{hours}h {minutes}m {seconds}s"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return "N/A"
    duration_display.short_description = 'Duration'
    
    def device_info_display(self, obj):
        if obj.device_info:
            info = []
            for key, value in obj.device_info.items():
                info.append(f"{key}: {value}")
            return "\n".join(info)
        return "No device info"
    device_info_display.short_description = 'Device Info'
    
    def network_info_display(self, obj):
        if obj.network_info:
            info = []
            for key, value in obj.network_info.items():
                info.append(f"{key}: {value}")
            return "\n".join(info)
        return "No network info"
    network_info_display.short_description = 'Network Info'
    
    def acknowledge_alerts(self, request, queryset):
        updated = 0
        for alert in queryset.filter(status='active'):
            alert.acknowledge(request.user)
            updated += 1
        self.message_user(request, f'{updated} alerts acknowledged.')
    acknowledge_alerts.short_description = "Acknowledge selected alerts"
    
    def resolve_alerts(self, request, queryset):
        updated = 0
        for alert in queryset.filter(status__in=['active', 'acknowledged', 'responding']):
            alert.resolve('Resolved via admin action')
            updated += 1
        self.message_user(request, f'{updated} alerts resolved.')
    resolve_alerts.short_description = "Resolve selected alerts"
    
    def assign_to_me(self, request, queryset):
        updated = queryset.update(assigned_operator=request.user)
        self.message_user(request, f'{updated} alerts assigned to you.')
    assign_to_me.short_description = "Assign selected alerts to me"

@admin.register(AlertLocation)
class AlertLocationAdmin(admin.ModelAdmin):
    list_display = ('alert_id_short', 'latitude', 'longitude', 'accuracy', 'provider', 'timestamp')
    list_filter = ('provider', 'timestamp')
    search_fields = ('alert__id', 'alert__user__username')
    readonly_fields = ('timestamp', 'coords_display')
    
    def alert_id_short(self, obj):
        return str(obj.alert.id)[:8]
    alert_id_short.short_description = 'Alert ID'
    
    def coords_display(self, obj):
        return f"{obj.latitude}, {obj.longitude}"
    coords_display.short_description = 'Coordinates'

@admin.register(AlertMedia)
class AlertMediaAdmin(admin.ModelAdmin):
    list_display = (
        'id_short', 'alert_id_short', 'media_type', 'upload_status',
        'file_size_display', 'duration', 'recorded_at'
    )
    list_filter = ('media_type', 'upload_status', 'recorded_at', 'is_encrypted')
    search_fields = ('alert__id', 'alert__user__username')
    readonly_fields = ('id', 'recorded_at', 'uploaded_at', 'file_size_display')
    actions = ['retry_upload', 'mark_as_uploaded']
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'Media ID'
    
    def alert_id_short(self, obj):
        return str(obj.alert.id)[:8]
    alert_id_short.short_description = 'Alert ID'
    
    def file_size_display(self, obj):
        if obj.file_size:
            if obj.file_size > 1024 * 1024:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
            else:
                return f"{obj.file_size / 1024:.1f} KB"
        return "Unknown"
    file_size_display.short_description = 'File Size'
    
    def retry_upload(self, request, queryset):
        updated = queryset.filter(upload_status='failed').update(upload_status='pending')
        self.message_user(request, f'{updated} media files marked for retry.')
    retry_upload.short_description = "Retry failed uploads"
    
    def mark_as_uploaded(self, request, queryset):
        updated = queryset.update(upload_status='uploaded')
        self.message_user(request, f'{updated} media files marked as uploaded.')
    mark_as_uploaded.short_description = "Mark as uploaded"

@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'relationship', 'phone', 'email', 'notify_on_alert', 'is_active')
    list_filter = ('relationship', 'notify_on_alert', 'can_receive_location', 'can_cancel_alert', 'is_active')
    search_fields = ('name', 'phone', 'email', 'user__username', 'user__email')
    list_editable = ('notify_on_alert', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('user', 'name', 'phone', 'email', 'relationship')
        }),
        ('Permissions', {
            'fields': ('notify_on_alert', 'can_receive_location', 'can_cancel_alert', 'is_active')
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AlertNotification)
class AlertNotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id_short', 'alert_id_short', 'notification_type', 'recipient',
        'status', 'sent_at', 'delivered_at', 'retry_count'
    )
    list_filter = ('notification_type', 'status', 'created_at', 'sent_at')
    search_fields = ('alert__id', 'recipient', 'subject', 'message')
    readonly_fields = ('id', 'created_at', 'sent_at', 'delivered_at', 'read_at')
    actions = ['resend_notifications', 'mark_as_delivered']
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'Notification ID'
    
    def alert_id_short(self, obj):
        return str(obj.alert.id)[:8]
    alert_id_short.short_description = 'Alert ID'
    
    def resend_notifications(self, request, queryset):
        updated = queryset.filter(status='failed').update(
            status='pending', retry_count=0, error_message=''
        )
        self.message_user(request, f'{updated} notifications marked for resend.')
    resend_notifications.short_description = "Resend failed notifications"
    
    def mark_as_delivered(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='sent').update(
            status='delivered', delivered_at=timezone.now()
        )
        self.message_user(request, f'{updated} notifications marked as delivered.')
    mark_as_delivered.short_description = "Mark as delivered"

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
