import io
import json
from typing import Optional

print("defining request")


def request(
    url: str,
    method: str = "GET",
    form_data: Optional[str] = None,
    headers: Optional[dict] = None,
    query_string: Optional[str] = None,
    cookie_string: Optional[str] = None,
):
    env = {
        "SERVER_NAME": "1.0.0.127.in-addr.arpa",
        "GATEWAY_INTERFACE": "CGI/1.1",
        "SERVER_PORT": "8000",
        "REMOTE_HOST": "",
        "CONTENT_LENGTH": "",
        "SCRIPT_NAME": "",
        "SERVER_PROTOCOL": "HTTP/1.1",
        "SERVER_SOFTWARE": "WSGIServer/0.2",
        "REQUEST_METHOD": method,
        "PATH_INFO": url,
        "QUERY_STRING": query_string or "",
        "REMOTE_ADDR": "127.0.0.1",
        "CONTENT_TYPE": "text/plain",
        "HTTP_HOST": "127.0.0.1:8000",
        "HTTP_CONNECTION": "keep-alive",
        "HTTP_SEC_CH_UA": '"Chromium";v="105", "Not)A;Brand";v="8"',
        "HTTP_SEC_CH_UA_MOBILE": "?0",
        "HTTP_SEC_CH_UA_PLATFORM": '"macOS"',
        "HTTP_DNT": "1",
        "HTTP_UPGRADE_INSECURE_REQUESTS": "1",
        "HTTP_USER_AGENT": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        "HTTP_ACCEPT": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "HTTP_SEC_FETCH_SITE": "none",
        "HTTP_SEC_FETCH_MODE": "navigate",
        "HTTP_SEC_FETCH_USER": "?1",
        "HTTP_SEC_FETCH_DEST": "document",
        "HTTP_ACCEPT_ENCODING": "gzip, deflate, br",
        "HTTP_ACCEPT_LANGUAGE": "en-US,en;q=0.9",
        "HTTP_COOKIE": cookie_string or "",
        "wsgi.version": (1, 0),
        "wsgi.run_once": False,
        "wsgi.url_scheme": "http",
        "wsgi.multithread": True,
        "wsgi.multiprocess": False,
        # 'wsgi.errors': <_io.TextIOWrapper name='<stderr>' mode='w' encoding='utf-8'>,
        # 'wsgi.file_wrapper': <class 'wsgiref.util.FileWrapper'>
    }

    if form_data is not None:
        env["CONTENT_LENGTH"] = str(len(form_data))
        env["CONTENT_TYPE"] = "application/x-www-form-urlencoded"
        env["wsgi.input"] = io.BytesIO(form_data.encode("utf-8"))
    else:
        env["wsgi.input"] = ""

    def start_response(status, headers):
        print(status, headers)

    app = get_wsgi_application()
    response = app(env, start_response=start_response)

    return json.dumps({
        "content": response.content.decode(response.charset),
        "statusCode": response.status_code,
        "headers": dict(response.headers),
    })
