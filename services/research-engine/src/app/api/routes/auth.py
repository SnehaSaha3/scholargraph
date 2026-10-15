
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    get_session_user,
    google_login,
    login_user,
    register_user,
    revoke_session,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]

COOKIE_NAME = "sg_session"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def set_session_cookie(response: Response, token: str) -> None:
    is_production = os.getenv("APP_ENV", "development").lower() == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    is_production = os.getenv("APP_ENV", "development").lower() == "production"
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=is_production,
        samesite="lax",
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    payload: RegisterRequest,
    response: Response,
    db: DbSession,
) -> UserResponse:
    user, token = register_user(db, payload)
    set_session_cookie(response, token)
    return user


@router.post("/login", response_model=UserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: DbSession,
) -> UserResponse:
    user, token = login_user(db, str(payload.email), payload.password)
    set_session_cookie(response, token)
    return user


@router.post("/google", response_model=UserResponse)
def login_with_google(
    payload: GoogleLoginRequest,
    response: Response,
    db: DbSession,
) -> UserResponse:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured.",
        )

    user, token = google_login(db, payload.credential, client_id)
    set_session_cookie(response, token)
    return user


@router.get("/me", response_model=UserResponse)
def me(
    request: Request,
    db: DbSession,
) -> UserResponse:
    return get_session_user(db, request.cookies.get(COOKIE_NAME))


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: DbSession,
) -> Response:
    revoke_session(db, request.cookies.get(COOKIE_NAME))
    clear_session_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
