from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Message, UserActivity, SystemNotification

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

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)