"""
Generate TTS audio for DualVectorFoil video using edge-tts Python API.
Usage: python -X utf8 scripts/dual-vector-foil/generate_tts.py
"""
import asyncio
import json
import os
import subprocess
import sys

# ─── 配置 ─────────────────────────────────────────
VOICE = "zh-CN-YunxiNeural"
OUT_DIR = "public/dual-vector-foil"
DURATIONS_FILE = os.path.join(OUT_DIR, "durations.json")

# ─── 纪录片旁白 ───────────────────────────────────
SCRIPT = (
    "在黑暗森林威慑建立之后，人类启动了掩体计划。"
    "他们在木星、土星等巨行星的阴影中建造太空城市，以为这样就能躲避来自高等文明的打击。"
    "然而他们不知道，真正的末日远比想象中更加彻底。"
    "那一天，歌者向太阳系投下了一枚二向箔。"
    "它看起来只是一张薄如蝉翼的半透明纸片，却能将三维空间不可逆转地坍缩为二维。"
    "二维化从太阳系边缘开始，如瘟疫般蔓延。"
    "行星一个一个被吸入那无底的平面，在无限的光滑表面上留下它们生前的轮廓。"
    "太阳是最后一个被二维化的，它在平面上展开了——"
    "核心、辐射层、对流层、光球层，像一幅在上帝画板上绘成的画。最壮丽，也最恐怖。"
    "地球也在二维空间中展开，像一只巨眼的虹膜。"
    "蓝色的大洋、褐色的大陆、白色的云层，都精致地画在那个圆盘上。"
    "太空城市里的人类也被展开成二维的图案，生命的最后印记凝固在无限延伸的平面上。"
    "那是坟墓，也是纪念碑，是人类文明最宏伟的墓志铭。"
)

FFPROBE = os.path.join(
    "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)
if not os.path.exists(FFPROBE):
    FFPROBE = "ffprobe"


async def generate_tts(text: str, out_path: str):
    """使用 edge_tts Python API 生成 MP3 文件"""
    import edge_tts

    print(f"  Generating narration ({len(text)} chars)...")
    communicate = edge_tts.Communicate(text, VOICE, rate="+5%")
    await communicate.save(out_path)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  OK: narration.mp3 ({size_kb:.1f} KB)")
    return True


def get_duration_seconds(filepath: str) -> float:
    try:
        from mutagen.mp3 import MP3
        audio = MP3(filepath)
        return audio.info.length
    except Exception:
        pass

    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=15, check=True,
        )
        return float(result.stdout.strip())
    except Exception as e:
        print(f"  ERROR: Cannot get duration for {filepath}: {e}")
        raise


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    print("\n" + "=" * 55)
    print("  DualVectorFoil TTS Generator")
    print(f"  Voice: {VOICE}  |  Rate: +5%")
    print("=" * 55 + "\n")

    out_path = os.path.join(OUT_DIR, "narration.mp3")
    try:
        await generate_tts(SCRIPT, out_path)
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)

    print("\n  Calculating duration...")
    dur = get_duration_seconds(out_path)
    print(f"  Duration: {dur:.2f}s  |  Frames (30fps): {int(dur * 30)}")

    durations = {"narration": round(dur, 2)}
    with open(DURATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)

    print(f"\n  Done. Audio: {out_path}")
    print(f"  Total frames needed: {int(dur * 30)}")


if __name__ == "__main__":
    asyncio.run(main())
