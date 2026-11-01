import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.health import router as health_router
from app.api.routes.research import router as research_router
from app.api.routes.resources import router as resources_router
from app.api.projects import router as projects_router
from app.api.routes.auth import router as auth_router
from app.api.routes.saved_projects import router as saved_projects_router

logger = logging.getLogger("scholargraph")

app = FastAPI(
    title="ScholarGraph Research Engine",
    version="0.1.0",
)


@app.middleware("http")
async def catch_unhandled(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse({"detail": "Internal server error."}, status_code=500)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ],
    allow_origin_regex=r"https://scholargraph-research(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(health_router, prefix="/api/health")
app.include_router(research_router, prefix="/api/research")
app.include_router(resources_router, prefix="/api/resources")
app.include_router(projects_router)
app.include_router(saved_projects_router)


@app.get("/")
def root():
    return {
        "name": "ScholarGraph Research Engine",
        "version": "0.1.0",
    }