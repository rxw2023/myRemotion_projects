"""从头像实测频道主色（而不是凭印象挑色）。

用法:
    python scripts/extract_palette.py public/channel/avatar.jpg

输出: 量化后的主色列表（hex + 占比）、以及按角色猜测的色板建议。
灵感来源: RuiC-motion-reel 的规矩 —— 品牌色必须实测（官网样式表 / 官方图），
不凭印象挑；颜色是被算出来的，不是被"喜欢"出来的。
"""

import sys
from collections import Counter

from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else "public/channel/avatar.jpg"
img = Image.open(path).convert("RGB")
w, h = img.size
print(f"source: {path}  {w}x{h}")

# --- 1. 中位切分量化，取主色 ---
q = img.quantize(colors=8, method=Image.Quantize.MEDIANCUT).convert("RGB")
counts = Counter(q.getdata())
total = w * h
print("\n== 量化主色（按占比） ==")
palette = []
for rgb, n in counts.most_common():
    hexv = "#%02X%02X%02X" % rgb
    pct = 100.0 * n / total
    palette.append((hexv, rgb, pct))
    print(f"  {hexv}  rgb{rgb}  {pct:5.2f}%")

# --- 2. 忽略背景白，取"最饱和"的几个色（真正的内容色） ---
def sat(rgb):
    mx, mn = max(rgb), min(rgb)
    return 0 if mx == 0 else (mx - mn) / mx

print("\n== 按饱和度排序（去掉近白/近黑） ==")
content = [
    (hexv, rgb, pct)
    for hexv, rgb, pct in palette
    if 25 < sum(rgb) / 3 < 245
]
for hexv, rgb, pct in sorted(content, key=lambda t: -sat(t[1])):
    print(f"  {hexv}  rgb{rgb}  sat={sat(rgb):.3f}  {pct:5.2f}%")

# --- 3. 逐点采样：九宫格中心区域，看各区域是什么色 ---
print("\n== 区域采样（3x3 网格中心点） ==")
for gy in range(3):
    row = []
    for gx in range(3):
        px = int((gx + 0.5) * w / 3)
        py = int((gy + 0.5) * h / 3)
        row.append("#%02X%02X%02X" % img.getpixel((px, py)))
    print("  " + "  ".join(row))
