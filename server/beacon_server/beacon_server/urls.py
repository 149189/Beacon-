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
                'chat': '/ws/chat/{alert_id}/'
            }
        },
        'timestamp': datetime.now().isoformat()
    })

def simple_login_page(request):
    """Simple login page for testing"""
    from django.http import HttpResponse
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Beacon Login</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .login-form { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
            input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; }
            button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
            button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="login-form">
            <h2>Beacon System Login</h2>
            <form id="loginForm">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <div id="result"></div>
        </div>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/auth/login/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        document.getElementById('result').innerHTML = '<p style="color: green;">Login successful! Token: ' + data.tokens.access.substring(0, 20) + '...</p>';
                    } else {
                        document.getElementById('result').innerHTML = '<p style="color: red;">Login failed: ' + data.error + '</p>';
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                }
            });
        </script>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', simple_login_page, name='login_page'),  # Root URL shows login page
    path('login/', simple_login_page, name='login_page_alt'),  # Alternative login URL
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
    # Add static files for admin interface
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)