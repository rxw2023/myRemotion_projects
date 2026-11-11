# -*- coding: utf-8 -*-
"""
音色 A/B 对照：同一句、同一音色，只换滤镜。

问题诊断：原来用"砍低频"来表达距离，`deep` 的低切是 560 Hz，
而男声基频只有 85–180 Hz——等于把胸腔整个切掉了，听起来是电话音而不是远方。

这个脚本不改音色，只改滤波：
  · 低切降到基频之上一点点（170–220 Hz），把身体还回来
  · 距离改用"收窄高频 + 抬高底噪 + 磁带衰落 + 断裂"来表达（本来更真实的短波特征）

输出：
    out/ab-old.wav   旧参数
    out/ab-new.wav   新参数
    out/ab-alt.wav   交替拼接，方便直接对比（旧/新/旧/新……）

用法：python scripts/eternal-signal/ab_voice.py
"""

import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_tts as G  # noqa: E402

BASE = G.BASE
TMP = os.path.join(BASE, ".tmp", "ab")
os.makedirs(TMP, exist_ok=True)

# 新的滤镜参数：距离不再靠砍低频
NEW_FX = {
    "cabin": dict(lo=95, hi=8600, hiss=-52, clip=1.25, flutter=0.0, drop=0.0),
    "link": dict(lo=175, hi=3400, hiss=-40, clip=1.6, flutter=0.0, drop=0.02),
    "deep": dict(lo=185, hi=2300, hiss=-31, clip=1.8, flutter=0.05, drop=0.12),
    "archive": dict(lo=215, hi=1900, hiss=-27, clip=1.9, flutter=0.075, drop=0.22),
    "ai": dict(lo=180, hi=2600, hiss=-56, clip=1.4, flutter=0.0, drop=0.0),
    "clean_link": dict(lo=150, hi=4800, hiss=-47, clip=1.2, flutter=0.0, drop=0.0),
}

# 三句代表性的台词：最窄的三档滤镜
LINES = [
    ("far", "我们还有……三千人……"),
    ("ground", "我们不知道。"),
    ("captain2", "我们一直朝着一个影子飞。"),
]


async def synth_one(role, text, idx):
    voice, rate, pitch = G.VOICES[role]
    mp3 = os.path.join(TMP, f"{idx}.mp3")
    raw = os.path.join(TMP, f"{idx}.wav")
    ok = await G.synth(text, voice, rate, pitch, mp3)
    if not ok:
        raise RuntimeError(f"合成失败：{text}")
    G.ffmpeg("-i", mp3, "-ac", "1", "-ar", str(G.SR), "-c:a", "pcm_s16le", raw)
    return G.load_wav(raw)


def stat(x):
    X = np.abs(np.fft.rfft(x))
    f = np.fft.rfftfreq(len(x), 1.0 / G.SR)
    tot = X.sum() + 1e-9
    return float(X[f < 300].sum() / tot * 100), float(X[f > 3000].sum() / tot * 100)


def main():
    olds, news = [], []
    print(f"{'台词':22} {'旧 <300Hz':>9} {'新 <300Hz':>9}")
    for i, (role, text) in enumerate(LINES):
        x = asyncio.run(synth_one(role, text, i))
        fx = G.FX[{"far": "archive", "ground": "link", "captain2": "deep"}[role]]
        o = G.apply_fx(x, role if role in G.FX else {"far": "archive", "ground": "link", "captain2": "deep"}[role],
                       text, params=fx)
        n = G.apply_fx(x, role if role in G.FX else {"far": "archive", "ground": "link", "captain2": "deep"}[role],
                       text, params=NEW_FX[{"far": "archive", "ground": "link", "captain2": "deep"}[role]])
        so, sn = stat(o), stat(n)
        print(f"{text[:20]:22} {so[0]:8.1f}% {sn[0]:8.1f}%      高频 {so[1]:.1f}% → {sn[1]:.1f}%")
        olds.append(o)
        news.append(n)

    gap = np.zeros(int(G.SR * 0.9), dtype=np.float32)

    def cat(parts):
        out = []
        for p in parts:
            out.extend([p, gap])
        return np.concatenate(out)

    G.save_wav(os.path.join(BASE, "out", "ab-old.wav"), cat(olds))
    G.save_wav(os.path.join(BASE, "out", "ab-new.wav"), cat(news))
    alt = []
    for o, n in zip(olds, news):
        alt.extend([o, gap, n, gap])
    G.save_wav(os.path.join(BASE, "out", "ab-alt.wav"), np.concatenate(alt))
    print("\n输出 out/ab-old.wav、out/ab-new.wav、out/ab-alt.wav")


if __name__ == "__main__":
    main()
