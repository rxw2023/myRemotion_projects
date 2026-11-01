"""
Generate TTS audio for the "TCP 可靠传输" video using edge-tts.

Same pipeline as scripts/arith-convert/generate_tts.py: one mp3 per scene, but
WordBoundary/SentenceBoundary events are streamed so per-cue subtitle timings
land exactly on the narration.

Output:
  public/tcp-basics/s00.mp3 ... s19.mp3
  src/TCPBasics/timings.ts   (auto-generated: cue frames + scene frames)

Source material:
  https://www.csgraduates.com/computer_network/transport/tcp/
"""
import asyncio
import json
import os
import random
import sys

import edge_tts
from mutagen.mp3 import MP3

VOICE = "zh-CN-YunxiNeural"  # 云希 - 男声，科普风格
RATE = "+4%"
FPS = 30
TAIL_FRAMES = 18             # 每个场景末尾留白，避免字幕撞转场
MAX_RETRIES = 6
RETRY_BASE_DELAY = 3.0

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(BASE_DIR, "public", "tcp-basics")
TS_PATH = os.path.join(BASE_DIR, "src", "TCPBasics", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)

# 每个场景 = 一段连续旁白，cues 是逐句字幕（一句一条，控制在 ~32 字以内）
SCENES = [
    {
        "id": "s00",
        "cues": [
            "传输层有两位主角，TCP 管可靠，UDP 管快。",
            "TCP 站在不可靠的 IP 之上，要造出一条可靠的管道。",
            "它得解决四件事：连得上、送得到、不乱序、不把网络压垮。",
            "这一期按四条线走：连接、传输、流量、拥塞。",
            "先看它给自己立下的四条规矩。",
        ],
    },
    {
        "id": "s01",
        "cues": [
            "第一条，面向连接。发数据之前先握手，发完之后要挥手。",
            "第二条，可靠交付。无差错、不丢失、不重复、按顺序。",
            "第三条，面向字节流。它不关心你的消息边界在哪里。",
            "第四条，全双工。一条连接里，两边同时收发。",
            "面向字节流这条最关键，后面所有机制都建立在它上面。",
            "因为编号是按字节编的，不是按报文段编的。",
        ],
    },
    {
        "id": "s02",
        "cues": [
            "打开一个 TCP 报文段，固定首部二十字节。",
            "最长能到六十字节，多出来的是选项。",
            "前四个字节是源端口和目的端口，各十六位。",
            "它们负责找到两端的进程。",
            "接着是序列号，三十二位，指向本报文段数据的第一个字节。",
            "然后是确认号，三十二位，表示下一个想收到的字节序号。",
            "确认号只有在确认标志置一时才有意义。",
            "后面依次是首部长度、保留位、六个标志位。",
        ],
    },
    {
        "id": "s03",
        "cues": [
            "六个标志位里，最常用的是三个：同步、确认、终止。",
            "同步用于建连，终止用于断连，确认表示确认号有效。",
            "还有三个：紧急、推送、复位。",
            "复位比较暴力，直接强制断开连接。",
            "再往后是窗口字段，十六位。",
            "接收方用它告诉对方，我还能收多少字节。",
            "这就是流量控制的抓手。",
            "最后是校验和、紧急指针，再加上可变的选项和填充。",
        ],
    },
    {
        "id": "s04",
        "cues": [
            "连接怎么建立？靠三次握手。",
            "第一次，客户端发一个同步标志置一的报文，带初始序列号 x。",
            "自己的状态从关闭，变成同步已发送。",
            "服务端原来在监听，收到之后回一个同步加确认。",
            "里面带自己的初始序列号 y，确认号填 x 加一。",
            "服务端状态变成同步已收到。",
            "第三次，客户端回一个确认，确认号填 y 加一。",
            "两边都进入已建立状态，连接就通了。",
        ],
    },
    {
        "id": "s05",
        "cues": [
            "三次握手的本质，是双方各自确认两个方向都能通。",
            "第一次，服务端确认了客户端能发。",
            "第二次，客户端确认了服务端能收也能发。",
            "第三次，服务端确认了客户端收到了自己的序列号。",
            "只握两次行不行？服务端就无法确认自己的同步报文被收到。",
            "初始序列号一般随机选，用来区分新旧连接。",
            "注意一个常考细节：初始序列号 x 是给同步报文用的。",
            "第一个数据字节的序号是 x 加一。",
            "第三次握手其实可以带数据，只是多数实现不带。",
        ],
    },
    {
        "id": "s06",
        "cues": [
            "断开连接要四次挥手。",
            "第一次，客户端发终止标志，序列号 u，表示我没数据要发了。",
            "客户端进入终止等待一。",
            "第二次，服务端回确认，确认号 u 加一，自己进入关闭等待。",
            "客户端收到后进入终止等待二，这时连接是半关闭的。",
            "服务端把剩下的数据发完，再发自己的终止报文，序列号 w。",
            "服务端进入最后确认，客户端收到后进入时间等待。",
            "第四次，客户端回确认，确认号 w 加一。",
            "服务端收到就关闭，客户端还要再等一会儿。",
        ],
    },
    {
        "id": "s07",
        "cues": [
            "两个方向的数据都停了，但客户端还多挂着一个状态：时间等待。",
            "它要等两倍的最长报文段寿命，才真正关闭。",
            "原因有两条。第一，最后那个确认可能丢。",
            "丢了，服务端会重发终止报文。",
            "还在时间等待的一方，能再补一个确认回去。",
            "第二，等这段时间过去，这条连接残留的旧报文全部过期。",
            "不会串到后面新建的连接上。",
            "那为什么握手三次、挥手四次？",
            "因为服务端收到终止报文时，自己的数据可能还没发完。",
            "确认可以先回，终止必须等数据发完再发。",
        ],
    },
    {
        "id": "s08",
        "cues": [
            "数据怎么发？TCP 不是发一个等一个确认。",
            "它维护一个窗口，窗口里的字节可以连续发出去。",
            "发送方的字节流可以分成四段。",
            "已发送已确认、已发送未确认、可以发还没发、暂时不能发。",
            "中间两段合起来，就是发送窗口。",
            "接收方也一样，分已交付、已收到未交付、等待接收、不许接收。",
            "收到确认之后，窗口左边界右移，右边腾出新的空间。",
            "一句话：确认推着窗口往前走，数据就流水线式地发出去了。",
        ],
    },
    {
        "id": "s09",
        "cues": [
            "这里有个容易绕晕的点：序列号只有三十二位，会回绕。",
            "把字节流想成一条无限长的带子，每个字节有一个绝对下标。",
            "绝对下标不回绕，序列号是它取模后的结果。",
            "发送时，绝对下标加上偏移再取模，写进报文。",
            "接收时反过来，光看序列号还原不出绝对下标。",
            "要结合当前窗口的位置，挑离窗口最近的那一个。",
            "为什么能这么挑？因为窗口远小于整个编号空间。",
            "所以一个序列号在窗口附近，只会有一个合理解释。",
            "总结一句：绝对下标管顺序，序列号上网线，窗口消除歧义。",
        ],
    },
    {
        "id": "s10",
        "cues": [
            "窗口有三个名字，别混：发送窗口、接收窗口、拥塞窗口。",
            "发送窗口等于接收窗口和拥塞窗口里较小的那个。",
            "接收窗口是接收方还空着的缓冲区，写在确认报文的窗口字段里。",
            "拥塞窗口是发送方自己估的网络容量，由拥塞控制来调。",
            "用接收窗口去限制发送方，这就是流量控制。",
            "缓冲区满了，接收方通告零窗口，发送方就得停。",
            "停住之后，发送方还会周期性发零窗口探测，问一句能收了吗。",
            "流量控制管两端的快慢，拥塞控制管整条网络，两回事。",
        ],
    },
    {
        "id": "s11",
        "cues": [
            "可靠传输的第一块砖，是序列号和确认号。",
            "确认号是累计确认，表示它之前的字节，一个不少全收到了。",
            "三种情形。第一种，数据段丢了。",
            "接收方收不到，确认号就不动，发送方等到超时，重传。",
            "第二种，乱序。后面的到了，前面的缺口还在。",
            "接收方反复发同一个确认号，发送方连收三个，立刻重传。",
            "第三种，按序到达，确认号往前走，继续发。",
            "记住一句话：确认号不动，就说明有洞。",
        ],
    },
    {
        "id": "s12",
        "cues": [
            "超时时间怎么定？定长了太慢，定短了会误重传。",
            "TCP 采样每次往返时间，算加权平均，叫平滑往返时间。",
            "再算往返时间的波动幅度，叫偏差。",
            "超时时间大约等于平滑往返时间，加上四倍偏差。",
            "网络抖得厉害，就把超时放宽，少误判几次。",
            "还有个细节：重传过的报文，往返时间样本不能用。",
            "这就是卡恩算法，避免把重传的确认错算成原报文的往返。",
        ],
    },
    {
        "id": "s13",
        "cues": [
            "校验和负责最后一道关：数据在路上被改坏了怎么办。",
            "它覆盖首部和数据，另外还要加一个伪首部。",
            "伪首部里有源地址、目的地址和协议号。",
            "作用是确认这个报文没被投错地方。",
            "校验不过，接收方直接丢弃，不确认，等发送方重传。",
            "从重传策略看，TCP 介于回退 N 帧和选择重传之间。",
            "它用累计确认，像回退 N。",
            "又缓存乱序段、只重传丢的那一段，像选择重传。",
            "而且整个发送窗口，只给最左边那个未确认的段维护一个定时器。",
        ],
    },
    {
        "id": "s14",
        "cues": [
            "再说拥塞控制。它管的不是一条连接，是整条链路。",
            "目标不是自己快，是大家加起来不过载。",
            "发送方维护一个拥塞窗口，实际发多少还要跟接收窗口取小。",
            "连接刚开始，窗口从很小起步，这叫慢开始。",
            "每收到一个确认，窗口加一个最大报文段。",
            "一个往返时间里确认数翻倍，所以窗口是指数增长。",
            "注意，是每收到一个确认加一，不是收到一个确认就翻倍。",
            "涨到慢开始阈值，就换挡，进入拥塞避免。",
        ],
    },
    {
        "id": "s15",
        "cues": [
            "过了阈值，增长方式从指数换成线性。",
            "每收到一个确认，窗口增加窗口大小分之一个报文段。",
            "一个往返时间里大约收到窗口那么多确认。",
            "加起来正好加一个报文段。",
            "也就是每个往返时间加一，慢慢往上探。",
            "为什么不敢快？因为已经接近链路容量了。",
            "再指数涨下去，很快就撞墙，然后大批丢包。",
        ],
    },
    {
        "id": "s16",
        "cues": [
            "什么时候认为网络拥塞了？最硬的信号是超时。",
            "超时说明连确认都回不来，路可能已经堵死。",
            "处理办法：阈值砍一半。",
            "拥塞窗口直接退回一个最大报文段。",
            "然后重新走慢开始，从头慢慢试。",
            "这一刀砍得很狠，因为超时是最严重的信号。",
            "画在图上，就是锯齿状上升，超时处垂直落下。",
        ],
    },
    {
        "id": "s17",
        "cues": [
            "等定时器太慢，快速重传是另一条路。",
            "接收方发现中间缺了一段，会一直重复发同一个确认号。",
            "发送方连收三个重复的确认，就明白那一段丢了。",
            "不用等定时器，立刻重传那一段。",
            "这里的三个是冗余的，算上第一个正常的，一共收到四个相同的确认号。",
            "快速重传只管重传动作，窗口怎么变，要看有没有快速恢复。",
        ],
    },
    {
        "id": "s18",
        "cues": [
            "快速恢复的思路是：别退回起点，太亏。",
            "三个重复确认说明网络还在送数据，只是丢了一个包。",
            "所以处理轻一点：阈值同样砍一半。",
            "但窗口不回到起点，教材口径是直接等于砍半后的阈值。",
            "然后进入拥塞避免，线性往上爬。",
            "Reno 的实现多一步：窗口等于阈值加三。",
            "加三是因为有三个报文段已经离开网络，被对方收下了。",
            "考试按教材写就行，题目点名 Reno 才用加三。",
        ],
    },
    {
        "id": "s19",
        "cues": [
            "最后把整张图串一遍。",
            "建立连接三次握手，断开四次挥手，收尾多等两倍报文寿命。",
            "传数据靠滑动窗口，窗口取接收窗口和拥塞窗口里小的那个。",
            "丢了靠序列号和确认号发现，要么超时重传，要么快速重传。",
            "拥塞控制四件套：慢开始指数涨，拥塞避免线性涨。",
            "超时就砍半归零，三个重复确认就快速重传加快速恢复。",
            "把这些连成一条线，TCP 的题基本都有抓手。",
            "有帮助的话点个赞，我们下期见。",
        ],
    },
]


async def synth(text, out_path, timeout=75):
    """Synthesize one scene's narration, collecting WordBoundary offsets (100ns).

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
            print(f"  (retry {attempt}/{MAX_RETRIES} {os.path.basename(out_path)} in {delay:.1f}s: {type(e).__name__})", flush=True)
            await asyncio.sleep(delay)
    return None


def _norm(s):
    out = []
    for ch in s:
        if ch.isalnum() or "\u4e00" <= ch <= "\u9fff":
            out.append(ch)
    return "".join(out)


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
        out[0]["start"] = max(0.0, round(out[0]["start"], 3))
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

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    lines = [
        "// AUTO-GENERATED by scripts/tcp-basics/generate_tts.py — 不要手改。",
        '// 重新生成："C:/Program Files/Python310/python.exe" scripts/tcp-basics/generate_tts.py',
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
    lines.append("export const TRANSITION_FRAMES = 10;")
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
    total_frames = sum(scene_frames.values()) - 10 * (len(scene_frames) - 1)
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio ===")
    for sid, f in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {f}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
