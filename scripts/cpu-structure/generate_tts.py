"""
Generate TTS audio for the "CPU 的结构" video using the DeepSeek TTS API.

管线与 scripts/instruction-ops/generate_tts.py 完全一致：
DeepSeek 的 /v1/tools/tts 只回音频、不回 SentenceBoundary，拿不到字级时间戳，
所以**一句一请求**，每句自己的时长就是这句的精确时长，依次累加即得字幕时间轴。
句间补 140ms 静音，听感上正好是一句话的停顿。

Output:
  public/cpu-structure/s00.wav ... s13.wav   (24kHz / 16bit / mono)
  public/cpu-structure/cues.json
  src/CpuStructure/timings.ts                (auto-generated: cue frames + scene frames)

两个引擎，产物格式与时间轴算法完全相同（都是一句一请求，最后写 wav）：
  deepseek（默认）: /v1/tools/tts，voice stella，要 DEEPSEEK_API_KEY
  edge          : edge-tts 晓晓，免费无需 key

用法:
  python scripts/cpu-structure/generate_tts.py            # 全部（有缓存会跳过）
  python scripts/cpu-structure/generate_tts.py --edge      # 换 edge-tts 晓晓
  python scripts/cpu-structure/generate_tts.py --dry       # 不联网，按字数估时长，先跑通版式
  python scripts/cpu-structure/generate_tts.py --force     # 忽略缓存，全部重合成
  python scripts/cpu-structure/generate_tts.py s03 s07     # 只做某几场

Source material:
  https://www.csgraduates.com/constitution_principle/cpu/structure/
"""
import asyncio
import json
import os
import random
import sys
import urllib.error
import urllib.request
import wave

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_env(path):
    """把项目根 .env 里的 KEY=VALUE 读进 os.environ（已存在的环境变量优先）。

    只用标准库：python 侧没装 dotenv，而"命令行 export"和".env 里躺着"两条路
    都得能跑 —— 少一件事要记，就不会再出现"DEEPSEEK_API_KEY 缺失"。
    """
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env(os.path.join(BASE_DIR, ".env"))

API_URL = os.environ.get("DEEPSEEK_TTS_URL", "https://api.deepseek.com/v1/tools/tts")
VOICE = os.environ.get("DEEPSEEK_TTS_VOICE", "stella")  # stella（女，默认）/ tide（男）
EDGE_VOICE = "zh-CN-XiaoxiaoNeural"
ENGINE = os.environ.get("TTS_ENGINE", "deepseek")
SAMPLE_RATE = 24000  # pcm 固定 24kHz / 16bit / mono
BYTES_PER_SEC = SAMPLE_RATE * 2
CUE_GAP = 0.14  # 句间静音（秒）
FPS = 30
TAIL_FRAMES = 40
MAX_RETRIES = 5
RETRY_BASE_DELAY = 2.5
CONCURRENCY = 6

