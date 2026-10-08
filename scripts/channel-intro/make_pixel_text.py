"""
把中文渲染成「真像素」遮罩贴图。

为什么不在 CSS 里做：字体是矢量的，`image-rendering: pixelated` 只对**位图**生效，
把矢量文字放大依然是平滑的曲线。所以只能先在 Pillow 里用超采样大字渲染、再用
NEAREST 缩到目标像素网格 —— 缩小这一步本身就是"把字压进像素格子"。

输出是 **alpha 遮罩**（RGB 全白、只有 alpha 有值），这样在组件里可以用
`WebkitMaskImage: url(...)` + `background: 任意颜色` 随时换色，不用为每种颜色重出一张图。

用法：
    python -X utf8 scripts/channel-intro/make_pixel_text.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path("public/channel")

# 优先粗体；找不到就退到常规
FONT_CANDIDATES = [
    "C:/Windows/Fonts/msyhbd.ttc",  # 微软雅黑 Bold
    "C:/Windows/Fonts/msyh.ttc",
    "C:/Windows/Fonts/simhei.ttf",
]

SS = 24  # 超采样倍率
ALPHA_CUTOFF = 110  # 二值化阈值：低于它算"这个像素没被字盖住"

# (输出文件名, 文字, 每个字的像素宽度)
JOBS = [
    ("px-name.png", "先生", 15),
    ("px-sign.png", "知识科普向", 12),
]


def pick_font() -> str:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return path
    raise SystemExit("找不到可用的中文字体，检查 FONT_CANDIDATES")


def render_mask(text: str, px_per_char: int, font_path: str) -> Image.Image:
    """大字渲染 → NEAREST 缩到 px_per_char → 二值化。返回 L 模式（0/255）。"""
    font = ImageFont.truetype(font_path, px_per_char * SS)
    box = font.getbbox(text)
    pad = SS  # 留一圈，避免描边被裁
    w = box[2] - box[0] + pad * 2
    h = box[3] - box[1] + pad * 2

    big = Image.new("L", (w, h), 0)
    ImageDraw.Draw(big).text((pad - box[0], pad - box[1]), text, font=font, fill=255)

    tw = max(1, round(w / SS))
    th = max(1, round(h / SS))
    small = big.resize((tw, th), Image.NEAREST)
    # 二值化：放大后要么是全色要么是全透明，中间灰会糊掉像素感
    return small.point(lambda v: 255 if v >= ALPHA_CUTOFF else 0)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font_path = pick_font()
    print(f"font: {font_path}")

    previews: list[Image.Image] = []
    for name, text, px_per_char in JOBS:
        mask = render_mask(text, px_per_char, font_path)
        out = Image.new("RGBA", mask.size, (255, 255, 255, 0))
        out.putalpha(mask)
        path = OUT_DIR / name
        out.save(path)
        lit = sum(1 for v in mask.get_flattened_data() if v > 0)
        print(f"wrote {path}  {mask.size[0]}x{mask.size[1]}  lit={lit}  bytes={path.stat().st_size}")
        previews.append(mask)

    # 遮罩是白底透明，直接看等于看不见 —— 出一张深底放大图供人眼复核
    zoom = 10
    gap = 4 * zoom
    width = max(m.width for m in previews) * zoom
    height = sum(m.height * zoom for m in previews) + gap * (len(previews) - 1)
    sheet = Image.new("RGB", (width, height), (26, 28, 44))
    y = 0
    for mask in previews:
        lit = mask.point(lambda v: 240 if v > 0 else 26)
        sheet.paste(lit.convert("RGB").resize((mask.width * zoom, mask.height * zoom), Image.NEAREST), (0, y))
        y += mask.height * zoom + gap
    out_dir = Path("out")
    out_dir.mkdir(exist_ok=True)
    preview_path = out_dir / "pixel-text-preview.png"
    sheet.save(preview_path)
    print(f"wrote {preview_path}  {sheet.size[0]}x{sheet.size[1]}")


if __name__ == "__main__":
    main()
