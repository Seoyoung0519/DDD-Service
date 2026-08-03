from fastapi import Depends, HTTPException, Header
from supabase import Client
from typing import Optional
import httpx
import jwt as pyjwt

from app.db.supabase_client import get_supabase_client, get_supabase_admin_client
from app.core.config import settings

def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return parts[1]

def _try_supabase(token: str) -> Optional[dict]:
    try:
        supabase = get_supabase_client()
        user_resp = supabase.auth.get_user(token)
        user = user_resp.user
        if user:
            return {
                "user_id": user.id,
                "email": user.email,
                "access_token": token,
                "token_source": "supabase",
            }
    except Exception:
        pass
    return None

def _try_login_server_jwt(token: str) -> Optional[dict]:
    print("AUTH DEBUG - token prefix:", token[:20] if token else None)
    print("AUTH DEBUG - has secret:", bool(settings.LOGIN_SERVER_JWT_SECRET))
    print("AUTH DEBUG - me url:", settings.LOGIN_SERVER_ME_URL)

    if settings.LOGIN_SERVER_JWT_SECRET:
        try:
            payload = pyjwt.decode(
                token,
                settings.LOGIN_SERVER_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            print("AUTH DEBUG - decoded payload:", payload)
            user_id = (
                payload.get("sub")
                or payload.get("user_id")
                or payload.get("userId")
                or payload.get("id")
            )
            email = (
                payload.get("email")
                or payload.get("user_email")
                or ""
            )
            print("AUTH DEBUG - parsed user_id:", user_id)

            if user_id:
                return {
                    "user_id": str(user_id),
                    "email": email,
                    "access_token": token,
                    "token_source": "login_server",
                }
        except Exception as e:
            print("AUTH DEBUG - jwt decode failed:", str(e))

    if settings.LOGIN_SERVER_ME_URL:
        try:
            resp = httpx.get(
                settings.LOGIN_SERVER_ME_URL,
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0,
            )
            print("AUTH DEBUG - /me status:", resp.status_code)
            print("AUTH DEBUG - /me body:", resp.text)

            if resp.status_code == 200:
                data = resp.json()
                user_id = (
                    data.get("user_id")
                    or data.get("userId")
                    or data.get("id")
                    or data.get("sub")
                    or (data.get("user", {}) or {}).get("id")
                )
                email = (
                    data.get("email")
                    or (data.get("user", {}) or {}).get("email")
                    or ""
                )
                print("AUTH DEBUG - /me parsed user_id:", user_id)

                if user_id:
                    return {
                        "user_id": str(user_id),
                        "email": email,
                        "access_token": token,
                        "token_source": "login_server",
                    }
        except Exception as e:
            print("AUTH DEBUG - /me failed:", str(e))

    return None

async def get_auth_context(
    authorization: Optional[str] = Header(default=None),
) -> dict:
    token = _extract_bearer(authorization)

    ctx = _try_supabase(token)
    if ctx:
        return ctx

    ctx = _try_login_server_jwt(token)
    if ctx:
        return ctx

    raise HTTPException(status_code=401, detail="Invalid token")

def get_db_client(auth_ctx: dict = Depends(get_auth_context)) -> Client:
    print("TOKEN SOURCE =", auth_ctx["token_source"])

    if auth_ctx["token_source"] == "supabase":
        print("DB CLIENT = user token")
        supabase = get_supabase_client()
        supabase.postgrest.auth(auth_ctx["access_token"])
        return supabase

    print("DB CLIENT = service role")
    return get_supabase_admin_client()