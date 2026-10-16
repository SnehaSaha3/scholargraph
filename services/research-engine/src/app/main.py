from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.research import router as research_router
from app.api.routes.resources import router as resources_router
from app.api.projects import router as projects_router
from app.api.routes.auth import router as auth_router
from app.api.routes.saved_projects import router as saved_projects_router

app = FastAPI(
    title="ScholarGraph Research Engine",
    version="0.1.0",
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://scholargraph-research.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(
    health_router,
    prefix="/api/health",
)

app.include_router(
    research_router,
    prefix="/api/research",
)

app.include_router(
    resources_router,
    prefix="/api/resources",
)

app.include_router(projects_router)

app.include_router(saved_projects_router)

@app.get("/")
def root():
    return {
        "name": "ScholarGraph Research Engine",
        "version": "0.1.0",
    }