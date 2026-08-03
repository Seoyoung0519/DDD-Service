# Supabase Storage 업로드 + signed url
import os
import uuid
from typing import Optional, Tuple

from fastapi import UploadFile, HTTPException
from supabase import Client
from app.core.config import settings

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}

def _guess_ext(file: UploadFile) -> str:
    # 1) filename extension
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext in ALLOWED_EXT:
            return ext
    # 2) mime fallback
    if file.content_type == "image/jpeg":
        return "jpg"
    if file.content_type == "image/png":
        return "png"
    if file.content_type == "image/webp":
        return "webp"
    return "jpg"

async def upload_proof_image(
    sb: Client,
    user_id: str,
    file: UploadFile,
    reading_session_id: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Returns: (image_path, content_type)
    image_path: storage object path inside bucket
    """
    if not file:
        raise HTTPException(status_code=400, detail="Missing file")
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported content_type: {file.content_type}")

    ext = _guess_ext(file)
    content_type = file.content_type or "image/jpeg"

    # 경로 규칙: user_id/session_id 기반으로 정리 (원하면 변경 가능)
    # e.g. read_proofs/<user_id>/<session_id or 'no_session'>/<uuid>.<ext>
    session_part = reading_session_id or "no_session"
    obj_name = f"{uuid.uuid4().hex}.{ext}"
    path = f"read_proofs/{user_id}/{session_part}/{obj_name}"

    data = await file.read()
    if not data or len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    bucket = settings.PROOF_BUCKET

    # supabase-py 버전에 따라 upload signature가 약간 다를 수 있어서 방어적으로 처리
    storage = sb.storage.from_(bucket)
    try:
        # storage3 기준: upload(path, file, file_options={...})
        storage.upload(
            path,
            data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except TypeError:
        # 어떤 버전은 options 파라미터명이 다를 수 있음
        storage.upload(
            path,
            data,
            {"content-type": content_type, "upsert": "true"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    return path, content_type


def get_proof_access_url(sb: Client, image_path: str) -> str:
    """
    Private bucket 권장: signed url 발급.
    Public bucket이면 get_public_url로 대체 가능.
    """
    bucket = settings.PROOF_BUCKET
    expires = int(settings.PROOF_SIGNED_URL_EXPIRES_SEC)

    storage = sb.storage.from_(bucket)

    # signed url
    try:
        resp = storage.create_signed_url(image_path, expires)
        # resp 구조는 보통 {"signedURL": "..."} 또는 {"signedUrl": "..."} 형태
        if isinstance(resp, dict):
            return resp.get("signedURL")  or resp.get("signedUrl") or resp.get("signed_url") or ""
        # 어떤 버전은 object로 올 수 있음
        return getattr(resp, "signed_url", "") or getattr(resp, "signedURL", "") or ""
    except Exception:
        # fallback: public url (버킷이 public일 때만 의미)
        try:
            pub = storage.get_public_url(image_path)
            if isinstance(pub, str):
                return pub
            if isinstance(pub, dict):
                return pub.get("publicURL") or pub.get("publicUrl") or ""
            return ""
        except Exception:
            return ""
def delete_proof_image(
    sb: Client,
    image_path: str,
):
    """
    Storage에서 인증샷 삭제
    """
    bucket = settings.PROOF_BUCKET

    try:
        sb.storage.from_(bucket).remove([image_path])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Storage delete failed: {e}"
        )