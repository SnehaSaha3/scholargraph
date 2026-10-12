
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import ResearchConversation, ResearchMessage
from app.schemas.research import (
    ResearchDiscussionRequest,
    ResearchDiscussionResponse,
    ResearchExploration,
    ResearchPlan,
    ResearchRequest,
)
from app.schemas.auth import UserResponse
from app.services.auth_service import get_session_user
from app.services.research_service import (
    explore_research,
    discuss_research,
    create_research_plan,
)

router = APIRouter()

DbSession = Annotated[Session, Depends(get_db)]
COOKIE_NAME = "sg_session"


def _get_current_user(request: Request, db: Session) -> UserResponse:
    return get_session_user(db, request.cookies.get(COOKIE_NAME))


def _get_or_create_conversation(
    db: Session,
    user_id: UUID,
    conversation_id: str | None,
    question: str,
) -> ResearchConversation:
    if conversation_id:
        try:
            parsed_id = UUID(conversation_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation ID.",
            )

        conversation = db.scalar(
            select(ResearchConversation).where(
                ResearchConversation.id == parsed_id,
                ResearchConversation.user_id == user_id,
            )
        )

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

        conversation.updated_at = datetime.now(timezone.utc)
        return conversation

    conversation = ResearchConversation(
        user_id=user_id,
        title=question.strip()[:255] or "New research",
    )
    db.add(conversation)
    db.flush()
    return conversation


def _save_interaction(
    db: Session,
    conversation: ResearchConversation,
    kind: str,
    prompt: str,
    result: dict,
    assistant_content: str,
) -> None:
    db.add_all(
        [
            ResearchMessage(
                conversation_id=conversation.id,
                role="user",
                kind=kind,
                content=prompt,
            ),
            ResearchMessage(
                conversation_id=conversation.id,
                role="assistant",
                kind=kind,
                content=assistant_content,
                payload=result,
            ),
        ]
    )


@router.post("/explore", response_model=ResearchExploration)
def explore(
    request: ResearchRequest,
    http_request: Request,
    db: DbSession,
) -> ResearchExploration:
    user = _get_current_user(http_request, db)
    result = explore_research(request)

    try:
        conversation = _get_or_create_conversation(
            db, UUID(user.id), request.conversation_id, request.question
        )
        data = result.model_dump(mode="json")
        data["conversation_id"] = str(conversation.id)

        _save_interaction(
            db,
            conversation,
            "explore",
            request.question,
            data,
            result.understanding,
        )
        db.commit()
        return result.model_copy(update={"conversation_id": str(conversation.id)})
    except Exception:
        db.rollback()
        raise


@router.post("/discuss", response_model=ResearchDiscussionResponse)
def discuss(
    request: ResearchDiscussionRequest,
    http_request: Request,
    db: DbSession,
) -> ResearchDiscussionResponse:
    user = _get_current_user(http_request, db)
    result = discuss_research(request)

    try:
        conversation = _get_or_create_conversation(
            db, UUID(user.id), request.conversation_id, request.question
        )
        data = result.model_dump(mode="json")
        data["conversation_id"] = str(conversation.id)

        _save_interaction(
            db,
            conversation,
            "discuss",
            request.prompt,
            data,
            result.answer,
        )
        db.commit()
        return result.model_copy(update={"conversation_id": str(conversation.id)})
    except Exception:
        db.rollback()
        raise


@router.post("/plan", response_model=ResearchPlan)
def generate_research_plan(
    request: ResearchRequest,
    http_request: Request,
    db: DbSession,
) -> ResearchPlan:
    user = _get_current_user(http_request, db)
    result = create_research_plan(request)

    try:
        conversation = _get_or_create_conversation(
            db, UUID(user.id), request.conversation_id, request.question
        )
        data = result.model_dump(mode="json")
        data["conversation_id"] = str(conversation.id)

        _save_interaction(
            db,
            conversation,
            "plan",
            request.question,
            data,
            result.understanding,
        )
        db.commit()
        return result.model_copy(update={"conversation_id": str(conversation.id)})
    except Exception:
        db.rollback()
        raise
