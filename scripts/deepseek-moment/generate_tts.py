# -*- coding: utf-8 -*-
"""
TTS 生成脚本 — 《DeepSeek 时刻》 Vox 风格纪录片
使用 edge-tts Python API，zh-CN-YunxiNeural
旁白用词做了拼音/口语化处理，避免英文缩写读得生硬。
"""
import asyncio
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import edge_tts
from mutagen.mp3 import MP3

VOICE = "en-US-ChristopherNeural"
RATE = "+2%"
# __file__ = scripts/deepseek-moment/generate_tts.py → 上溯 3 层 = 项目根
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
OUT_DIR = os.path.join(PROJECT_ROOT, "public", "deepseek-moment")

# 旁白脚本 — 与 src/DeepSeekMoment 的 SUBTITLE_TEXTS 对应（此处为 TTS 友好用词）
SCRIPTS = {
    "ds_s1": "On January 27, 2025, Nvidia lost 589 billion dollars in market value in a single day — the biggest one-day collapse in history. There was no bad news. Instead, a Chinese lab called DeepSeek released a free, open-source reasoning model, R1. Overnight, the whole AI industry had to redo the math.",
    "ds_s2": "This wasn't a tech giant. DeepSeek was founded in 2023, and its parent was a quant trading fund called High-Flyer. No splashy marketing, no venture hype — just a group of engineers quietly training big models in a server room in Hangzhou.",
    "ds_s3": "But it started with the worst hand. US export controls meant it could not buy the top AI chips, only restricted models. And because it could not get the best cards, it had to squeeze every ounce of compute. The limit became its strongest weapon.",
    "ds_s4": "In late 2024, DeepSeek released V3 and revealed a number that stunned the industry. Its reported training cost was about five point six million dollars. To match that, American labs often spend hundreds of millions. The comparison hit the industry like a stone in a still lake.",
    "ds_s5": "The secret wasn't brute force — it was architecture. A mixture of experts model activates only part of its parameters per token. Multi-head latent attention cut memory overhead. And GRPO let it skip the tedious SFT stage and train with pure reinforcement learning. One clever structure saved the cost of thousands of chips.",
    "ds_s6": "Then came the real detonator. January 2025. R1 launched, matching OpenAI's top reasoning model, completely open source, with an API ridiculously cheap. Within days it hit the top of the App Store, and developers around the world rushed in.",
    "ds_s7": "And so came the moment. One open source model, almost overnight, made the market question the assumption that more compute is always better. Nvidia's stock did not fall because it was bad. It fell because, for the first time, people realized it might not have to be so expensive.",
    "ds_s8": "DeepSeek's story is not a Chinese company catching up to America. It is a small team using one open model to reshuffle a trillion dollar compute narrative. When needing less becomes possible, the real rules of this race are only starting to be rewritten.",
}


async def generate_one(key: str, text: str, tries: int = 3):
    out_path = os.path.join(OUT_DIR, f"{key}.mp3")
    os.makedirs(OUT_DIR, exist_ok=True)
    for attempt in range(1, tries + 1):
        try:
            communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
            await communicate.save(out_path)
            size = os.path.getsize(out_path)
            if size == 0:
                raise RuntimeError("empty audio")
            print(f"  生成: {key}.mp3 ({size} bytes)")
            return
        except Exception as e:  # 限流/网络偶发 → 重试
            print(f"  尝试 {attempt}/{tries} 失败: {type(e).__name__}: {e}")
            await asyncio.sleep(2.5 * attempt)
    raise RuntimeError(f"{key} 生成失败")


async def main():
    print(f"输出目录: {OUT_DIR}")
    print(f"音色: {VOICE}, 语速: {RATE}\n")

    for key, text in SCRIPTS.items():
        await generate_one(key, text)
        await asyncio.sleep(1.5)  # 防限流

    # 用 mutagen 精确测量时长
    durations = {}
    print("\n时长统计:")
    total = 0.0
    for key in SCRIPTS:
        path = os.path.join(OUT_DIR, f"{key}.mp3")
        dur = MP3(path).info.length
        durations[key] = round(dur, 2)
        frames = int(dur * 30)
        print(f"  {key}: {dur:.2f}s  →  {frames}f  (+30f缓冲 = {frames+30}f)")
        total += dur
    print(f"\n  总时长: {total:.1f}s")

    out_json = os.path.join(OUT_DIR, "durations_deepseek.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    print(f"\n已写入: {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
