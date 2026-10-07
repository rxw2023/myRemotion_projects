"""频道片头 10 秒音床 —— 全部由机器声合成，不用任何素材库。

为什么是机器声：片头的画面是"开机自检"，声音就必须是机器在走时钟。
120 BPM × 5 小节 = 正好 10.000 秒；每一拍 0.5 秒，每小节 2 秒。
所有事件都写在拍点或半拍上（grid-first，借鉴 RuiC-motion-reel 的
"时间网格先于镜头"），换掉音乐不需要改画面。

用法:
    python -X utf8 scripts/channel-intro/generate_intro_sfx.py
输出:
    public/channel/intro-10s.wav   (10.000s, 44.1kHz, 单声道)
"""

import os
import wave

import numpy as np

SR = 44100
DUR = 10.0
N = int(SR * DUR)
OUT = "public/channel/intro-10s.wav"

BPM = 120
BEAT = 60.0 / BPM  # 0.5s
BAR = 4 * BEAT  # 2.0s

rng = np.random.default_rng(20261007)
buf = np.zeros(N)


def at(sec):
    return int(round(sec * SR))


def add(sig, sec, gain=1.0):
    """把 sig 叠加到 sec 秒处，超出尾部自动截断。"""
    i = at(sec)
    if i >= N:
        return
    j = min(N, i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env(n, attack, decay, curve="exp"):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    d = np.exp(-t / max(decay, 1e-6)) if curve == "exp" else np.clip(1 - t / (decay * 5), 0, 1)
    return a * d


def onepole_lp(x, cutoff):
    a = min(2 * np.pi * cutoff / SR, 1.0)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def onepole_hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def click(dur=0.05, cutoff=3800, decay=0.008, seed=1):
    """继电器咔哒：宽频瞬态 + 一点金属共振。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).normal(0, 1, n)
    body = onepole_hp(noise, 900) * env(n, 0.0004, decay)
    res = np.sin(2 * np.pi * 2650 * t) * np.exp(-t / 0.004) * 0.35
    res += np.sin(2 * np.pi * 5300 * t) * np.exp(-t / 0.002) * 0.18
    return onepole_lp(body * 1.1 + res, cutoff)


def beep(freq=1000.0, dur=0.09, gain=1.0):
    """经典 POST 自检蜂鸣：方波 + 轻微包络。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * freq * t))
    return sq * env(n, 0.002, 0.05) * 0.32 * gain


def typewriter(seed=1):
    """打字机：极短瞬态 + 一点纸噪声。"""
    n = int(SR * 0.035)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).normal(0, 1, n)
    tick = onepole_hp(noise, 2200) * np.exp(-t / 0.0025)
    thock = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.006) * 0.5
    return onepole_lp(tick + thock, 7000) * 0.5


def whoosh(dur=0.9, f0=380, f1=3600, seed=5):
    """线框成像的气流扫频。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = np.random.default_rng(seed).normal(0, 1, n)
    cut = f0 * (f1 / f0) ** (t / dur)
    # 用两级一阶低通近似扫描
    y = onepole_lp(noise, 1200)
    y = onepole_lp(y, 1600)
    envl = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    sweep = np.sin(2 * np.pi * np.cumsum(cut * 0.25 / SR)) * 0.12
    return (y * 0.9 + sweep) * envl


def flatten_hit():
    """二维化压扁：一声短促的"咔哒 + 气流"。"""
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    noise = np.random.default_rng(9).normal(0, 1, n)
    air = onepole_hp(noise, 600) * np.exp(-t / 0.05) * 0.55
    clack = np.sin(2 * np.pi * (220 * np.exp(-t / 0.02) + 90) * t) * np.exp(-t / 0.03) * 0.5
    return air + clack


def pop(freq=520.0):
    """睁眼：水滴感的正弦上滑。"""
    n = int(SR * 0.18)
    t = np.arange(n) / SR
    f = freq * (1 + 2.2 * t / 0.18)
    return np.sin(2 * np.pi * np.cumsum(f / SR)) * env(n, 0.003, 0.05) * 0.4


def metal_swipe(dur=0.28):
    """字标硬切入：带通噪声由高扫到低 + 一点金属泛音。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = np.random.default_rng(13).normal(0, 1, n)
    y = onepole_hp(noise, 1200)
    y = onepole_lp(y, 5200)
    ring = sum(
        np.sin(2 * np.pi * f * t) * a for f, a in [(1180, 0.10), (1760, 0.07), (2630, 0.05)]
    )
    return (y * 0.5 + ring) * env(n, 0.001, 0.07)


def stamp():
    """盖章：低频冲击 + 纸噪声。"""
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    f = 95 * np.exp(-t / 0.05) + 42
    thud = np.sin(2 * np.pi * np.cumsum(f / SR)) * 0.85
    sub = np.sin(2 * np.pi * 38 * t) * 0.5
    paper = onepole_hp(np.random.default_rng(21).normal(0, 1, n), 2500) * np.exp(-t / 0.02) * 0.3
    return (thud + sub + paper) * env(n, 0.001, 0.16)


