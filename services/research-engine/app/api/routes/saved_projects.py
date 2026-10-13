from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Project
from app.schemas.auth import UserResponse
from app.services.auth_service import get_session_user

router = APIRouter(prefix="/api/saved-projects", tags=["saved-projects"])

DbSession = Annotated[Session, Depends(get_db)]
COOKIE_NAME = "sg_session"


class SaveProjectRequest(BaseModel):
    github_url: HttpUrl
    research_question: str
    result: dict


def current_user(request: Request, db: Session) -> UserResponse:
    user = get_session_user(db, request.cookies.get(COOKIE_NAME))
    if user is None:
        raise HTTPException(status_code=401, detail="Please sign in.")
    return user


def project_payload(project: Project) -> dict:
    return {
        "id": str(project.id),
        "github_url": project.github_url,
        "repository_name": project.repository_name,
        "research_question": project.research_question,
        "result": project.result,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("")
def list_projects(request: Request, db: DbSession):
    user = current_user(request, db)

    projects = db.scalars(
        select(Project)
        .where(Project.user_id == UUID(user.id))
        .order_by(Project.updated_at.desc())
    ).all()

    return [project_payload(project) for project in projects]


@router.post("")
def save_project(
    body: SaveProjectRequest,
    request: Request,
    db: DbSession,
):
    user = current_user(request, db)

    result_repository = body.result.get("repository", {})
    full_name = result_repository.get("full_name")

    if not full_name:
        raise HTTPException(
            status_code=422,
            detail="The advisor response is missing repository details.",
        )

    project = Project(
        user_id=UUID(user.id),
        github_url=str(body.github_url),
        repository_name=full_name,
        research_question=body.research_question.strip(),
        result=body.result,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project_payload(project)


@router.get("/{project_id}")
def get_project(
    project_id: str,
    request: Request,
    db: DbSession,
):
    user = current_user(request, db)

    try:
        parsed_id = UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID.")

    project = db.scalar(
        select(Project).where(
            Project.id == parsed_id,
            Project.user_id == UUID(user.id),
        )
    )

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    return project_payload(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    request: Request,
    db: DbSession,
):
    user = current_user(request, db)

    try:
        parsed_id = UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID.")

    project = db.scalar(
        select(Project).where(
            Project.id == parsed_id,
            Project.user_id == UUID(user.id),
        )
    )

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    db.delete(project)
    db.commit()