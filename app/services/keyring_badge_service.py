from datetime import datetime, timezone
from fastapi import HTTPException
from supabase import Client

from app.services.cover_features import extract_cover_features
from app.services.keyring_prompt import build_keyring_prompt
from app.services.openai_image_gen import generate_keyring_image_bytes
from app.services.keyring_storage import upload_keyring_image, signed_keyring_url
from app.services.fallback_icon import build_fallback_svg

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def create_or_update_keyring_for_completed_book(
    sb: Client,
    user_id: str,
    book_id: str,
) -> dict:
    """
    completed 확정 순간 호출:
    - 책 표지에서 dominant color 추출
    - 장르별 motif 반영
    - OpenAI Responses API로 최종 프롬프트 작성
    - OpenAI Images API로 '단일 charm' 생성
    - 성공 시 Storage 업로드 + keyrings 저장
    - 실패 시 fallback_svg 저장
    """

    # 1) book 조회
    b_rows = (
        sb.table("books")
        .select("*")
        .eq("id", book_id)
        .limit(1)
        .execute()
        .data
    )
    # ✅ 추가
    print(f"[keyring_badge_service] books lookup for id={book_id}: found={len(b_rows) if b_rows else 0}")

    if not b_rows:
        raise HTTPException(status_code=404, detail="Book not found")

    book = b_rows[0]

    # 2) 기존 동일 book row 있는지 먼저 확인
    k_rows = (
        sb.table("keyrings")
        .select("id,image_path,image_status,prompt")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .limit(1)
        .execute()
        .data
    )
    existing_keyring = k_rows[0] if k_rows else None

    # ✅ FIX: existing_count는 이 책 키링을 제외한 수로 계산
    #         신규 생성이면 현재 전체 수 = charm number
    #         업데이트면 이미 카운트에 포함되어 있으므로 -1
    total_count_resp = (
        sb.table("keyrings")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    total_count = total_count_resp.count or 0

    if existing_keyring:
        # 이미 이 책 키링이 count에 포함되어 있으므로 제외
        existing_charm_count = total_count - 1
    else:
        # 신규 생성: 현재 total이 기존 charm 수
        existing_charm_count = total_count

    # 3) 표지 특징 추출
    dominant_hex, motif = extract_cover_features(book)

    # 4) OpenAI로 프롬프트 작성
    prompt = build_keyring_prompt(
        book=book,
        dominant_hex=dominant_hex,
        motif=motif,
        existing_charm_count=existing_charm_count,
    )

    # 5) 이미지 생성 → 업로드
    try:
        image_bytes, content_type = generate_keyring_image_bytes(prompt)
        image_path = upload_keyring_image(
            sb=sb,
            user_id=user_id,
            book_id=book_id,
            image_bytes=image_bytes,
            content_type=content_type,
        )
        image_url = signed_keyring_url(sb, image_path)

        payload = {
            "user_id": user_id,
            "book_id": book_id,
            "earned_at": now_iso(),
            "prompt": prompt,
            "image_path": image_path,
            "image_status": "generated",
            "fallback_svg": None,
            "updated_at": now_iso(),
        }

        if existing_keyring:
            sb.table("keyrings").update(payload).eq("id", existing_keyring["id"]).execute()
            keyring_id = existing_keyring["id"]
        else:
            inserted = sb.table("keyrings").insert(payload).execute().data
            keyring_id = inserted[0]["id"]

        return {
            "keyring_id": keyring_id,
            "prompt": prompt,
            "image_status": "generated",
            "image_path": image_path,
            "image_url": image_url,
            "fallback_svg": None,
        }


    except Exception as e:

        print("KEYRING GENERATE ERROR:", repr(e))

        fallback_svg = build_fallback_svg(dominant_hex, motif)

        payload = {
            "user_id": user_id,
            "book_id": book_id,
            "earned_at": now_iso(),
            "prompt": prompt,
            "image_path": None,
            "image_status": "fallback",
            "fallback_svg": fallback_svg,
            "updated_at": now_iso(),
        }

        if existing_keyring:
            sb.table("keyrings").update(payload).eq("id", existing_keyring["id"]).execute()
            keyring_id = existing_keyring["id"]
        else:
            inserted = sb.table("keyrings").insert(payload).execute().data
            keyring_id = inserted[0]["id"]

        return {
            "keyring_id": keyring_id,
            "prompt": prompt,
            "image_status": "fallback",
            "image_path": None,
            "image_url": None,
            "fallback_svg": fallback_svg,
        }