from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Incident, IncidentUpdate

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_operator', 
                   'is_emergency_responder', 'is_active', 'date_joined')
    list_filter = ('is_operator', 'is_emergency_responder', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'first_name', 'last_name', 'phone_number', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_operator', 'is_emergency_responder', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'priority', 'incident_type', 'created_at')
    list_filter = ('status', 'priority', 'incident_type', 'created_at')
    search_fields = ('title', 'description', 'user__email', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {'fields': ('title', 'description', 'user')}),
        ('Location', {'fields': ('latitude', 'longitude', 'address')}),
        ('Classification', {'fields': ('status', 'priority', 'incident_type')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'resolved_at')}),
    )

@admin.register(IncidentUpdate)
class IncidentUpdateAdmin(admin.ModelAdmin):
    list_display = ('incident', 'user', 'message', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('message', 'incident__title', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
