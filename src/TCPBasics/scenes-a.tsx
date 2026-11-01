import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { T, W, clamp } from "./tokens";
import {
  Callout,
  Chip,
  CN,
  FadeUp,
  FieldRow,
  Lane,
  Mono,
  Panel,
  Scene,
  WindowStrip,
  cueAt,
} from "./components";
import { Formula, TagLine } from "./parts";

// ==================== 小零件 ====================

const StackRow: React.FC<{
  name: string;
  items: string[];
  hl?: boolean;
  muted?: boolean;
  note?: string;
  delay?: number;
}> = ({ name, items, hl, muted, note, delay = 0 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: op }}>
      <div
        style={{
          width: 110,
          fontFamily: T.cn,
          fontSize: 25,
          fontWeight: 800,
          color: muted ? T.faint : hl ? T.blue : T.ink2,
        }}
      >
        {name}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: hl ? T.blueSoft : muted ? "#F7F9FC" : T.panel,
          border: `2px ${muted ? "dashed" : "solid"} ${hl ? T.blue : T.line}`,
          borderRadius: 12,
          padding: "15px 20px",
        }}
      >
        {items.map((it) => (
          <span
            key={it}
            style={{
              fontFamily: it.length <= 6 ? T.mono : T.cn,
              fontSize: 25,
              fontWeight: 800,
              color: hl ? T.blue : muted ? T.faint : T.ink2,
            }}
          >
            {it}
          </span>
        ))}
        {note && (
          <span style={{ marginLeft: "auto", fontFamily: T.cn, fontSize: 17, color: T.sub }}>
            {note}
          </span>
        )}
      </div>
    </div>
  );
};

