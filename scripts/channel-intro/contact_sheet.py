"""把片头的关键帧拼成一张分镜联络表（contact sheet），用于一眼看完整条 10 秒。

用法：
    python -X utf8 scripts/channel-intro/contact_sheet.py
输入：out/intro-stills/beat-*.png —— 由下面这条 PowerShell 生成（帧号取自本文件的 BEATS）：

    $chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    foreach ($f in 32,55,80,120,158,170,191,200,215,245) {
      $n = "{0:d3}" -f $f
      npx remotion still ChannelIntro "out/intro-stills/beat-$n.png" --frame=$f --browser-executable="$chrome"
    }

输出：out/channel-intro-storyboard.png
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "out" / "intro-stills"
DST = ROOT / "out" / "channel-intro-storyboard.png"

# (帧号, 标题, 副标题) —— 与 src/ChannelIntro/tokens.ts 的 T 表逐个对应
BEATS = [
    (32, "f032 · 1.1s", "终端初始化：乱码落定 + 进度条"),
    (55, "f055 · 1.8s", "进度条填满 → 绿 OK 硬切入"),
    (80, "f080 · 2.7s", "整行上擦 → 线框地球起"),
    (120, "f120 · 4.0s", "线框自转"),
    (158, "f158 · 5.3s", "二维化压扁 —— signature"),
    (170, "f170 · 5.7s", "网点印刷显影"),
    (191, "f191 · 6.4s", "压实后眨眼：地球活了"),
    (200, "f200 · 6.7s", "头像框 + 字标硬切"),
    (215, "f215 · 7.2s", "「先生」盖章"),
    (245, "f245 · 8.2s", "套准十字 + 签名条（终帧）"),
]

CELL_W = 288
PAD = 14
LABEL_H = 34
COLS = 5


def font(size: int) -> ImageFont.FreeTypeFont:
    for name in ("msyh.ttc", "msyhbd.ttc", "simhei.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    cells = []
    for frame, title, sub in BEATS:
        p = SRC / f"beat-{frame:03d}.png"
        if not p.exists():
            print(f"skip (missing): {p}")
            continue
        im = Image.open(p).convert("RGB")
        h = round(CELL_W * im.height / im.width)
        cells.append((im.resize((CELL_W, h), Image.LANCZOS), title, sub))

    if not cells:
        raise SystemExit("没有找到任何 beat-*.png，先渲染静帧。")

    cell_h = cells[0][0].height
    rows = (len(cells) + COLS - 1) // COLS
    W = COLS * CELL_W + (COLS + 1) * PAD
    H = rows * (cell_h + LABEL_H) + (rows + 1) * PAD
    sheet = Image.new("RGB", (W, H), "#F2F3EE")
    d = ImageDraw.Draw(sheet)
    f1 = font(19)
    f2 = font(15)
    ink = "#242D34"

    for i, (im, title, sub) in enumerate(cells):
        r, c = divmod(i, COLS)
        x = PAD + c * (CELL_W + PAD)
        y = PAD + r * (cell_h + LABEL_H + PAD)
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + CELL_W - 1, y + cell_h - 1], outline=ink, width=3)
        d.text((x + 2, y + cell_h + 5), title, fill=ink, font=f1)
        d.text((x + 2, y + cell_h + 5 + 21), sub, fill="#7A848C", font=f2)

    DST.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(DST)
    print(f"wrote {DST}  {sheet.size}  cells={len(cells)}")


if __name__ == "__main__":
    main()
