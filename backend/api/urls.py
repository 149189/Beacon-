from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication endpoints
    path('auth/register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', views.UserLoginView.as_view(), name='user_login'),
    path('auth/profile/', views.UserProfileView.as_view(), name='user_profile'),
    
    # JWT token endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Incident management
    path('incidents/', views.IncidentListView.as_view(), name='incident_list'),
    path('incidents/<int:pk>/', views.IncidentDetailView.as_view(), name='incident_detail'),
    path('incidents/<int:incident_id>/updates/', views.IncidentUpdateView.as_view(), name='incident_updates'),
    
    # Test endpoint (no auth required)
    path('test/incidents/', views.test_incidents, name='test_incidents'),
]
