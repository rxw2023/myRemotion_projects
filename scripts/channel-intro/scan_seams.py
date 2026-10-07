"""在指定静帧里找"横向不连续"—— 用来区分「点阵逐行揭开的边界」和「一条不该存在的线」。

用法：
    python -X utf8 scripts/channel-intro/scan_seams.py out/intro-stills/beat-055.png ...

原理：逐行统计酸绿像素（#BBEB00：G 高、B 低）的覆盖率，找相邻两行差值最大的位置。
逐行揭开会在 boundary 那一行留下一个台阶；一条"线"则是 —— 相邻两行各有一个尖峰。
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

for path in sys.argv[1:]:
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    h = im.shape[0]
    green = ((im[:, :, 1] > 180) & (im[:, :, 2] < 120)).mean(axis=1)
    delta = np.abs(np.diff(green))
    order = np.argsort(delta)[::-1][:5]
    jumps = sorted(int(i) for i in order)
    desc = "  ".join(f"row {i} ({100 * i / h:.1f}%) Δ={delta[i]:.4f}" for i in order)
    print(f"{Path(path).name}  绿色覆盖率 top-5 跳变: {desc}")
