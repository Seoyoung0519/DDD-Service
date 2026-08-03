from datetime import datetime, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    Response,
)
from supabase import Client

from app.deps.auth import get_auth_context, get_db_client
from app.services.storage import (
    upload_proof_image,
    get_proof_access_url,
    delete_proof_image,
)
from app.schemas.proofs import ProofOut, ProofListOut

router = APIRouter(prefix="/proofs", tags=["proofs"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _to_bool(v: Optional[str], default: bool = False) -> bool:
    if v is None:
        return default
    return str(v).lower() in (
        "1",
        "true",
        "t",
        "yes",
        "y",
        "on",
    )


@router.post("/upload", response_model=ProofOut)
async def upload_proof(
    bookId: Optional[str] = Form(default=None),
    readingSessionId: Optional[str] = Form(default=None),
    pageNumber: Optional[int] = Form(default=None),
    capturedAt: Optional[str] = Form(default=None),
    isPublic: Optional[str] = Form(default=None),

    file: UploadFile = File(...),

    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    try:
        print("UPLOAD START")

        user_id = auth_ctx["user_id"]
        print("USER =", user_id)

        # reading session 확인
        if readingSessionId:
            print("CHECK SESSION =", readingSessionId)

            sess = (
                sb.table("reading_sessions")
                .select("id,user_id,book_id")
                .eq("id", readingSessionId)
                .limit(1)
                .execute()
                .data
            )

            print("SESSION RESULT =", sess)

            if not sess:
                raise HTTPException(
                    status_code=404,
                    detail="readingSessionId not found",
                )

            if sess[0]["user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden session",
                )

            if not bookId:
                bookId = sess[0].get("book_id")

        # Storage 업로드
        image_path, _ = await upload_proof_image(
            sb=sb,
            user_id=user_id,
            file=file,
            reading_session_id=readingSessionId,
        )

        print("IMAGE =", image_path)

        public_flag = _to_bool(isPublic)

        payload = {
            "user_id": user_id,
            "book_id": bookId,
            "reading_session_id": readingSessionId,
            "image_path": image_path,
            "page_number": pageNumber,
            "captured_at": capturedAt or now_iso(),
            "is_public": public_flag,
        }

        print("PAYLOAD =", payload)

        inserted = (
            sb.table("read_proofs")
            .insert(payload)
            .execute()
            .data
        )

        print("INSERT OK")

        row = inserted[0]

        image_url = get_proof_access_url(
            sb,
            image_path,
        )

        return ProofOut(
            id=row["id"],
            userId=row["user_id"],
            bookId=row.get("book_id"),
            readingSessionId=row.get("reading_session_id"),
            imagePath=row["image_path"],
            imageUrl=image_url or None,
            pageNumber=row.get("page_number"),
            capturedAt=row.get("captured_at"),
            isPublic=bool(row.get("is_public")),
            createdAt=row.get("created_at"),
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        print("UPLOAD ERROR =", repr(e))
        raise


@router.get("", response_model=ProofListOut)
def list_my_proofs(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),

    limit: int = Query(default=20, ge=1, le=50),
    before: Optional[str] = Query(
        default=None,
        description="pagination cursor (created_at ISO)",
    ),
    bookId: Optional[str] = Query(default=None),
):
    user_id = auth_ctx["user_id"]

    q = (
        sb.table("read_proofs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    if before:
        q = q.lt("created_at", before)

    if bookId:
        q = q.eq("book_id", bookId)

    rows = q.execute().data or []

    items = []

    for r in rows:
        image_url = get_proof_access_url(
            sb,
            r["image_path"],
        )

        items.append(
            ProofOut(
                id=r["id"],
                userId=r["user_id"],
                bookId=r.get("book_id"),
                readingSessionId=r.get("reading_session_id"),
                imagePath=r["image_path"],
                imageUrl=image_url or None,
                pageNumber=r.get("page_number"),
                capturedAt=r.get("captured_at"),
                isPublic=bool(r.get("is_public")),
                createdAt=r.get("created_at"),
            )
        )

    return ProofListOut(items=items)

@router.delete("/{proof_id}", status_code=204)
def delete_proof(
    proof_id: str,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    내 독서 인증샷 삭제

    처리 순서
    1. 인증샷 존재 여부 확인
    2. 본인 소유인지 확인
    3. Storage 이미지 삭제
    4. DB row 삭제
    """

    user_id = auth_ctx["user_id"]

    # 인증샷 조회
    result = (
        sb.table("read_proofs")
        .select("*")
        .eq("id", proof_id)
        .limit(1)
        .execute()
        .data
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Proof not found",
        )

    proof = result[0]

    # 본인 사진인지 확인
    if proof["user_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden",
        )

    # Storage 삭제
    image_path = proof.get("image_path")

    try:
        if image_path:
            delete_proof_image(sb, image_path)
    except Exception as e:
        print("Storage delete failed:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete proof image",

        )

    # DB 삭제
    (
        sb.table("read_proofs")
        .delete()
        .eq("id", proof_id)
        .execute()
    )

    return Response(status_code=204)