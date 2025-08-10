from django.contrib import admin
from .models import Incident, ChatMessage


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'latitude', 'longitude', 'created_at', 'acknowledged_by']
    list_filter = ['status', 'created_at', 'acknowledged_at']
    search_fields = ['user', 'id']
    readonly_fields = ['id', 'created_at', 'last_update_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'status', 'latitude', 'longitude')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_update_at', 'acknowledged_at'),
            'classes': ('collapse',)
        }),
        ('Acknowledgment', {
            'fields': ('acknowledged_by',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'incident', 'sender', 'message_text', 'timestamp']
    list_filter = ['sender', 'timestamp', 'incident__status']
    search_fields = ['message_text', 'incident__id']
    readonly_fields = ['id', 'timestamp']
    
    fieldsets = (
        ('Message', {
            'fields': ('id', 'incident', 'sender', 'message_text')
        }),
        ('Timing', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
