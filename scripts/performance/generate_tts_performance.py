# -*- coding: utf-8 -*-
"""
TTS 生成脚本 — 计算机性能指标知识科普视频
使用 edge-tts Python API，zh-CN-YunxiNeural
"""
import asyncio
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-YunxiNeural"
RATE = "+8%"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "voice")

# 旁白脚本 — 纯中文，不含英文缩写
SCRIPTS = {
    "perf_title": "本节课我们来学习计算机性能指标。性能是衡量计算机好坏的核心标准，理解这些指标，才能真正读懂芯片参数。",
    "perf_scene1": "首先是时钟周期，它是中央处理器执行指令的最基本时间单位。计算机内部的晶体振荡器利用压电效应产生规律的脉冲信号，连续两个脉冲之间的间隔就是时钟周期。主频与时钟周期互为倒数——主频越高，时钟周期越短，处理器速度越快。三吉赫的处理器每秒完成三十亿个时钟周期。",
    "perf_scene2": "了解主频之后，我们再看四个执行效率指标。每周期时钟数，也叫西皮爱，表示执行一条指令平均需要多少个时钟周期；它的倒数叫每周期指令数。每秒指令数等于主频除以每周期时钟数，反映处理器每秒能跑多少条指令。当这个数值达到百万级别，就用每秒百万指令数来衡量，也就是常说的米普斯。",
    "perf_scene3": "对于图形处理器和人工智能芯片，我们用每秒浮点运算次数来衡量性能，简称弗洛普斯。从百万级到十亿级、万亿级，每升一级就是一千倍的提升。现代超算已经突破千万亿次每秒量级，而最新的人工智能加速器正在向百亿亿次每秒冲击。",
    "perf_scene4": "字长是处理器一次操作能处理的二进制位数，常见的有三十二位和六十四位。数据通路带宽决定处理器与内存之间每个时钟周期能传多少位数据。主存容量则和地址寄存器的位数直接相关，地址空间越大，需要的地址寄存器位数越多。以一百二十八千字节、按字寻址为例，可寻址范围是六万五千五百三十六，对应的地址寄存器位数就是十六位。",
    "perf_scene5": "最后来记住几个核心公式。主频等于一除以时钟周期；每周期指令数等于一除以每周期时钟数；每秒指令数等于主频除以每周期时钟数。这三个公式贯穿整章，考研选择题和解答题都会用到，一定要熟记。",
}


async def generate_one(key: str, text: str):
    out_path = os.path.join(OUT_DIR, f"{key}.mp3")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(out_path)
    print(f"  生成: {key}.mp3")


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"输出目录: {OUT_DIR}")
    print(f"音色: {VOICE}, 语速: {RATE}\n")

    for key, text in SCRIPTS.items():
        await generate_one(key, text)
        await asyncio.sleep(0.5)  # 防限流

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

    out_json = os.path.join(OUT_DIR, "durations_performance.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    print(f"\n已写入: {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
