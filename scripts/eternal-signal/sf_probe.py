# -*- coding: utf-8 -*-
"""
探测 SiliconFlow 上可用的 TTS 音色，并生成试听样音。

用法：
    python scripts/eternal-signal/sf_probe.py
    python scripts/eternal-signal/sf_probe.py --line "我们不知道。"
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(BASE, ".tmp", "tts")
os.makedirs(OUT, exist_ok=True)


def load_env():
    env = {}
    p = os.path.join(BASE, ".env")
    if os.path.exists(p):
        for ln in open(p, encoding="utf-8"):
            ln = ln.strip()
            if not ln or ln.startswith("#") or "=" not in ln:
                continue
            k, v = ln.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()
KEY = os.environ.get("SILICONFLOW_API_KEY") or ENV.get("SILICONFLOW_API_KEY", "")
API = (os.environ.get("SILICONFLOW_BASE") or ENV.get("SILICONFLOW_BASE", "https://api.siliconflow.cn/v1")).rstrip("/")

CANDIDATES = [
    ("FunAudioLLM/CosyVoice2-0.5B", v) for v in
    ["alex", "anna", "bella", "benjamin", "charles", "claire", "david", "diana"]
] + [
    ("fnlp/MOSS-TTSD-v0.5", v) for v in
    ["speaker_1", "speaker_2", "speaker_3", "speaker_4"]
]


def synth(model, voice, text, path, speed=0.95, tries=3):
    """接口偶发 500，重试几次再用。"""
    import time

    last = "未知"
    for i in range(tries):
        ok, info = _synth_once(model, voice, text, path, speed)
        if ok:
            return ok, info
        last = info
        if "500" not in str(info):
            break
        time.sleep(1.5 * (i + 1))
    return False, last


def _synth_once(model, voice, text, path, speed):
    body = json.dumps(
        {
            "model": model,
            "voice": f"{model}:{voice}",
            "input": text,
            "response_format": "mp3",
            "speed": speed,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{API}/audio/speech",
        data=body,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        if len(data) < 2000:
            return False, "返回过小"
        open(path, "wb").write(data)
        return True, len(data)
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode("utf-8")).get("message", "")
        except Exception:  # noqa: BLE001
            msg = ""
        return False, f"HTTP {e.code} {msg}"
    except Exception as e:  # noqa: BLE001
        return False, f"{type(e).__name__} {e}"


def to_wav(src, dst):
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src,
         "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", dst],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--line", default="我们不知道。")
    a = ap.parse_args()

    if not KEY:
        print("没有找到 SILICONFLOW_API_KEY")
        sys.exit(1)

    ok_list = []
    print(f"测试台词：{a.line}\n")
    print(f"{'音色':28} {'结果':>10}  时长")
    for model, voice in CANDIDATES:
        mp3 = os.path.join(OUT, f"{voice}.mp3")
        wav = os.path.join(OUT, f"{voice}.wav")
        ok, info = synth(model, voice, a.line, mp3)
        if not ok:
            print(f"{model.split('/')[-1]}:{voice:12} {'失败':>10}  {info}")
            continue
        to_wav(mp3, wav)
        dur = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav],
            capture_output=True, text=True).stdout.strip() or 0)
        print(f"{model.split('/')[-1]}:{voice:12} {'OK':>10}  {dur:.2f}s")
        ok_list.append((voice, wav))

    print(f"\n可用 {len(ok_list)} 个，样音在 .tmp/tts/")
    return ok_list


if __name__ == "__main__":
    main()