OUT_DIR = os.path.join(BASE_DIR, "public", "cpu-structure")
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")
TS_PATH = os.path.join(BASE_DIR, "src", "CpuStructure", "timings.ts")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# ==========================================================================
# 旁白：一场 = 一段连续叙述，一句一条字幕（控制在 ~30 字）
#
# 全片主线：一条总线，两种元件。
#   —— 总线决定部件怎么连，时钟决定谁能记住东西。
# 上一期（指令操作码）讲"指令动了哪几份状态"，这一期讲"这些状态住在哪个元件里"。
# ==========================================================================
SCENES = [
    {
        # 主题页：门牌 + 三段目录 + 主线
        "id": "s00",
        "cues": [
            "上一期说，每条指令都在改某几份状态。",
            "这一期换个问题：这些状态到底住在哪，又是怎么连起来的。",
            "答案在 CPU 内部，一块不到巴掌大的硅片上。",
            "这一期分三段：先把 CPU 拆成两半，再看清里面只有两种元件，最后落到八零八六这颗真实芯片上。",
            "主线只有一句话：一条总线，两种元件。",
            "总线决定了部件怎么连，时钟决定了谁能记住东西。",
            "把这两件事想通，寄存器那张表就不用背。",
        ],
    },
    {
        # 从五大部件到两分法
        "id": "s01",
        "cues": [
            "冯诺依曼机有五大部件：运算器、控制器、存储器、输入、输出。",
            "其中运算器和控制器合起来，就是 CPU。",
            "所以最早的教材，把 CPU 直接分成运算部件和控制部件。",
            "这个分法不算错，但它漏了一样东西：内总线。",
            "运算器和控制器之间的数据，就是靠这条内部总线来回传的。",
            "漏掉总线，就解释不了暂存器，也解释不了多路选择器为什么存在。",
            "所以更完善的分法是：数据通路，加控制器。",
        ],
    },
    {
        # 数据通路的定义
        "id": "s02",
        "cues": [
            "数据通路，是指令执行时数据走过的路径，连同路径上的部件。",
            "它回答三个问题：数据从哪来，中间经过谁，最后到哪去。",
            "ALU 在路径上，寄存器组在路径上，多路选择器也在路径上。",
            "注意，数据通路不只是运算器，它是整条路。",
            "它是执行部件，真正动手的地方。",
            "但它自己不知道什么时候该动。",
            "控制信号从控制器来，控制器才是按节拍喊开始的那个。",
        ],
    },
    {
        # 组合逻辑元件（会忘的）
        "id": "s03",
        "cues": [
            "数据通路上的元件，先看第一种：组合逻辑元件。",
            "它的输出只取决于此刻的输入，跟以前发生过什么没有关系。",
            "没有记忆，没有反馈，信号只往一个方向走。",
            "最典型的是 ALU，给它两个数和一个操作码，它立刻算出结果。",
            "译码器的输入是 n 位，输出是 2 的 n 次方条线，每次只有一根被拉高。",
            "多路选择器有几个输入，靠一根选择线决定把哪一个送到输出。",
            "三态门像一道闸门，使能为一就通，为零就变成高阻，等于断开。",
            "这四个东西的共同点是：它们从不记得上一秒。",
        ],
    },
    {
        # 时序逻辑元件（会记的）
        "id": "s04",
        "cues": [
            "第二种元件叫时序逻辑元件，也叫状态元件。",
            "它的输出不只看现在的输入，还要看以前输入留下的状态。",
            "说白了，它能记住东西。",
            "代价是它必须在时钟节拍下工作，什么时候更新由时钟说了算。",
            "寄存器、存储器都属于这一类：通用寄存器组、程序计数器、状态寄存器、暂存器、锁存器。",
            "一个比喻：组合元件是路口，只看此刻谁到；时序元件是驿站，记得谁来过。",
        ],
    },
    {
        # 单总线约束 → T 暂存器
        "id": "s05",
        "cues": [
            "现在把这两种元件连起来，问题就来了。",
            "内总线只有一条，同一时刻只能传一个数。",
            "可 ALU 要两个操作数，怎么办。",
            "第一个操作数先取出来，存进一个叫 T 的暂存器。",
            "第二个操作数再上总线，ALU 从 T 和总线各拿一个，才能算。",
            "所以 T 不是设计出来的花样，是被单总线逼出来的补丁。",
            "凡是只有一个内总线的 CPU，ALU 前面几乎一定挂着这么个暂存器。",
        ],
    },
    {
        # 控制器四步
        "id": "s06",
        "cues": [
            "接下来说控制器，它是整个 CPU 的指挥。",
            "第一步取指：程序计数器把地址送上总线，存储器把指令送回指令寄存器。",
            "第二步分析：译码器拆出操作码和寻址方式，搞清楚要做什么、操作数在哪。",
            "第三步执行：按节拍发出一串控制信号，开哪条路、ALU 做哪种运算、要不要写回。",
            "第四步转向：更新程序计数器，准备取下一条。",
            "这四步合起来，就是一次指令周期，然后循环往复。",
            "注意，控制器本身不碰数据。",
            "它只发信号，像指挥家不演奏任何一件乐器。",
        ],
    },
    {
        # 8086 全景
        "id": "s07",
        "cues": [
            "抽象讲完，落到一颗真实芯片上：八零八六。",
            "它是 Intel 第一颗真正的十六位处理器，也是 x86 的开端。",
            "它的数据通路有三块：指令队列、寄存器、内总线。",
            "指令队列是它的花招：总线空闲时提前把后面的指令取进来存着。",
            "控制器这边，有指令译码器、时序控制单元、标志控制逻辑和微指令控制逻辑。",
            "一横线切开，上面走数据，下面发命令。",
            "考试里绝大多数结构题，问的都是这张图上的位置。",
        ],
    },
    {
        # 寄存器五类 + 可见性
        "id": "s08",
        "cues": [
            "这张图上最密的一块是寄存器。",
            "按功能分五类：通用、段、变址、指针、标志。",
            "通用四个：AX 累加、BX 基址、CX 计数、DX 数据，名字就是它们的默认职业。",
            "段寄存器四个，指向内存里不同段的起点；变址两个，SI 和 DI，配合数组和字符串。",
            "指针三个：SP 指栈顶，BP 指栈底，IP 指下一条指令。",
            "再加一个标志寄存器，五类就齐了。",
            "还有两个特殊的：IR 存刚取来的指令，T 存 ALU 的一个输入。",
            "判断可见性有个简单标准：汇编里能直接写名字的才算。",
            "所以 IR、T，还有地址寄存器和数据寄存器，都看不见。",
        ],
    },
    {
        # CS:IP
        "id": "s09",
        "cues": [
            "这里有个最容易记错的地方：程序计数器，在八零八六里不是一个寄存器。",
            "IP 只有十六位，只能表示代码段内的偏移。",
            "而八零八六的地址总线是二十位，能寻址一兆。",
            "差出来的四位由段寄存器补：物理地址等于 CS 左移四位，再加上 IP。",
            "所以真正指向下一条指令的，是 CS 和 IP 这一对。",
            "取指完成后，IP 自动加上这条指令的长度。",
            "遇到跳转、调用、中断，CPU 就直接改 CS、IP，或者两个都改。",
        ],
    },
    {
        # 段 / 栈帧 / 变址
        "id": "s10",
        "cues": [
            "四个段各管一件事：CS 放指令，DS 放全局数据，SS 放栈，ES 留给你灵活用。",
            "现代进程的内存空间复杂得多，但逻辑结构是同一套。",
            "栈这一块，BP 和 SP 各站一头。",
            "函数一层层调用，栈帧就一层层往上叠，BP 指当前帧的底，SP 指当前帧的顶。",
            "变址寄存器用在数组上：SI 当索引，循环里加二，就跳到下一个元素。",
            "字符串操作更省事，SI 指源、DI 指目的，一条指令搬一批。",
            "所以段寄存器管在哪一段，指针和变址管段内哪个位置。",
        ],
    },
    {
        # 标志寄存器
        "id": "s11",
        "cues": [
            "标志寄存器十六位，真正有含义的只有九位。",
            "六位条件标志记录运算结果：溢出、进位、符号、零、辅助进位、奇偶。",
            "三位控制标志不自动改：中断允许、单步、方向。",
            "条件标志由算术逻辑指令和比较指令自动设置，然后被条件跳转读走。",
            "最容易被绕晕的是 CF 和 OF。",
            "CF 看最高位有没有进位，给无符号数用；OF 看符号位有没有被算错，给有符号数用。",
            "举个数：一百二十七加一，八位装不下。",
            "硬件算出来是 CF 等于零、OF 等于一，它不判断你想当有符号还是无符号。",
            "这两个标志只是同一次二进制运算的两个特征，怎么解释是程序的事。",
        ],
    },
    {
        # 引脚（了解为主）
        "id": "s12",
        "cues": [
            "最后一块是引脚，这部分以了解为主，试题很少直接考。",
            "八零八六的地址线和数据线复用同一组引脚，先送地址，后传数据。",
            "靠 ALE 信号把地址锁存下来，才不会跟数据混在一起。",
            "中断这边有 NMI 和 INTR 两根输入，加一根 INTA 应答。",
            "还有 READY 让慢速外设拖住 CPU，HOLD 和 HLDA 让外设接管总线。",
            "说白了，引脚就是 CPU 跟外部世界握手的规矩。",
        ],
    },
    {
        # 收口表
        "id": "s13",
        "cues": [
            "最后，把这一期画过的东西压成一张表。",
            "每一行是一个元件，每一列回答一个问题。",
            "第一列靠不靠时钟，第二列记不记得住事，第三列程序员能不能写它的名字。",
            "ALU、译码器、多路选择器、三态门，三列全是否。",
            "寄存器组、程序计数器、标志寄存器，靠时钟、有记忆、能写名字。",
            "IR 和暂存器 T 也靠时钟，但你看不见它们。",
            "所以哪些寄存器对程序员可见这道题，本质是问它在不在指令能指名的地方。",
            "而 CPU 长成这个样子，是总线的宽度和时钟的节拍逼出来的。",
        ],
    },
]


