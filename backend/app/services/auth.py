import jwt
from fastapi import HTTPException, status
from supabase import Client, create_client

from app.core.config import settings

# Initialize Supabase Client
# NOTE: Service role key is used so backend DB queries bypass RLS.
# User auth is enforced in the API layer via get_current_user.
supabase_client: Client | None = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    supabase_client = create_client(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
    )


def verify_token(token: str) -> dict:
    """
    Verifies a Supabase JWT token.
    First tries decoding locally using JWT secret if configured,
    otherwise falls back to validating with the Supabase Auth server.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    # 1. Attempt local JWT decoding if secret is available
    if settings.SUPABASE_JWT_SECRET:
        try:
            # Supabase tokens are typically HS256 signed using the JWT secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            # Standard Supabase claim holds user ID in "sub"
            user_id = payload.get("sub")
            email = payload.get("email")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token claims: user identity not found",
                )
            return {"user_id": user_id, "email": email, "payload": payload}
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token signature has expired",
            ) from None
        except jwt.InvalidTokenError:
            # Fallback to Supabase API if local decode fails (e.g. key mismatch or token format)
            pass

    # 2. API verification fallback via Supabase client
    if not supabase_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized. Cannot verify authentication.",
        )

    try:
        # get_user verifies the session token against GoTrue directly
        response = supabase_client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token",
            )
        user = response.user
        return {"user_id": str(user.id), "email": user.email, "payload": user.__dict__}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication check failed: {str(e)}",
        ) from e
