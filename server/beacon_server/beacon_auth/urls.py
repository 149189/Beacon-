from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # User management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    
    # Message management
    path('messages/', views.MessageListView.as_view(), name='message-list'),
    path('messages/<uuid:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/<uuid:message_id>/read/', views.mark_message_read, name='mark-message-read'),
    path('messages/<uuid:message_id>/resolve/', views.resolve_message, name='resolve-message'),
    
    # Activity and notifications
    path('activities/', views.UserActivityListView.as_view(), name='activity-list'),
    path('notifications/', views.SystemNotificationListView.as_view(), name='notification-list'),
    
    # Dashboard
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # ======================== PANIC ALERT ENDPOINTS ========================
    
    # Panic alerts management
    path('alerts/', views.PanicAlertListView.as_view(), name='alert-list'),
    path('alerts/<uuid:pk>/', views.PanicAlertDetailView.as_view(), name='alert-detail'),
    path('alerts/stats/', views.PanicAlertStatsView.as_view(), name='alert-stats'),
    
    # Alert actions
    path('alerts/<uuid:alert_id>/acknowledge/', views.acknowledge_alert, name='acknowledge-alert'),
    path('alerts/<uuid:alert_id>/resolve/', views.resolve_alert, name='resolve-alert'),
    path('alerts/<uuid:alert_id>/cancel/', views.cancel_alert, name='cancel-alert'),
    path('alerts/<uuid:alert_id>/location/', views.update_alert_location, name='update-alert-location'),
    
    # Map and mobile endpoints
    path('alerts/map/', views.get_alerts_for_map, name='alerts-for-map'),
    path('panic/create/', views.create_panic_alert, name='create-panic-alert'),
    
    # Alert sub-resources
    path('alerts/<uuid:alert_id>/locations/', views.AlertLocationListView.as_view(), name='alert-location-list'),
    path('alerts/<uuid:alert_id>/media/', views.AlertMediaListView.as_view(), name='alert-media-list'),
    
    # ======================== COMPANION APP ENDPOINTS ========================
    # These endpoints are required for the Flutter companion app to function
    
    # Panic alert creation (mobile app)
    path('panic/create/', views.create_panic_alert, name='create-panic-alert-mobile'),
    
    # Alert location updates (mobile app)
    path('alerts/<uuid:alert_id>/location/', views.update_alert_location, name='update-alert-location-mobile'),
    
    # Alert listing and management (mobile app)
    path('alerts/', views.PanicAlertListView.as_view(), name='alert-list-mobile'),
    
    # Emergency contacts
    path('emergency-contacts/', views.EmergencyContactListView.as_view(), name='emergency-contact-list'),
    path('emergency-contacts/<int:pk>/', views.EmergencyContactDetailView.as_view(), name='emergency-contact-detail'),
]
