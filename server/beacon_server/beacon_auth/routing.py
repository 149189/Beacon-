from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Panic Alert WebSocket - Real-time alerts for admin dashboard
    re_path(r'ws/alerts/$', consumers.PanicAlertConsumer.as_asgi()),
    
    # Individual Alert WebSocket - Real-time updates for specific alert
    re_path(r'ws/alerts/(?P<alert_id>[0-9a-f-]+)/$', consumers.AlertConsumer.as_asgi()),
    
    # User-specific WebSocket - Real-time updates for user
    re_path(r'ws/user/(?P<user_id>\w+)/$', consumers.UserConsumer.as_asgi()),
    
    # Admin Dashboard WebSocket - Real-time dashboard updates
    re_path(r'ws/admin/dashboard/$', consumers.AdminDashboardConsumer.as_asgi()),
    
    # Location Tracking WebSocket - Real-time location updates
    re_path(r'ws/location/(?P<alert_id>[0-9a-f-]+)/$', consumers.LocationConsumer.as_asgi()),
    
    # Chat WebSocket - Two-way communication between user and operator
    re_path(r'ws/chat/(?P<alert_id>[0-9a-f-]+)/$', consumers.ChatConsumer.as_asgi()),
    
    # Map WebSocket - Real-time map updates for admin dashboard
    re_path(r'ws/map/alerts/$', consumers.MapAlertsConsumer.as_asgi()),
]
