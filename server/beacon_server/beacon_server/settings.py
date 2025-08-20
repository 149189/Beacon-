# First, create the Django project and app
# Run these commands in your terminal:

# 1. Install Django (if not already installed)
# pip install django

# 2. Create the project
# django-admin startproject beacon_server

# 3. Navigate to project directory
# cd beacon_server

# 4. Create the auth app
# python manage.py startapp auth

# ===== beacon_server/settings.py =====
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv()  # .env if present

BASE_DIR = Path(__file__).resolve().parent.parent
# Also load config.env in this project directory if present
load_dotenv(dotenv_path=BASE_DIR / 'config.env', override=False)

SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here-change-this-in-production')

DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

# Application definition
INSTALLED_APPS = [
    'daphne',  # Add Daphne at the top for ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',  # Add Django Channels
    'beacon_auth',  # Your custom auth app
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'beacon_server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'beacon_server.wsgi.application'

# ASGI Configuration for WebSockets
ASGI_APPLICATION = 'beacon_server.asgi.application'

# Database Configuration - Prefer SQLite on Windows unless explicitly forcing MySQL and mysqlclient is available
USE_SQLITE = os.getenv('USE_SQLITE', '').lower() in ('1', 'true', 'yes')
FORCE_MYSQL = os.getenv('FORCE_MYSQL', '').lower() in ('1', 'true', 'yes')
MYSQL_HOST = os.getenv('MYSQL_HOST')

# Detect mysqlclient availability
try:
    import MySQLdb  # type: ignore
    MYSQLCLIENT_AVAILABLE = True
except Exception:
    MYSQLCLIENT_AVAILABLE = False

if USE_SQLITE or (not FORCE_MYSQL and (not MYSQL_HOST or not MYSQLCLIENT_AVAILABLE)):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('MYSQL_DB', 'beacon_db'),
            'USER': os.getenv('MYSQL_USER', 'root'),
            'PASSWORD': os.getenv('MYSQL_PASSWORD', ''),
            'HOST': MYSQL_HOST,
            'PORT': os.getenv('MYSQL_PORT', '3306'),
            'OPTIONS': {
                'sql_mode': 'STRICT_TRANS_TABLES',
                'charset': 'utf8mb4',
                'init_command': "SET NAMES 'utf8mb4'",
                'autocommit': True,
            },
            'TEST': {
                'CHARSET': 'utf8mb4',
                'COLLATION': 'utf8mb4_unicode_ci',
            }
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:5178",
    "http://127.0.0.1:5179",
    "http://127.0.0.1:5180",
    
    # ======================== FLUTTER COMPANION APP SUPPORT ========================
    # Flutter web default ports
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    
    # Flutter web development ports
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

# For development, also allow all localhost origins (more permissive)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []  # Clear specific origins when allowing all

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ======================== CHANNELS CONFIGURATION ========================

# Channel Layer Configuration for WebSockets
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')],
        },
    },
}

# Fallback to in-memory channel layer for development if Redis is not available
if DEBUG and not os.getenv('REDIS_URL'):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }

# WebSocket Settings
WEBSOCKET_URL = '/ws/'
WEBSOCKET_ACCEPT_ALL = DEBUG  # Allow all connections in debug mode

# WebSocket Origins (for CORS)
WEBSOCKET_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:5173',
    'ws://localhost:8000',
    'ws://127.0.0.1:8000',
    
    # ======================== FLUTTER COMPANION APP SUPPORT ========================
    # Flutter web WebSocket origins
    'ws://localhost:8080',
    'ws://127.0.0.1:8080',
    'ws://localhost:3001',
    'ws://127.0.0.1:3001',
    'ws://localhost:3002',
    'ws://127.0.0.1:3002',
    'ws://localhost:4000',
    'ws://127.0.0.1:4000',
    'ws://localhost:5000',
    'ws://127.0.0.1:5000',
    
    # Flutter web HTTP origins for WebSocket upgrade
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
]

if DEBUG:
    WEBSOCKET_ALLOWED_ORIGINS.extend([
        'ws://localhost:*',
        'ws://127.0.0.1:*',
        'http://localhost:*',
        'http://127.0.0.1:*',
        
        # Additional Flutter development ports in debug mode
        'ws://localhost:8080',
        'ws://127.0.0.1:8080',
        'ws://localhost:3001',
        'ws://127.0.0.1:3001',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
    ])
