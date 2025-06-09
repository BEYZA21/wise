import os
import base64
import json
from google.oauth2 import service_account
import os
from dotenv import load_dotenv

load_dotenv()

# Temel dizin
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

try:
    base64_creds = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    print("✅ CREDS RAW EXISTS:", bool(base64_creds))
    creds_json = json.loads(base64.b64decode(base64_creds).decode('utf-8'))
    GS_CREDENTIALS = service_account.Credentials.from_service_account_info(creds_json)
except Exception as e:
    print("🚨 GCS Auth Error:", e)
    raise

# Django anahtarları ve güvenlik ayarları
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = ["*"]


# HTTPS/SSL proxy için ayarlar (Render prod ortamı için zorunlu)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Statik dosyalar
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Uygulamalar
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'users',
]

# Middleware
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


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173", 
    "https://wise-byn.onrender.com"
]


CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type", "dnt",
    "origin", "user-agent", "x-csrftoken", "x-requested-with",
]
CORS_ALLOW_METHODS = [
    "DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT",
]


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend']

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'config.wsgi.application'

# Dosya boyutları
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB

# Veritabanı (gelişmiş için PostgreSQL önerilir)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
