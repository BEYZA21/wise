import os
from google.oauth2 import service_account

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SERVICE_ACCOUNT_PATH = os.environ.get(
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    os.path.join(BASE_DIR, "wise-453820-9eb472780e68.json")
)
GS_CREDENTIALS = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH)

print("JSON PATH:", SERVICE_ACCOUNT_PATH)
print("EXISTS?", os.path.exists(SERVICE_ACCOUNT_PATH))

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

SECRET_KEY = 'django-insecure-0$^ldpx&a0kfrm8$747n&qfnhbkykybd4!9r72%jp)d!r*2x-6'
DEBUG = True
ALLOWED_HOSTS = []

GS_BUCKET_NAME = 'wise-uploads'
ALLOWED_HOSTS = [
    'wise-pr89.onrender.com',  # Render domainin
    'localhost',
    '127.0.0.1',
    # Gerekirse diğer domainler
]

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

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend']

CORS_ALLOW_ALL_ORIGINS = True  # React ile sorunsuz çalışması için

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

DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# İlk deployda CORS_ALLOW_ALL_ORIGINS = True yeterli. Gerekirse sonra aşağıdaki satırı açabilirsin.
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
# ]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