# ==========================================================================
# 合成
# ==========================================================================
def post_tts(text, key):
    """POST /v1/tools/tts，返回裸 PCM。只有标准库，不依赖 requests。"""
    body = json.dumps({"text": text, "voice_id": VOICE, "format": "pcm", "filter_markdown": True}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        ct = r.headers.get("Content-Type", "")
        if "json" in ct or "text" in ct:
            raise RuntimeError(f"unexpected content-type {ct}: {r.read()[:120]!r}")
        return r.read()


def synth(text, cache_path):
    """一句话 -> 裸 PCM（24kHz/16bit/mono），带磁盘缓存与退避重试。"""
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, "rb") as f:
            return f.read()

    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        raise RuntimeError("缺少 DEEPSEEK_API_KEY：先 export DEEPSEEK_API_KEY=sk-... 再跑（或写进 .env 后 source）。")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            pcm = post_tts(text, key)
            # "音频开始后才失败，响应会被截断" —— 短到不像一句话就是失败
            if len(pcm) < BYTES_PER_SEC * 0.25:
                raise RuntimeError(f"audio too short: {len(pcm)} bytes")
            with open(cache_path, "wb") as f:
                f.write(pcm)
            return pcm
        except urllib.error.HTTPError as e:
            detail = e.read()[:160].decode("utf-8", "replace")
            if e.code == 400:
                # 内容审核不过：改词，重试没意义
                raise RuntimeError(f"400 {detail}（内容审核未过，换一种说法）") from e
            if attempt == MAX_RETRIES:
                raise RuntimeError(f"HTTP {e.code}: {detail}") from e
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.2)
            print(f"    retry {attempt}/{MAX_RETRIES} HTTP {e.code} in {delay:.1f}s", flush=True)
            time_sleep(delay)
        except Exception as e:  # noqa: BLE001  网络抖动 / 截断，退避重试
            if "400" in str(e) or attempt == MAX_RETRIES:
                raise
            delay = RETRY_BASE_DELAY * attempt + random.uniform(0, 1.2)
            print(f"    retry {attempt}/{MAX_RETRIES} in {delay:.1f}s: {type(e).__name__} {e}", flush=True)
            time_sleep(delay)
    raise RuntimeError("unreachable")


