"""
良渚探秘 — TTS 配音生成脚本
使用 edge-tts Python API，zh-CN-YunxiNeural 语音
"""
import asyncio
import json
import os
import subprocess

# ==================== 配置 ====================
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "voice")
VOICE = "zh-CN-YunxiNeural"
RATE = "+8%"
FPS = 30

SCENES = [
    {
        "key": "lzh_title",
        "text": "良渚探秘。跨越千年，文明之光。",
    },
    {
        "key": "lzh_overview",
        "text": "良渚文化是中国新石器时代晚期高度发达的古文化，距今约五千三百至四千年。分布于太湖流域，被誉为实证中华五千年文明史的圣地。",
    },
    {
        "key": "lzh_mojiaoshan",
        "text": "良渚早期，距今约五千三百年。莫角山遗址是一处大型人工营建台地，发现有规模宏大的祭坛遗迹，反映了当时社会已具备高度组织能力。",
    },
    {
        "key": "lzh_fanshan",
        "text": "反山遗址是良渚早期的贵族墓地。出土了大量精美玉器，等级分明，表明当时社会已经出现了明显的阶级分化。",
    },
    {
        "key": "lzh_yaoshan_early",
        "text": "瑶山遗址是良渚早期的祭坛与墓葬复合遗址。出土了众多玉器，工艺精湛，展现了良渚先民高超的治玉技术。",
    },
    {
        "key": "lzh_maoshan",
        "text": "良渚晚期，距今约四千五百年。茅山遗址发现了大规模水稻田遗迹，证明良渚先民已拥有发达的稻作农业，为文明提供了坚实的物质基础。",
    },
    {
        "key": "lzh_huiguanshan",
        "text": "汇观山遗址和瑶山祭坛是良渚晚期的代表性遗址。出土了玉琮、玉璧等珍贵礼器，体现了良渚社会成熟的礼仪制度和信仰体系。",
    },
    {
        "key": "lzh_outro",
        "text": "良渚遗址是中华文明的重要源头。这里高度发达的古文化，为实证中华五千年文明史提供了坚实依据。感谢观看。",
    },
]


async def generate_scene(scene):
    """为单个场景生成 TTS MP3（带重试）"""
    out_path = os.path.join(OUTPUT_DIR, f"{scene['key']}.mp3")

    # 如果已存在且大于 1KB，跳过
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"  Skip (exists): {scene['key']}")
        # 仍需计算时长
        pass
    else:
        import edge_tts
        for attempt in range(5):
            try:
                print(f"  Generating: {scene['key']} (attempt {attempt+1}) ...")
                communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
                await communicate.save(out_path)
                if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
                    break
            except Exception as e:
                print(f"    Failed: {e}")
                if attempt < 4:
                    print(f"    Retrying in 3s...")
                    await asyncio.sleep(3)
                else:
                    raise

    # 获取时长
    ffprobe = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
    )
    if not os.path.exists(ffprobe):
        # fallback: try system ffprobe
        ffprobe = "ffprobe"

    result = subprocess.run(
        [ffprobe, "-v", "quiet", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1", out_path],
        capture_output=True, text=True
    )
    duration_sec = float(result.stdout.strip().split("=")[-1]) if result.stdout else 0
    duration_frames = int(duration_sec * FPS)
    print(f"    Duration: {duration_sec:.2f}s ({duration_frames} frames)")
    return {"key": scene["key"], "duration_sec": round(duration_sec, 2), "duration_frames": duration_frames, "text": scene["text"]}


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    durations = []

    for scene in SCENES:
        result = await generate_scene(scene)
        durations.append(result)

    # 写入 durations.json
    json_path = os.path.join(OUTPUT_DIR, "durations_lzh.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)
    print(f"\nDurations saved to {json_path}")

    # 打印汇总
    total_frames = sum(d["duration_frames"] for d in durations)
    print(f"\n=== Summary ===")
    for d in durations:
        print(f"  {d['key']}: {d['duration_frames']}f ({d['duration_sec']}s)")
    print(f"  Total TTS: {total_frames}f ({total_frames/FPS:.1f}s)")


if __name__ == "__main__":
    asyncio.run(main())
