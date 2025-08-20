from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

def health_check(request):
    """Health check endpoint for API connectivity monitoring"""
    from datetime import datetime
    return JsonResponse({
        'status': 'healthy',
        'message': 'Beacon API is running',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'websockets': '/ws/',
            'admin': '/admin/'
        }
    })

def companion_status(request):
    """Companion app status and configuration endpoint"""
    from datetime import datetime
    return JsonResponse({
        'status': 'ready',
        'message': 'Companion app can connect to this backend',
        'backend_url': 'http://127.0.0.1:8000',
        'websocket_url': 'ws://127.0.0.1:8000',
        'api_base': '/api/auth/',
        'supported_endpoints': {
            'panic_create': '/api/auth/panic/create/',
            'alerts': '/api/auth/alerts/',
            'alert_location': '/api/auth/alerts/{alert_id}/location/',
            'websockets': {
                'alerts': '/ws/alerts/',
                'user': '/ws/user/{user_id}/',
                'location': '/ws/location/{alert_id}/',
                'chat': '/ws/chat/{alert_id}/'
            }
        },
        'timestamp': datetime.now().isoformat()
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/companion/status/', companion_status, name='companion_status'),
    path('api/auth/', include('beacon_auth.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)