def synth_edge(text, cache_path):
    """edge-tts 一句话 -> 裸 PCM（24kHz/16bit/mono），带磁盘缓存。

    edge 只吐 mp3，所以每句过一次 ffmpeg 解成裸 PCM —— 与 DeepSeek 那条路产物一致，
    后面的拼 wav、算时间轴代码完全不用分叉。
    """
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, "rb") as f:
            return f.read()

    import subprocess

    import edge_tts

    mp3 = cache_path + f".{os.getpid()}.mp3"
    asyncio.run(edge_tts.Communicate(text, EDGE_VOICE).save(mp3))
    try:
        pcm = subprocess.run(
            ["ffmpeg", "-v", "quiet", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
            capture_output=True,
            check=True,
        ).stdout
    finally:
        if os.path.exists(mp3):
            os.remove(mp3)
    if len(pcm) < BYTES_PER_SEC * 0.25:
        raise RuntimeError(f"audio too short: {len(pcm)} bytes")
    with open(cache_path, "wb") as f:
        f.write(pcm)
    return pcm


def time_sleep(sec):
    import time

    time.sleep(sec)


def write_wav(path, pcm):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm)


# ==========================================================================
# 主流程
# ==========================================================================
async def build_scene(scene, sem, force):
    sid = scene["id"]
    loop = asyncio.get_running_loop()

    async def one(i, text):
        cache_path = os.path.join(CACHE_DIR, f"{sid}_{i:02d}_{ENGINE}.pcm")
        if force and os.path.exists(cache_path):
            os.remove(cache_path)
        fn = synth_edge if ENGINE == "edge" else synth
        async with sem:
            for _ in range(3):
                try:
                    return await loop.run_in_executor(None, fn, text, cache_path)
                except Exception as e:  # noqa: BLE001
                    print(f"  [{sid}#{i}] {e}", flush=True)
                    break
            raise RuntimeError(f"{sid}#{i} failed")

    pcms = await asyncio.gather(*(one(i, t) for i, t in enumerate(scene["cues"])))

    gap = b"\x00" * int(BYTES_PER_SEC * CUE_GAP)
    blob = b""
    cues = []
    for pcm, text in zip(pcms, scene["cues"]):
        start = len(blob) / BYTES_PER_SEC
        end = start + len(pcm) / BYTES_PER_SEC
        cues.append({"text": text, "start": round(start, 3), "end": round(end, 3)})
        blob += pcm + gap

    wav_path = os.path.join(OUT_DIR, f"{sid}.wav")
    write_wav(wav_path, blob)
    duration = len(blob) / BYTES_PER_SEC
    print(f"[{sid}] OK {duration:6.2f}s  {len(scene['cues'])} cues -> {os.path.basename(wav_path)}", flush=True)
    return {"duration": round(duration, 3), "cues": cues}


