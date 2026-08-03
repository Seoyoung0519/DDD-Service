def build_fallback_svg(dominant_hex: str, motif: str) -> str:
    # motif는 아이콘 종류에 반영 (초기엔 텍스트로만)
    # FE는 이 SVG를 <img src="data:image/svg+xml;utf8,..."> 로도 렌더 가능
    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="96" y="80" width="320" height="352" rx="48" fill="{dominant_hex}" opacity="0.92"/>
  <circle cx="392" cy="136" r="44" fill="#111827" opacity="0.14"/>
  <circle cx="392" cy="136" r="26" fill="#F9FAFB" opacity="0.9"/>
  <path d="M170 172h172c18 0 32 14 32 32v160c0 18-14 32-32 32H170c-18 0-32-14-32-32V204c0-18 14-32 32-32z"
        fill="#F9FAFB" opacity="0.92"/>
  <path d="M190 220h132" stroke="#111827" stroke-width="18" stroke-linecap="round" opacity="0.35"/>
  <path d="M190 268h172" stroke="#111827" stroke-width="18" stroke-linecap="round" opacity="0.25"/>
  <path d="M190 316h152" stroke="#111827" stroke-width="18" stroke-linecap="round" opacity="0.18"/>
  <text x="256" y="410" text-anchor="middle" font-size="24" fill="#111827" opacity="0.45">{motif}</text>
</svg>
""".strip()
    return svg
