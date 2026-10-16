import traceback

from fastapi import FastAPI
from workers import asgi

try:
    from app.main import app
except Exception:
    err = traceback.format_exc()
    app = FastAPI()

    @app.get("/")
    async def root():
        return {"status": "import_failed"}

    @app.get("/debug")
    async def debug():
        return {"error": err}

Default = asgi.entrypoint(app)