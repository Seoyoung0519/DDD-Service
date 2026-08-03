import uuid
from supabase import Client
from app.core.config import settings

def upload_keyring_image(sb: Client, user_id: str, book_id: str, image_bytes: bytes, content_type: str) -> str:
    bucket = settings.KEYRING_BUCKET
    obj = f"keyrings/{user_id}/{book_id}/{uuid.uuid4().hex}.png"
    storage = sb.storage.from_(bucket)

    # 버전 차이 방어
    try:
        storage.upload(obj, image_bytes, file_options={"content-type": content_type, "upsert": True})
    except TypeError:
        storage.upload(obj, image_bytes, {"content-type": content_type, "upsert": True})

    return obj

def signed_keyring_url(sb: Client, image_path: str) -> str:
    bucket = settings.KEYRING_BUCKET
    storage = sb.storage.from_(bucket)
    expires = int(settings.SIGNED_URL_EXPIRES_SEC)

    resp = storage.create_signed_url(image_path, expires)
    if isinstance(resp, dict):
        return resp.get("signedURL") or resp.get("signedUrl") or resp.get("signed_url") or ""
    return getattr(resp, "signed_url", "") or getattr(resp, "signedURL", "") or ""
