# -*- coding: utf-8 -*-
"""
《永不消逝的电波》· 电台体 —— 多音色配音 / 电台滤镜 / 时间轴生成

用法：
    python scripts/eternal-signal/generate_tts.py            # 全部重生成
    python scripts/eternal-signal/generate_tts.py --reuse     # 复用已有 wav，只重算时间轴
    python scripts/eternal-signal/generate_tts.py --only-sfx  # 只生成底噪 / 爆炸

设计要点（与科普视频的做法不同）：
  1. 一行一个音频文件。广播剧每行的音色、带宽、断裂位置都不同，不能整段合成。
  2. 音色不是"角色身份证"，是"距离尺"：同一音色，越远越低、越慢、越窄。
     所以 captain 与 captain2 共用 Yunjian，只降 pitch。
  3. "兹"不念。噪声由 numpy 在频域里做：带通、嘶声、断裂、静噪咔。
  4. 所有随机量用文本哈希做种子，重跑结果一致。

输出：
    public/eternal-signal/vo/<scene>-<nn>.wav
    public/eternal-signal/bed.wav       （12s 无缝底噪，频域合成，整周期）
    public/eternal-signal/boom.wav      （F 幕点火）
    src/EternalSignal/timeline.ts
"""

import argparse
import asyncio
import hashlib
import json
import os
import random
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script_data import SCENES  # noqa: E402

import edge_tts  # noqa: E402

SR = 48000
FPS = 30
PROVIDER = os.environ.get("TTS_PROVIDER", "siliconflow")
RATE_LIMIT = 3
MAX_RETRIES = 6
RETRY_BASE = 3.0

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(BASE, "public", "eternal-signal")
VO = os.path.join(PUB, "vo")
TMPV = os.path.join(BASE, ".tmp", "vo")
TS_PATH = os.path.join(BASE, "src", "EternalSignal", "timeline.ts")
META_PATH = os.path.join(PUB, "meta.json")

# ---------------------------------------------------------------- 声部

# 音色是"距离尺"，不是身份证。同一副嗓子，越远越低、越慢、越窄。
#
# CosyVoice2 没有 pitch 参数，所以"低"用离线变速做：shift<1 即降调并略延长，
# 再用 atempo 把时长拉回原样（见 pitch_shift）。
#
# 两组刻意的"同一副嗓子"：
#   ground / elder —— 几万年前通报"太阳已经死亡"，几万年后哄孩子睡觉
#   captain / captain2 —— 同一条文明的接力，后者只低一代、慢一代
ROLES = {
    "nicolai":  dict(voice="alex",     speed=0.94, shift=1.00),
    "ground":   dict(voice="benjamin", speed=1.00, shift=1.00),
    "captain":  dict(voice="charles",  speed=0.98, shift=0.97),
    "captain2": dict(voice="charles",  speed=0.90, shift=0.92),
    "crew":     dict(voice="david",    speed=1.06, shift=1.00),
    "colonist": dict(voice="claire",   speed=0.95, shift=1.00),
    "elder":    dict(voice="benjamin", speed=0.90, shift=0.96),
    "ai":       dict(voice="bella",    speed=1.04, shift=1.02),
    "far":      dict(voice="anna",     speed=0.86, shift=0.95),
}

SF_MODEL = "FunAudioLLM/CosyVoice2-0.5B"

# 备用引擎：edge-tts（--provider edge）
EDGE_VOICES = {
    "nicolai": ("zh-CN-YunxiNeural", "-10%", "-30Hz"),
    "ground": ("zh-CN-YunyangNeural", "+2%", "+0Hz"),
    "captain": ("zh-CN-YunjianNeural", "-6%", "-20Hz"),
    "captain2": ("zh-CN-YunjianNeural", "-14%", "-55Hz"),
    "crew": ("zh-CN-YunjianNeural", "+6%", "+10Hz"),
    "colonist": ("zh-CN-XiaoxiaoNeural", "-8%", "-5Hz"),
    "elder": ("zh-CN-YunyangNeural", "-14%", "-40Hz"),
    "ai": ("zh-CN-YunxiaNeural", "+4%", "-60Hz"),
    "far": ("zh-CN-XiaoxiaoNeural", "-22%", "-45Hz"),
}

