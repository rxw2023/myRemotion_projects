# -*- coding: utf-8 -*-
"""
《像素到光子》音频素材生成器
============================

生成两类音频（全部输出到 public/gameCatEra/）：

1. 配音 vo/*.mp3 —— 用 edge-tts（微软 Edge 神经网络语音，需要联网）朗读解说词。
   12 个年代的解说词**直接从 src/GameCatEra/data.ts 里读**（正则抓 narration 字段），
   所以改了 data.ts 的字幕文案后重跑本脚本即可，不会出现字幕和配音不一致。

2. 底噪 sfx/static-crt.wav 与 sfx/air.wav —— 每个年代垫一点白噪音环境音。
   在频域里合成（随机相位 + 指定幅度谱），因此波形天然以整个文件为周期，循环无缝、不会有咔哒声。

用法：
    python scripts/gamecat-audio.py                 # 语音 + 底噪都生成
    python scripts/gamecat-audio.py --only-noise     # 只重新生成底噪
    python scripts/gamecat-audio.py --only-voice     # 只重新生成配音
    python scripts/gamecat-audio.py --voice zh-CN-YunyangNeural   # 换播音员

可选中文音色（edge-tts）：
    zh-CN-YunjianNeural   成熟男声，解说感强（默认）
    zh-CN-YunyangNeural   专业播音男声
    zh-CN-YunxiNeural     年轻男声，偏活泼
    zh-CN-XiaoxiaoNeural  温暖女声
    zh-CN-XiaoyiNeural    年轻女声
"""

import argparse
import asyncio
import re
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "GameCatEra" / "data.ts"
PUBLIC = ROOT / "public" / "gameCatEra"
VO_DIR = PUBLIC / "vo"
SFX_DIR = PUBLIC / "sfx"

SR = 48000

DEFAULT_VOICE = "zh-CN-YunjianNeural"
RATE = "-6%"  # 解说慢一点，更纪录片

# 封面与片尾的解说词（年代部分从 data.ts 读）
COVER_TEXT = "五十年，十二个年代，同一只橘猫。"
OUTRO_TEXT = "分辨率涨了几千倍，多边形涨了几万倍。唯一没变的，是那只猫。"


# ---------------------------------------------------------------- 解说词


def read_narrations() -> list[str]:
    """从 data.ts 里按出现顺序抓出 12 条 narration。"""
    src = DATA_TS.read_text(encoding="utf-8")
    found = re.findall(r'narration:\s*"([^"]+)"', src)
    if len(found) != 12:
        sys.exit(f"从 {DATA_TS} 里抓到 {len(found)} 条 narration，预期 12 条，请检查文件格式")
    return found


async def synth(text: str, voice: str, out: Path) -> None:
    import edge_tts

    out.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, voice, rate=RATE).save(str(out))
    print(f"  {out.relative_to(ROOT)}  <- {text}")


async def gen_voice(voice: str) -> None:
    narrations = read_narrations()
    print(f"配音音色：{voice}")
    await synth(COVER_TEXT, voice, VO_DIR / "cover.mp3")
    for i, text in enumerate(narrations):
        await synth(text, voice, VO_DIR / f"cat-{i:02d}.mp3")
    await synth(OUTRO_TEXT, voice, VO_DIR / "outro.mp3")


# ---------------------------------------------------------------- 底噪


def spectral_noise(n: int, shape: str, rng: np.random.Generator) -> np.ndarray:
    """在频域合成噪声：幅度谱按 shape 给，相位随机 => 以 n 为周期，循环无缝。"""
    half = n // 2 + 1
    freq = np.fft.rfftfreq(n, d=1.0 / SR)
    f = np.maximum(freq, 1.0)
    if shape == "white":
        mag = np.ones(half)
    elif shape == "pink":
        mag = 1.0 / np.sqrt(f)
    else:  # brown / 暗色房间底噪
        mag = 1.0 / f
    mag[0] = 0.0
    phase = rng.uniform(0, 2 * np.pi, half)
    spec = mag * np.exp(1j * phase)
    sig = np.fft.irfft(spec, n=n)
    return sig / (np.max(np.abs(sig)) or 1.0)


def make_static_crt() -> np.ndarray:
    """老 CRT 电视的电子底噪：宽带沙沙声 + 60Hz 电源哼声 + 偶发爆点。"""
    n = SR * 4
    rng = np.random.default_rng(2026)
    sig = spectral_noise(n, "white", rng) * 0.62
    sig += spectral_noise(n, "pink", rng) * 0.3

    t = np.arange(n) / SR
    hum = np.sin(2 * np.pi * 60 * t) * 0.1 + np.sin(2 * np.pi * 120 * t) * 0.05
    # 哼声也要无缝：60/120Hz 在 4 秒整数周期内成立，无需特殊处理
    sig += hum

    # 偶发爆点（快速衰减，不影响循环点）
    for _ in range(26):
        pos = int(rng.integers(0, n - 2000))
        env = np.exp(-np.arange(1200) / rng.uniform(60, 200))
        sig[pos : pos + 1200] += env * rng.uniform(0.25, 0.8) * rng.choice([-1, 1])

    sig = np.tanh(sig * 1.2)  # 轻微软削波，更像电子噪声
    return sig / (np.max(np.abs(sig)) or 1.0)


def make_air() -> np.ndarray:
    """现代场景的房间底噪 / 风声：低沉、没有高频沙沙。"""
    n = SR * 4
    rng = np.random.default_rng(77)
    sig = spectral_noise(n, "brown", rng) * 0.8 + spectral_noise(n, "pink", rng) * 0.2
    # 用缓慢起伏的音量包络做成"风"（包络本身也以 n 为周期）
    t = np.arange(n) / n
    env = 0.55 + 0.45 * np.sin(2 * np.pi * 2 * t) * np.sin(2 * np.pi * 1 * t)
    sig = sig * env
    return sig / (np.max(np.abs(sig)) or 1.0)


def write_wav(path: Path, sig: np.ndarray, peak_dbfs: float = -12.0) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = 10 ** (peak_dbfs / 20.0)
    pcm = np.clip(sig / (np.max(np.abs(sig)) or 1.0) * peak, -1.0, 1.0)
    data = (pcm * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"  {path.relative_to(ROOT)}  ({path.stat().st_size / 1024:.0f} KB, {len(sig) / SR:.1f}s)")


def gen_noise() -> None:
    print("底噪：")
    write_wav(SFX_DIR / "static-crt.wav", make_static_crt())
    write_wav(SFX_DIR / "air.wav", make_air())


# ---------------------------------------------------------------- main


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    ap.add_argument("--only-noise", action="store_true")
    ap.add_argument("--only-voice", action="store_true")
    args = ap.parse_args()

    if not args.only_voice:
        gen_noise()
    if not args.only_noise:
        asyncio.run(gen_voice(args.voice))


if __name__ == "__main__":
    main()
