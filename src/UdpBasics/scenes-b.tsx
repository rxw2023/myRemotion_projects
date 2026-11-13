import React from "react";
import { useCurrentFrame } from "remotion";
import { F, T } from "../shared/b3b/tokens";
import { Cells, Chip, Stage, Subs, Table, Write, p, useCues } from "../shared/b3b/ui";
import { Box, Head, Item, Step } from "./parts";

// ==========================================================================
// s06 · 接收端验证
// ==========================================================================
export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s06");

  return (
    <Stage label="第 7 幕 · 接收端">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="接收端：加起来应该是全 1" delay={at(0)} size={46} weight={500} />
      </div>

      <Step
        x={130}
        y={248}
        n={1}
        title="重造伪首部"
        detail="用收到的 IP 首部，把 12 字节伪首部重新拼出来"
        color={T.blue}
        delay={at(1)}
        w={640}
      />
      <Step
        x={130}
        y={388}
        n={2}
        title="全部相加"
        detail="16 位分组逐个累加，这一次连校验和字段一起算"
        color={T.teal}
        delay={at(2)}
        w={640}
      />
      <Step
        x={130}
        y={528}
        n={3}
        title="看结果"
        detail="全 1 → 通过；不是全 1 → 路上出了错"
        color={T.yellow}
        delay={at(3)}
        w={640}
      />

      <Box x={830} y={244} w={930} h={264} color={T.green} delay={at(2)} fill>
        <div style={{ fontFamily: F.mono, fontSize: 44, color: T.ink, letterSpacing: 1.5 }}>
          43E1 + BC1E = FFFF
        </div>
        <div style={{ fontFamily: F.cn, fontSize: 25, color: T.green, marginTop: 18, letterSpacing: 0.8 }}>
          ✓ 全 1 —— 数据正确，收下
        </div>
      </Box>

      <div
        style={{
          position: "absolute",
          left: 840,
          top: 556,
          fontFamily: F.cn,
          fontSize: 25,
          color: T.red,
          opacity: p(f, at(3) + 24, 18),
          letterSpacing: 0.6,
        }}
      >
        ≠ 全 1 → 通常直接丢弃（UDP 不负责重传）
      </div>
      <div
        style={{
          position: "absolute",
          left: 840,
          top: 616,
          fontFamily: F.cn,
          fontSize: 21,
          color: T.sub,
          opacity: p(f, at(4), 18),
          letterSpacing: 0.4,
        }}
      >
        也可以交给上层，但要附上「这是错的数据」这句话
      </div>

      <Box x={130} y={720} w={790} h={110} color={T.faint} delay={at(5)} dashed>
        <div style={{ fontFamily: F.mono, fontSize: 21, color: T.ink2 }}>校验和 = 0000</div>
        <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 8 }}>发送端根本没算，接收端直接收下</div>
      </Box>
      <Box x={950} y={720} w={770} h={110} color={T.yellow} delay={at(6)} dashed>
        <div style={{ fontFamily: F.mono, fontSize: 21, color: T.yellow }}>算出来的和 = 0000</div>
        <div style={{ fontFamily: F.cn, fontSize: 18, color: T.sub, marginTop: 8 }}>发送时填 FFFF，免得跟"禁用"混掉</div>
      </Box>
      <Subs sceneId="s06" />
    </Stage>
  );
};

