"""
Generate TTS audio for the "UDP" video using edge-tts.

Same pipeline as scripts/cisc-risc/generate_tts.py: one mp3 per scene,
逐句 SentenceBoundary → 字符级对齐 → 生成 src/UdpBasics/timings.ts。
场景里的动画只认 cue 序号（at(3)），不认绝对帧号，所以改旁白不用重排画面。

Output:
  public/udp-basics/s00.mp3 ... s10.mp3
  public/udp-basics/cues.json
  src/UdpBasics/timings.ts        (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/computer_network/transport/udp/
  注意：原页 s05 算例的累加结果写作 0xC4E0 / 校验和 0x3B1F，复算为 0x43E1 / 0xBC1E，
        本片采用复算值（12 个 16 位分组累加、回卷 2 次）。
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓 - 与前几期同一副嗓子
RATE = "+6%"
FPS = 30
TAIL_FRAMES = 40  # 每个场景末尾留白：3b1b 风格需要一个"呼吸"的停顿
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "udp-basics")
TS_PATH = os.path.join(BASE_DIR, "src", "UdpBasics", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~30 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "先想一个问题：寄一张明信片，你会等对方签收吗？",
            "不会。写好地址，投进邮筒，剩下的事就与自己无关了。",
            "UDP 就是这样一种协议：不建立连接，也不等确认，发出去就算完。",
            "传输层有两条路，一条是 TCP，一条是 UDP。",
            "TCP 把可靠性做进了协议里，UDP 把这件事留给了应用层。",
            "这一期只讲 UDP：首部、校验，和它为什么还活着。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "先从最小的东西看起：UDP 的首部。",
            "它固定八个字节，六十四位，不管带多少数据，长度都不变。",
            "四个字段，每个两字节：源端口、目的端口、长度、校验和。",
            "前两个字段各标识一端：发送方的应用进程，和接收方的应用进程。",
            "长度字段指的是整个数据报的长度，首部加数据。",
            "所以它的最小值是八：只有首部、不带数据的时候。",
            "换句话说，长度字段的值，永远等于数据长度加八。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "数据报到了主机，怎么知道该交给哪个程序？",
            "靠目的端口。这一步，叫分用。",
            "IP 层把数据报交上来，传输层按目的端口，分给不同的应用进程。",
            "端口五十三给 DNS，六十九给 TFTP，五百二十给 RIP。",
            "如果目的端口上根本没有进程在等，这个报文会被直接丢掉。",
            "同时，主机回一个 ICMP 差错报文：端口不可达。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "第二个问题：数据在路上坏掉了，怎么知道？",
            "UDP 有校验和，但它只做一件事：发现错误，不负责纠正。",
            "校验的范围不止 UDP 自己，还包括一个假的头部，叫伪首部。",
            "伪首部十二个字节：源 IP 四字节，目的 IP 四字节。",
            "再加一个全零字节、一个协议号十七，和两字节的 UDP 长度。",
            "这些信息本来就在 IP 首部里，为什么还要再抄一遍？",
            "因为校验必须覆盖 IP 地址：防止数据报被投递到了错误的主机。",
            "伪首部不传输，只参与计算。协议号十七，就是 UDP 的身份证。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "计算分四步。",
            "第一步，把伪首部、UDP 首部、数据首尾相接，按十六位分组。",
            "校验和字段先填零；数据如果是奇数字节，末尾补一个零字节。",
            "第二步，把所有十六位数加起来。",
            "这里有个坑：溢出不能丢，要把最高位的进位加回最低位。",
            "这个动作叫回卷。卷一次不够，就再卷一次。",
            "第三步，把得到的和按位取反，就是校验和。",
            "第四步，把它填进首部的校验和字段，发出去。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "拿一个例子走一遍，这是考试最爱的形式。",
            "源地址 192.168.1.1，目的地址 192.168.1.2。",
            "源端口 1024，目的端口 2048，数据是三个字节的 Hel。",
            "长度字段等于 3 加 8，也就是 11。",
            "现在分组：两个 IP 地址各拆成两段，加上零和协议号，一共十二个十六位数。",
            "数据 Hel 只有三字节，补一个零，凑成两个十六位。",
            "累加，中间回卷两次，得到十六位和 43E1。",
            "按位取反，得到 BC1E。这就是校验和。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "接收端怎么验证？方法简单得有点意外。",
            "把收到的数据原样再算一遍，连校验和字段一起算。",
            "如果数据没错，加起来的结果一定是全一。",
            "不是全一，说明路上出了错。UDP 通常直接丢弃，它不重传。",
            "但丢弃不是唯一选择：也可以交给上层，附上一句这是错的数据。",
            "还有两个特殊值要记牢：校验和全零，表示发送端根本没算。",
            "而如果算出来的和恰好是零，就填全一，避免和禁用混淆。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "回到设计本身。UDP 的特点，五条。",
            "第一，无连接：发之前不握手，每个数据报都是独立的。",
            "第二，轻量：没有连接状态，没有拥塞控制，开销只有八个字节。",
            "第三，无序：先发的可能后到，排序要靠应用自己来做。",
            "第四，不可靠：丢了不重传，错了不纠正，也不通知对方。",
            "第五，支持一对多：广播和组播，这一条只有 UDP 能做。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "这些特点听起来全是缺点，那它为什么还在用？",
            "第一类，一次只传一点点数据：DNS、SNMP。",
            "为了一次查询去握手三次、挥手四次，开销比数据本身还大。",
            "第二类，对延迟敏感：视频会议、直播、游戏。",
            "晚到的画面没有价值，宁可丢一帧，也不要卡住等重传。",
            "第三类，应用自己实现可靠性：在 UDP 上面自己写确认和重传。",
            "QUIC 就是这么干的，HTTP/3 就跑在 UDP 上。",
            "所以 UDP 不是不可靠，它是把可靠性外包了出去。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "最后把这一期的考点，压成一张表。",
            "首部：固定八字节，四个字段各两字节。",
            "长度字段：首部加数据，最小值是八。",
            "伪首部：十二字节，协议号十七，只算不传。",
            "校验：全零表示禁用；算得零就填全一；验证通过是全一。",
            "分用：看目的端口；端口不可达，回 ICMP 差错报文。",
            "特点：无连接、无序、不可靠，却支持广播和组播。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "再回到那张明信片。",
            "寄信的人不负责送达，只负责写清楚地址、投进邮筒。",
            "剩下的事，交给邮局，也交给写信的两个人自己去约定。",
            "UDP 的全部哲学，就在这八个字节里。",
            "它不承诺什么，所以它也几乎不花什么代价。",
        ],
    },
]


async def synth(text, out_path, timeout=180):
    """Synthesize one scene; return boundary list or None.

    edge-tts occasionally hangs mid-stream with no error; a hard timeout keeps the
    whole batch from stalling (symptom: 0-byte mp3 that never grows).
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:

            async def _stream():
                com = edge_tts.Communicate(text, VOICE, rate=RATE)
                boundaries = []
                with open(out_path, "wb") as f:
                    async for chunk in com.stream():
                        if chunk["type"] == "audio":
                            f.write(chunk["data"])
                        elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                            boundaries.append(
                                {
                                    "type": chunk["type"],
                                    "text": chunk["text"],
                                    "offset": chunk["offset"],
                                    "duration": chunk.get("duration", 0),
                                }
                            )
                return boundaries

            return await asyncio.wait_for(_stream(), timeout=timeout)
        except Exception as e:  # noqa: BLE001
            if attempt == MAX_RETRIES:
                print(f"  [ERROR] {out_path}: {type(e).__name__} {e}")
                return None
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.5)
            print(
                f"  (retry {attempt}/{MAX_RETRIES} {os.path.basename(out_path)} in {delay:.1f}s: {type(e).__name__})",
                flush=True,
            )
            await asyncio.sleep(delay)
    return None


