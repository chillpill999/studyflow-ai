from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth import verify_token

security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
) -> dict:
    """
    FastAPI dependency injection to validate and extract the active user context.
    Usage: user = Depends(get_current_user)
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Supabase uses standard "Bearer <token>" format
    token = credentials.credentials
    user_context = verify_token(token)
    user_context["id"] = user_context["user_id"]
    return user_context
