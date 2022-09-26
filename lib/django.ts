export const SETUP_CODE = `
import os
import sys
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from django.conf import settings
from django.core.wsgi import get_wsgi_application
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import path
from django.utils.crypto import get_random_string
from django.utils.functional import empty
from django.urls.resolvers import _get_cached_resolver
_get_cached_resolver.cache_clear()
settings._wrapped = empty
settings.configure(
    DEBUG=True,
    ALLOWED_HOSTS=["*"],  # Disable host header validation
    ROOT_URLCONF=__name__,  # Make this module the urlconf
    SECRET_KEY=get_random_string(
        50
    ),  # We aren't using any security features but Django requires this setting
    MIDDLEWARE=["django.middleware.common.CommonMiddleware"],
  EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend',
  INSTALLED_APPS=["abc"],
  DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': '/data/data.sqlite3',
    }
  },
  TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            # ... some options here ...
        },
    },
  ]
)
browser_url = None
`;

// @ts-ignore
import code from "./post.py";

export const POST_CODE = code;
