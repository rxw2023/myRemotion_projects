import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Arrow, Bits, Chip, Field, Rule, Stage, Subs, Table, Write, p, useCues } from "../shared/b3b/ui";
import { Box, ByteBand, GRow, Head, Item, Span, Step, type Seg } from "./parts";

// ==========================================================================
// s00 · 一张明信片
// ==========================================================================
export const S00: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s00");
  const cv = p(f, at(1), 22);

  return (
    <Stage label="第 1 幕 · 一张明信片">
      <div style={{ position: "absolute", left: 0, right: 0, top: 112, display: "flex", justifyContent: "center" }}>
        <Write text="寄一张明信片，你会等对方签收吗？" delay={at(0)} size={48} weight={500} />
      </div>

      {/* ---------- 明信片 ---------- */}
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 272,
          width: 680,
          height: 330,
          border: `1.5px solid ${T.blue}`,
          borderRadius: 10,
          background: "rgba(88,196,221,0.05)",
          opacity: cv,
          transform: `scale(${0.96 + 0.04 * cv})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 22,
            width: 110,
            height: 84,
            border: `1.5px dashed ${T.yellow}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: 2,
            color: T.yellow,
          }}
        >
          POST
        </div>
        <div style={{ position: "absolute", left: 36, top: 34, fontFamily: F.mono, fontSize: 23, color: T.blue }}>
          to: 203.0.113.7 : 53
        </div>
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 74,
            fontFamily: F.mono,
            fontSize: 19,
            color: T.faint,
            letterSpacing: 0.4,
          }}
        >
          from: 192.168.1.1 : 49152
        </div>
        <div style={{ position: "absolute", left: 36, top: 132, fontFamily: F.mono, fontSize: 48, color: T.ink }}>
          DATA
        </div>
        {[0, 1, 2].map((i) => (
          <Rule
            key={i}
            w={300}
            color={T.line}
            delay={at(1) + 8 + i * 4}
            style={{ position: "absolute", left: 36, top: 232 + i * 32 }}
          />
        ))}
      </div>

      {/* ---------- 三个"不" ---------- */}
      {["不建立连接", "不等确认", "不负责重传"].map((t, i) => {
        const v = p(f, at(2) + i * 12, 16);
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: 960,
              top: 300 + i * 74,
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: v,
              transform: `translateX(${(1 - v) * 14}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 30, color: T.red }}>×</span>
            <span style={{ fontFamily: F.cn, fontSize: 32, color: T.ink, letterSpacing: 0.8 }}>{t}</span>
          </div>
        );
      })}
      <Chip x={960} y={536} text="sendto() 一返回，本机的事就结束了" color={T.faint} size={18} delay={at(2) + 36} />

      {/* ---------- 传输层两条路 ---------- */}
      {[
        { x: 180, name: "TCP", sub: "握手 · 确认 · 重传 · 有序", color: T.blue, d: at(3) },
        { x: 990, name: "UDP", sub: "不握手 · 不确认 · 不重传 · 无序", color: T.yellow, d: at(3) + 10 },
      ].map((c) => (
        <Box key={c.name} x={c.x} y={680} w={700} h={110} color={c.color} delay={c.d} fill>
          <div style={{ fontFamily: F.mono, fontSize: 34, color: c.color, letterSpacing: 2 }}>{c.name}</div>
          <div style={{ fontFamily: F.cn, fontSize: 20, color: T.sub, marginTop: 8, letterSpacing: 0.6 }}>{c.sub}</div>
        </Box>
      ))}
      <div
        style={{
          position: "absolute",
          left: 990,
          top: 804,
          fontFamily: F.cn,
          fontSize: 20,
          color: T.faint,
          letterSpacing: 0.6,
          opacity: p(f, at(4), 18),
        }}
      >
        可靠性 → 交给应用层自己去实现
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 884, textAlign: "center" }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: 3,
            color: T.faint,
            opacity: p(f, at(5), 20),
          }}
        >
          本期：8 字节首部 · 校验和 · 五个特点
        </span>
      </div>
      <Subs sceneId="s00" />
    </Stage>
  );
};

// ==========================================================================
// s01 · 首部固定 8 字节
// ==========================================================================
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s01");

  const cols = [
    { label: "字段", w: 280 },
    { label: "长度", w: 240 },
    { label: "作用", w: 1020 },
  ];
  const rows = [
    { cells: ["源端口", "2 字节", "发送方应用进程的端口号"] },
    { cells: ["目的端口", "2 字节", "接收方应用进程的端口号 —— 分用的依据"] },
    { cells: ["长度", "2 字节", "整个数据报的长度：首部 + 数据"] },
    { cells: ["校验和", "2 字节", "检测数据报在传输中是否被损坏"] },
  ];

  return (
    <Stage label="第 2 幕 · 固定 8 字节">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="UDP 首部：8 字节，一个也不多" delay={at(0)} size={46} weight={500} />
      </div>

      <Span x={355} y={300} w={877} label="8 字节 = 64 位 · 固定不变" color={T.blue} delay={at(1)} />
      <Span x={1232} y={300} w={327} label="数据（n 字节）" color={T.green} delay={at(1) + 8} />
      <ByteBand
        x={355}
        y={336}
        pxPerByte={110}
        h={86}
        delay={at(2)}
        stagger={7}
        segs={[
          { label: "源端口", sub: "16 位", bytes: 2, color: T.blue },
          { label: "目的端口", sub: "16 位", bytes: 2, color: T.blue },
          { label: "长度", sub: "16 位", bytes: 2, color: T.yellow },
          { label: "校验和", sub: "16 位", bytes: 2, color: T.purple },
          { label: "数据", bytes: 3, color: T.green, dashed: true, noTick: true },
        ]}
      />

      <Table
        x={180}
        y={480}
        cols={cols}
        rows={rows}
        delay={at(2) + 14}
        stagger={18}
        rowH={62}
        size={24}
      />

      <Field x={180} y={792} w={240} h={88} label="8" sub="字节 首部" color={T.blue} delay={at(4)} fill />
      <div style={{ position: "absolute", left: 440, top: 818, fontFamily: F.mono, fontSize: 30, color: T.faint, opacity: p(f, at(5), 16) }}>
        +
      </div>
      <Field x={490} y={792} w={240} h={88} label="n" sub="字节 数据" color={T.green} delay={at(5)} fill />
      <div style={{ position: "absolute", left: 750, top: 818, fontFamily: F.mono, fontSize: 30, color: T.faint, opacity: p(f, at(6), 16) }}>
        =
      </div>
      <Field x={800} y={792} w={420} h={88} label="8 + n" sub="长度字段的值" color={T.yellow} delay={at(6)} fill />
      <Chip x={1270} y={796} text="n = 0 → 长度 8（最小）" color={T.yellow} size={17} delay={at(5) + 10} />
      <Chip x={1270} y={846} text="长度 = 数据长度 + 8" color={T.faint} size={17} delay={at(6) + 14} />
      <Subs sceneId="s01" />
    </Stage>
  );
};

// ==========================================================================
// s02 · 分用与端口不可达
// ==========================================================================
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s02");

  const procs = [
    { name: "DNS", port: "端口 53", y: 300 },
    { name: "TFTP", port: "端口 69", y: 436 },
    { name: "RIP", port: "端口 520", y: 572 },
  ];

  return (
    <Stage label="第 3 幕 · 分用">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="到了主机，凭什么知道该交给谁？" delay={at(0)} size={46} weight={500} />
      </div>

      {/* IP 层 → UDP */}
      <Box x={210} y={386} w={230} h={120} color={T.line} delay={at(0) + 30}>
        <div style={{ fontFamily: F.cn, fontSize: 26, color: T.ink2 }}>IP 层</div>
        <div style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, marginTop: 6 }}>收到数据报</div>
      </Box>
      <Arrow from={[442, 446]} to={[522, 446]} color={T.faint} delay={at(0) + 40} dur={16} />

      <Box x={530} y={366} w={250} h={160} color={T.yellow} delay={at(1)} fill>
        <div style={{ fontFamily: F.mono, fontSize: 32, color: T.yellow, letterSpacing: 2 }}>UDP</div>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub, marginTop: 8 }}>查目的端口</div>
      </Box>

      {procs.map((pr, i) => (
        <React.Fragment key={pr.name}>
          <Arrow
            from={[782, 446]}
            to={[1042, pr.y + 52]}
            color={T.faint}
            delay={at(2) + i * 8}
            dur={20}
            curve={0.12}
          />
          <div
            style={{
              position: "absolute",
              left: 1050,
              top: pr.y,
              width: 630,
              height: 104,
              borderRadius: 10,
              border: `1.5px solid ${T.blue}66`,
              background: "rgba(88,196,221,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 30px",
              boxSizing: "border-box",
              opacity: p(f, at(2) + 10 + i * 8, 18),
              transform: `translateX(${(1 - p(f, at(2) + 10 + i * 8, 18)) * 16}px)`,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 30, color: T.ink, letterSpacing: 1.5 }}>{pr.name}</span>
            <span style={{ fontFamily: F.cn, fontSize: 20, color: T.blue, opacity: p(f, at(3) + i * 10, 14) }}>
              {pr.port}
            </span>
          </div>
        </React.Fragment>
      ))}

      {/* 端口不可达 */}
      <Box x={210} y={764} w={725} h={120} color={T.red} delay={at(4)} dashed>
        <div style={{ fontFamily: F.cn, fontSize: 25, color: T.red }}>没有进程监听该端口</div>
        <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 8 }}>报文被直接丢弃，不通知应用层</div>
      </Box>
      <div
        style={{
          position: "absolute",
          left: 952,
          top: 808,
          fontFamily: F.mono,
          fontSize: 24,
          color: T.faint,
          opacity: p(f, at(5), 14),
        }}
      >
        +
      </div>
      <Box x={985} y={764} w={725} h={120} color={T.red} delay={at(5)} dashed>
        <div style={{ fontFamily: F.cn, fontSize: 25, color: T.red }}>回一个 ICMP 差错报文</div>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: T.sub, marginTop: 8 }}>TYPE 3 · 端口不可达 ← 发送方</div>
      </Box>
      <Subs sceneId="s02" />
    </Stage>
  );
};

// ==========================================================================
// s03 · 伪首部：校验的范围
// ==========================================================================
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s03");

  const segs: Seg[] = [
    { label: "源 IP", sub: "4 B", bytes: 4, color: T.blue, size: 21 },
    { label: "目的 IP", sub: "4 B", bytes: 4, color: T.blue, size: 21 },
    { label: "0", bytes: 1, color: T.yellow, size: 21 },
    { label: "17", bytes: 1, color: T.yellow, size: 21 },
    { label: "UDP长度", bytes: 2, color: T.yellow, size: 15 },
    { label: "源端口", bytes: 2, color: T.ink2, size: 18 },
    { label: "目的端口", bytes: 2, color: T.ink2, size: 18 },
    { label: "长度", bytes: 2, color: T.ink2, size: 18 },
    { label: "校验和", bytes: 2, color: T.ink2, size: 18 },
    { label: "数据", bytes: 4, color: T.green, dashed: true, noTick: true, size: 19 },
  ];

  return (
    <Stage label="第 4 幕 · 伪首部">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="校验的范围，比 UDP 自己更大" delay={at(0)} size={46} weight={500} />
      </div>

      <Span x={240} y={300} w={720} label="伪首部 12 字节 · 不传输" color={T.blue} delay={at(3)} />
      <Span x={960} y={300} w={480} label="UDP 首部 8 字节" color={T.faint} delay={at(2) + 10} />
      <Span x={1440} y={300} w={240} label="数据" color={T.green} delay={at(2) + 20} />
      <ByteBand x={240} y={336} pxPerByte={60} h={82} delay={at(2)} stagger={4} gap={2} ticks={false} segs={segs} />

      <Item x={150} y={556} i={1} title="伪首部不传输，只在计算时临时拼出来" note="计算完就扔掉" color={T.blue} delay={at(4)} w={940} />
      <Item x={150} y={640} i={2} title="协议号 17 —— UDP 的身份证" note="0x11" color={T.yellow} delay={at(4) + 40} w={940} />
      <Item x={150} y={724} i={3} title="覆盖 IP 地址，防止投递到错误的主机" note="这才是它存在的理由" color={T.teal} delay={at(6)} w={940} />

      <Box x={1140} y={548} w={620} h={236} color={T.line} delay={at(1) + 10}>
        <div style={{ fontFamily: F.cn, fontSize: 20, color: T.faint, letterSpacing: 2 }}>代价与收益</div>
        <div style={{ fontFamily: F.cn, fontSize: 23, color: T.sub, marginTop: 18, lineHeight: 1.8 }}>
          <div>校错能力：不强</div>
          <div style={{ color: T.ink2 }}>但简单、处理快</div>
        </div>
      </Box>

      <div style={{ position: "absolute", left: 0, right: 0, top: 856, textAlign: "center" }}>
        <span
          style={{
            fontFamily: F.cn,
            fontSize: 22,
            color: T.faint,
            letterSpacing: 1.2,
            opacity: p(f, at(7), 20),
          }}
        >
          伪首部只算，不传 · 协议号 17 就是 UDP
        </span>
      </div>
      <Subs sceneId="s03" />
    </Stage>
  );
};

// ==========================================================================
// s04 · 发送端四步
// ==========================================================================
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s04");

  return (
    <Stage label="第 5 幕 · 发送端四步">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="发送端：四步算出一个校验和" delay={at(0)} size={46} weight={500} />
      </div>

      <Step
        x={130}
        y={244}
        n={1}
        title="分组"
        detail="伪首部 + UDP 首部 + 数据首尾相接，按 16 位一段切开；校验和字段先置 0"
        extra="数据是奇数字节？末尾补一个 0 字节"
        extraDelay={at(2) + 20}
        color={T.blue}
        delay={at(1)}
        w={720}
      />
      <Step
        x={130}
        y={396}
        n={2}
        title="累加"
        detail="把所有 16 位数加起来；进位不能丢，回卷到最低位"
        color={T.teal}
        delay={at(3)}
        w={720}
      />
      <Step
        x={130}
        y={548}
        n={3}
        title="取反"
        detail="对最终的和按位取反，得到校验和"
        color={T.yellow}
        delay={at(6)}
        w={720}
      />
      <Step
        x={130}
        y={700}
        n={4}
        title="填入"
        detail="写进首部的校验和字段，随数据报发出"
        color={T.purple}
        delay={at(7)}
        w={720}
      />

      {/* ---------- 回卷演示 ---------- */}
      <Head x={900} y={232} text="回卷 · 进位加回最低位" color={T.red} delay={at(4)} />
      <div
        style={{
          position: "absolute",
          left: 952,
          top: 278,
          fontFamily: F.mono,
          fontSize: 28,
          color: T.faint,
          opacity: p(f, at(4) + 6, 14),
        }}
      >
        +
      </div>
      <Bits bits="1111111111111111" x={990} y={272} cw={32} gap={4} ch={40} size={20} delay={at(4) + 6} stagger={0.8} />
      <Bits bits="0000000000000010" x={990} y={322} cw={32} gap={4} ch={40} size={20} delay={at(4) + 14} stagger={0.8} />
      <Rule w={620} color={T.line} delay={at(4) + 22} style={{ position: "absolute", left: 950, top: 380 }} />
      <Bits
        bits="10000000000000001"
        x={954}
        y={396}
        cw={32}
        gap={4}
        ch={40}
        size={20}
        delay={at(5)}
        stagger={0.6}
        paint={{ 0: T.red }}
      />
      <div
        style={{
          position: "absolute",
          left: 1588,
          top: 402,
          fontFamily: F.cn,
          fontSize: 17,
          color: T.red,
          opacity: p(f, at(5) + 20, 16),
        }}
      >
        第 17 位 = 进位
      </div>
      <Arrow from={[1000, 450]} to={[1074, 512]} color={T.red} delay={at(5) + 26} dur={16} curve={-0.28} sw={1.6} />
      <Bits
        bits="0000000000000010"
        x={990}
        y={520}
        cw={32}
        gap={4}
        ch={40}
        size={20}
        delay={at(6)}
        stagger={0.8}
        color={T.green}
      />
      <div
        style={{
          position: "absolute",
          left: 990,
          top: 576,
          fontFamily: F.mono,
          fontSize: 19,
          color: T.sub,
          opacity: p(f, at(6) + 14, 16),
        }}
      >
        0xFFFF + 0x0002 = 0x0002
      </div>

      {/* ---------- 取反演示 ---------- */}
      <Head x={900} y={634} text="按位取反 · 0 变 1，1 变 0" color={T.yellow} delay={at(6) + 40} />
      <Bits bits="0100001111100001" x={940} y={676} cw={28} gap={3} ch={38} size={19} delay={at(6) + 46} stagger={0.6} />
      <div
        style={{
          position: "absolute",
          left: 1462,
          top: 680,
          fontFamily: F.mono,
          fontSize: 24,
          color: T.ink2,
          opacity: p(f, at(7), 14),
        }}
      >
        0x43E1
      </div>
      <Bits
        bits="1011110000011110"
        x={940}
        y={752}
        cw={28}
        gap={3}
        ch={38}
        size={19}
        delay={at(7) + 8}
        stagger={0.6}
        color={T.yellow}
      />
      <div
        style={{
          position: "absolute",
          left: 1462,
          top: 756,
          fontFamily: F.mono,
          fontSize: 24,
          color: T.yellow,
          opacity: p(f, at(7) + 20, 14),
        }}
      >
        0xBC1E
      </div>
      <Subs sceneId="s04" />
    </Stage>
  );
};

// ==========================================================================
// s05 · 完整算例
// ==========================================================================
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s05");

  const groups = [
    { hex: "C0A8", mean: "源 IP 高 16 位", c: T.blue },
    { hex: "0101", mean: "源 IP 低 16 位", c: T.blue },
    { hex: "C0A8", mean: "目的 IP 高 16 位", c: T.blue },
    { hex: "0102", mean: "目的 IP 低 16 位", c: T.blue },
    { hex: "0011", mean: "全 0 + 协议 17", c: T.yellow },
    { hex: "000B", mean: "UDP 长度 11", c: T.yellow },
    { hex: "0400", mean: "源端口 1024", c: T.teal },
    { hex: "0800", mean: "目的端口 2048", c: T.teal },
    { hex: "000B", mean: "长度 11", c: T.ink2 },
    { hex: "0000", mean: "校验和（先置 0）", c: T.faint },
    { hex: "4865", mean: "数据「He」", c: T.green },
    { hex: "6C00", mean: "数据「l」+ 补 0", c: T.green },
  ];

  return (
    <Stage label="第 6 幕 · 算一遍">
      <div style={{ position: "absolute", left: 120, top: 112 }}>
        <Write text="算一遍：192.168.1.1 → 192.168.1.2" delay={at(0)} size={44} weight={500} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 186,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.blue,
          opacity: p(f, at(1), 16),
          letterSpacing: 0.4,
        }}
      >
        src 192.168.1.1 → dst 192.168.1.2
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 220,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.teal,
          opacity: p(f, at(2), 16),
          letterSpacing: 0.4,
        }}
      >
        1024 → 2048 · data「Hel」3 字节
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 254,
          fontFamily: F.mono,
          fontSize: 20,
          color: T.yellow,
          opacity: p(f, at(3), 16),
          letterSpacing: 0.4,
        }}
      >
        长度 = 8 + 3 = 11
      </div>

      {groups.map((g, i) => (
        <GRow
          key={`${g.hex}-${i}`}
          x={120}
          y={318 + i * 40}
          hex={g.hex}
          mean={g.mean}
          color={g.c}
          delay={at(4) + i * 12}
          w={620}
        />
      ))}

      {/* ---------- 流水线 ---------- */}
      <Head x={880} y={280} text="累加到底" color={T.faint} delay={at(4) + 20} />
      <Box x={880} y={318} w={540} h={84} color={T.line} delay={at(4) + 24}>
        <div style={{ fontFamily: F.cn, fontSize: 21, color: T.sub }}>12 个 16 位分组</div>
        <div style={{ fontFamily: F.mono, fontSize: 16, color: T.faint, marginTop: 6 }}>= 伪首部 12 B + 首部 8 B + 数据 4 B（补 0 后）</div>
      </Box>
      <Arrow from={[1150, 406]} to={[1150, 438]} color={T.faint} delay={at(5) + 10} dur={14} />
      <Box x={880} y={442} w={540} h={96} color={T.teal} delay={at(6)} fill>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub }}>16 位和（回卷 2 次）</div>
        <div style={{ fontFamily: F.mono, fontSize: 42, color: T.teal, marginTop: 4, letterSpacing: 2 }}>43E1</div>
      </Box>
      <Arrow from={[1150, 542]} to={[1150, 574]} color={T.faint} delay={at(7)} dur={14} />
      <Box x={880} y={578} w={540} h={96} color={T.yellow} delay={at(7) + 6} fill>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub }}>按位取反 → 校验和</div>
        <div style={{ fontFamily: F.mono, fontSize: 42, color: T.yellow, marginTop: 4, letterSpacing: 2 }}>BC1E</div>
      </Box>
      <Arrow from={[1150, 678]} to={[1150, 710]} color={T.faint} delay={at(7) + 22} dur={14} />
      <Box x={880} y={714} w={540} h={76} color={T.purple} delay={at(7) + 28}>
        <div style={{ fontFamily: F.cn, fontSize: 19, color: T.sub }}>
          写进首部的校验和字段：<span style={{ fontFamily: F.mono, color: T.purple }}>BC1E</span>
        </div>
      </Box>
      <Subs sceneId="s05" />
    </Stage>
  );
};
