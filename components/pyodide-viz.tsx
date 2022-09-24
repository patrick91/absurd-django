let renderDiagram = async (code: string, url: string) => "";

const PRE_CODE = `
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

const POST_CODE = `
env = {
  'SERVER_NAME': '1.0.0.127.in-addr.arpa',
  'GATEWAY_INTERFACE': 'CGI/1.1',
  'SERVER_PORT': '8000',
  'REMOTE_HOST': '',
  'CONTENT_LENGTH': '',
  'SCRIPT_NAME': '',
  'SERVER_PROTOCOL': 'HTTP/1.1',
  'SERVER_SOFTWARE': 'WSGIServer/0.2',
  'REQUEST_METHOD': 'GET',
  'PATH_INFO': browser_url or '/',
  'QUERY_STRING': '',
  'REMOTE_ADDR': '127.0.0.1',
  'CONTENT_TYPE': 'text/plain',
  'HTTP_HOST': '127.0.0.1:8000',
  'HTTP_CONNECTION': 'keep-alive',
  'HTTP_SEC_CH_UA': '"Chromium";v="105", "Not)A;Brand";v="8"',
  'HTTP_SEC_CH_UA_MOBILE': '?0',
  'HTTP_SEC_CH_UA_PLATFORM': '"macOS"',
  'HTTP_DNT': '1',
  'HTTP_UPGRADE_INSECURE_REQUESTS': '1',
  'HTTP_USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
  'HTTP_ACCEPT': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'HTTP_SEC_FETCH_SITE': 'none',
  'HTTP_SEC_FETCH_MODE': 'navigate',
  'HTTP_SEC_FETCH_USER': '?1',
  'HTTP_SEC_FETCH_DEST': 'document',
  'HTTP_ACCEPT_ENCODING': 'gzip, deflate, br',
  'HTTP_ACCEPT_LANGUAGE': 'en-US,en;q=0.9',
  'HTTP_COOKIE': 'csrftoken=XHTj8KICgryBH1R3LSxgGOcfYe6sTejF; sessionid=roqybhvgfq334yclqtidqcsbf7tttmzu',
  # 'wsgi.input': <django.core.handlers.wsgi.LimitedStream object at 0x10497cf70>,
  # 'wsgi.errors': <_io.TextIOWrapper name='<stderr>' mode='w' encoding='utf-8'>,
  'wsgi.version': (1, 0),
  'wsgi.run_once': False,
  'wsgi.url_scheme': 'http',
  'wsgi.multithread': True,
  'wsgi.multiprocess': False,
  # 'wsgi.file_wrapper': <class 'wsgiref.util.FileWrapper'>
}

env["wsgi.input"] = ""

def start_response(status, headers):
  print(status, headers)


app = get_wsgi_application()

response = app(env, start_response=start_response)

response.content.decode(response.charset)
`;

export const useRender = ({
  onLoad,
  onLoadStart,
}: {
  onLoadStart: () => void;
  onLoad: () => Promise<void>;
}) => {
  // there's probably a better way for doing this, but I'll investigate later
  // @ts-ignore
  if (typeof window !== "undefined" && !window.pyodide) {
    onLoadStart();

    // @ts-ignore
    window.pyodide = true;

    const pyodideWorker = new Worker("/js/pyodide.worker.js");

    const callbacks: any = {};

    pyodideWorker.onmessage = (event) => {
      if (event.data.ready) {
        onLoad();

        return;
      }

      const { id, ...data } = event.data;
      const onSuccess = callbacks[id];
      delete callbacks[id];
      onSuccess(data);
    };

    const asyncRun = (() => {
      let id = 0; // identify a Promise
      return (pythonCode: string) => {
        // the id could be generated more carefully
        id = (id + 1) % Number.MAX_SAFE_INTEGER;
        return new Promise((onSuccess) => {
          callbacks[id] = onSuccess;
          pyodideWorker.postMessage({
            python: PRE_CODE + pythonCode + "\n" + POST_CODE,
            id,
          });
        });
      };
    })();

    renderDiagram = async (code: string, url: string) => {
      code += "\n" + `browser_url = "${url}".replace("http://localhost:3000", "")`;

      try {
        // @ts-ignore
        const { results, error } = await asyncRun(code);

        if (results) {
          return results;
        } else if (error) {
          console.error("pyodideWorker error: ", error);
        }
      } catch (e) {
        console.log(
          // @ts-ignore
          `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
        );
      }
    };
  }

  return {
    renderDiagram,
  };
};