# fx -> 处理参数。lo/hi 是带通，hiss 是嘶声电平(dBFS)，clip 是软削波量，
# flutter 是磁带抖动深度，drop 是断裂概率。
#
# 关键修正：旧版用"砍低频"表达距离（deep 低切 560Hz），而男声基频只有 85–180Hz，
# 等于把胸腔切掉——实测低频能量只剩 2.4%，听起来是电话音，不是远方。
# 现在低切降到基频之上一点点，距离改用"收窄高频 + 抬高底噪 + 磁带衰落 + 断裂"。
FX = {
    "cabin": dict(lo=95, hi=8600, hiss=-52, clip=1.25, flutter=0.0, drop=0.0),
    "link": dict(lo=175, hi=3400, hiss=-40, clip=1.6, flutter=0.0, drop=0.02),
    "deep": dict(lo=185, hi=2300, hiss=-31, clip=1.8, flutter=0.05, drop=0.12),
    "archive": dict(lo=215, hi=1900, hiss=-27, clip=1.9, flutter=0.075, drop=0.22),
    "ai": dict(lo=180, hi=2600, hiss=-56, clip=1.4, flutter=0.0, drop=0.0),
    "clean_link": dict(lo=150, hi=4800, hiss=-47, clip=1.2, flutter=0.0, drop=0.0),
}


def rng_for(text, salt=""):
    seed = int(hashlib.md5((text + salt).encode("utf-8")).hexdigest()[:8], 16)
    return np.random.default_rng(seed)


# ---------------------------------------------------------------- 信号处理


def bandpass(x, lo, hi):
    """在频域做 24 dB/oct 带通，比 IIR 好写且不会有相位爆音。"""
    n = len(x)
    if n == 0:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    g = 1.0 / (1.0 + (lo / np.maximum(f, 1.0)) ** 4)
    g *= 1.0 / (1.0 + (f / hi) ** 4)
    return np.fft.irfft(X * g, n).astype(np.float32)


def rms(x):
    return float(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-12)


