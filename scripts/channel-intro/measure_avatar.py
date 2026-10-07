"""从头像里"量"出画片头要用的真实几何与颜色。

用途：
  1. 量出两只眼睛（白色圆）在头像里的归一化坐标和半径 —— 片头眨眼动画要用真坐标，
     不能凭印象画一对"像眼睛的圆"。
  2. 量出外圈黑描边的粗细、地球圆盘的半径 —— 片头做描边/网点时要用同一个线宽。
  3. 输出去掉抗锯齿后的"纯色"色板。

用法:
  python scripts/channel-intro/measure_avatar.py public/channel/avatar.jpg
"""

import sys
from collections import Counter

import numpy as np
from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else "public/channel/avatar.jpg"
img = Image.open(path).convert("RGB")
a = np.asarray(img).astype(np.float32)
h, w, _ = a.shape
print(f"source: {path}  {w}x{h}")

r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
sat = a.max(axis=2) - a.min(axis=2)

# ---------- 1. 地球圆盘：非白像素的外接圆 ----------
ink = lum < 120  # 黑描边
green = (g > 180) & (r > 120) & (b < 120)  # 大陆黄绿
blue = (b > 180) & (r < 120)  # 海洋蓝
globe = green | blue
ys, xs = np.nonzero(globe)
cx, cy = xs.mean(), ys.mean()
rad = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
print(f"\n== 地球圆盘 ==")
print(f"  center = ({cx:.1f}, {cy:.1f})  -> norm ({cx/w:.4f}, {cy/h:.4f})")
print(f"  radius = {rad:.1f}px          -> norm {rad/w:.4f}")
print(f"  占比: 海洋 {blue.mean()*100:.1f}%  大陆 {green.mean()*100:.1f}%  描边 {ink.mean()*100:.1f}%")

# ---------- 2. 描边粗细：沿水平中线扫一行，量黑段长度 ----------
mid = int(round(cy))
row_ink = ink[mid]
runs, run = [], 0
for v in row_ink:
    if v:
        run += 1
    elif run:
        runs.append(run)
        run = 0
if run:
    runs.append(run)
print(f"  中线 y={mid} 的黑段长度: {runs}  -> 描边约 {min(runs) if runs else 0}px")

# ---------- 3. 两只眼睛：在圆盘内部找"白色 + 被描边包住"的连通块 ----------
yy, xx = np.mgrid[0:h, 0:w]
inside = ((xx - cx) ** 2 + (yy - cy) ** 2) < (rad * 0.94) ** 2
white = (lum > 225) & inside

# 简易连通域（4 邻域），图像小直接 BFS
lab = np.zeros((h, w), dtype=np.int32)
cur = 0
blobs = []
for y0 in range(h):
    for x0 in range(w):
        if white[y0, x0] and lab[y0, x0] == 0:
            cur += 1
            stack = [(y0, x0)]
            lab[y0, x0] = cur
            pts = []
            while stack:
                y, x = stack.pop()
                pts.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and lab[ny, nx] == 0:
                        lab[ny, nx] = cur
                        stack.append((ny, nx))
            if len(pts) > 200:
                pts = np.array(pts)
                py, px = pts[:, 0], pts[:, 1]
                blobs.append(
                    {
                        "n": len(pts),
                        "cx": px.mean(),
                        "cy": py.mean(),
                        "rx": (px.max() - px.min()) / 2,
                        "ry": (py.max() - py.min()) / 2,
                    }
                )

blobs.sort(key=lambda d: -d["n"])
print(f"\n== 圆盘内的白色块（眼睛候选，按面积） ==")
for d in blobs[:5]:
    print(
        f"  area={d['n']:6d}  center=({d['cx']:6.1f},{d['cy']:6.1f})"
        f"  norm=({d['cx']/w:.4f},{d['cy']/h:.4f})  r=({d['rx']:.1f},{d['ry']:.1f})"
        f"  normR=({d['rx']/w:.4f},{d['ry']/h:.4f})"
    )

# ---------- 4. 纯色色板：只统计未抗锯齿的像素 ----------
flat = sat < 40
pure = a[flat].astype(np.uint8)
cnt = Counter(map(tuple, pure[:: max(1, len(pure) // 200000)]))
print(f"\n== 低饱和/抗锯齿以外的纯色 top8 ==")
for rgb, n in cnt.most_common(8):
    print("  #%02X%02X%02X  x%d" % (rgb[0], rgb[1], rgb[2], n))
