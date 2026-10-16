import json
import traceback

from workers import asgi

_app = None
_error = None


def _load():
    global _app, _error
    if _app is not None or _error is not None:
        return
    try:
        from app.main import app as real_app
        _app = real_app
    except BaseException:
        _error = traceback.format_exc()


async def app(scope, receive, send):
    _load()
    if _app is not None:
        await _app(scope, receive, send)
        return
    if scope["type"] != "http":
        return
    body = json.dumps({"error": "import_failed", "traceback": _error}).encode()
    await send({
        "type": "http.response.start",
        "status": 500,
        "headers": [(b"content-type", b"application/json")],
    })
    await send({"type": "http.response.body", "body": body})


Default = asgi.entrypoint(app)