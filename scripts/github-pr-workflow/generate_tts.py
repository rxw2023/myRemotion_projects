"""
Generate TTS audio for GitHubPRWorkflow video using edge-tts Python API.
Usage: python -X utf8 scripts/github-pr-workflow/generate_tts.py
"""
import asyncio
import json
import os
import subprocess
import sys

# ─── 配置 ─────────────────────────────────────────
VOICE = "zh-CN-XiaoyiNeural"
OUT_DIR = "public/github-pr-workflow"
DURATIONS_FILE = os.path.join(OUT_DIR, "durations_githubpr.json")

# ─── 旁白文案 ─────────────────────────────────────
SCRIPTS = {
    "githubpr_intro": (
        "今天我们来聊聊GitHub的正确打开方式。"
        "从Fork到Merge，一个完整的Pull Request工作流到底该怎么走？"
    ),
    "githubpr_fork": (
        "首先，你应该先Fork我的仓库，而不是直接clone。"
        "Fork会在你自己的账户下创建一份副本，这样你就有了完整的读写权限，不会影响原仓库。"
    ),
    "githubpr_branch": (
        "然后从develop分支checkout一个新的feature分支，比如叫feature/confession。"
        "记住，永远不要在main或develop分支上直接开发，功能分支隔离是关键。"
    ),
    "githubpr_code": (
        "接着把你的代码写出来，并为它写好单元测试和集成测试，"
        "确保代码覆盖率达到百分之九十五以上。"
        "没有测试的代码，谁敢合并？"
    ),
    "githubpr_lintcommit": (
        "跑一下Linter，通过所有的代码风格检查。"
        "然后commit，commit message要遵循Conventional Commits规范，"
        "比如feat: add confession feature。"
    ),
    "githubpr_pushpr": (
        "把这个分支push到你自己的远程仓库，然后提一个Pull Request。"
        "在PR描述里详细说明你的功能改动和实现思路，"
        "并且at我和至少两个其他的评审。"
    ),
    "githubpr_reviewmerge": (
        "我们会review你的代码，可能会留下一些评论，你需要解决所有的thread。"
        "等CI/CD流水线全部通过，并且拿到至少两个LGTM之后，"
        "我才会考虑把你的分支squash and merge到develop里，等待下一个版本发布。"
    ),
    "githubpr_wrongmain": (
        "你怎么能直接commit到我的main分支？GitHub上不是这样！"
        "main分支是保护分支，所有的改动都应该通过Pull Request进来。"
    ),
    "githubpr_wrongforce": (
        "怎么直接上来就想force push到main？GitHub上根本不是这样！"
        "force push会覆盖远程历史，别人的代码可能就丢了。我拒绝合并！"
    ),
    "githubpr_outro": (
        "回顾一下：Fork仓库，创建feature分支，写代码加测试，"
        "通过Lint，规范commit，提PR，通过review，squash and merge。"
        "记住这个流程，开源协作不迷路。点赞收藏关注，下期见。"
    ),
}

# ffprobe 路径
FFPROBE = os.path.join(
    "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"
)
if not os.path.exists(FFPROBE):
    FFPROBE = "ffprobe"


async def generate_tts(key: str, text: str, out_path: str):
    """使用 edge_tts Python API 生成 MP3 文件"""
    import edge_tts

    print(f"  Generating {key} ({len(text)} chars)...")
    communicate = edge_tts.Communicate(text, VOICE, rate="+8%")
    await communicate.save(out_path)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  OK: {key}.mp3 ({size_kb:.1f} KB)")
    return True


def get_duration_seconds(filepath: str) -> float:
    """用 mutagen 获取 MP3 精确时长，失败则回退 ffprobe"""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(filepath)
        return audio.info.length
    except Exception:
        import traceback
        print(f"  DEBUG: mutagen failed for {filepath}, falling back to ffprobe...")
        traceback.print_exc()

    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=15, check=True,
        )
        return float(result.stdout.strip())
    except Exception as e:
        import traceback
        print(f"  ERROR: Cannot get duration for {filepath}")
        traceback.print_exc()
        raise RuntimeError(f"Failed to determine duration for {filepath}") from e


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}

    print("\n" + "=" * 55)
    print("  GitHub PR Workflow TTS Generator")
    print(f"  Voice: {VOICE}  |  Rate: +8%")
    print("=" * 55 + "\n")

    for key, text in SCRIPTS.items():
        out_path = os.path.join(OUT_DIR, f"{key}.mp3")
        try:
            await generate_tts(key, text, out_path)
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  ERROR: {key} failed: {e}")
            print(f"  Retrying via CLI...")
            try:
                edge_cmd = os.path.join(
                    os.path.dirname(sys.executable), "Scripts", "edge-tts.exe"
                )
                if not os.path.exists(edge_cmd):
                    edge_cmd = "edge-tts"
                proc = await asyncio.create_subprocess_exec(
                    edge_cmd, "--voice", VOICE, "--text", text,
                    "--write-media", out_path, "--rate=+8%",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, stderr = await proc.communicate()
                if proc.returncode != 0:
                    print(f"  CLI also failed: {stderr.decode()}")
                    sys.exit(1)
                size_kb = os.path.getsize(out_path) / 1024
                print(f"  CLI OK: {key}.mp3 ({size_kb:.1f} KB)")
            except Exception as e2:
                print(f"  ALL methods failed for {key}: {e2}")
                sys.exit(1)

    print("\n" + "-" * 55)
    print("  Calculating durations...")
    print("-" * 55 + "\n")

    for key in SCRIPTS:
        path = os.path.join(OUT_DIR, f"{key}.mp3")
        dur = get_duration_seconds(path)
        durations[key] = round(dur, 2)
        print(f"  {key}: {dur:.2f}s")

    with open(DURATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(durations, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 55)
    print("  TTS Duration Summary (30fps)")
    print("=" * 55)
    total_frames = 0
    for key, dur in durations.items():
        frames = int(dur * 30)
        rec_frames = frames + 40
        total_frames += rec_frames
        print(f"  {key:<32s}  {dur:>5.1f}s  =  {frames:>4d}f  ->  rec: {rec_frames:>4d}f")
    total_frames += 54  # 9 fade transitions × 6f
    print(f"  {'(9 transitions)':<32s}  {'':>5s}     {'':>4s}     {'+54f':>6s}")
    print(f"  {'TOTAL':<32s}  {'':>5s}     {'':>4s}     {'':>9s}{total_frames:>4d}f")
    print("=" * 55 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