def cue_times(cues, boundaries, total_sec):
    """把每条字幕句映射到 [start, end]（字符级对齐，拆分合并都不会错位）。"""
    sents = [b for b in boundaries if b["type"] == "SentenceBoundary"] or boundaries

    if not sents:
        written_total = sum(len(c) for c in cues)
        out, cum = [], 0.0
        for cue in cues:
            s = total_sec * cum / written_total
            cum += len(cue)
            out.append(
                {"text": cue, "start": round(s, 3), "end": round(total_sec * cum / written_total, 3)}
            )
        return out

    spoken = "".join(b["text"] for b in sents)
    written = "".join(cues)

    char_t = []
    for b in sents:
        t0 = b["offset"] / 1e7
        t1 = t0 + b["duration"] / 1e7
        n = max(1, len(b["text"]))
        char_t.extend((t0 + (t1 - t0) * j / n, t0 + (t1 - t0) * (j + 1) / n) for j in range(n))

    ratio = len(char_t) / max(1, len(written))
    exact = spoken == written

    out, cum = [], 0
    for cue in cues:
        a = cum
        cum += len(cue)
        b = cum - 1
        if not exact:
            a = min(len(char_t) - 1, int(a * ratio))
            b = min(len(char_t) - 1, int(b * ratio))
        b = min(b, len(char_t) - 1)
        start = char_t[a][0]
        end = char_t[b][1]
        out.append({"text": cue, "start": round(start, 3), "end": round(end, 3)})

    for i in range(1, len(out)):
        if out[i]["start"] < out[i - 1]["end"]:
            out[i]["start"] = out[i - 1]["end"]
    for i in range(len(out) - 1):
        if out[i + 1]["start"] - out[i]["end"] > 0.22:
            out[i]["end"] = round(out[i + 1]["start"], 3)
    if out:
        out[0]["start"] = max(0.1, round(out[0]["start"], 3))
        out[-1]["end"] = min(total_sec, round(out[-1]["end"] + 0.35, 3))
    return out