def click(amp=0.42, dur=0.035):
    """静噪开合的"咔"：极短噪声爆发 + 指数衰减。电台的呼吸。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.007)
    return (bandpass(np.random.randn(n).astype(np.float32), 420, 3200) * env * amp).astype(
        np.float32
    )


def apply_fx(x, name, seed_text, params=None):
    p = params or FX[name]
    y = bandpass(x, p["lo"], p["hi"])

    # 软削波：单边带解调后的那种"压得发紧"的声音
    k = p["clip"]
    y = np.tanh(y * k) / np.tanh(k)

    # 磁带抖动：慢速幅度调制
    if p["flutter"] > 0:
        t = np.arange(len(y)) / SR
        y = y * (1.0 + p["flutter"] * np.sin(2 * np.pi * 0.72 * t + 1.1))

    # 环形调制感：航行电脑的金属味
    if name == "ai":
        t = np.arange(len(y)) / SR
        y = y * (0.55 + 0.45 * np.sin(2 * np.pi * 38 * t))

    # 归一化到 -19 dBFS 再叠嘶声
    y = y / (rms(y) + 1e-9) * (10 ** (-19 / 20))

    r = rng_for(seed_text, "hiss")
    hiss = r.standard_normal(len(y)).astype(np.float32)
    hiss = bandpass(hiss, max(120, p["lo"] * 0.6), p["hi"] * 1.15)
    hiss = hiss / (rms(hiss) + 1e-9) * (10 ** (p["hiss"] / 20))
    y = y + hiss

    # 断裂：句中被吞掉一块，接噪声再接回来。越到后面越密
    if p["drop"] > 0:
        r2 = rng_for(seed_text, "drop")
        n_holes = 1 if r2.random() < 0.5 + p["drop"] * 2 else 2
        for _ in range(n_holes):
            if r2.random() > p["drop"]:
                continue
            w = int(SR * r2.uniform(0.05, 0.13))
            s = int(SR * r2.uniform(0.22, 0.78) * max(0, len(y) - w))
            if s + w < len(y):
                fill = (r2.standard_normal(w).astype(np.float32)) * 10 ** (-30 / 20)
                y[s : s + w] = fill

    # 静噪开合
    y = np.concatenate([click(), y, click(amp=0.34)])

    # 峰值限制
    peak = float(np.max(np.abs(y)))
    if peak > 0.95:
        y = y / peak * 0.95
    return y.astype(np.float32)


# ---------------------------------------------------------------- 读写


def load_wav(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        data = w.readframes(n)
    return np.frombuffer(data, dtype="<i2").astype(np.float32) / 32768.0


def save_wav(path, x):
    d = np.clip(x, -1.0, 1.0)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((d * 32767).astype("<i2").tobytes())


def ffmpeg(*args):
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
        check=True,
    )


# ---------------------------------------------------------------- 合成


async def synth(text, voice, rate, pitch, out_mp3, timeout=75):
    for attempt in range(1, MAX_RETRIES + 1):
        try:

            async def _run():
                com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                with open(out_mp3, "wb") as f:
                    async for chunk in com.stream():
                        if chunk["type"] == "audio":
                            f.write(chunk["data"])

            await asyncio.wait_for(_run(), timeout=timeout)
            return True
        except Exception as e:  # noqa: BLE001
            if attempt == MAX_RETRIES:
                print(f"  [FAIL] {os.path.basename(out_mp3)}: {type(e).__name__} {e}")
                return False
            await asyncio.sleep(RETRY_BASE * attempt + random.uniform(0, 1.5))
    return False


# ---------------------------------------------------------------- SiliconFlow


def load_dotenv():
    """读项目根的 .env。key 不写进脚本，避免跟仓库一起走。"""
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


_DOTENV = load_dotenv()
SF_KEY = os.environ.get("SILICONFLOW_API_KEY") or _DOTENV.get("SILICONFLOW_API_KEY", "")
SF_BASE = (
    os.environ.get("SILICONFLOW_BASE")
    or _DOTENV.get("SILICONFLOW_BASE", "https://api.siliconflow.cn/v1")
).rstrip("/")


def synth_sf(text, voice, speed, out_mp3, timeout=90):
    """SiliconFlow 的 /audio/speech。注意它只出 22050Hz 单声道 MP3，response_format 不生效。"""
    import time
    import urllib.error
    import urllib.request

    body = json.dumps(
        {
            "model": SF_MODEL,
            "voice": f"{SF_MODEL}:{voice}",
            "input": text,
            "response_format": "mp3",
            "speed": speed,
        },
        ensure_ascii=False,
    ).encode("utf-8")

    last = ""
    for attempt in range(1, MAX_RETRIES + 1):
        req = urllib.request.Request(
            f"{SF_BASE}/audio/speech",
            data=body,
            headers={"Authorization": f"Bearer {SF_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
            if len(data) < 2000:
                last = f"返回过小 ({len(data)}B)"
            else:
                with open(out_mp3, "wb") as f:
                    f.write(data)
                return True
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read().decode("utf-8")).get("message", "")
            except Exception:  # noqa: BLE001
                msg = ""
            last = f"HTTP {e.code} {msg}"
            # 4xx 除了限流，重试没意义
            if 400 <= e.code < 500 and e.code != 429:
                break
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__} {e}"
        time.sleep(RETRY_BASE * attempt + random.uniform(0, 1.2))

    print(f"  [FAIL] {os.path.basename(out_mp3)}: {last}")
    return False


def pitch_shift(src, dst, shift):
    """
    离线降调：asetrate 把采样率按 shift 缩放（音高变、时长也变），
    再用 atempo=1/shift 把时长拉回原样。shift<1 就是"更低、但不变慢"。
    """
    if abs(shift - 1.0) < 1e-3:
        os.replace(src, dst)
        return
    ffmpeg(
        "-i", src,
        "-filter:a", f"asetrate={int(SR * shift)},atempo={1.0 / shift:.6f},aresample={SR}",
        "-ac", "1", "-c:a", "pcm_s16le", dst,
    )


# ---------------------------------------------------------------- 底噪 / 爆炸


def make_bed(path, secs=12.0):
    """频域合成底噪：随机相位 + 指定幅度谱 → 天然整周期，循环无缝。"""
    n = int(SR * secs)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    r = np.random.default_rng(20261108)

    # 短波底噪：低频滚降、3 kHz 以上更快衰减
    amp = 1.0 / (1.0 + (f / 2600.0) ** 2.2)
    amp *= 1.0 / (1.0 + (90.0 / np.maximum(f, 1.0)) ** 2.0)
    phase = r.uniform(0, 2 * np.pi, len(f))
    spec = amp * np.exp(1j * phase)
    x = np.fft.irfft(spec, n).astype(np.float32)
    x = x / (rms(x) + 1e-9) * 10 ** (-30 / 20)

    # 极弱的载波啸叫：让"有人开着机器"这件事一直成立
    t = np.arange(n) / SR
    x += (0.0055 * np.sin(2 * np.pi * 1180 * t)).astype(np.float32)
    save_wav(path, x)


def make_boom(path):
    """点火：次低频扫频 + 噪声爆发 + 长尾。3.5 秒。"""
    dur = 3.5
    n = int(SR * dur)
    t = np.arange(n) / SR
    r = np.random.default_rng(1776)

    # 次低频：90 Hz 滑到 28 Hz
    f0, f1 = 90.0, 28.0
    sweep = f0 * (f1 / f0) ** (t / dur)
    sub = np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.exp(-t / 0.85)

    # 噪声爆发：前 0.5 秒
    nz = r.standard_normal(n).astype(np.float32)
    nz = bandpass(nz, 30, 2200)
    nz = nz / (rms(nz) + 1e-9) * np.exp(-t / 0.55) * 0.55

    x = (sub * 0.85 + nz).astype(np.float32)
    x /= max(1e-6, float(np.max(np.abs(x)))) / 0.95
    save_wav(path, x)


# ---------------------------------------------------------------- 主流程


def build_timeline(durations):
    """把秒换成帧，算出每幕与每行的绝对位置。"""
    lines_out = []
    scenes_out = []
    cursor = 0.0
    idx_global = 0

    for sc in SCENES:
        sid = sc["id"]
        start = cursor
        t = cursor + sc.get("pad_head", 0.0)
        line_i = 0
        for item in sc["items"]:
            if item["t"] == "beat":
                t += item["dur"]
                continue
            key = f"{sid}-{line_i:02d}"
            dur = durations.get(key)
            if dur is None:
                dur = max(1.2, len(item["text"]) * 0.19)
            lines_out.append(
                {
                    "scene": sid,
                    "role": item["role"],
                    "fx": item["fx"],
                    "text": item["text"],
                    "src": f"eternal-signal/vo/{key}.wav",
                    "start": round(t * FPS),
                    "end": round((t + dur) * FPS),
                    "sec": round(dur, 3),
                }
            )
            t += dur + item.get("gap", 0.35)
            line_i += 1
            idx_global += 1
        t += sc.get("pad_tail", 0.0)
        scenes_out.append(
            {
                "id": sid,
                "name": sc["name"],
                "start": round(start * FPS),
                "frames": round((t - start) * FPS),
            }
        )
        cursor = t

    total = round(cursor * FPS)
    return lines_out, scenes_out, total


def write_ts(lines, scenes, total):
    def esc(s):
        return s.replace("\\", "\\\\").replace('"', '\\"')

    out = [
        "// AUTO-GENERATED by scripts/eternal-signal/generate_tts.py — 不要手改。",
        '// 重新生成："C:/Program Files/Python310/python.exe" scripts/eternal-signal/generate_tts.py',
        "",
        "export type Role =",
        "  | \"nicolai\"",
        "  | \"ground\"",
        "  | \"captain\"",
        "  | \"captain2\"",
        "  | \"crew\"",
        "  | \"colonist\"",
        "  | \"elder\"",
        "  | \"ai\"",
        "  | \"far\";",
        "",
        "export type Fx = \"cabin\" | \"link\" | \"deep\" | \"archive\" | \"ai\" | \"clean_link\";",
        "",
        "export interface LineCue {",
        "  scene: string;",
        "  role: Role;",
        "  fx: Fx;",
        "  text: string;",
        "  /** staticFile() 路径 */",
        "  src: string;",
        "  /** 绝对帧 */",
        "  start: number;",
        "  end: number;",
        "}",
        "",
        "export interface SceneCue {",
        "  id: string;",
        "  name: string;",
        "  start: number;",
        "  frames: number;",
        "}",
        "",
        "export const LINES: LineCue[] = [",
    ]
    for ln in lines:
        out.append(
            "  { scene: \"%s\", role: \"%s\", fx: \"%s\", src: \"%s\", start: %d, end: %d, text: \"%s\" },"
            % (ln["scene"], ln["role"], ln["fx"], ln["src"], ln["start"], ln["end"], esc(ln["text"]))
        )
    out += ["];", "", "export const SCENES: SceneCue[] = ["]
    for sc in scenes:
        out.append(
            '  { id: "%s", name: "%s", start: %d, frames: %d },'
            % (sc["id"], sc["name"], sc["start"], sc["frames"])
        )
    out += [
        "];",
        "",
        "export const AUDIO_BED = \"eternal-signal/bed.wav\";",
        "export const AUDIO_BOOM = \"eternal-signal/boom.wav\";",
        "",
        f"export const TOTAL_FRAMES = {total};",
        "",
    ]
    with open(TS_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out))


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reuse", action="store_true")
    ap.add_argument("--only-sfx", action="store_true")
    ap.add_argument("--only", nargs="*", default=None)
    ap.add_argument("--provider", choices=["siliconflow", "edge"], default="siliconflow")
    args = ap.parse_args()

    global PROVIDER
    PROVIDER = args.provider
    if PROVIDER == "siliconflow" and not SF_KEY:
        print("缺少 SILICONFLOW_API_KEY（写进 .env 或设环境变量）")
        return
    print(f"引擎：{PROVIDER}")

    os.makedirs(VO, exist_ok=True)
    os.makedirs(TMPV, exist_ok=True)

    meta = {}
    if os.path.exists(META_PATH):
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)

    if not args.only_sfx:
        jobs = []
        for sc in SCENES:
            li = 0
            for item in sc["items"]:
                if item["t"] != "line":
                    continue
                key = f"{sc['id']}-{li:02d}"
                li += 1
                if args.only and key not in args.only:
                    continue
                jobs.append((key, item))

        sem = asyncio.Semaphore(RATE_LIMIT)
        lock = asyncio.Lock()

        async def work(key, item):
            wav = os.path.join(VO, key + ".wav")
            if args.reuse and os.path.exists(wav):
                x = load_wav(wav)
                async with lock:
                    meta[key] = {"dur": round(len(x) / SR, 3), "text": item["text"]}
                print(f"[{key}] reuse  {len(x) / SR:5.2f}s  {item['text'][:18]}")
                return

            # 临时文件放 .tmp，且不删除：沙箱的批量删除守卫会在 os.remove 上掐掉进程
            mp3 = os.path.join(TMPV, key + ".mp3")
            raw = os.path.join(TMPV, key + ".raw.wav")
            shifted = os.path.join(TMPV, key + ".shift.wav")

            if PROVIDER == "siliconflow":
                r = ROLES[item["role"]]
                async with sem:
                    ok = await asyncio.to_thread(
                        synth_sf, item["text"], r["voice"], r["speed"], mp3
                    )
                if not ok:
                    return
                ffmpeg("-i", mp3, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", raw)
                # 降调在滤镜之前做：先把"距离"压进嗓子，再压进频带
                pitch_shift(raw, shifted, r["shift"])
            else:
                voice, rate, pitch = EDGE_VOICES[item["role"]]
                async with sem:
                    ok = await synth(item["text"], voice, rate, pitch, mp3)
                if not ok:
                    return
                ffmpeg("-i", mp3, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", shifted)

            x = load_wav(shifted)
            y = apply_fx(x, item["fx"], item["text"])
            save_wav(wav, y)
            async with lock:
                meta[key] = {"dur": round(len(y) / SR, 3), "text": item["text"]}
                with open(META_PATH, "w", encoding="utf-8") as f:
                    json.dump(meta, f, ensure_ascii=False, indent=2)
            print(f"[{key}] {item['role']:<9} {len(y) / SR:5.2f}s  {item['text'][:22]}")

        await asyncio.gather(*(work(k, it) for k, it in jobs))

    # 底噪与爆炸
    make_bed(os.path.join(PUB, "bed.wav"))
    make_boom(os.path.join(PUB, "boom.wav"))
    print("底噪 / 爆炸 已生成")

    durations = {k: v["dur"] for k, v in meta.items()}
    lines, scenes, total = build_timeline(durations)
    write_ts(lines, scenes, total)

    print(f"\n=== {len(scenes)} 幕 / {len(lines)} 行 / {total} 帧 ({total / FPS:.1f}s) ===")
    for sc in scenes:
        print(f"  {sc['id']} {sc['name']:<6} {sc['start']:>6}f  {sc['frames']:>5}f  ({sc['frames'] / FPS:5.1f}s)")
    print(f"  timeline -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
