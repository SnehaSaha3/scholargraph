
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_database_url
from app.core.security import (
    create_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.db.models import AuthIdentity, User, UserSession
from app.schemas.auth import RegisterRequest, UserResponse

SESSION_TTL_DAYS = 7


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _public_user(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        email_verified=user.email_verified,
    )


def _create_session(db: Session, user: User) -> str:
    token = create_session_token()
    session = UserSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS),
    )
    db.add(session)
    return token


def register_user(db: Session, payload: RegisterRequest) -> tuple[UserResponse, str]:
    email = _normalize_email(str(payload.email))

    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        display_name=payload.display_name,
        password_hash=hash_password(payload.password),
        email_verified=False,
    )
    db.add(user)

    try:
        db.flush()
        token = _create_session(db, user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return _public_user(user), token


def login_user(db: Session, email: str, password: str) -> tuple[UserResponse, str]:
    normalized_email = _normalize_email(email)
    user = db.scalar(select(User).where(User.email == normalized_email))

    if (
        user is None
        or user.password_hash is None
        or not verify_password(password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = _create_session(db, user)
    db.commit()
    return _public_user(user), token


def google_login(
    db: Session,
    credential: str,
    google_client_id: str,
) -> tuple[UserResponse, str]:
    try:
        claims = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential.",
        )

    subject = claims.get("sub")
    email = claims.get("email")
    email_verified = claims.get("email_verified") is True

    if not subject or not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email must be verified.",
        )

    email = _normalize_email(email)
    identity = db.scalar(
        select(AuthIdentity).where(
            AuthIdentity.provider == "google",
            AuthIdentity.provider_subject == subject,
        )
    )

    if identity:
        user = db.get(User, identity.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google identity is not linked to an active account.",
            )
    else:
        existing_user = db.scalar(select(User).where(User.email == email))
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email already has an account. Sign in with that account before linking Google.",
            )

        user = User(
            email=email,
            display_name=(claims.get("name") or email.split("@")[0])[:120],
            avatar_url=claims.get("picture"),
            password_hash=None,
            email_verified=True,
        )
        db.add(user)
        db.flush()

        db.add(
            AuthIdentity(
                user_id=user.id,
                provider="google",
                provider_subject=subject,
            )
        )

    token = _create_session(db, user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The Google account could not be linked. Please retry.",
        )

    return _public_user(user), token


def get_session_user(db: Session, token: str | None) -> UserResponse:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    token_hash = hash_session_token(token)
    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired.",
        )

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found.",
        )

    return _public_user(user)


def revoke_session(db: Session, token: str | None) -> None:
    if not token:
        return

    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == hash_session_token(token),
            UserSession.revoked_at.is_(None),
        )
    )

    if session:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()