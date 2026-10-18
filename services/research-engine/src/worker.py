import os

import asgi
from workers import WorkerEntrypoint

ENV_KEYS = (
    "CORS_ORIGINS",
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "JWT_SECRET",
)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        for key in ENV_KEYS:
            value = getattr(self.env, key, None)
            if value is not None:
                os.environ[key] = str(value)
        from app.main import app

        return await asgi.fetch(app, request.js_object, self.env)