/** n 个二进制小格 */
export const BitCells: React.FC<{
  n: number;
  text?: string;
  cell?: number;
  delay?: number;
  color?: string;
  bg?: string;
  every?: number;
}> = ({ n, text, cell = 32, delay = 0, color = T.blue, bg = T.blueSoft, every = 4 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: n }).map((_, i) => {
        const at = delay + i * 1.2;
        const op = interpolate(frame, [at, at + 7], [0, 1], clamp);
        const mark = every > 0 && (i + 1) % every === 0;
        return (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              borderRadius: 5,
              background: op > 0.5 ? (mark ? bg : "#F2F5F9") : "transparent",
              border: `1.5px solid ${op > 0.5 ? (mark ? color : "#DDE3EC") : "transparent"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: T.mono,
              fontSize: cell * 0.42,
              fontWeight: 800,
              color: mark ? color : "#C3CBD6",
              opacity: op,
            }}
          >
            {text ?? ""}
          </div>
        );
      })}
    </div>
  );
};

// ==================== S00 · TCP 在传输层 ====================

export const S00: React.FC = () => {
  const t = (i: number) => cueAt("s00", i);
  return (
    <Scene id="s00" no="00" title="不可靠之上，造一条可靠管道" en="TCP / RELIABLE OVER UNRELIABLE">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <FadeUp delay={t(0)} style={{ width: 466 }}>
            <Panel pad={20} accent={T.blue} style={{ borderWidth: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Mono size={38} color={T.blue}>
                  TCP
                </Mono>
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 22, fontWeight: 800, color: T.ink }}>
                    可靠 · 按序 · 面向连接
                  </div>
                  <div style={{ fontFamily: T.cn, fontSize: 17, fontWeight: 700, color: T.blue }}>
                    这一期的主角
                  </div>
                </div>
              </div>
            </Panel>
          </FadeUp>
          <FadeUp delay={t(0) + 10} style={{ width: 466 }}>
            <Panel pad={20}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Mono size={38} color={T.faint}>
                  UDP
                </Mono>
                <div>
                  <div style={{ fontFamily: T.cn, fontSize: 22, fontWeight: 800, color: T.ink2 }}>
                    不可靠 · 无连接
                  </div>
                  <div style={{ fontFamily: T.cn, fontSize: 17, fontWeight: 700, color: T.faint }}>
                    只要快，不管丢
                  </div>
                </div>
              </div>
            </Panel>
          </FadeUp>
        </div>

        <Panel pad={26} style={{ width: W }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <StackRow name="应用层" items={["HTTP", "FTP", "SMTP"]} delay={t(0)} muted />
            <StackRow name="传输层" items={["TCP", "UDP"]} hl delay={t(0)} note="主角在下一层" />
            <StackRow
              name="网络层"
              items={["IP · 尽力而为，会丢、会乱、会重"]}
              delay={t(1)}
              muted
            />
          </div>
        </Panel>

        <FadeUp delay={t(2)}>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { t: "连得上", c: T.blue, bg: T.blueSoft },
              { t: "送得到", c: T.green, bg: T.greenSoft },
              { t: "不乱序", c: T.cyan, bg: T.cyanSoft },
              { t: "不压垮网络", c: T.amber, bg: T.amberSoft },
            ].map((x) => (
              <Chip key={x.t} color={x.c} bg={x.bg} size={26} style={{ padding: "12px 22px" }}>
                {x.t}
              </Chip>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={t(3)}>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { n: "01", t: "连接", c: T.blue },
              { n: "02", t: "传输", c: T.green },
              { n: "03", t: "流量", c: T.cyan },
              { n: "04", t: "拥塞", c: T.amber },
            ].map((x) => (
              <Panel key={x.n} pad={20} style={{ width: 226 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Mono size={23} color={x.c}>
                    {x.n}
                  </Mono>
                  <CN size={29}>{x.t}</CN>
                </div>
              </Panel>
            ))}
          </div>
        </FadeUp>
      </div>
    </Scene>
  );
};

// ==================== S01 · 四条规矩 ====================

const RULES = [
  { n: "01", t: "面向连接", d: "先握手，再传数据，最后挥手", c: T.blue, bg: T.blueSoft },
  { n: "02", t: "可靠交付", d: "无差错 · 不丢失 · 不重复 · 按序", c: T.green, bg: T.greenSoft },
  { n: "03", t: "面向字节流", d: "没有消息边界，只有一串字节", c: T.cyan, bg: T.cyanSoft },
  { n: "04", t: "全双工", d: "一条连接里，两边同时收发", c: T.purple, bg: T.purpleSoft },
];

export const S01: React.FC = () => {
  const t = (i: number) => cueAt("s01", i);
  return (
    <Scene id="s01" no="01" title="四条规矩" en="FOUR PROPERTIES">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, width: W }}>
          {RULES.map((r, i) => (
            <FadeUp key={r.n} delay={t(i === 3 ? 3 : i)} style={{ width: 466 }}>
              <Panel
                pad={24}
                accent={i === 2 ? r.c : undefined}
                style={{ height: 172, borderWidth: i === 2 ? 3 : 2 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Mono size={22} color={r.c}>
                    {r.n}
                  </Mono>
                  <CN size={32}>{r.t}</CN>
                  {i === 2 && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: T.cn,
                        fontSize: 16,
                        fontWeight: 800,
                        color: r.c,
                        background: r.bg,
                        borderRadius: 6,
                        padding: "3px 9px",
                      }}
                    >
                      最关键
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 22, fontWeight: 700, color: T.sub, lineHeight: 1.45 }}>
                  {r.d}
                </div>
              </Panel>
            </FadeUp>
          ))}
        </div>

        <Callout color={T.cyan} delay={t(5)} style={{ width: W - 20 }}>
          编号按<span style={{ color: T.cyan }}>字节</span>编，不按报文段编 —— 后面所有窗口机制都建立在这上面
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S02 · 首部 ====================

export const S02: React.FC = () => {
  const t = (i: number) => cueAt("s02", i);
  return (
    <Scene id="s02" no="02" title="首部：二十字节起步" en="TCP HEADER · 20 BYTES FIXED">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <FieldRow
          segs={[
            { name: "源端口", bits: 16 },
            { name: "目的端口", bits: 16 },
          ]}
          delay={t(2)}
          hl={{ 0: true, 1: true }}
          height={72}
        />
        <FieldRow segs={[{ name: "序列号 seq", bits: 32, color: T.green }]} delay={t(4)} hl={{ 0: true }} height={72} />
        <FieldRow segs={[{ name: "确认号 ack", bits: 32, color: T.cyan }]} delay={t(5)} hl={{ 0: true }} height={72} />
        <FieldRow
          segs={[
            { name: "首部长度", bits: 4 },
            { name: "保留", bits: 6 },
            { name: "标志位", bits: 6, color: T.amber },
            { name: "窗口", bits: 16, color: T.purple },
          ]}
          delay={t(7)}
          hl={{ 2: true, 3: true }}
          height={72}
        />
        <FieldRow
          segs={[
            { name: "校验和", bits: 16 },
            { name: "紧急指针", bits: 16 },
          ]}
          delay={t(7) + 8}
          hl={{ 0: true, 1: true }}
          height={72}
        />
        <FieldRow
          segs={[
            { name: "选项（最长 40 字节）", bits: 3, color: T.faint },
            { name: "填充", bits: 1, color: T.faint },
          ]}
          delay={t(1)}
          hl={{ 0: true, 1: true }}
          height={62}
          showBits={false}
        />

        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          <TagLine tag="20 B" text="固定首部（无选项）" delay={t(0)} width={440} />
          <TagLine tag="60 B" text="含选项的上限" color={T.amber} bg={T.amberSoft} delay={t(1)} width={440} />
        </div>
        <Callout color={T.blue} delay={t(6)} style={{ width: W - 20, marginTop: 6 }}>
          确认号只有在<span style={{ color: T.green }}>确认标志置一</span>时才有意义
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S03 · 标志位与窗口 ====================

const FLAGS = [
  { k: "URG", d: "紧急指针有效", c: T.sub, on: false },
  { k: "ACK", d: "确认号有效", c: T.green, on: true },
  { k: "PSH", d: "立即交付应用层", c: T.sub, on: false },
  { k: "RST", d: "强制复位连接", c: T.red, on: false },
  { k: "SYN", d: "建立连接 · 同步序号", c: T.blue, on: true },
  { k: "FIN", d: "释放连接", c: T.amber, on: true },
];

export const S03: React.FC = () => {
  const t = (i: number) => cueAt("s03", i);
  return (
    <Scene id="s03" no="03" title="六个标志位与窗口字段" en="CONTROL FLAGS & WINDOW">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, width: W }}>
          {FLAGS.map((f, i) => (
            <FadeUp key={f.k} delay={t(i < 3 ? 0 : 2) + (i % 3) * 5} style={{ width: 308 }}>
              <Panel pad={16} accent={f.on ? f.c : undefined} style={{ height: 104, borderWidth: f.on ? 2.5 : 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Mono size={27} color={f.c}>
                    {f.k}
                  </Mono>
                  {f.on && <div style={{ width: 7, height: 7, borderRadius: 4, background: f.c }} />}
                </div>
                <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub, marginTop: 4 }}>
                  {f.d}
                </div>
              </Panel>
            </FadeUp>
          ))}
        </div>

        <Panel pad={22} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <CN size={24} color={T.purple} weight={800}>
              窗口
            </CN>
            <BitCells n={16} delay={t(4)} color={T.purple} bg={T.purpleSoft} cell={30} text="1" />
            <div style={{ marginLeft: "auto", fontFamily: T.cn, fontSize: 21, fontWeight: 700, color: T.sub }}>
              我还能收 <Mono size={22} color={T.purple}>65535</Mono> 字节
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 14 }}>
          <TagLine tag="校验和" text="首部 + 数据" delay={t(7)} width={456} />
          <TagLine tag="选项" text="MSS / 窗口扩大 / 时间戳" delay={t(7) + 6} width={482} />
        </div>
      </div>
    </Scene>
  );
};

// ==================== S04 · 三次握手 ====================

export const S04: React.FC = () => {
  const t = (i: number) => cueAt("s04", i);
  return (
    <Scene id="s04" no="04" title="三次握手" en="THREE-WAY HANDSHAKE">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Lane
          gap={190}
          top={96}
          steps={[
            { from: "c", label: "SYN=1, seq=x", kind: "syn", at: t(1) },
            { from: "s", label: "SYN=1, ACK=1, seq=y, ack=x+1", kind: "syn", at: t(3) },
            { from: "c", label: "ACK=1, seq=x+1, ack=y+1", kind: "ack", at: t(6) },
          ]}
          states={[
            { side: "c", text: "SYN-SENT", at: t(2), y: 130 },
            { side: "s", text: "LISTEN → SYN-RCVD", at: t(5), y: 320 },
            { side: "c", text: "ESTABLISHED", at: t(7), y: 500 },
            { side: "s", text: "ESTABLISHED", at: t(7), y: 540 },
          ]}
        />
        <Callout color={T.blue} delay={t(7)} style={{ width: W - 40 }}>
          x、y 是双方各自随机选的初始序列号，第三次确认后双向通道才成立
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S05 · 握手在确认什么 ====================

export const S05: React.FC = () => {
  const t = (i: number) => cueAt("s05", i);
  return (
    <Scene id="s05" no="05" title="三次握手的本质" en="WHAT IS BEING ACKNOWLEDGED">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <TagLine tag="#1" text="服务端确认：客户端能发" delay={t(1)} width={W - 40} />
        <TagLine tag="#2" text="客户端确认：服务端能收也能发" color={T.green} bg={T.greenSoft} delay={t(2)} width={W - 40} />
        <TagLine
          tag="#3"
          text="服务端确认：客户端收到了我的初始序列号"
          color={T.purple}
          bg={T.purpleSoft}
          delay={t(3)}
          width={W - 40}
        />

        <Panel pad={22} style={{ width: W, marginTop: 4 }} accent={T.red}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Chip color={T.red} bg={T.redSoft} size={20}>
              反问
            </Chip>
            <div style={{ fontFamily: T.cn, fontSize: 24, fontWeight: 700, color: T.ink2 }}>
              只握两次？
              <span style={{ color: T.red }}> 服务端无法确认自己的同步报文被收到</span>
            </div>
          </div>
        </Panel>

        <Panel pad={24} style={{ width: W }} accent={T.cyan}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <CN size={24} color={T.cyan} weight={800}>
                初始序列号 ISN
              </CN>
              <span style={{ fontFamily: T.cn, fontSize: 19, color: T.sub }}>随机选取 · 区分新旧连接</span>
            </div>
            <Formula
              delay={t(6)}
              size={27}
              parts={[
                { text: "SYN", color: T.blue },
                { text: "→", color: T.faint },
                { text: "seq = x", color: T.ink },
                { text: "｜", color: T.faint },
                { text: "第 1 个数据字节", color: T.sub, size: 22 },
                { text: "→", color: T.faint },
                { text: "seq = x+1", color: T.cyan },
              ]}
            />
          </div>
        </Panel>

        <Callout color={T.amber} delay={t(8)} style={{ width: W - 20 }}>
          第三次握手<span style={{ color: T.amber }}>允许携带数据</span>，但多数实现只发纯 ACK
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S06 · 四次挥手 ====================

export const S06: React.FC = () => {
  const t = (i: number) => cueAt("s06", i);
  return (
    <Scene id="s06" no="06" title="四次挥手" en="FOUR-WAY TEARDOWN">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Lane
          gap={150}
          top={94}
          steps={[
            { from: "c", label: "FIN=1, seq=u", kind: "fin", at: t(1) },
            { from: "s", label: "ACK=1, ack=u+1", kind: "ack", at: t(3) },
            { from: "s", label: "（剩下的数据继续发）", kind: "data", at: t(5) },
            { from: "s", label: "FIN=1, seq=w, ack=u+1", kind: "fin", at: t(5) + 26 },
            { from: "c", label: "ACK=1, ack=w+1", kind: "ack", at: t(7) },
          ]}
          states={[
            { side: "c", text: "FIN-WAIT-1", at: t(2), y: 126 },
            { side: "s", text: "CLOSE-WAIT", at: t(3) + 6, y: 252 },
            { side: "c", text: "FIN-WAIT-2", at: t(4), y: 322 },
            { side: "s", text: "LAST-ACK", at: t(6), y: 576 },
            { side: "c", text: "TIME-WAIT", at: t(6) + 20, y: 616 },
            { side: "s", text: "CLOSED", at: t(8), y: 738 },
          ]}
        />
        <Callout color={T.amber} delay={t(8)} style={{ width: W - 40 }}>
          两个方向各关一次：FIN 与 ACK 不能合并，所以是四次
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S07 · 2MSL 与三次四次 ====================

export const S07: React.FC = () => {
  const t = (i: number) => cueAt("s07", i);
  const frame = useCurrentFrame();
  return (
    <Scene id="s07" no="07" title="为什么多等两倍报文寿命" en="TIME-WAIT · 2×MSL">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Panel pad={24} style={{ width: W }} accent={T.amber}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 30, fontWeight: 800, color: T.amber }}>
                TIME-WAIT
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 18, color: T.sub, marginTop: 2 }}>
                只有主动关闭方多出这个状态
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 26,
                  borderRadius: 13,
                  background: "#EDF1F6",
                  border: `1.5px solid ${T.line}`,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: "100%",
                      background: i === 0 ? T.amber : "#F6C97A",
                      opacity: interpolate(frame, [t(1) + i * 12, t(1) + 12 + i * 12], [0, 1], clamp),
                      borderRight: i === 0 ? `2px solid ${T.panel}` : undefined,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontFamily: T.cn,
                  fontSize: 18,
                  fontWeight: 800,
                  color: T.sub,
                }}
              >
                <span>MSL</span>
                <span>2 × MSL</span>
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 18 }}>
          <Panel pad={22} style={{ width: 466, height: 262 }}>
            <CN size={24} color={T.amber} weight={800}>
              等 2MSL 的两个理由
            </CN>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <TagLine tag="①" text="最后的 ACK 丢了，能补发一次" color={T.amber} bg={T.amberSoft} delay={t(2)} size={19} />
              <TagLine tag="②" text="让旧连接的残包全部过期" color={T.amber} bg={T.amberSoft} delay={t(5)} size={19} />
            </div>
          </Panel>

          <Panel pad={22} style={{ width: 466, height: 262 }} accent={T.blue}>
            <CN size={24} color={T.blue} weight={800}>
              为什么三握四挥
            </CN>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <div style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 700, color: T.ink2, lineHeight: 1.5 }}>
                握手：两边的同步标志<span style={{ color: T.blue }}>可以合并在一个报文里</span>
              </div>
              <div style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 700, color: T.ink2, lineHeight: 1.5 }}>
                挥手：对方的数据可能没发完，
                <span style={{ color: T.red }}>确认与终止必须分开</span>
              </div>
            </div>
          </Panel>
        </div>

        <Callout color={T.blue} delay={t(9)} style={{ width: W - 20 }}>
          确认可以先回，终止必须等数据发完 —— 这就是多出来的那一次
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S08 · 滑动窗口四段 ====================

export const S08: React.FC = () => {
  const t = (i: number) => cueAt("s08", i);
  return (
    <Scene id="s08" no="08" title="滑动窗口：一次发一批" en="SLIDING WINDOW">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <Panel pad={26} style={{ width: W }}>
          <CN size={22} color={T.sub} weight={800}>
            发送方字节流
          </CN>
          <div style={{ marginTop: 14 }}>
            <WindowStrip
              cell={22}
              delay={t(2)}
              shift={t(5)}
              segs={[
                { text: "已发送且已确认", n: 6, color: T.faint, bg: "#F1F4F8" },
                { text: "已发送未确认", n: 6, color: T.amber, bg: T.amberSoft },
                { text: "可以发还没发", n: 6, color: T.blue, bg: T.blueSoft },
                { text: "暂时不能发", n: 6, color: "#B4BECB", bg: "#F7F9FC" },
              ]}
            />
          </div>
        </Panel>

        <Panel pad={26} style={{ width: W }}>
          <CN size={22} color={T.sub} weight={800}>
            接收方缓冲区
          </CN>
          <div style={{ marginTop: 14 }}>
            <WindowStrip
              cell={22}
              delay={t(5)}
              segs={[
                { text: "已交付应用", n: 6, color: T.green, bg: T.greenSoft },
                { text: "已收未交付", n: 6, color: T.cyan, bg: T.cyanSoft },
                { text: "等待接收", n: 6, color: T.blue, bg: T.blueSoft },
                { text: "不允许接收", n: 6, color: "#B4BECB", bg: "#F7F9FC" },
              ]}
            />
          </div>
        </Panel>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Chip color={T.blue} bg={T.blueSoft} size={22}>
            窗口 = 中间两段
          </Chip>
          <FadeUp delay={t(6)}>
            <div style={{ fontFamily: T.cn, fontSize: 24, fontWeight: 700, color: T.ink2 }}>
              收到 ACK → 左边界右移 → 右边腾出新空间
            </div>
          </FadeUp>
        </div>

        <Callout color={T.blue} delay={t(7)} style={{ width: W - 20 }}>
          确认推着窗口往前走，数据就<span style={{ color: T.blue }}>流水线式</span>地发出去了
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S09 · 绝对下标与序列号 ====================

export const S09: React.FC = () => {
  const t = (i: number) => cueAt("s09", i);
  const frame = useCurrentFrame();
  const nums = ["0", "1", "2", "3", "4", "5", "6", "7"];
  return (
    <Scene id="s09" no="09" title="序列号为什么会回绕" en="ABSOLUTE INDEX vs 32-BIT SEQNO">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Panel pad={24} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <CN size={21} color={T.sub} weight={800}>
              字节流 · 绝对下标
            </CN>
            <span style={{ fontFamily: T.cn, fontSize: 17, color: T.faint }}>永不休止，不回绕</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {nums.map((n, i) => (
              <div
                key={n}
                style={{
                  width: 100,
                  height: 70,
                  borderRadius: 9,
                  background: i >= 2 && i <= 5 ? T.blueSoft : T.panel,
                  border: `2px solid ${i >= 2 && i <= 5 ? T.blue : T.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: T.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  color: i >= 2 && i <= 5 ? T.blue : T.faint,
                  opacity: interpolate(frame, [t(1) + i * 3, t(1) + i * 3 + 8], [0, 1], clamp),
                }}
              >
                {n}
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: T.mono,
                fontSize: 26,
                color: T.faint,
                paddingLeft: 6,
              }}
            >
              …
            </div>
          </div>
        </Panel>

        <Panel pad={24} style={{ width: W }} accent={T.green}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <CN size={21} color={T.green} weight={800}>
              报文里 · 32 位序列号
            </CN>
            <span style={{ fontFamily: T.cn, fontSize: 17, color: T.faint }}>
              撞到 2³² 就绕回 0
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["2³²-2", "2³²-1", "0", "1", "2", "3", "4", "5"].map((n, i) => (
              <React.Fragment key={n + i}>
                {i === 2 && <Mono size={20} color={T.red} style={{ paddingRight: 4 }}>↺</Mono>}
                <div
                  style={{
                    width: 100,
                    height: 70,
                    borderRadius: 9,
                    background: T.greenSoft,
                    border: `2px solid ${T.green}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: T.mono,
                    fontSize: 20,
                    fontWeight: 800,
                    color: T.green,
                    opacity: interpolate(frame, [t(2) + i * 3, t(2) + i * 3 + 8], [0, 1], clamp),
                  }}
                >
                  {n}
                </div>
              </React.Fragment>
            ))}
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 16 }}>
          <Panel pad={18} style={{ width: 306, height: 150 }}>
            <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color: T.blue }}>发送</div>
            <div style={{ fontFamily: T.cn, fontSize: 17, color: T.sub, marginTop: 2 }}>
              绝对下标 + 偏移
            </div>
            <Formula
              delay={t(3)}
              size={21}
              align="left"
              parts={[
                { text: "seqno", color: T.green },
                { text: "=", color: T.faint },
                { text: "(ISN+i)", color: T.ink },
                { text: "mod 2³²", color: T.red, size: 18 },
              ]}
            />
          </Panel>
          <Panel pad={18} style={{ width: 306, height: 150 }}>
            <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color: T.cyan }}>接收</div>
            <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>
              光看序列号还原不出来，要挑离窗口最近的那个
            </div>
          </Panel>
          <Panel pad={18} style={{ width: 306, height: 150 }} accent={T.purple}>
            <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color: T.purple }}>
              为什么不歧义
            </div>
            <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>
              窗口远小于 2³²，窗口附近只有一个合理解释
            </div>
          </Panel>
        </div>

        <Callout color={T.purple} delay={t(8)} style={{ width: W - 20 }}>
          绝对下标管顺序，序列号上网线，<span style={{ color: T.purple }}>窗口消除歧义</span>
        </Callout>
      </div>
    </Scene>
  );
};
