"""Rebuild launcher icons so the Daedokdan mark stays inside Android's 66% safe zone."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "images"
WHITE_THRESH = 245


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    rgba = im.convert("RGBA")
    pixels = rgba.getdata()
    width, height = rgba.size
    min_x, min_y, max_x, max_y = width, height, -1, -1
    for i, (r, g, b, a) in enumerate(pixels):
        if a <= 10:
            continue
        if r >= WHITE_THRESH and g >= WHITE_THRESH and b >= WHITE_THRESH:
            continue
        x = i % width
        y = i // width
        if x < min_x:
            min_x = x
        if y < min_y:
            min_y = y
        if x > max_x:
            max_x = x
        if y > max_y:
            max_y = y
    if max_x < 0:
        raise RuntimeError("no logo pixels found")
    return min_x, min_y, max_x, max_y


def extract_mark(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    x0, y0, x1, y1 = content_bbox(im)
    crop = im.crop((x0, y0, x1 + 1, y1 + 1))
    pixels = crop.load()
    width, height = crop.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 10 and r >= WHITE_THRESH and g >= WHITE_THRESH and b >= WHITE_THRESH:
                pixels[x, y] = (r, g, b, 0)
    return crop


def place_on_canvas(
    mark: Image.Image,
    canvas: int,
    fill: float,
    background: tuple[int, int, int, int],
) -> Image.Image:
    out = Image.new("RGBA", (canvas, canvas), background)
    max_side = int(canvas * fill)
    mw, mh = mark.size
    scale = min(max_side / mw, max_side / mh)
    new_size = (max(1, int(mw * scale)), max(1, int(mh * scale)))
    resized = mark.resize(new_size, Image.Resampling.LANCZOS)
    x = (canvas - new_size[0]) // 2
    y = (canvas - new_size[1]) // 2
    out.paste(resized, (x, y), resized)
    return out


def print_stats(label: str, path: Path) -> None:
    im = Image.open(path)
    x0, y0, x1, y1 = content_bbox(im)
    w, h = im.size
    print(
        f"{label}: {w}x{h} fill={(x1 - x0 + 1) / w:.0%} x {(y1 - y0 + 1) / h:.0%} "
        f"pad=({x0},{y0},{w - 1 - x1},{h - 1 - y1})"
    )


def main() -> None:
    source = IMAGES / "splash" / "app-icon.png"
    if not source.exists():
        source = IMAGES / "icon.png"
    mark = extract_mark(source)
    print(f"source mark {source.name}: {mark.size}")

    fg = place_on_canvas(mark, 1024, 0.58, (0, 0, 0, 0))
    fg_path = IMAGES / "android-icon-foreground.png"
    fg.save(fg_path, "PNG")
    print_stats("android foreground", fg_path)

    bg = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    bg_path = IMAGES / "android-icon-background.png"
    bg.save(bg_path, "PNG")
    print("android background: solid #FFFFFF")

    icon = place_on_canvas(mark, 1024, 0.72, (255, 255, 255, 255))
    icon_path = IMAGES / "icon.png"
    icon.save(icon_path, "PNG")
    print_stats("icon.png", icon_path)

    mono_src = IMAGES / "android-icon-monochrome.png"
    if mono_src.exists():
        try:
            mono_mark = extract_mark(mono_src)
        except RuntimeError:
            mono_mark = Image.open(mono_src).convert("RGBA")
        mono = place_on_canvas(mono_mark, 1024, 0.58, (0, 0, 0, 0))
        mono.save(mono_src, "PNG")
        print_stats("android monochrome", mono_src)


if __name__ == "__main__":
    main()
