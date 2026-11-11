# -*- coding: utf-8 -*-
"""
试音带：每个音色念同样几句，拼成一条，方便直接挑人。

输出：
    out/cast-male.wav     四个男声，依次是 alex / benjamin / charles / david
    out/cast-female.wav   四个女声，依次是 anna / bella / claire / diana
    .tmp/tts/<voice>.wav  每个音色单独一条

用法：python scripts/eternal-signal/sf_cast.py
"""

import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sf_probe import API, KEY, OUT, synth, to_wav  # noqa: E402

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000

MALE = ["alex", "benjamin", "charles", "david"]
FEMALE = ["anna", "bella", "claire", "diana"]

LINES_M = [
    "这里是倾听者。四八六零。",
    "太阳已经死亡。",
    "我们一直朝着一个影子飞。",
]
LINES_F = [
    "第七舱。妇女和儿童。",
    "剩下的，跟我们留在这里。",
    "我见过的地球，是别人讲给我的。",
]


def load(p):
    import wave

    with wave.open(p, "rb") as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768


def save(p, x):
    import wave

    d = np.clip(x, -1.0, 1.0)
    with wave.open(p, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((d * 32767).astype("<i2").tobytes())


def f0_median(x):
    """粗估基频：自相关。够判断"这是男中音还是男低音"。"""
    win, hop = int(SR * 0.04), int(SR * 0.02)
    est = []
    for s in range(0, len(x) - win, hop):
        seg = x[s : s + win]
        if np.sqrt((seg ** 2).mean()) < 0.02:
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, mode="full")[win - 1 :]
        lo, hi = int(SR / 400), int(SR / 70)
        if hi >= len(ac):
            continue
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.35 * ac[0]:
            est.append(SR / k)
    return float(np.median(est)) if est else 0.0


def build(voices, lines, out_name):
    gap = np.zeros(int(SR * 0.7), dtype=np.float32)
    big_gap = np.zeros(int(SR * 1.4), dtype=np.float32)
    parts = []
    print(f"\n{'音色':10} {'基频Hz':>7} {'重心Hz':>7} {'<300Hz':>7}")
    for v in voices:
        segs = []
        for i, text in enumerate(lines):
            mp3 = os.path.join(OUT, f"cast_{v}_{i}.mp3")
            ok, info = synth("FunAudioLLM/CosyVoice2-0.5B", v, text, mp3, speed=0.95)
            if not ok:
                print(f"{v:10} 失败 {info}")
                segs = []
                break
            wav = os.path.join(OUT, f"cast_{v}_{i}.wav")
            to_wav(mp3, wav)
            segs.append(load(wav))
        if not segs:
            continue
        merged = np.concatenate([s for seg in segs for s in (seg, gap)][:-1])
        save(os.path.join(OUT, f"{v}.wav"), merged)
        parts.extend([merged, big_gap])

        X = np.abs(np.fft.rfft(merged))
        f = np.fft.rfftfreq(len(merged), 1.0 / SR)
        tot = X.sum() + 1e-9
        print(f"{v:10} {f0_median(merged):7.0f} {float((X*f).sum()/tot):7.0f} "
              f"{float(X[f<300].sum()/tot*100):6.1f}%")

    whole = np.concatenate(parts[:-1])
    save(os.path.join(BASE, "out", out_name), whole)
    print(f"→ out/{out_name}  {len(whole)/SR:.1f}s")


if __name__ == "__main__":
    if not KEY:
        print("缺少 SILICONFLOW_API_KEY")
        sys.exit(1)
    print("男声顺序：" + " → ".join(MALE))
    build(MALE, LINES_M, "cast-male.wav")
    print("\n女声顺序：" + " → ".join(FEMALE))
    build(FEMALE, LINES_F, "cast-female.wav")