async def main():
    args = sys.argv[1:]
    reuse = "--reuse" in args
    only = {a for a in args if not a.startswith("--")} or None

    meta_path = os.path.join(OUT_DIR, "cues.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    lock = asyncio.Lock()
    sem = asyncio.Semaphore(3)  # 并发 3：太快会被服务端限流

    async def save_meta():
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    async def work(scene):
        sid = scene["id"]
        if only and sid not in only:
            return
        out_path = os.path.join(OUT_DIR, f"{sid}.mp3")

        # --reuse：音频与断点都在，只重算字幕时间轴
        if reuse and os.path.exists(out_path) and meta.get(sid, {}).get("sentences"):
            dur = MP3(out_path).info.length
            cues = cue_times(scene["cues"], meta[sid]["sentences"], dur)
            async with lock:
                meta[sid] = {"duration": round(dur, 3), "sentences": meta[sid]["sentences"], "cues": cues}
            print(f"[{sid}] reuse {dur:6.2f}s  {len(cues)} cues")
            return

        text = "".join(scene["cues"])
        async with sem:
            boundaries = await synth(text, out_path)
        if boundaries is None:
            print(f"[{sid}] FAILED")
            return
        dur = MP3(out_path).info.length
        cues = cue_times(scene["cues"], boundaries, dur)
        async with lock:
            meta[sid] = {"duration": round(dur, 3), "sentences": boundaries, "cues": cues}
            await save_meta()  # 每个场景落盘一次，中途挂掉也不丢已完成部分
        print(f"[{sid}] OK {dur:6.2f}s  {len(boundaries):3d} sents  {len(cues)} cues")

    await asyncio.gather(*(work(s) for s in SCENES))
    await save_meta()

    lines = [
        "// AUTO-GENERATED by scripts/udp-basics/generate_tts.py — 不要手改。",
        "// 重新生成：python scripts/udp-basics/generate_tts.py",
        "",
        "export interface Cue {",
        "  text: string;",
        "  start: number;",
        "  end: number;",
        "}",
        "",
        "/** 逐句字幕，帧为单位，相对当前场景起点 */",
        "export const CUES: Record<string, Cue[]> = {",
    ]
    scene_frames = {}
    for scene in SCENES:
        sid = scene["id"]
        if sid not in meta:
            continue
        entry = meta[sid]
        frames = round(entry["duration"] * FPS) + TAIL_FRAMES
        scene_frames[sid] = frames
        lines.append(f"  {sid}: [")
        for c in entry["cues"]:
            text = c["text"].replace('"', '\\"')
            s = round(c["start"] * FPS)
            e = min(round(c["end"] * FPS), frames)
            lines.append(f'    {{ text: "{text}", start: {s}, end: {e} }},')
        lines.append("  ],")
    lines.append("};")
    lines.append("")
    lines.append("/** 每个场景总帧数（旁白 + 尾部留白） */")
    lines.append("export const SCENE_FRAMES: Record<string, number> = {")
    for sid, f in scene_frames.items():
        lines.append(f"  {sid}: {f},")
    lines.append("};")
    lines.append("")
    lines.append("export const SCENE_ORDER = [")
    lines.append("  " + ", ".join(f'"{s["id"]}"' for s in SCENES) + ",")
    lines.append("] as const;")
    lines.append("")
    lines.append("export const SCENE_FRAME_LIST: number[] = [")
    lines.append("  " + ", ".join(str(f) for f in scene_frames.values()) + ",")
    lines.append("];")
    lines.append("")
    lines.append("/** 转场时长（每两个相邻场景之间） */")
    lines.append("export const TRANSITION_FRAMES = 8;")
    lines.append("")
    lines.append(
        "export const TOTAL_FRAMES: number =\n"
        "  SCENE_FRAME_LIST.reduce((a: number, b: number) => a + b, 0) -\n"
        "  TRANSITION_FRAMES * (SCENE_ORDER.length - 1);"
    )
    lines.append("")

    with open(TS_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))

    total_sec = sum(m["duration"] for m in meta.values())
    total_frames = sum(scene_frames.values()) - 8 * (len(scene_frames) - 1)
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio ===")
    for sid, f in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {f}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
