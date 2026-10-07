"""从 300x300 的 B 站头像切出一张"地球先生"透明底贴纸。

为什么要预切而不是在 Remotion 里算：
  Remotion 里用「实测圆心 + 半径」做圆形 mask，只要测量差 3%（半径 140.5 -> 136），
  渲染出来就是碗口宽的一圈白纸露在圆外 —— 而且症状看起来像"遮罩没生效"，
  真因是一个小数。预切成带 alpha 的 PNG 之后，片子只负责摆放，不负责几何。
  （这条"症状不指向真因"的教训来自 RuiC-motion-reel 的 references/gotchas.md。）

输出：public/channel/globe.png —— 600x600 RGBA，地球正好内切，圆外全透明。
"""

import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "channel" / "avatar.jpg"
DST = ROOT / "public" / "channel" / "globe.png"
OUT = 600
SS = 3  # 超采样倍数，用来做边缘抗锯齿


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    a = np.asarray(img).astype(np.int16)
    h, w, _ = a.shape

    # 纸底 = 近白且几乎无彩度。头像的底是 #FBFBFA，地球最亮的地方（眼白）也是白的，
    # 但眼白被黑色描边圈住，所以取"最大连通域"就能把它们排除掉。
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    paper = (mn > 228) & ((mx - mn) < 14)
    solid = ~paper

    # 最大连通域（四邻域洪泛，纯 numpy 迭代到不动点）
    lab = np.zeros((h, w), dtype=np.int32)
    cur = 0
    ys, xs = np.nonzero(solid)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        cur += 1
        stack = [(y0, x0)]
        lab[y0, x0] = cur
        while stack:
            y, x = stack.pop()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = cur
                    stack.append((ny, nx))

    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    blob = lab == int(sizes.argmax())
    yy, xx = np.nonzero(blob)
    left, right, top, bottom = int(xx.min()), int(xx.max()), int(yy.min()), int(yy.max())

    # 水平方向没被画布切掉，用它定圆心与半径；纵向顶部也没被切，用它定 cy。
    r = (right - left + 1) / 2.0
    cx = (left + right + 1) / 2.0
    cy = top + r
    clipped = bottom >= h - 2

    # 用连通域的像素做一次最小二乘圆拟合，压掉边缘锯齿带来的零点几像素误差
    ex = xx.astype(float)[:: max(1, len(xx) // 4000)]
    ey = yy.astype(float)[:: max(1, len(yy) // 4000)]
    for _ in range(24):
        d = np.hypot(ex - cx, ey - cy)
        keep = np.abs(d - r) < max(2.0, r * 0.02)
        if keep.sum() < 50:
            break
        px, py = ex[keep], ey[keep]
        A = np.c_[2 * px, 2 * py, np.ones(len(px))]
        b = px**2 + py**2
        sol, *_ = np.linalg.lstsq(A, b, rcond=None)
        cx, cy = float(sol[0]), float(sol[1])
        r = float(np.sqrt(sol[2] + cx**2 + cy**2))

    print(f"globe  center=({cx:.2f},{cy:.2f})  r={r:.2f}  clipped_bottom={clipped}")
    print(f"norm   cx={cx/w:.4f} cy={cy/h:.4f} r={r/w:.4f}")

    # 超采样采样：输出每像素取 SSxSS 个子样本，边缘自然抗锯齿
    n = OUT * SS
    gy, gx = np.mgrid[0:n, 0:n].astype(np.float32)
    sx = (cx + (gx + 0.5 - n / 2) * (r / (n / 2))).ravel()
    sy = (cy + (gy + 0.5 - n / 2) * (r / (n / 2))).ravel()
    ok = (sx >= 0) & (sx <= w - 1) & (sy >= 0) & (sy <= h - 1)
    src = np.asarray(img, dtype=np.float32)
    x0 = np.clip(np.floor(sx).astype(np.int64), 0, w - 2)
    y0 = np.clip(np.floor(sy).astype(np.int64), 0, h - 2)
    fx = np.clip(sx - x0, 0, 1)[:, None]
    fy = np.clip(sy - y0, 0, 1)[:, None]
    c00 = src[y0, x0]
    c10 = src[y0, x0 + 1]
    c01 = src[y0 + 1, x0]
    c11 = src[y0 + 1, x0 + 1]
    rgb = (c00 * (1 - fx) + c10 * fx) * (1 - fy) + (c01 * (1 - fx) + c11 * fx) * fy
    rgb[~ok] = 255.0
    cover = (np.hypot(sx - cx, sy - cy) <= r).astype(np.float32)[:, None]
    rgba = np.concatenate([rgb, cover * 255.0], axis=1).reshape(n, n, 4)

    out = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")
    out = out.resize((OUT, OUT), Image.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=2, percent=55, threshold=2))

    # 抗锯齿会在圆外留一圈半透明，重新压一次 alpha，保证圆外绝对是 0
    oy, ox = np.mgrid[0:OUT, 0:OUT].astype(np.float32)
    hard = np.hypot(ox + 0.5 - OUT / 2, oy + 0.5 - OUT / 2) <= OUT / 2 - 0.5
    arr = np.asarray(out).copy()
    arr[..., 3] = np.where(hard, arr[..., 3], 0)
    out = Image.fromarray(arr, "RGBA")

    DST.parent.mkdir(parents=True, exist_ok=True)
    out.save(DST)
    al = arr[..., 3]
    print(f"wrote {DST}  {out.size}  opaque={int((al > 250).sum())}  fully-transparent={int((al == 0).sum())}")


if __name__ == "__main__":
    main()
