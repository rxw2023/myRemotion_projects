"""
把豆包生成的原图整理成成片能直接用的图。

原图有三个问题，都得在这里解决：

1. **右下角有水印**（"豆包 AI 生成"），位置固定在 x≥2220 / y≥1545，压到了画面里。
   → 直接裁掉。裁 300×120 对构图影响很小，比糊一块补丁强。
2. **一部分图外面包着一圈白纸边 + 一道黑框**，另一部分是满幅出血。
   混着用，同一页里有的格带白圈有的不带，很难看。
   → 有纸边的裁到框内，让所有图都变成"满幅"，边框统一由成片自己画。
3. **51 张的纸白不一样**（有的是冷白，有的是米白）。
   → 全部做双色调映射：最暗压到墨色 #12100E，最亮提到我们的纸色 #F2EEE2。
   这样每一格的白就正好等于页面的纸色，看起来像印在同一张纸上。

用法：
  python scripts/eternal-signal/prep-panels.py
"""

from PIL import Image, ImageFilter
import numpy as np
import glob
import os

SRC = "public/external-storage"
DST = "public/eternal-signal/panels"
MAX_W = 1600

INK = np.array([18, 16, 14], dtype=np.float32)
PAPER = np.array([242, 238, 226], dtype=np.float32)

# 水印范围（原图坐标）。贴在最右下角，几乎顶到边缘。
WM_X = 2200
WM_Y = 1545

os.makedirs(DST, exist_ok=True)


def border_is_paper(a: np.ndarray) -> bool:
    """最外圈是不是白纸——用来区分"纸边画格"和"满幅出血"两种图。"""
    edge = np.concatenate([a[0:6, :].ravel(), a[-6:, :].ravel(), a[:, 0:6].ravel(), a[:, -6:].ravel()])
    return float(edge.mean()) > 200.0


def find_panel(a: np.ndarray):
    """找画格的黑框。找不到或不可信就返回 None。"""
    h, w = a.shape
    dark = a < 110
    rf = dark.mean(axis=1)
    cf = dark.mean(axis=0)
    try:
        top = next(i for i in range(h) if rf[i] > 0.55)
        bot = next(i for i in range(h - 1, -1, -1) if rf[i] > 0.55)
        left = next(j for j in range(w) if cf[j] > 0.55)
        right = next(j for j in range(w - 1, -1, -1) if cf[j] > 0.55)
    except StopIteration:
        return None

    bw, bh = right - left, bot - top
    # 画格必须占住大部分画面，否则说明找到的是画面里的一块暗部，不是框
    if bw < w * 0.6 or bh < h * 0.6:
        return None
    ar = bw / max(1, bh)
    if not (1.2 < ar < 1.9):
        return None
    return left, top, right, bot


def duotone(gray: np.ndarray) -> np.ndarray:
    """灰阶 → 墨/纸双色调。这才是"印在纸上"的关键。"""
    l = (gray.astype(np.float32) / 255.0)[..., None]
    out = INK + (PAPER - INK) * l
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    files = sorted(glob.glob(os.path.join(SRC, "*.[pP][nN][gG]")))
    files = [f for f in files if os.path.basename(f)[0].lower() in "abcdefghij"]
    print(f"共 {len(files)} 张\n")
    print(f"{'file':10} {'原尺寸':>12} {'裁切后':>12} {'类型':>8} {'输出':>10}")

    for f in files:
        name = os.path.basename(f).lower()
        act = name[0].upper()
        num = "".join(ch for ch in os.path.splitext(name)[0][1:] if ch.isdigit()).zfill(2)
        out = os.path.join(DST, f"{act}-{num}.jpg")

        im = Image.open(f).convert("RGB")
        a = np.asarray(im.convert("L"), dtype=np.uint8)
        h, w = a.shape

        x0, y0, x1, y1 = 0, 0, w, h
        kind = "满幅"

        if border_is_paper(a):
            box = find_panel(a)
            if box:
                l, t, r, b = box
                # 往框内多收 10px，把它自己的黑框去掉——边框统一由成片画
                x0, y0, x1, y1 = l + 10, t + 10, r - 10, b - 10
                kind = "纸边"

        # 一律切掉水印所在的那一条
        x1 = min(x1, WM_X)
        y1 = min(y1, WM_Y)

        im = im.crop((x0, y0, x1, y1))
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)

        g = np.asarray(im.convert("L"), dtype=np.uint8)
        Image.fromarray(duotone(g)).save(out, "JPEG", quality=88, optimize=True, progressive=False)

        kb = os.path.getsize(out) / 1024
        print(f"{os.path.basename(f):10} {w:5d}x{h:<6d} {x1-x0:5d}x{y1-y0:<6d} {kind:>8} {kb:7.0f}KB")

    tot = sum(os.path.getsize(os.path.join(DST, x)) for x in os.listdir(DST))
    print(f"\n输出目录总大小 {tot/1e6:.1f}MB")


if __name__ == "__main__":
    main()