def dry_scene(scene):
    """--dry：不联网，只按字数估时长，用来在没有 key 时先把 timings.ts 跑通、能抽帧看版式。"""
    cues, t = [], 0.0
    for text in scene["cues"]:
        dur = max(1.2, len(text) / (6.2 if ENGINE == "edge" else 4.8))
        cues.append({"text": text, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur + CUE_GAP
    return {"duration": round(t, 3), "cues": cues}


async def main():
    args = sys.argv[1:]
    global ENGINE
    force = "--force" in args
    dry = "--dry" in args
    if "--edge" in args:
        ENGINE = "edge"
    only = {a for a in args if not a.startswith("--")} or None

    meta_path = os.path.join(OUT_DIR, "cues.json")
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    sem = asyncio.Semaphore(CONCURRENCY)
    targets = [s for s in SCENES if not only or s["id"] in only]

    if dry:
        for s in targets:
            meta[s["id"]] = dry_scene(s)
            print(f"[{s['id']}] dry {meta[s['id']]['duration']:6.2f}s  {len(s['cues'])} cues")
        results = [None] * len(targets)
    else:
        results = await asyncio.gather(*(build_scene(s, sem, force) for s in targets), return_exceptions=True)

    failed = False
    for s, res in zip(targets, results):
        if isinstance(res, Exception):
            print(f"[{s['id']}] FAILED: {res}")
            failed = True
        elif res is not None:
            meta[s["id"]] = res

    if not dry:
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    if failed:
        print("\n有场景失败，timings.ts 未更新。修好后重跑（已合成的句子有缓存，不会重复计费）。")
        return

    lines = [
        "// AUTO-GENERATED by scripts/cpu-structure/generate_tts.py — 不要手改。",
        "// 重新生成：python scripts/cpu-structure/generate_tts.py",
        "//",
        ("// ⚠️ 这是 --dry 占位版：时长按字数估算，尚未合成音频。" if dry else
         "// 音频管线：DeepSeek /v1/tools/tts（voice stella，pcm 24kHz）一句一请求，"),
        ("// 拿到 key 后重跑本脚本即可覆盖。" if dry else
         "// pcm 24kHz，时长即字幕时间轴，cue 边界是精确值，不是按字数估的。"),
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
        frames = round(meta[sid]["duration"] * FPS) + TAIL_FRAMES
        scene_frames[sid] = frames
        lines.append(f"  {sid}: [")
        for c in meta[sid]["cues"]:
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

    os.makedirs(os.path.dirname(TS_PATH), exist_ok=True)
    with open(TS_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))

    total_sec = sum(m["duration"] for m in meta.values())
    total_frames = sum(scene_frames.values()) - 8 * (len(scene_frames) - 1)
    chars = sum(len(c) for s in SCENES for c in s["cues"])
    print(f"\n=== {len(scene_frames)} scenes, {total_sec:.1f}s audio, {chars} 字 ===")
    print(f"  估算费用：{chars * 2 / 10000 * 0.225:.3f} USD")
    for sid, fr in scene_frames.items():
        print(f"  {sid}: {meta[sid]['duration']:6.2f}s -> {fr}f")
    print(f"  TOTAL: {total_frames}f  ({total_frames / FPS:.1f}s)")
    print(f"  timings -> {TS_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
