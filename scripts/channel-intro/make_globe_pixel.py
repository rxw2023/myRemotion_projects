"""把「地球先生」贴纸降采样成像素画，供 8-bit 风格样张使用。

为什么不在 CSS 里做：`image-rendering: pixelated` 只能保证**放大**时用最近邻，
先缩后放要靠 transform 的栅格化时机，headless Chrome 里不可靠。
直接预生成一张小图，再用 pixelated 放大，结果是确定的。
"""

from pathlib import Path

from PIL import Image

SRC = Path("public/channel/globe.png")
OUT_DIR = Path("public/channel")


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    for size in (32, 64):
        # NEAREST 降采样 = 每个像素取源图一个点，这才是真像素画；
        # BILINEAR/BOX 会把边缘糊掉，放大后变成软块。
        small = src.resize((size, size), Image.NEAREST)
        out = OUT_DIR / f"globe-px{size}.png"
        small.save(out)
        print(f"wrote {out}  {small.size}  {out.stat().st_size} B")


if __name__ == "__main__":
    main()
