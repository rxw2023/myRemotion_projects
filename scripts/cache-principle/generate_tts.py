"""
Generate TTS audio for CachePrinciple scenes using edge-tts (python API).
Output: public/cache-principle/ directory with mp3 files + duration metadata.

科普视频分镜（对应 csgraduates.com 组成原理·存储系统·Cache 章节）：
  1. 标题开场   —— 为什么需要缓存
  2. 原理       —— 缓存命中/未命中 + 局部性原理
  3. 概念       —— 缓存块 / 主存块 / 块内偏移
  4. 映射方式   —— 直接映射 / 全相联 / 组相联
  5. 地址结构   —— 标记 / 块匹配字段 / 块内地址
  6. 存储结构与替换 —— Valid/Tag/Dirty + LRU/FIFO
  7. 写策略     —— 直写/回写、写分配/非写分配
  8. 结尾总结
"""
import asyncio
import json
import os
import random

import edge_tts

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
RATE = "+8%"
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "cache-principle")
os.makedirs(OUT_DIR, exist_ok=True)

SCRIPTS = {
    "scene1_title": (
        "缓存。为什么你的电脑内存都有十六GB了，"
        "CPU却还要偷偷藏一个两百五十六KB的小仓库？"
        "因为内存太慢。缓存是一种临时存储数据的硬件，用来加速后续访问。"
        "今天我们就来聊透计算机组成原理的重点，Cache缓存。"
    ),
    "scene2_principle": (
        "缓存的工作原理，靠的是程序的局部性原理。"
        "时间局部性，刚刚用过的数据，很可能马上又会被用到，"
        "比如循环里的计数器。"
        "空间局部性，访问了一个数据，它附近的数据也很快会被用到，"
        "比如数组的连续遍历。"
        "基于这两条规律，缓存把常用数据提前放在CPU身边。"
    ),
    "scene3_concept": (
        "缓存里最小的存储单元叫缓存行，也叫缓存块，"
        "里面存的是主存块的一个副本。"
        "主存和缓存之间按块交换数据，一个块通常几十到一百多字节。"
        "块内偏移用来定位块内的具体字节，"
        "偏移位数等于log2块大小，比如64字节的块，偏移就是6位。"
    ),
    "scene4_mapping": (
        "主存块怎么放进缓存？有三种映射方式。"
        "直接映射，主存块号对缓存块数取模，只能放唯一的位置，"
        "硬件最简单，但容易冲突。"
        "全相联映射，可以放任意位置，命中率最高，"
        "但每次要和所有行比较标记，硬件最复杂。"
        "组相联映射是折中，先定位到组，组内N路随便放。"
        "比如256KB缓存，块大小64字节，一共4096个缓存块，"
        "四路组相联就是1024个组，"
        "第10000个主存块映射到第784组。"
    ),
    "scene5_address": (
        "访问缓存时，物理地址拆成三段："
        "块内地址、块匹配字段和标记。"
        "块内地址定位块内字节，位数由块大小决定。"
        "直接映射下，块匹配字段是缓存块号，位数是log2缓存块数；"
        "组相联下是组号，位数是log2组数；全相联下没有这个字段。"
        "标记用来判断是否命中，"
        "位数等于地址总位数减去前两段。"
    ),
    "scene6_replace": (
        "缓存行里存的不只是数据，还有元数据："
        "有效位标记这行有没有数据，"
        "标记字段用来比对，"
        "脏位记录有没有被改过，"
        "访问位为替换算法服务。"
        "当缓存满了，就需要替换算法，"
        "最常用的是LRU最近最少使用，"
        "还有FIFO先进先出和随机替换。"
        "直接映射不需要替换算法，冲突了直接覆盖。"
    ),
    "scene7_writepolicy": (
        "写操作要保证缓存和主存一致。"
        "命中时有两种策略："
        "直写法，每次写缓存同时写主存，简单但慢；"
        "回写法，只写缓存，等缓存块被替换时才写回主存，需要脏位。"
        "未命中时也有两种："
        "写分配法，先把主存块加载进缓存再写；"
        "非写分配法，不加载，直接写主存。"
        "记忆口诀：直写配非分配，偏向主存；回写配写分配，偏向缓存。"
    ),
    "scene8_hitrate": (
        "衡量缓存性能，核心指标是命中率。"
        "命中率等于命中次数除以总访问次数，"
        "缺失率就是1减去命中率。"
        "平均访问时间怎么算？"
        "用命中率乘以缓存访问时间，"
        "加上缺失率乘以主存访问时间。"
        "举个例子，缓存访问一个纳秒，主存访问十个纳秒，"
        "命中率百分之九十五，"
        "平均访问时间等于零点九五乘一，加零点零五乘十，"
        "等于一点四五纳秒。"
        "对比直接访问主存的十个纳秒，性能提升了将近七倍。"
        "所以缓存的价值，就藏在命中率里。"
    ),
    "scene9_outro": (
        "总结一下。"
        "缓存利用局部性原理，把常用数据放在CPU身边；"
        "映射方式决定主存块放哪；"
        "地址结构拆出标记、组号和偏移；"
        "替换算法管理空间；写策略保证一致性。"
        "Cache是408考研的必考重点，务必深入掌握。"
        "点赞收藏关注，我们下期再见。"
    ),
}


async def generate_tts(key, text, out_path):
    """Generate TTS audio using edge-tts python API, with retry + backoff."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
            await communicate.save(out_path)
            return out_path
        except Exception as e:
            if attempt == MAX_RETRIES:
                print(f"  [ERROR] {key}: {e}")
                return None
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.5)
            print(f"  (retry {attempt}/{MAX_RETRIES} after {delay:.1f}s: {e})", flush=True)
            await asyncio.sleep(delay)
    return None


def get_duration_sec(filepath):
    """Get audio duration using mutagen."""
    from mutagen.mp3 import MP3

    return MP3(filepath).info.length


async def main():
    # 可选：python generate_tts.py scene8_hitrate 只生成指定场景
    only_keys = set(sys.argv[1:]) if len(sys.argv) > 1 else None

    # 若只生成部分场景，先读取已有的 durations.json 保留其他时长
    meta_path = os.path.join(OUT_DIR, "durations.json")
    durations = {}
    if only_keys and os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            durations = json.load(f)

    for key, text in SCRIPTS.items():
        if only_keys and key not in only_keys:
            continue
        out_path = os.path.join(OUT_DIR, f"{key}.mp3")
        print(f"Generating: {key}...", end=" ", flush=True)
        result = await generate_tts(key, text, out_path)
        if result:
            dur = get_duration_sec(result)
            durations[key] = dur
            frames = round(dur * 30)
            print(f"OK ({dur:.2f}s, {frames}f)")
        else:
            print("FAILED")
        # 缓解 edge-tts 限流：场景之间稍作停顿
        await asyncio.sleep(1.0)

    # Write metadata
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    print(f"\nDurations saved to {meta_path}")

    # Summary
    total = sum(durations.values())
    total_frames = round(total * 30)
    print(f"\n=== Summary ===")
    print(f"Total TTS: {total:.2f}s ({total_frames}f @30fps)")
    for key, dur in durations.items():
        print(f"  {key}: {dur:.2f}s = {round(dur * 30)}f")
    print(f"\nSuggested scene durations (TTS + 40f padding):")
    for key, dur in durations.items():
        print(f"  {key}: {round(dur * 30) + 40}f")


if __name__ == "__main__":
    import sys

    asyncio.run(main())
