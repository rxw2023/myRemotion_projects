"""Synthesize SFX for DualVectorFoil using numpy. Usage: python -X utf8 scripts/dual-vector-foil/generate_sfx.py"""
import os
import numpy as np
import wave

SR = 44100
OUT = "public/dual-vector-foil/sfx"
os.makedirs(OUT, exist_ok=True)


def write_wav(name, data):
    pcm = np.clip(data, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    print(f"  OK: {name} ({len(data)/SR:.2f}s)")


def env_exp(n, attack=0.01, decay=0.3):
    """attack then exponential decay envelope"""
    t = np.arange(n) / SR
    a = np.minimum(t / max(attack, 1e-6), 1.0)
    d = np.exp(-t / decay)
    return a * d


def lowpass_tv(x, cutoff_hz):
    """one-pole lowpass with time-varying cutoff"""
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        a = 2 * np.pi * cutoff_hz[i] / SR
        a = min(a, 1.0)
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(dur=3.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = np.random.default_rng(7).normal(0, 1, n)
    # cutoff sweeps up then down
    cutoff = 400 + 2800 * np.sin(np.pi * t / dur) ** 2
    filtered = lowpass_tv(noise, cutoff)
    # amplitude envelope: up-down swish
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    # add a pitched component for the "sweep" character
    pitch = np.sin(2 * np.pi * np.cumsum(90 + 220 * np.sin(np.pi * t / dur) / SR))
    return 0.6 * filtered * env + 0.3 * pitch * env


def boom(dur=2.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    # body: sine gliding 110 -> 40 Hz
    freq = 110 + (40 - 110) * (t / dur)
    phase = 2 * np.pi * np.cumsum(freq / SR)
    body = np.sin(phase) * 0.9
    # sub layer
    sub = np.sin(2 * np.pi * 42 * t) * 0.7
    # transient noise burst (0-80ms)
    transient = np.random.default_rng(3).normal(0, 1, n) * np.exp(-t / 0.015) * 0.5
    return (body + sub + transient) * env_exp(n, attack=0.005, decay=0.7)


def drone(dur=12.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    rng = np.random.default_rng(11)
    # layered detuned sines: A1/E2/A2
    out = np.zeros(n)
    for f, amp in [(55, 0.25), (55.7, 0.2), (82.4, 0.15), (110, 0.1), (110.8, 0.08)]:
        out += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi))
    # slow amplitude breathing
    breathe = 0.75 + 0.25 * np.sin(2 * np.pi * t / 6)
    # lowpassed noise bed
    noise = rng.normal(0, 1, n)
    noise_lp = lowpass_tv(noise, np.full(n, 160))
    out += noise_lp * 0.06
    return out * breathe * 0.5


print("Synthesizing SFX...")
write_wav("whoosh.wav", whoosh())
write_wav("boom.wav", boom())
write_wav("drone.wav", drone())
print("Done.")
