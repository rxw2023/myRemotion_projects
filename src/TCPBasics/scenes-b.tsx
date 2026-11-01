import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { T, W, clamp } from "./tokens";
import {
  Callout,
  Chip,
  CN,
  CwndChart,
  FadeUp,
  FieldRow,
  Mono,
  Panel,
  Scene,
  cueAt,
} from "./components";
import { Formula, MiniBar, MiniBlocks, Stat, TagLine } from "./parts";

// ==================== S10 · 三个窗口与流量控制 ====================

export const S10: React.FC = () => {
  const t = (i: number) => cueAt("s10", i);
  return (
    <Scene id="s10" no="10" title="三个窗口，谁限制谁" en="swnd = min(cwnd, rwnd)">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <Panel pad={26} style={{ width: W }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CN size={22} color={T.amber} weight={800} style={{ width: 190 }}>
                拥塞窗口 cwnd
              </CN>
              <MiniBar ratio={0.78} width={420} color={T.amber} delay={t(3)} label="发送方自己估" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CN size={22} color={T.cyan} weight={800} style={{ width: 190 }}>
                接收窗口 rwnd
              </CN>
              <MiniBar ratio={0.42} width={420} color={T.cyan} delay={t(2)} label="对方还能收" />
            </div>
            <div style={{ height: 2, background: T.line }} />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CN size={22} color={T.blue} weight={800} style={{ width: 190 }}>
                发送窗口 swnd
              </CN>
              <MiniBar ratio={0.42} width={420} color={T.blue} delay={t(1)} label="取小" />
            </div>
          </div>
        </Panel>

        <Formula
          delay={t(1)}
          size={34}
          parts={[
            { text: "swnd", color: T.blue },
            { text: "=", color: T.faint },
            { text: "min", color: T.ink },
            { text: "(", color: T.faint },
            { text: "cwnd", color: T.amber },
            { text: ",", color: T.faint },
            { text: "rwnd", color: T.cyan },
            { text: ")", color: T.faint },
          ]}
        />

        <div style={{ display: "flex", gap: 14 }}>
          <TagLine tag="rwnd=0" text="发送方必须停" color={T.cyan} bg={T.cyanSoft} delay={t(5)} width={456} />
          <TagLine tag="probe" text="周期性零窗口探测" color={T.purple} bg={T.purpleSoft} delay={t(6)} width={470} />
        </div>

        <Callout color={T.purple} delay={t(7)} style={{ width: W - 20 }}>
          流量控制管<span style={{ color: T.cyan }}>两端快慢</span>，拥塞控制管
          <span style={{ color: T.amber }}>整条网络</span>，两回事
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S11 · 可靠传输：三种情形 ====================

const CASES = [
  {
    tag: "丢失",
    c: T.red,
    bg: T.redSoft,
    blocks: [
      { text: "1", state: "ok" as const },
      { text: "2", state: "lost" as const, label: "丢了" },
      { text: "3", state: "late" as const },
    ],
    result: "确认号不动 → 超时重传",
  },
  {
    tag: "乱序",
    c: T.amber,
    bg: T.amberSoft,
    blocks: [
      { text: "1", state: "ok" as const },
      { text: "2", state: "lost" as const, label: "缺 2" },
      { text: "3", state: "ok" as const, label: "dup ACK" },
      { text: "4", state: "ok" as const, label: "dup ACK" },
    ],
    result: "重复确认 → 快速重传",
  },
  {
    tag: "按序",
    c: T.green,
    bg: T.greenSoft,
    blocks: [
      { text: "1", state: "ok" as const },
      { text: "2", state: "ok" as const },
      { text: "3", state: "ok" as const, label: "ACK 前进" },
    ],
    result: "确认号前进 → 继续发",
  },
];

export const S11: React.FC = () => {
  const t = (i: number) => cueAt("s11", i);
  return (
    <Scene id="s11" no="11" title="确认号不动，就说明有洞" en="CUMULATIVE ACK · THREE CASES">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Chip color={T.blue} bg={T.blueSoft} size={21}>
            确认号 = 下一个期望的字节
          </Chip>
          <span style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 700, color: T.sub }}>
            之前的字节，一个不少全收到
          </span>
        </div>

        {CASES.map((c, i) => (
          <Panel key={c.tag} pad={18} style={{ width: W, height: 190 }} accent={c.c}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ width: 96 }}>
                <div
                  style={{
                    fontFamily: T.cn,
                    fontSize: 26,
                    fontWeight: 800,
                    color: c.c,
                  }}
                >
                  {c.tag}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.faint, marginTop: 2 }}>
                  case {i + 1}
                </div>
              </div>
              <MiniBlocks items={c.blocks} delay={t(i === 0 ? 2 : i === 1 ? 4 : 6)} size={120} gap={10} height={66} />
              <div
                style={{
                  marginLeft: "auto",
                  fontFamily: T.cn,
                  fontSize: 21,
                  fontWeight: 800,
                  color: T.ink2,
                  width: 236,
                  lineHeight: 1.5,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {c.result}
              </div>
            </div>
          </Panel>
        ))}

        <Callout color={T.red} delay={t(7)} style={{ width: W - 20 }}>
          洞不补上，<span style={{ color: T.red }}>确认号就永远停在那里</span>
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S12 · 超时重传与 RTO ====================

export const S12: React.FC = () => {
  const t = (i: number) => cueAt("s12", i);
  return (
    <Scene id="s12" no="12" title="超时时间怎么定" en="RTO · KARN'S ALGORITHM">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Panel pad={28} style={{ width: W }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Formula
              delay={t(1)}
              size={28}
              align="left"
              parts={[
                { text: "EstimatedRTT", color: T.cyan },
                { text: "=", color: T.faint },
                { text: "(1-α)·E + α·SampleRTT", color: T.ink, size: 24 },
              ]}
            />
            <Formula
              delay={t(2)}
              size={28}
              align="left"
              parts={[
                { text: "DevRTT", color: T.purple },
                { text: "=", color: T.faint },
                { text: "(1-β)·D + β·|SampleRTT - E|", color: T.ink, size: 24 },
              ]}
            />
            <div style={{ height: 2, background: T.line }} />
            <Formula
              delay={t(3)}
              size={34}
              parts={[
                { text: "RTO", color: T.red },
                { text: "=", color: T.faint },
                { text: "EstimatedRTT", color: T.cyan },
                { text: "+", color: T.faint },
                { text: "4 × DevRTT", color: T.purple },
              ]}
            />
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 16 }}>
          <TagLine tag="平均" text="平滑往返时间" color={T.cyan} bg={T.cyanSoft} delay={t(1)} width={456} />
          <TagLine tag="波动" text="四倍偏差，容忍抖动" color={T.purple} bg={T.purpleSoft} delay={t(4)} width={470} />
        </div>

        <Panel pad={22} style={{ width: W }} accent={T.amber}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Chip color={T.amber} bg={T.amberSoft} size={20}>
              Karn
            </Chip>
            <div style={{ fontFamily: T.cn, fontSize: 23, fontWeight: 700, color: T.ink2 }}>
              重传过的报文，<span style={{ color: T.amber }}>不采往返时间样本</span>
              —— 分不清确认是给原报文还是重传报文
            </div>
          </div>
        </Panel>

        <Callout color={T.red} delay={t(5)} style={{ width: W - 20 }}>
          超时是最硬的拥塞信号：连确认都回不来了
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S13 · 校验和与 GBN/SR 定位 ====================

export const S13: React.FC = () => {
  const t = (i: number) => cueAt("s13", i);
  return (
    <Scene id="s13" no="13" title="校验和，以及它在 GBN 与 SR 之间" en="CHECKSUM · BETWEEN GBN AND SR">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ width: W }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
              fontFamily: T.cn,
              fontSize: 21,
              fontWeight: 800,
              color: T.sub,
            }}
          >
            伪首部
            <span style={{ fontSize: 17, color: T.faint, fontWeight: 600 }}>
              校验时临时拼上，不随报文发送
            </span>
          </div>
          <FieldRow
            segs={[
              { name: "源 IP", bits: 32 },
              { name: "目的 IP", bits: 32 },
            ]}
            delay={t(1)}
            hl={{ 0: true, 1: true }}
            height={64}
            width={W}
          />
          <div style={{ height: 8 }} />
          <FieldRow
            segs={[
              { name: "保留 0", bits: 8 },
              { name: "协议 6", bits: 8 },
              { name: "TCP 长度", bits: 16, color: T.cyan },
            ]}
            delay={t(2)}
            hl={{ 2: true }}
            height={64}
            width={W}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 20,
              opacity: interpolate(useCurrentFrame(), [t(4), t(4) + 10], [0, 1], clamp),
            }}
          >
            <span style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 800, color: T.sub, width: 62 }}>
              覆盖
            </span>
            <div
              style={{
                width: 300,
                height: 58,
                borderRadius: "10px 0 0 10px",
                background: T.blueSoft,
                border: `2px solid ${T.blue}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.cn,
                fontSize: 21,
                fontWeight: 800,
                color: T.blue,
              }}
            >
              TCP 首部
            </div>
            <div
              style={{
                flex: 1,
                height: 58,
                borderRadius: "0 10px 10px 0",
                background: T.amberSoft,
                border: `2px solid ${T.amber}`,
                borderLeft: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.cn,
                fontSize: 21,
                fontWeight: 800,
                color: T.amber,
              }}
            >
              数据部分
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { t: "GBN", d: "累计确认 · 回退重发", c: T.amber, bg: T.amberSoft },
            { t: "TCP", d: "累计确认 + 只补丢的那段", c: T.blue, bg: T.blueSoft },
            { t: "SR", d: "逐段确认 · 乱序缓存", c: T.green, bg: T.greenSoft },
          ].map((x, i) => (
            <FadeUp key={x.t} delay={t(5) + i * 8} style={{ width: 308 }}>
              <Panel pad={18} accent={x.c} style={{ height: 132 }}>
                <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: x.c }}>{x.t}</div>
                <div style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 700, color: T.sub, marginTop: 6, lineHeight: 1.4 }}>
                  {x.d}
                </div>
              </Panel>
            </FadeUp>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <TagLine tag="丢弃" text="校验不过，不确认" color={T.red} bg={T.redSoft} delay={t(4)} width={456} />
          <TagLine tag="1 个" text="整个窗口只维护一个定时器" delay={t(8)} width={470} />
        </div>
      </div>
    </Scene>
  );
};

// ==================== S14 · 慢开始 ====================

export const S14: React.FC = () => {
  const t = (i: number) => cueAt("s14", i);
  return (
    <Scene id="s14" no="14" title="慢开始：指数试探" en="SLOW START">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Panel pad={20} style={{ width: W }}>
          <CwndChart
            data={[1, 2, 4, 8, 16]}
            max={20}
            width={W - 40}
            height={400}
            delay={t(3)}
            bands={[{ from: 0, to: 4, label: "慢开始 · 指数", color: T.blue }]}
            marks={[{ i: 4, text: "ssthresh", color: T.amber }]}
          />
        </Panel>

        <Formula
          delay={t(4)}
          size={30}
          parts={[
            { text: "每收到 1 个 ACK", color: T.ink },
            { text: "→", color: T.faint },
            { text: "cwnd += 1 MSS", color: T.blue },
          ]}
        />

        <div style={{ display: "flex", gap: 14 }}>
          <Stat value="1 MSS" label="起步窗口" color={T.blue} delay={t(2)} size={54} />
          <Stat value="×2" label="每 RTT 翻倍" color={T.amber} delay={t(5)} size={54} />
          <Stat value="1460 B" label="常见 MSS" color={T.cyan} delay={t(7)} size={54} />
        </div>

        <Callout color={T.red} delay={t(6)} style={{ width: W - 20 }}>
          是「每收一个 ACK 加一」，不是「收一个 ACK 就翻倍」
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S15 · 拥塞避免 ====================

export const S15: React.FC = () => {
  const t = (i: number) => cueAt("s15", i);
  return (
    <Scene id="s15" no="15" title="拥塞避免：线性爬升" en="CONGESTION AVOIDANCE">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Panel pad={20} style={{ width: W }}>
          <CwndChart
            data={[16, 17, 18, 19, 20, 21, 22, 23]}
            max={26}
            width={W - 40}
            height={400}
            delay={t(0)}
            bands={[{ from: 0, to: 7, label: "拥塞避免 · 线性", color: T.green }]}
            marks={[{ i: 0, text: "过了 ssthresh", color: T.amber }]}
          />
        </Panel>

        <Formula
          delay={t(1)}
          size={29}
          parts={[
            { text: "每收到 1 个 ACK", color: T.ink },
            { text: "→", color: T.faint },
            { text: "cwnd += 1/cwnd", color: T.green },
          ]}
        />

        <div style={{ display: "flex", gap: 14 }}>
          <TagLine tag="1 RTT" text="大约收到 cwnd 个 ACK" color={T.green} bg={T.greenSoft} delay={t(2)} width={456} />
          <TagLine tag="+1" text="每个往返时间只加一个 MSS" color={T.blue} bg={T.blueSoft} delay={t(4)} width={470} />
        </div>

        <Callout color={T.amber} delay={t(5)} style={{ width: W - 20 }}>
          已经贴近链路容量，再指数涨就是<span style={{ color: T.amber }}>撞墙</span>
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S16 · 超时的处理 ====================

export const S16: React.FC = () => {
  const t = (i: number) => cueAt("s16", i);
  return (
    <Scene id="s16" no="16" title="超时：砍一半，退回起点" en="TIMEOUT · RESET TO 1 MSS">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Panel pad={20} style={{ width: W }}>
          <CwndChart
            data={[1, 2, 4, 8, 16, 17, 18, 19, 20, 1, 2, 4, 8, 16]}
            max={24}
            width={W - 40}
            height={400}
            delay={t(0)}
            bands={[
              { from: 0, to: 4, label: "慢开始", color: T.blue },
              { from: 4, to: 8, label: "拥塞避免", color: T.green },
            ]}
            marks={[{ i: 9, text: "超时 → cwnd=1", color: T.red, dy: 18 }]}
          />
        </Panel>

        <div style={{ display: "flex", gap: 14 }}>
          <Formula
            delay={t(2)}
            size={27}
            parts={[
              { text: "ssthresh", color: T.amber },
              { text: "=", color: T.faint },
              { text: "cwnd / 2", color: T.ink },
            ]}
          />
          <div style={{ width: 40 }} />
          <Formula
            delay={t(3)}
            size={27}
            parts={[
              { text: "cwnd", color: T.blue },
              { text: "=", color: T.faint },
              { text: "1 MSS", color: T.red },
            ]}
          />
        </div>

        <Callout color={T.red} delay={t(5)} style={{ width: W - 20 }}>
          锯齿状上升，超时处<span style={{ color: T.red }}>垂直落下</span>，然后重新慢开始
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S17 · 快速重传 ====================

export const S17: React.FC = () => {
  const t = (i: number) => cueAt("s17", i);
  const frame = useCurrentFrame();
  return (
    <Scene id="s17" no="17" title="快速重传：不等定时器" en="FAST RETRANSMIT">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <Panel pad={24} style={{ width: W }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <CN size={21} color={T.sub} weight={800}>
              发送方连续收到的确认
            </CN>
            <span style={{ fontFamily: T.cn, fontSize: 17, color: T.faint }}>
              包 100 丢了，后面的都到了
            </span>
          </div>
          <MiniBlocks
            items={[
              { text: "ack=100", state: "ok", label: "正常" },
              { text: "ack=100", state: "late", label: "冗余 1" },
              { text: "ack=100", state: "late", label: "冗余 2" },
              { text: "ack=100", state: "lost", label: "冗余 3 → 重传" },
            ]}
            delay={t(1)}
            size={160}
            height={58}
            gap={14}
          />
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: W }}>
          <TagLine tag="触发" text="3 个冗余 ACK，共 4 个相同的确认号" color={T.red} bg={T.redSoft} delay={t(4)} width={W} />
          <TagLine tag="动作" text="立即重传第 100 号段，不等 RTO" delay={t(3)} width={W} />
        </div>

        <Panel pad={22} style={{ width: W }} accent={T.amber}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <CN size={21} color={T.amber} weight={800}>
              时间对比
            </CN>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: T.cn, fontSize: 18, color: T.sub, width: 84 }}>超时重传</span>
                <div style={{ height: 14, background: T.redSoft, borderRadius: 7, width: 520, border: `1.5px solid ${T.red}55` }} />
                <span style={{ fontFamily: T.mono, fontSize: 17, color: T.red, fontWeight: 800 }}>等到 RTO</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: T.cn, fontSize: 18, color: T.sub, width: 84 }}>快速重传</span>
                <div
                  style={{
                    height: 14,
                    background: T.greenSoft,
                    borderRadius: 7,
                    width: interpolate(frame, [t(5), t(5) + 20], [30, 190], clamp),
                    border: `1.5px solid ${T.green}55`,
                  }}
                />
                <span style={{ fontFamily: T.mono, fontSize: 17, color: T.green, fontWeight: 800 }}>3 个 dup ACK</span>
              </div>
            </div>
          </div>
        </Panel>

        <Callout color={T.blue} delay={t(5)} style={{ width: W - 20 }}>
          快速重传只管<span style={{ color: T.blue }}>重传动作</span>，窗口怎么变看有没有快速恢复
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S18 · 快速恢复 ====================

export const S18: React.FC = () => {
  const t = (i: number) => cueAt("s18", i);
  return (
    <Scene id="s18" no="18" title="快速恢复：别退回起点" en="FAST RECOVERY">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Panel pad={16} style={{ width: 466 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Chip color={T.red} bg={T.redSoft} size={17}>
                超时
              </Chip>
              <span style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 800, color: T.sub }}>
                cwnd = 1 → 慢开始
              </span>
            </div>
            <CwndChart
              data={[20, 1, 2, 4, 8]}
              max={24}
              width={434}
              height={190}
              delay={t(0)}
              speed={3}
              marks={[{ i: 1, text: "归零", color: T.red, dy: 14 }]}
            />
          </Panel>

          <Panel pad={16} style={{ width: 466 }} accent={T.green}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Chip color={T.green} bg={T.greenSoft} size={17}>
                3 个重复 ACK
              </Chip>
              <span style={{ fontFamily: T.cn, fontSize: 18, fontWeight: 800, color: T.sub }}>
                cwnd = ssthresh → 拥塞避免
              </span>
            </div>
            <CwndChart
              data={[20, 10, 10.6, 11.2, 11.8]}
              max={24}
              width={434}
              height={190}
              delay={t(2)}
              speed={3}
              marks={[{ i: 1, text: "砍半", color: T.green, dy: 14 }]}
            />
          </Panel>
        </div>

        <Formula
          delay={t(3)}
          size={26}
          parts={[
            { text: "ssthresh = cwnd/2", color: T.amber },
            { text: "，", color: T.faint },
            { text: "cwnd = ssthresh", color: T.green },
            { text: "（教材口径）", color: T.sub, size: 20 },
          ]}
        />

        <div style={{ display: "flex", gap: 14 }}>
          <TagLine tag="+3" text="Reno：认为 3 段已离开网络" color={T.purple} bg={T.purpleSoft} delay={t(5)} width={456} />
          <TagLine tag="408" text="按教材写，点名 Reno 才加 3" color={T.blue} bg={T.blueSoft} delay={t(7)} width={470} />
        </div>

        <Callout color={T.purple} delay={t(1)} style={{ width: W - 20 }}>
          网络还在送数据，只是丢了一个包 —— 所以<span style={{ color: T.purple }}>轻处理</span>
        </Callout>
      </div>
    </Scene>
  );
};

// ==================== S19 · 全景 ====================

const MAP = [
  { n: "01", t: "连接", c: T.blue, d: "三次握手 → 传数据 → 四次挥手（2MSL）" },
  { n: "02", t: "传输", c: T.green, d: "字节流 + 滑动窗口 + 序列号 / 累计确认" },
  { n: "03", t: "流量", c: T.cyan, d: "rwnd 限制发送方，零窗口探测" },
  { n: "04", t: "拥塞", c: T.amber, d: "慢开始指数 / 拥塞避免线性 / 超时归零 / 快速恢复" },
];

export const S19: React.FC = () => {
  const t = (i: number) => cueAt("s19", i);
  const frame = useCurrentFrame();
  return (
    <Scene id="s19" no="19" title="一张图串完 TCP" en="TCP IN ONE PICTURE">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {MAP.map((m, i) => (
          <FadeUp key={m.n} delay={t(i + 1)} style={{ width: W }}>
            <Panel pad={22} accent={m.c} style={{ borderWidth: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Mono size={26} color={m.c}>
                  {m.n}
                </Mono>
                <CN size={28} weight={800} style={{ width: 88 }}>
                  {m.t}
                </CN>
                <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 700, color: T.ink2 }}>
                  {m.d}
                </div>
              </div>
            </Panel>
          </FadeUp>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["握手", "挥手", "窗口", "重传", "拥塞"].map((x, i) => (
            <Chip
              key={x}
              color={[T.blue, T.amber, T.cyan, T.red, T.purple][i]}
              bg={[T.blueSoft, T.amberSoft, T.cyanSoft, T.redSoft, T.purpleSoft][i]}
              size={21}
              style={{ padding: "8px 16px", opacity: interpolate(frame, [t(6) + i * 8, t(6) + i * 8 + 8], [0, 1], clamp) }}
            >
              {x}
            </Chip>
          ))}
        </div>

        <Callout color={T.blue} delay={t(5)} style={{ width: W - 20 }}>
          连成一条线：<span style={{ color: T.blue }}>建立 → 传输 → 控速 → 恢复</span>，TCP 的题都有抓手
        </Callout>

        <div
          style={{
            marginTop: 10,
            fontFamily: T.mono,
            fontSize: 19,
            fontWeight: 700,
            color: T.faint,
            letterSpacing: 7,
            opacity: interpolate(frame, [t(7), t(7) + 14], [0, 1], clamp),
          }}
        >
          MRDAVE · 408 NOTES
        </div>
      </div>
    </Scene>
  );
};