def note(freq, dur=0.34, gain=0.16):
    """收尾 3 音动机用的方波音符。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * freq * t)) * 0.5
    sq += np.sign(np.sin(2 * np.pi * freq * 2 * t)) * 0.14
    return sq * env(n, 0.004, 0.12) * gain


# ==================== BAR 1  0.0–2.5s  上电 ====================
# 每拍一个继电器咔哒 + 逐步升起的电流嗡鸣
for i in range(5):
    add(click(cutoff=4200, decay=0.007, seed=100 + i), i * BEAT, 0.55)

t_all = np.arange(N) / SR
hum = (
    np.sin(2 * np.pi * 50 * t_all) * 0.10
    + np.sin(2 * np.pi * 100 * t_all) * 0.05
    + np.sin(2 * np.pi * 150 * t_all) * 0.02
)
# 嗡鸣爬得更快（原来 1.8s，现在引导段只有 2.5s）
ramp = np.clip(t_all / 1.3, 0, 1) ** 1.4
buf += hum * ramp
# 终端打字：0.50s 起，每 2 帧（0.0667s）一个字符，12 个字符打到 1.30s
k = 0
for sec in np.arange(0.50, 1.30, 0.0667):
    add(typewriter(seed=300 + k), sec, 0.5)
    k += 1

# 块状进度条（画面 f18→f42 = 0.60→1.40s）：一条很轻的上扫正弦，
# 频率 300→900Hz 指数上升、音量随进度涨，到 1.40s 落一声"锁上"的脆响。
# 用一条扫频而不是 16 声 tick —— tick 会和上面 0.5s 起的打字机瞬态糊成一片。
seg = slice(at(0.60), at(1.40))
m = seg.stop - seg.start
tt = np.arange(m) / SR
prog = tt / (m / SR)
freq = 300.0 * (3.0**prog)  # 300 → 900Hz，指数扫频在听感上是匀速上行
buf[seg] += np.sin(2 * np.pi * np.cumsum(freq) / SR) * (prog**2.2) * 0.10
add(click(cutoff=6200, decay=0.005, seed=540), 1.40, 0.55)  # 进度条填满 = 锁上

# ==================== 1.5–2.5s  POST 通过 → 擦除 ====================
# 对应画面 f45 那个"OK"硬切入：一声 1kHz 蜂鸣 + 一个高八度亮点
# （1.40 锁上 → 1.50 蜂鸣 → 1.62 收尾，三步连成一个"启动完成"）
add(beep(1000.0, dur=0.10), 1.50, 1.0)
add(beep(1568.0, dur=0.06), 1.54, 0.55)
add(click(cutoff=5000, decay=0.006, seed=499), 1.62, 0.45)
# 原来的四行自检确认音（660/784/880/1046.5Hz）随清单一起删掉了 ——
# 没有清单就没有"逐行通过"，留着会是四声没有出处的声音。

# ==================== BAR 2  2.5–5.0s  成形 → 二维化 ====================
add(whoosh(0.9), 2.50, 0.85)  # 终端上擦 + 线框地球起
# 线框成形 / 自转时的机械微响
for i in range(6):
    add(click(cutoff=3000, decay=0.006, seed=500 + i), 2.80 + i * 0.30, 0.30)
# 线框自转：3.5s → 5.0s 的低频 drone
seg = slice(at(3.5), at(5.0))
m = seg.stop - seg.start
tt = np.arange(m) / SR
drone = (
    np.sin(2 * np.pi * 55 * tt) * 0.10
    + np.sin(2 * np.pi * 82.5 * tt) * 0.06
    + np.sin(2 * np.pi * 110.4 * tt) * 0.04
)
buf[seg] += drone * np.sin(np.pi * tt / (m / SR)) ** 0.8
add(flatten_hit(), 5.00, 0.95)  # 二维化压扁落点（signature）
add(click(cutoff=6000, decay=0.005, seed=520), 5.00, 0.5)

# ==================== BAR 3  5.5–7.0s  印刷 → 落款 ====================
add(pop(520.0), 5.50, 1.0)  # 网点开始显影
# 半调网点"印刷"的密集轻响
for k in range(10):
    add(typewriter(seed=600 + k), 5.56 + k * 0.040, 0.30)
add(click(cutoff=5200, decay=0.010, seed=530), 6.00, 0.42)  # 网点压实
add(click(cutoff=6800, decay=0.004, seed=531), 6.30, 0.38)  # 眨眼：快门一下
add(metal_swipe(), 6.50, 0.95)  # MRDave 硬切入
add(stamp(), 7.00, 1.0)  # 「先生」盖章

# ==================== BAR 4  8.0–10.0s  签名条落定 → 定格 ====================
# 三音动机原来配的是标语，标语拿掉后改配"BILIBILI · 知识科普向"这条签名，
# 时间点没变（还是 8.0s）—— 它现在是频道的声音签名。
for i, f in enumerate([523.25, 783.99, 1046.50]):
    add(note(f), 8.00 + i * 0.25, 1.0)
# 尾音空气：极轻的噪声床，9.7s 后几乎归零
tail = slice(at(8.0), N)
m = tail.stop - tail.start
tt = np.arange(m) / SR
air = onepole_lp(np.random.default_rng(77).normal(0, 1, m), 3200)
fade = np.clip(1.0 - (tt - 0.4) / 1.6, 0, 1) ** 2
buf[tail] += air * fade * 0.020

# ==================== 收尾：软限幅 + 归一化 ====================
buf = np.tanh(buf * 1.05)
peak = np.max(np.abs(buf))
buf = buf / peak * 0.89
# 首尾各 3ms 淡入淡出，避免爆音
edge = int(SR * 0.003)
buf[:edge] *= np.linspace(0, 1, edge)
buf[-edge:] *= np.linspace(1, 0, edge)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT, "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes())

print(f"OK: {OUT}  {len(buf)/SR:.4f}s  peak={np.max(np.abs(buf)):.3f}")
print(f"    拍点 @ {BPM}BPM: beat={BEAT}s  bar={BAR}s  总计 {DUR/BAR:.0f} 小节")
