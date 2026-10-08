"""把十二张片头风格样张拼成一张对比图例（contact sheet）。

用法：
    python -X utf8 scripts/channel-intro/styles_sheet.py
输入：out/style-samples/{swiss,crt,blueprint,memphis,editorial,whiteboard,
      neon,retrofuture,pixel,vaporwave,ink,comic}.png
      （由 npx remotion still StyleSample-<key> --frame=12 生成）
输出：out/channel-intro-style-options.png

下面 CELLS 里的文案是 src/ChannelIntroStyles/index.tsx 里 STYLE_META 的节选 ——
Python 读不了 TS，所以这里是副本。改设计时两边都要动。
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "out" / "style-samples"
DST = ROOT / "out" / "channel-intro-style-options.png"

# (文件键, 编号, 主标题, 英文名, 情绪词, 借鉴来源)
CELLS = [
    ("swiss", "01", "瑞士网格", "SWISS / GRID", "可信 · 克制 · 学术气", "mg-styles-15 · 风格 11"),
    ("crt", "02", "磷光终端", "CRT / PHOSPHOR", "硬核 · 极客 · 机器感", "mg-styles-15 · 风格 08"),
    ("blueprint", "03", "工程蓝图", "BLUEPRINT", "严谨 · 有出处 · 拆开看", "RuiC · 颜色是被算出来的"),
    ("memphis", "04", "孟菲斯波普", "MEMPHIS POP", "活泼 · 抓眼 · 信息流", "mg-styles-15 · 风格 15"),
    ("editorial", "05", "杂志封面", "EDITORIAL COVER", "人文 · 有品 · 收藏感", "awesome-opus5-5 · 编辑式排版"),
    ("whiteboard", "06", "手绘白板", "WHITEBOARD", "亲切 · 门槛低 · 讲给你听", "mg-styles-15 · 风格 04"),
    ("neon", "07", "霓虹夜市", "NEON / NIGHT MARKET", "夜 · 潮 · 带劲", "mg-styles-15 · 风格 15（发光版）"),
    ("retrofuture", "08", "复古未来", "RETROFUTURE / 70s", "怀旧 · 乐观 · 使命感", "awesome-opus5-5 · 70 年代科普版式"),
    ("pixel", "09", "像素游戏", "PIXEL / 8-BIT", "游戏 · 极客 · 童年", "mg-styles-15 · 风格 07（降采样）"),
    ("vaporwave", "10", "蒸汽波", "VAPORWAVE", "亚文化 · 迷幻 · 上瘾", "RuiC · 把渐变当颜色源"),
    ("ink", "11", "水墨宣纸", "INK / RICE PAPER", "静 · 有文化底 · 慢慢讲", "原创方向（三个库里没有）"),
    ("comic", "12", "漫画分格", "COMIC PANEL", "热血 · 有叙事感 · 翻开第一格", "mg-styles-15 · 风格 07（漫画化）"),
]

COLS = 4
CELL_W = 360
PAD = 24
LABEL_H = 176
HEADER_H = 156
BG = (24, 24, 26)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    """优先用中文字体，避免标题变方块。"""
    for name in ("msyh.ttc", "msyhbd.ttc", "simhei.ttf", "segoeui.ttf"):
        p = Path("C:/Windows/Fonts") / name
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def main() -> None:
    srcs = []
    for key, no, title, en, mood, borrow in CELLS:
        p = SRC / f"{key}.png"
        if not p.exists():
            raise SystemExit(f"缺少样张：{p}\n先跑 npx remotion still StyleSample-{key} ...")
        srcs.append((Image.open(p).convert("RGB"), key, no, title, en, mood, borrow))

    cell_h = round(CELL_W * srcs[0][0].height / srcs[0][0].width)
    rows = (len(srcs) + COLS - 1) // COLS
    W = PAD + COLS * (CELL_W + PAD)
    H = HEADER_H + PAD + rows * (cell_h + LABEL_H + PAD)

    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)

    f_no = load_font(36)
    f_en = load_font(19)
    f_mood = load_font(19)
    f_borrow = load_font(17)
    f_head = load_font(46)
    f_note = load_font(21)

    d.text((PAD + 4, 30), "频道片头 · 12 种风格候选", font=f_head, fill=(240, 240, 235))
    d.text(
        (PAD + 4, 90),
        "十二张画的是同一件事、同一组内容（EP.07 / 缓存原理 / 一条数据从内存到屏幕的旅程 / 08:24）",
        font=f_note,
        fill=(150, 150, 146),
    )
    d.text(
        (PAD + 4, 118),
        "—— 只有视觉语言不同，所以「哪种风格排得出正文、哪种更适合这个频道」才是可比的。",
        font=f_note,
        fill=(150, 150, 146),
    )

    for i, (im, key, no, title, en, mood, borrow) in enumerate(srcs):
        r, c = divmod(i, COLS)
        x = PAD + c * (CELL_W + PAD)
        y = HEADER_H + PAD + r * (cell_h + LABEL_H + PAD)

        thumb = im.resize((CELL_W, cell_h), Image.LANCZOS)
        sheet.paste(thumb, (x, y))
        d.rectangle([x, y, x + CELL_W - 1, y + cell_h - 1], outline=(70, 70, 74), width=2)

        ly = y + cell_h + 12
        d.text((x, ly), f"{no}  {title}", font=f_no, fill=(248, 248, 244))
        d.text((x, ly + 44), en, font=f_en, fill=(120, 170, 255))
        d.text((x, ly + 72), mood, font=f_mood, fill=(160, 160, 155))
        d.text((x, ly + 106), f"借鉴 ← {borrow}", font=f_borrow, fill=(126, 126, 122))

    sheet.save(DST)
    print(f"wrote {DST}  {sheet.size}  cells={len(srcs)}")


if __name__ == "__main__":
    main()
