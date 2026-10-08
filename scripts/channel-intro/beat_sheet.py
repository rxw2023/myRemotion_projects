"""把一组静帧拼成网格联络表。通用小工具，不绑定任何一条片子。

用法：
    python -X utf8 scripts/channel-intro/beat_sheet.py <输出.png> <列数> <图1.png> [图2.png ...]
标签取文件名（去扩展名），按传入顺序排列。
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG = (18, 18, 20)
PAD = 16
LABEL_H = 44
CELL_W = 300


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for name in ("consola.ttf", "msyh.ttc", "segoeui.ttf"):
        p = Path("C:/Windows/Fonts") / name
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def main() -> None:
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    out = Path(sys.argv[1])
    cols = int(sys.argv[2])
    files = [Path(a) for a in sys.argv[3:]]

    ims = [(f.stem, Image.open(f).convert("RGB")) for f in files]
    cell_h = round(CELL_W * ims[0][1].height / ims[0][1].width)
    rows = (len(ims) + cols - 1) // cols

    W = PAD + cols * (CELL_W + PAD)
    H = PAD + rows * (cell_h + LABEL_H + PAD)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    font = load_font(22)

    for i, (name, im) in enumerate(ims):
        r, c = divmod(i, cols)
        x = PAD + c * (CELL_W + PAD)
        y = PAD + r * (cell_h + LABEL_H + PAD)
        sheet.paste(im.resize((CELL_W, cell_h), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + CELL_W - 1, y + cell_h - 1], outline=(64, 64, 68), width=2)
        d.text((x + 2, y + cell_h + 10), name, font=font, fill=(225, 225, 220))

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"wrote {out}  {sheet.size}  cells={len(ims)}")


if __name__ == "__main__":
    main()