// ==========================================================================
// s07 · 五个特点
// ==========================================================================
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s07");

  const feats = [
    { t: "无连接", n: "发前不握手 · 每个数据报各自独立", c: T.blue, d: at(1) },
    { t: "轻量", n: "无连接状态 · 无拥塞控制 · 首部只有 8 字节", c: T.teal, d: at(2) },
    { t: "无序", n: "先发的可能后到 · 排序得应用自己做", c: T.yellow, d: at(3) },
    { t: "不可靠", n: "不重传 · 不纠正 · 也不通知", c: T.red, d: at(4) },
    { t: "一对多", n: "广播 · 组播 · 这一条只有 UDP 能做", c: T.purple, d: at(5) },
  ];

  return (
    <Stage label="第 8 幕 · 五个特点">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="回到设计本身：五个特点" delay={at(0)} size={46} weight={500} />
      </div>

      {feats.map((x, i) => (
        <Item
          key={x.t}
          x={150}
          y={214 + i * 124}
          i={i + 1}
          title={x.t}
          note={x.n}
          color={x.c}
          delay={x.d}
          w={1560}
          size={32}
          noteSize={20}
          noteColor={T.sub}
        />
      ))}
      <Chip x={150} y={826} text="唯一能广播 / 组播的传输层协议" color={T.purple} size={20} delay={at(5) + 30} mono={false} />
      <div
        style={{
          position: "absolute",
          left: 900,
          top: 838,
          width: 810,
          textAlign: "right",
          fontFamily: F.cn,
          fontSize: 26,
          color: T.sub,
          letterSpacing: 1,
          opacity: p(f, at(5) + 30, 18),
        }}
      >
        四条是「不做」，只有第五条是「能做」
      </div>
      <Subs sceneId="s07" />
    </Stage>
  );
};

// ==========================================================================
// s08 · 应用场景
// ==========================================================================
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s08");

  const cards = [
    {
      n: "01",
      title: "一次只传一点点",
      tags: ["DNS", "SNMP"],
      reason: "为一次查询去握手三次、挥手四次，开销比数据本身还大",
      color: T.blue,
      d: at(1),
      rd: at(2),
      x: 150,
      y: 236,
    },
    {
      n: "02",
      title: "对延迟敏感",
      tags: ["视频会议", "直播", "游戏"],
      reason: "晚到的帧没有价值，宁可丢一帧，也不卡住等重传",
      color: T.yellow,
      d: at(3),
      rd: at(4),
      x: 990,
      y: 236,
    },
    {
      n: "03",
      title: "应用自己实现可靠",
      tags: ["自写确认", "自写重传"],
      reason: "把可靠性挪到应用层，按业务需要定制，而不是全都要",
      color: T.teal,
      d: at(5),
      rd: at(5) + 26,
      x: 150,
      y: 516,
    },
    {
      n: "04",
      title: "QUIC / HTTP-3",
      tags: ["跑在 UDP 上", "可靠传输"],
      reason: "在 UDP 之上做确认、重传、拥塞控制——却又绕开了 TCP 的队头阻塞",
      color: T.purple,
      d: at(6),
      rd: at(6) + 22,
      x: 990,
      y: 516,
    },
  ];

  return (
    <Stage label="第 9 幕 · 为什么还在用">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="听起来全是缺点，那它为什么还在用？" delay={at(0)} size={46} weight={500} />
      </div>

      {cards.map((c) => {
        const v = p(f, c.d, 20);
        return (
          <div
            key={c.n}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 780,
              height: 250,
              borderRadius: 10,
              border: `1.5px solid ${c.color}55`,
              background: `${c.color}0D`,
              padding: "26px 30px",
              boxSizing: "border-box",
              opacity: v,
              transform: `translateY(${(1 - v) * 16}px)`,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 17, color: c.color, letterSpacing: 2 }}>{c.n}</div>
            <div style={{ fontFamily: F.cn, fontSize: 31, color: T.ink, marginTop: 10, letterSpacing: 0.6 }}>
              {c.title}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {c.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: F.cn,
                    fontSize: 17,
                    color: c.color,
                    border: `1px solid ${c.color}55`,
                    borderRadius: 999,
                    padding: "3px 12px",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              style={{
                fontFamily: F.cn,
                fontSize: 18,
                color: T.sub,
                lineHeight: 1.6,
                marginTop: 14,
                opacity: p(f, c.rd, 18),
              }}
            >
              {c.reason}
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, top: 852, textAlign: "center" }}>
        <Write text="UDP 不是不可靠，是把可靠性外包了出去" delay={at(7)} size={36} color={T.yellow} />
      </div>
      <Subs sceneId="s08" />
    </Stage>
  );
};

