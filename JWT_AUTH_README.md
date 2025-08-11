# JWT Authentication Implementation for Beacon

This document describes the JWT (JSON Web Token) authentication system implemented in the Beacon emergency response application.

## 🚀 Features

- **JWT-based Authentication**: Secure token-based authentication using SimpleJWT
- **User Registration & Login**: Complete user management system
- **Token Refresh**: Automatic token refresh mechanism
- **Protected Routes**: Secure API endpoints with authentication requirements
- **Role-based Access**: Support for operators and emergency responders
- **Vibrant UI**: Modern, colorful interface with smooth animations

## 🏗️ Backend Implementation

### Dependencies Added

```bash
djangorestframework-simplejwt==5.3.0
```

### Key Components

#### 1. Custom User Model (`backend/api/models.py`)
- Extended Django's AbstractUser
- Added fields: `phone_number`, `profile_picture`, `is_operator`, `is_emergency_responder`
- Email as primary username field

#### 2. JWT Configuration (`backend/beacon_backend/settings.py`)
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

#### 3. Authentication Views (`backend/api/views.py`)
- `UserRegistrationView`: User registration endpoint
- `UserLoginView`: User login endpoint
- `UserProfileView`: Profile management
- Protected incident management views

#### 4. API Endpoints
```
POST /api/auth/register/     - User registration
POST /api/auth/login/        - User login
GET  /api/auth/profile/      - Get user profile
PUT  /api/auth/profile/      - Update user profile
POST /api/auth/token/        - JWT token obtain
POST /api/auth/token/refresh/ - JWT token refresh
POST /api/auth/token/verify/ - JWT token verification
```

## 🎨 Frontend Implementation

### Key Components

#### 1. Authentication Context (`frontend/src/contexts/AuthContext.js`)
- Global authentication state management
- Automatic token refresh handling
- User session persistence

#### 2. API Utility (`frontend/src/utils/api.js`)
- Axios instance with JWT interceptors
- Automatic token attachment to requests
- Token refresh on 401 responses

#### 3. Enhanced Login Page (`frontend/src/pages/Login.js`)
- Toggle between login and registration forms
- Vibrant gradient backgrounds and animations
- Form validation and error handling
- Demo credentials display

#### 4. Protected Routes (`frontend/src/App.js`)
- Route protection with authentication checks
- Loading states during authentication
- Automatic redirects for unauthenticated users

## 🎨 Vibrant Color Scheme

The application uses a modern, vibrant color palette:

- **Primary Gradient**: `#667eea` to `#764ba2` (Blue to Purple)
- **Success Gradient**: `#10b981` to `#059669` (Green)
- **Warning Gradient**: `#f59e0b` to `#d97706` (Orange)
- **Danger Gradient**: `#ef4444` to `#dc2626` (Red)
- **Info Gradient**: `#f093fb` to `#f5576c` (Pink to Red)

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser and demo user
python create_superuser.py

# Start the server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 3. Test Authentication

```bash
# Run the JWT test script
python test_jwt_auth.py
```

## 🔐 Authentication Flow

### 1. User Registration
```
POST /api/auth/register/
{
    "username": "user123",
    "email": "user@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Response:**
```json
{
    "message": "User registered successfully",
    "user": { ... },
    "tokens": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

### 2. User Login
```
POST /api/auth/login/
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:** Same format as registration

### 3. Using Protected Endpoints
```javascript
// Include token in Authorization header
const headers = {
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
};

// Make authenticated request
fetch('/api/incidents/', { headers })
```

### 4. Token Refresh
```javascript
// Automatic refresh handled by frontend interceptors
// Manual refresh available at:
POST /api/auth/token/refresh/
{
    "refresh": "refresh_token_here"
}
```

## 🛡️ Security Features

- **JWT Tokens**: Secure, stateless authentication
- **Token Expiration**: Access tokens expire in 60 minutes
- **Refresh Tokens**: Long-lived refresh tokens for seamless experience
- **Token Rotation**: New refresh tokens on each refresh
- **HTTPS Ready**: Configured for production security
- **CORS Protection**: Proper CORS configuration for frontend

## 🧪 Testing

### Demo Credentials
- **Admin User**: `admin@beacon.com` / `admin123`
- **Demo User**: `demo@beacon.com` / `demo123`

### Test Endpoints
- **Health Check**: `GET /api/health/` (No auth required)
- **Test Incidents**: `GET /api/test/incidents/` (No auth required)
- **Protected**: All other endpoints require authentication

## 🔧 Configuration

### Environment Variables
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
MYSQL_DB=beacon_db
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_HOST=localhost
MYSQL_PORT=3306
REDIS_HOST=localhost
REDIS_PORT=6379
```

### JWT Settings (Customizable)
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),      # 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),        # 1 day
    'ROTATE_REFRESH_TOKENS': True,                      # New refresh token on refresh
    'BLACKLIST_AFTER_ROTATION': True,                   # Invalidate old refresh tokens
    'UPDATE_LAST_LOGIN': True,                          # Track user activity
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure database is properly set up
2. **Token Expiration**: Check JWT settings and token lifetimes
3. **CORS Issues**: Verify CORS configuration matches frontend URL
4. **Database Connection**: Check MySQL connection settings

### Debug Mode
```python
# In settings.py
DEBUG = True
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
```

## 🔮 Future Enhancements

- **Social Authentication**: Google, Facebook, etc.
- **Two-Factor Authentication**: SMS/Email verification
- **Password Reset**: Email-based password recovery
- **Session Management**: User activity tracking
- **Rate Limiting**: API usage restrictions
- **Audit Logging**: Authentication event logging

## 📚 Resources

- [Django REST Framework](https://www.django-rest-framework.org/)
- [SimpleJWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [React Authentication](https://reactjs.org/docs/context.html)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

---

**Note**: This implementation provides a solid foundation for JWT authentication in the Beacon application. The vibrant color scheme and modern UI create an engaging user experience while maintaining security best practices.
