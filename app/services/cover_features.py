from typing import Dict, Tuple
import re
from io import BytesIO

import requests
from PIL import Image

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


def _dominant_color_hex(img: Image.Image) -> str:
    im = img.convert("RGB").resize((64, 64))
    colors = im.getcolors(64 * 64)
    if not colors:
        return "#4F46E5"
    colors.sort(key=lambda x: x[0], reverse=True)
    r, g, b = colors[0][1]
    return f"#{r:02X}{g:02X}{b:02X}"


def _pick_genre(book_row: Dict) -> str:
    genre = (book_row.get("genre") or book_row.get("categoryName") or "").strip()
    if genre:
        return genre

    categories = book_row.get("categories") or []
    if isinstance(categories, list) and categories:
        return str(categories[0]).strip()

    return ""


def _motif_by_genre(genre: str, title: str = "") -> str:
    if genre in GENRE_MOTIF_MAP:
        return GENRE_MOTIF_MAP[genre]

    for key, motif in GENRE_MOTIF_MAP.items():
        if key in genre:
            return motif

    # title fallback
    if re.search(r"바다|sea|ocean|river|강|여행", title.lower()):
        return "wave line, cloud trail, small compass"
    return DEFAULT_MOTIF


def extract_cover_features(book_row: Dict) -> Tuple[str, str]:
    """
    Returns:
      (dominant_hex, motif)
    """
    thumb = (
        book_row.get("thumbnail_url")
        or book_row.get("cover_url")
        or book_row.get("cover")
        or ""
    ).strip()

    dominant = "#4F46E5"
    if thumb:
        try:
            resp = requests.get(thumb, timeout=8)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content))
            dominant = _dominant_color_hex(img)
        except Exception:
            dominant = "#4F46E5"

    genre = _pick_genre(book_row)
    title = (book_row.get("title") or "").strip()
    motif = _motif_by_genre(genre, title)

    return dominant, motif