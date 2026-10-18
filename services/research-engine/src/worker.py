import os
import traceback

import asgi
from workers import Response, WorkerEntrypoint

ENV_KEYS = (
    "CORS_ORIGINS",
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "JWT_SECRET",
)

ALLOWED_ORIGIN_SUFFIX = ".vercel.app"


def debug_response(request, status, body):
    origin = request.headers.get("Origin") or ""
    headers = {"Content-Type": "text/plain"}
    if origin.endswith(ALLOWED_ORIGIN_SUFFIX) or origin.startswith("http://localhost"):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return Response(body, status=status, headers=headers)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        for key in ENV_KEYS:
            value = getattr(self.env, key, None)
            if value is not None:
                os.environ[key] = str(value)
        try:
            from app.main import app
        except Exception:
            return debug_response(request, 500, "IMPORT ERROR\n" + traceback.format_exc())
        try:
            return await asgi.fetch(app, request.js_object, self.env)
        except Exception:
            return debug_response(request, 500, "RUNTIME ERROR\n" + traceback.format_exc())