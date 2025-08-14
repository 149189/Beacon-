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
]