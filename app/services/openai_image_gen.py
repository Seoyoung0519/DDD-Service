import base64
from typing import Tuple
from openai import OpenAI

from app.core.config import settings


def generate_keyring_image_bytes(prompt: str) -> Tuple[bytes, str]:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    resp = client.images.generate(
        model=settings.OPENAI_IMAGE_MODEL,
        prompt=prompt,
        size="1024x1024",
        output_format="png",
        quality="high",
        background="transparent",
    )

    b64 = resp.data[0].b64_json
    img_bytes = base64.b64decode(b64)
    return img_bytes, "image/png"