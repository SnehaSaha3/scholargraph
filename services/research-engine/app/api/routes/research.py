
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


from sqlalchemy import func
from app.schemas.research import (
    ResearchConversationDetail,
    ResearchConversationSummary,
    ResearchMessageResponse,
    RenameResearchConversationRequest,
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


def _owned_conversation(
    db: Session,
    user_id: UUID,
    conversation_id: str,
) -> ResearchConversation:
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

    return conversation


@router.get("/history", response_model=list[ResearchConversationSummary])
def list_research_history(
    http_request: Request,
    db: DbSession,
    search: str | None = None,
) -> list[ResearchConversationSummary]:
    user = _get_current_user(http_request, db)

    statement = select(
        ResearchConversation,
        func.count(ResearchMessage.id).label("message_count"),
    ).outerjoin(
        ResearchMessage,
        ResearchMessage.conversation_id == ResearchConversation.id,
    ).where(
        ResearchConversation.user_id == UUID(user.id)
    ).group_by(
        ResearchConversation.id
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            ResearchConversation.title.ilike(term)
        )

    rows = db.execute(
        statement.order_by(ResearchConversation.updated_at.desc())
    ).all()

    return [
        ResearchConversationSummary(
            id=str(conversation.id),
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=count,
        )
        for conversation, count in rows
    ]


@router.get(
    "/history/{conversation_id}",
    response_model=ResearchConversationDetail,
)
def get_research_conversation(
    conversation_id: str,
    http_request: Request,
    db: DbSession,
) -> ResearchConversationDetail:
    user = _get_current_user(http_request, db)
    conversation = _owned_conversation(
        db, UUID(user.id), conversation_id
    )

    return ResearchConversationDetail(
        id=str(conversation.id),
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(conversation.messages),
        messages=[
            ResearchMessageResponse(
                id=str(message.id),
                role=message.role,
                kind=message.kind,
                content=message.content,
                payload=message.payload,
                created_at=message.created_at,
            )
            for message in conversation.messages
        ],
    )


@router.patch(
    "/history/{conversation_id}",
    response_model=ResearchConversationSummary,
)
def rename_research_conversation(
    conversation_id: str,
    request: RenameResearchConversationRequest,
    http_request: Request,
    db: DbSession,
) -> ResearchConversationSummary:
    user = _get_current_user(http_request, db)
    conversation = _owned_conversation(
        db, UUID(user.id), conversation_id
    )

    title = request.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title cannot be empty.",
        )

    conversation.title = title
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)

    return ResearchConversationSummary(
        id=str(conversation.id),
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(conversation.messages),
    )


@router.delete("/history/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_research_conversation(
    conversation_id: str,
    http_request: Request,
    db: Session = Depends(get_db),
) -> None:
    user = _get_current_user(http_request, db)
    conversation = _owned_conversation(
        db, UUID(user.id), conversation_id
    )

    db.delete(conversation)
    db.commit()
