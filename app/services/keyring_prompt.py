from typing import Dict, Optional
from openai import OpenAI

from app.core.config import settings

GENRE_MOTIF_MAP = {
    "시": "pressed flower, moon drop, ribbon tag",
    "경영/경제": "coin charm, upward graph, briefcase emblem",
    "에세이": "tea cup, leaf, diary page",
    "로맨스 소설": "rose, envelope, ribbon bow",
    "추리 소설": "magnifying glass, old key, pocket watch",
    "외국어": "globe, speech bubble, travel card",
    "인문": "column, laurel, open scroll",
    "철학": "owl, labyrinth, hourglass",
    "과학": "atom, flask, constellation spark",
    "사회": "handshake, network nodes, megaphone",
    "역사": "wax seal, scroll, compass",
    "종교": "candle, halo light, stained-glass motif",
    "IT": "microchip, cursor star, pixel sparkle",
    "여행": "suitcase, map pin, cloud trail",
}

DEFAULT_MOTIF = "open book charm, soft sparkle, elegant emblem"

def _as_author_text(book: Dict) -> str:
    authors = book.get("authors") or []
    if isinstance(authors, list):
        return ", ".join([str(a).strip() for a in authors if str(a).strip()])
    return str(authors).strip()

def _pick_genre(book: Dict) -> str:
    genre = (book.get("genre") or book.get("categoryName") or "").strip()
    if genre:
        return genre

    categories = book.get("categories") or []
    if isinstance(categories, list) and categories:
        return str(categories[0]).strip()

    return ""

def _genre_motif(genre: str) -> str:
    if not genre:
        return DEFAULT_MOTIF

    if genre in GENRE_MOTIF_MAP:
        return GENRE_MOTIF_MAP[genre]

    for key, motif in GENRE_MOTIF_MAP.items():
        if key in genre:
            return motif

    return DEFAULT_MOTIF

def build_keyring_prompt(
    book: Dict,
    # ✅ FIX: dominant_hex를 Optional로 변경 — user_books, keyrings 라우터에서
    #         cover_features 없이 호출할 때 TypeError 방지
    dominant_hex: Optional[str] = None,
    motif: Optional[str] = None,
    existing_charm_count: int = 0,
    user_nickname: Optional[str] = None,  # ✅ FIX: user_books/keyrings 라우터가 넘기던 파라미터 추가
) -> str:
    """
    OpenAI Responses API로 '최종 이미지 생성 프롬프트'를 작성한다.
    - dominant_hex가 없으면 표지 URL에서 자동 추출 시도, 그것도 없으면 기본값 사용
    - 장르별 참 장식 스타일 반영
    - 항상 '하나의 고리에 추가될 단일 charm'만 생성하도록 유도
    """
    # ✅ FIX: dominant_hex가 없으면 기본값 fallback
    if not dominant_hex:
        dominant_hex = "#4F46E5"

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    title = (book.get("title") or "").strip()
    author_txt = _as_author_text(book)
    genre = _pick_genre(book)
    cover_url = (
        book.get("thumbnail_url")
        or book.get("cover_url")
        or book.get("cover")
        or ""
    ).strip()

    motif = motif or _genre_motif(genre)
    next_charm_number = existing_charm_count + 1

    system_prompt = """
You are a senior product art director for a reading-tracker app.
Your task is to write ONE final image-generation prompt for a collectible acrylic BOOK CHARM.

Important rules:
- The output must be only the final prompt text.
- Do not add explanations, headings, JSON, or markdown.
- The generated object must be a SINGLE detachable acrylic charm pendant for a larger keyring collection.
- It must NOT be a full completed multi-charm keyring scene.
- It must visually harmonize with other charms that may be added later.
- The style should be cute, premium, minimalist, and consistent across a series.
- Never request readable text, letters, numbers, logos, or watermarks in the image.
""".strip()

    user_content = [
        {
            "type": "input_text",
            "text": f"""
Book title: {title}
Author: {author_txt}
Genre: {genre or 'unknown'}
Dominant cover color: {dominant_hex}
Genre-based motif suggestion: {motif}
This charm will be charm number {next_charm_number} on the user's growing reading keyring.

Write a single polished prompt for an image model that generates:
- one standalone acrylic charm inspired by this book
- visually influenced by the cover image if provided
- genre-specific ornament details
- a small top loop so it can hang from one shared ring with other book charms
- transparent acrylic edge
- glossy premium acrylic material
- centered front-facing product-style composition
- isolated charm only, plain bright studio background
- no human hands
- no full keyring bundle
- no extra unrelated props

The charm should feel collectible and emotionally tied to the book, but simplified into a clean icon-like design suitable for a small acrylic pendant.
""".strip(),
        }
    ]

    if cover_url:
        user_content.append(
            {
                "type": "input_image",
                "image_url": cover_url,
                "detail": "high",
            }
        )

    resp = client.responses.create(
        model=settings.OPENAI_PROMPT_MODEL,
        input=[
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": user_content,
            },
        ],
    )

    prompt = (getattr(resp, "output_text", None) or "").strip()
    if prompt:
        return prompt

    # fallback
    return f"""
Create a premium product-style image of one collectible acrylic book charm inspired by "{title}" by {author_txt}.
Design a single detachable charm pendant, not a full keyring set.
Use a color palette centered on {dominant_hex}.
Motif inspiration: {motif}.
Make it genre-aware, cute minimalist, elegant, and consistent with a collectible reading charm series.
Include a small top loop for attaching to a shared keyring ring.
Use transparent acrylic edges, subtle glossy highlights, crisp clean shapes, front-facing centered composition, and a plain bright studio background.
Do NOT include readable text, letters, numbers, logos, or watermark.
High resolution, sharp edges, isolated object only.
""".strip()