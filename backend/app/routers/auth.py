from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.security import get_current_user
from app.services.auth import supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    """
    Registers a new user with Supabase Auth using email and password.
    """
    if not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth service is unavailable",
        )
    try:
        signup_options = {}
        if user_data.full_name:
            signup_options = {"data": {"full_name": user_data.full_name}}

        response = supabase_client.auth.sign_up(
            {
                "email": user_data.email,
                "password": user_data.password,
                "options": signup_options,
            }
        )

        # In Supabase, if email confirmation is required, session might be null initially
        return {
            "message": "User registered successfully. Check email for confirmation if required.",
            "user": {
                "id": str(response.user.id) if response.user else None,
                "email": response.user.email if response.user else user_data.email,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login")
def login(user_data: UserLogin):
    """
    Logs in an existing user with email and password, returning tokens.
    """
    if not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth service is unavailable",
        )
    try:
        response = supabase_client.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )
        if not response or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed. Session not created.",
            )
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "expires_in": response.session.expires_in,
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
                "full_name": (
                    response.user.user_metadata.get("full_name")
                    if response.user.user_metadata
                    else None
                ),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
def logout(user=Depends(get_current_user)):
    """
    Logs out the current authenticated user, destroying their session.
    """
    if not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth service is unavailable",
        )
    try:
        supabase_client.auth.sign_out()
        return {"detail": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Logout failed: {str(e)}"
        )


@router.get("/session")
def get_session(user=Depends(get_current_user)):
    """
    Validates the active authentication session and returns user metadata.
    """
    return {"authenticated": True, "user_id": user["user_id"], "email": user["email"]}


@router.get("/google")
def get_google_oauth_url(
    redirect_to: Optional[str] = "http://localhost:3000/auth/callback",
):
    """
    Generates a Google OAuth authorization URL redirect link.
    """
    if not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth service is unavailable",
        )
    try:
        response = supabase_client.auth.sign_in_with_oauth(
            {"provider": "google", "options": {"redirect_to": redirect_to}}
        )
        return {"url": response.url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth initialization failed: {str(e)}",
        )