// ==========================================================================
// s09 · 考点表
// ==========================================================================
export const S09: React.FC = () => {
  const { at } = useCues("s09");

  const rows = [
    { cells: ["首部", "固定 8 字节（64 位），四个字段各 2 字节"], color: T.ink2 },
    { cells: ["长度字段", "首部 + 数据的总长；最小值 8；长度 = 数据长度 + 8"], color: T.yellow },
    { cells: ["伪首部", "12 字节；协议号 17；只参与计算，不传输"], color: T.blue },
    { cells: ["校验和", "全 0 = 禁用；算得 0 则填全 1；验证通过得全 1"], color: T.purple },
    { cells: ["分用", "依据目的端口；端口不可达 → 丢弃 + 回 ICMP 差错报文"], color: T.teal },
    { cells: ["特点", "无连接 · 无序 · 不可靠 · 支持广播和组播"], color: T.ink2 },
    { cells: ["场景", "DNS/SNMP · 会议直播游戏 · 应用自实现 · QUIC"], color: T.faint },
  ];

  return (
    <Stage label="第 10 幕 · 考点">
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, display: "flex", justifyContent: "center" }}>
        <Write text="考点：一张表" delay={at(0)} size={46} weight={500} />
      </div>

      <Table
        x={170}
        y={230}
        cols={[
          { label: "项目", w: 300 },
          { label: "结论", w: 1320 },
        ]}
        rows={rows}
        delay={at(1)}
        stagger={118}
        rowH={88}
        size={24}
      />
      <Subs sceneId="s09" />
    </Stage>
  );
};

// ==========================================================================
// s10 · 收尾
// ==========================================================================
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { at } = useCues("s10");
  const cardV = p(f, at(1), 20);

  const bytes = [
    { label: "0", sub: "源", color: T.blue },
    { label: "1", sub: "源", color: T.blue },
    { label: "2", sub: "目的", color: T.teal },
    { label: "3", sub: "目的", color: T.teal },
    { label: "4", sub: "长度", color: T.yellow },
    { label: "5", sub: "长度", color: T.yellow },
    { label: "6", sub: "校验", color: T.purple },
    { label: "7", sub: "校验", color: T.purple },
  ];

  return (
    <Stage label="第 11 幕 · 收尾">
      <Head x={376} y={158} text="回到那张明信片" color={T.faint} delay={at(0)} size={20} />

      <div
        style={{
          position: "absolute",
          left: 360,
          top: 210,
          width: 380,
          height: 240,
          border: `1.5px dashed ${T.blue}`,
          borderRadius: 8,
          opacity: cardV * 0.9,
          transform: `rotate(-2deg) scale(${0.96 + 0.04 * cardV})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 292,
            top: 20,
            width: 62,
            height: 50,
            border: `1.5px dashed ${T.yellow}`,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: 1.4,
            color: T.yellow,
            opacity: 0.8,
          }}
        >
          POST
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 30,
              top: 118 + i * 36,
              width: 260,
              height: 1,
              background: T.line,
              transform: `scaleX(${p(f, at(1) + 8 + i * 4, 18)})`,
              transformOrigin: "left center",
            }}
          />
        ))}
      </div>

      <div style={{ position: "absolute", left: 820, top: 256 }}>
        <Write text="写好地址，投进邮筒" delay={at(1) + 10} size={36} weight={500} />
      </div>
      <div style={{ position: "absolute", left: 820, top: 312 }}>
        <Write text="剩下的，与你无关" delay={at(1) + 26} size={36} color={T.sub} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 378,
          fontFamily: F.mono,
          fontSize: 18,
          color: T.faint,
          opacity: p(f, at(2), 18),
          letterSpacing: 1.4,
        }}
      >
        FIRE AND FORGET
      </div>

      <Cells
        x={541}
        y={488}
        cells={bytes}
        cw={96}
        ch={96}
        gap={10}
        delay={at(3)}
        stagger={5}
        size={30}
        subSize={18}
      />

      <div style={{ position: "absolute", left: 0, right: 0, top: 636, textAlign: "center" }}>
        <Write text="它不承诺什么，" delay={at(4)} size={44} weight={500} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center" }}>
        <Write text="所以也几乎不花什么代价。" delay={at(4) + 22} size={44} weight={500} color={T.yellow} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 862, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: 4, color: T.faint, opacity: p(f, at(4) + 40, 20) }}>
          UDP · RFC 768 · 8 BYTES
        </span>
      </div>
      <Subs sceneId="s10" />
    </Stage>
  );
};
