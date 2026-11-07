import React from "react";
import { T } from "./tokens";
import {
  Arrow,
  BitStrip,
  BlockGrid,
  Bullet,
  CN,
  Chip,
  DataTable,
  FadeUp,
  Formula,
  KeyLine,
  Kicker,
  Mono,
  Panel,
  Scene,
} from "./components";

// ==================== 00 引子 ====================

const LayerBox: React.FC<{
  tag: string;
  title: string;
  sub: string;
  color: string;
  bg: string;
  delay: number;
}> = ({ tag, title, sub, color, bg, delay }) => (
  <FadeUp
    delay={delay}
    style={{
      background: bg,
      border: `2px solid ${color}`,
      borderRadius: 14,
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}
  >
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 15,
        fontWeight: 800,
        color,
        letterSpacing: 1.5,
        width: 96,
        flexShrink: 0,
      }}
    >
      {tag}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: T.cn, fontSize: 24, fontWeight: 800, color: T.ink }}>{title}</div>
      <div style={{ fontFamily: T.cn, fontSize: 18, color: T.sub, marginTop: 2 }}>{sub}</div>
    </div>
  </FadeUp>
);

export const S00: React.FC = () => (
  <Scene id="s00" no="00" title="虚拟存储器" en="Virtual Memory">
    <div style={{ display: "flex", gap: 44, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 20 }}>
        <Kicker>408 · 计算机组成原理 · 存储系统</Kicker>
        <FadeUp delay={3}>
          <div
            style={{
              fontFamily: T.cn,
              fontSize: 60,
              fontWeight: 800,
              color: T.ink,
              lineHeight: 1.18,
              letterSpacing: 1,
            }}
          >
            物理内存不够用，
            <br />
            怎么办？
          </div>
        </FadeUp>
        <FadeUp delay={10}>
          <div style={{ fontFamily: T.cn, fontSize: 26, color: T.sub, lineHeight: 1.55 }}>
            答案是虚拟存储器：在内存和磁盘之间，造一个更大的抽象空间，
            <br />
            让程序以为自己拥有一整块连续内存。
          </div>
        </FadeUp>
        <FadeUp delay={18} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["怎么划分", "怎么翻译", "怎么查表", "怎么访存"].map((s, i) => (
            <Chip key={s} color={[T.blue, T.green, T.purple, T.amber][i]} bg={[T.blueSoft, T.greenSoft, T.purpleSoft, T.amberSoft][i]} size={20}>
              {`0${i + 1} ${s}`}
            </Chip>
          ))}
        </FadeUp>
      </div>

      <Panel style={{ flex: "0 0 760px" }} pad={24}>
        <Kicker color={T.faint} style={{ marginBottom: 14 }}>
          one address, three worlds
        </Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <LayerBox
            tag="进程视角"
            title="连续、完整的虚拟地址空间"
            sub="0x0000_0000 ────────── 0xFFFF_FFFF"
            color={T.blue}
            bg={T.blueSoft}
            delay={8}
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Arrow vertical label="MMU + 页表" delay={14} color={T.purple} />
          </div>
          <LayerBox
            tag="物理内存"
            title="真实 RAM：分散的页框"
            sub="可能只装了极少一部分页"
            color={T.green}
            bg={T.greenSoft}
            delay={20}
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Arrow vertical label="缺页 / 换出" delay={26} color={T.red} dashed />
          </div>
          <LayerBox
            tag="磁盘"
            title="交换分区：页的备份仓库"
            sub="没装进内存的页都躺在这里"
            color={T.red}
            bg={T.redSoft}
            delay={32}
          />
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 01 物理内存 vs 虚拟内存 ====================

const MemCard: React.FC<{
  tag: string;
  title: string;
  rows: [string, string][];
  color: string;
  bg: string;
  delay: number;
}> = ({ tag, title, rows, color, bg, delay }) => (
  <FadeUp
    delay={delay}
    style={{
      flex: 1,
      background: T.panel,
      border: `2px solid ${T.line}`,
      borderTop: `6px solid ${color}`,
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "0 8px 22px rgba(20,26,34,0.05)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 15,
          fontWeight: 800,
          color,
          background: bg,
          border: `1.5px solid ${color}44`,
          borderRadius: 8,
          padding: "4px 10px",
          letterSpacing: 1.5,
        }}
      >
        {tag}
      </span>
      <span style={{ fontFamily: T.cn, fontSize: 30, fontWeight: 800, color: T.ink }}>{title}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 96,
              fontFamily: T.cn,
              fontSize: 19,
              fontWeight: 700,
              color: T.faint,
              flexShrink: 0,
              paddingTop: 1,
            }}
          >
            {k}
          </div>
          <div style={{ fontFamily: T.cn, fontSize: 22, fontWeight: 600, color: T.ink2, lineHeight: 1.45 }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  </FadeUp>
);

export const S01: React.FC = () => (
  <Scene id="s01" no="01" title="物理内存与虚拟内存" en="Physical vs Virtual">
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
        <MemCard
          tag="RAM"
          title="物理内存"
          color={T.green}
          bg={T.greenSoft}
          delay={4}
          rows={[
            ["是什么", "主板上的 RAM 芯片，真实存在的硬件"],
            ["地址", "物理地址 = 每个存储单元的唯一编号"],
            ["谁在用", "CPU 最终必须用它才能取到数据"],
            ["规模", "固定、有限，插了几条就是多少"],
          ]}
        />
        <MemCard
          tag="ABSTRACT"
          title="虚拟内存"
          color={T.blue}
          bg={T.blueSoft}
          delay={10}
          rows={[
            ["是什么", "一种内存管理技术，不是一块具体硬件"],
            ["地址", "虚拟地址 = 进程看到的连续编号"],
            ["谁在用", "进程只用虚拟地址，不关心物理内存在哪"],
            ["规模", "可以远大于物理内存，甚至可以更分散"],
          ]}
        />
      </div>
      <KeyLine delay={22}>
        进程管虚拟地址，硬件管翻译，物理内存负责真正落地。
      </KeyLine>
    </div>
  </Scene>
);

// ==================== 02 页式虚拟存储器 ====================

export const S02: React.FC = () => (
  <Scene id="s02" no="02" title="页式虚拟存储器" en="Paged Virtual Memory">
    <div style={{ display: "flex", gap: 34, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "0 0 600px", display: "flex", flexDirection: "column", gap: 13 }}>
        <Bullet marker="1" delay={4} size={22}>
          虚拟空间切成<span style={{ color: T.blue, fontWeight: 800 }}>虚拟页 VP</span>，
          物理空间切成<span style={{ color: T.green, fontWeight: 800 }}>物理页框 PP</span>
        </Bullet>
        <Bullet marker="2" delay={10} dot={T.green} size={22}>
          两者<span style={{ fontWeight: 800, color: T.ink }}>大小相同</span>，常见 4 KB
        </Bullet>
        <Bullet marker="3" delay={16} dot={T.amber} size={22}>
          用哪页调哪页，其余留在磁盘 —— 按需装入
        </Bullet>
        <Bullet marker="4" delay={22} dot={T.red} size={22}>
          页不在内存 → 缺页中断 → 内核把它调进来
        </Bullet>
        <Bullet marker="5" delay={28} dot={T.purple} size={22}>
          内存满了 → 页面置换，挑一页换出去
        </Bullet>
        <KeyLine delay={34} size={22} color={T.purple} bg={T.purpleSoft}>
          对程序透明：它只感到这一次访问慢了一点
        </KeyLine>
      </div>

      <Panel style={{ flex: 1 }} pad={22}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1 1 0" }}>
            <Kicker color={T.blue}>虚拟空间 · 页</Kicker>
            <div style={{ marginTop: 8 }}>
              <BlockGrid
                cols={3}
                rows={3}
                highlight={[0, 2, 4, 7]}
                cellH={52}
                delay={12}
                color={T.blue}
                bg={T.blueSoft}
                labels={["VP0", "VP1", "VP2", "VP3", "VP4", "VP5", "VP6", "VP7", "VP8"]}
              />
            </div>
          </div>
          <div style={{ width: 118, display: "flex", justifyContent: "center", paddingTop: 22 }}>
            <Arrow width={82} delay={20} label="映射" color={T.purple} />
          </div>
          <div style={{ flex: "0 0 300px" }}>
            <Kicker color={T.green}>物理内存 · 页框</Kicker>
            <div style={{ marginTop: 8 }}>
              <BlockGrid
                cols={2}
                rows={3}
                highlight={[0, 1, 3]}
                dimFrom={4}
                cellH={52}
                delay={18}
                color={T.green}
                bg={T.greenSoft}
                labels={["PP0", "PP1", "PP2", "PP3", "—", "—"]}
              />
            </div>
          </div>
          <div style={{ width: 100, display: "flex", justifyContent: "center", paddingTop: 22 }}>
            <Arrow width={68} delay={26} label="换出" color={T.red} dashed />
          </div>
          <div style={{ flex: "0 0 170px" }}>
            <Kicker color={T.red}>磁盘</Kicker>
            <div style={{ marginTop: 8 }}>
              <BlockGrid
                cols={1}
                rows={3}
                highlight={[0, 1, 2]}
                cellH={52}
                delay={30}
                color={T.red}
                bg={T.redSoft}
                labels={["swap0", "swap1", "swap2"]}
                size={12}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1.5px dashed ${T.line}`,
            display: "flex",
            gap: 22,
            fontFamily: T.cn,
            fontSize: 20,
            color: T.sub,
          }}
        >
          <span>蓝色：已装入</span>
          <span>虚线：未装入 / 空闲</span>
          <span style={{ color: T.ink2, fontWeight: 700 }}>好处：进程隔离 + 内存共享</span>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 03 地址结构 ====================

export const S03: React.FC = () => (
  <Scene id="s03" no="03" title="页面划分与地址结构" en="Address Format">
    <div style={{ display: "flex", flexDirection: "column", gap: 26, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Chip color={T.blue} bg={T.blueSoft} size={17}>
            VA
          </Chip>
          <CN size={21} color={T.sub}>
            虚拟地址
          </CN>
        </div>
        <BitStrip
          segs={[
            { label: "VPN 虚拟页号", sub: "找到是哪一页", bits: "m 位", flex: 3, color: T.blue, bg: T.blueSoft },
            { label: "VPO 页内偏移", sub: "页内第几个字节", bits: "n 位", flex: 2, color: T.amber, bg: T.amberSoft },
          ]}
          delay={6}
          height={96}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Chip color={T.green} bg={T.greenSoft} size={17}>
            PA
          </Chip>
          <CN size={21} color={T.sub}>
            物理地址
          </CN>
        </div>
        <BitStrip
          segs={[
            { label: "PPN 物理页号", sub: "找到是哪个页框", bits: "k 位", flex: 2, color: T.green, bg: T.greenSoft },
            { label: "PPO 页内偏移", sub: "与 VPO 完全相同", bits: "n 位", flex: 2, color: T.amber, bg: T.amberSoft },
          ]}
          delay={16}
          height={96}
        />
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        <Formula label="页大小" color={T.amber}>
          = 2<sup>n</sup>
        </Formula>
        <div style={{ width: 2, height: 26, background: T.line }} />
        <Formula label="虚拟页数" color={T.blue}>
          = 2<sup>m</sup>
        </Formula>
        <div style={{ width: 2, height: 26, background: T.line }} />
        <Formula label="翻译" color={T.purple}>
          VPN → PPN
        </Formula>
        <div style={{ flex: 1 }} />
        <KeyLine delay={28} size={21}>
          VPO = PPO，偏移一个位都不变
        </KeyLine>
      </div>

      <div
        style={{
          display: "flex",
          gap: 26,
          paddingTop: 4,
          fontFamily: T.cn,
          fontSize: 20,
          color: T.sub,
        }}
      >
        <span>同义词：</span>
        <span>
          <span style={{ color: T.blue, fontWeight: 800 }}>虚拟页</span> = 逻辑页
        </span>
        <span>
          <span style={{ color: T.green, fontWeight: 800 }}>页框</span> = 物理页 = Physical Page
        </span>
      </div>
    </div>
  </Scene>
);

// ==================== 04 MMU ====================

export const S04: React.FC = () => (
  <Scene id="s04" no="04" title="地址翻译机构 MMU" en="Memory Management Unit">
    <div style={{ display: "flex", gap: 30, width: "100%", alignItems: "stretch" }}>
      <div style={{ flex: "0 0 620px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Kicker>MMU 的三项职责</Kicker>
        {[
          ["地址转换", "把进程给出的虚拟地址换成物理地址", T.blue, T.blueSoft],
          ["地址保护", "防止进程越界访问别人的内存", T.green, T.greenSoft],
          ["权限控制", "按保护位决定这一页可读、可写还是可执行", T.purple, T.purpleSoft],
        ].map(([t, d, c, b], i) => (
          <FadeUp
            key={t as string}
            delay={6 + i * 6}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: b as string,
              border: `2px solid ${c as string}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 22,
                fontWeight: 800,
                color: c as string,
                width: 118,
                flexShrink: 0,
              }}
            >
              {t as string}
            </div>
            <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 600, color: T.ink2, lineHeight: 1.4 }}>
              {d as string}
            </div>
          </FadeUp>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <Kicker color={T.red}>最容易卡住的问题</Kicker>
        <FadeUp delay={10}>
          <div style={{ fontFamily: T.cn, fontSize: 26, fontWeight: 800, color: T.ink, lineHeight: 1.5 }}>
            页表是操作系统维护的，
            <br />
            翻译却是硬件完成的 —— 矛盾吗？
          </div>
        </FadeUp>
        <DataTable
          delay={16}
          size={20}
          widths={["120px", undefined]}
          head={["角色", "负责什么"]}
          rows={[
            { cells: ["操作系统", "提供规则和数据：按架构规范在内存里搭出页表"], accent: T.blue, bg: T.blueSoft },
            { cells: ["MMU", "执行翻译：按 PTBR 逐级查页表，或查 TLB"], accent: T.green, bg: T.greenSoft },
          ]}
        />
        <KeyLine delay={26} size={20} color={T.red} bg={T.redSoft}>
          页表格式由 CPU 架构定死，OS 只是照着填
        </KeyLine>
        <CN size={19} color={T.sub}>
          整个过程对软件透明，不需要操作系统逐条参与。
        </CN>
      </div>
    </div>
  </Scene>
);

// ==================== 05 单级页表 ====================

export const S05: React.FC = () => (
  <Scene id="s05" no="05" title="单级页表与页表项" en="Single-Level Page Table">
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CN size={22} color={T.sub}>
          一条页表项（PTE）
        </CN>
        <div style={{ flex: 1 }}>
          <BitStrip
            segs={[
              { label: "PPN", sub: "物理页号 · 核心", bits: "k 位", flex: 3, color: T.green, bg: T.greenSoft },
              { label: "valid", sub: "在不在内存", bits: "1 位", flex: 2, color: T.blue, bg: T.blueSoft },
              { label: "dirty", sub: "写没写过", bits: "1 位", flex: 2, color: T.red, bg: T.redSoft },
              { label: "accessed", sub: "读没读过", bits: "1 位", flex: 2, color: T.amber, bg: T.amberSoft },
              { label: "保护 / 缓存", sub: "权限与可缓存", bits: "剩余", flex: 2, color: T.purple, bg: T.purpleSoft, dim: true },
            ]}
            delay={4}
            height={88}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        {[
          ["VPN 不存", "单级页表里，虚拟页号就是下标，隐式存在", T.blue, T.blueSoft],
          ["valid = 0", "页不在内存 → 触发缺页中断", T.red, T.redSoft],
          ["dirty = 1", "页被写过 → 换出时必须写回磁盘", T.red, T.redSoft],
          ["accessed", "给置换算法用：最近有没有被访问", T.amber, T.amberSoft],
        ].map(([t, d, c, b], i) => (
          <FadeUp
            key={t as string}
            delay={14 + i * 5}
            style={{
              flex: 1,
              background: b as string,
              border: `2px solid ${(c as string)}55`,
              borderRadius: 14,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: c as string }}>{t as string}</div>
            <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, lineHeight: 1.45, marginTop: 6 }}>
              {d as string}
            </div>
          </FadeUp>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center", paddingTop: 2 }}>
        <Chip color={T.purple} bg={T.purpleSoft} size={17}>
          注意
        </Chip>
        <CN size={21} color={T.ink2}>
          页表项的具体格式因架构而异，做题按题目给的字段来 —— 必看 PPN、valid，常看 dirty、accessed。
        </CN>
      </div>
    </div>
  </Scene>
);

// ==================== 06 翻译实例 ====================

const ParamRow: React.FC<{ k: string; v: string; d: string; delay: number }> = ({ k, v, d, delay }) => (
  <FadeUp
    delay={delay}
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      background: T.panel,
      border: `1.5px solid ${T.line}`,
      borderLeft: `5px solid ${T.blue}`,
      borderRadius: 9,
      padding: "9px 14px",
    }}
  >
    <span style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 700, color: T.sub, width: 82 }}>{k}</span>
    <span style={{ fontFamily: T.mono, fontSize: 23, fontWeight: 800, color: T.ink }}>{v}</span>
    <span style={{ fontFamily: T.cn, fontSize: 17, color: T.faint, marginLeft: "auto" }}>{d}</span>
  </FadeUp>
);

export const S06: React.FC = () => (
  <Scene id="s06" no="06" title="单级页表翻译实例" en="Worked Example · 0x321654">
    <div style={{ display: "flex", gap: 34, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "0 0 470px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Kicker>题目给定</Kicker>
        <ParamRow k="虚拟内存" v="16 MB" d="VA 24 位" delay={4} />
        <ParamRow k="物理内存" v="1 MB" d="PA 20 位" delay={8} />
        <ParamRow k="页大小" v="4 KB" d="偏移 12 位" delay={12} />
        <div style={{ height: 6 }} />
        <Kicker color={T.green}>由此推出</Kicker>
        <ParamRow k="VPN" v="24 − 12 = 12 位" d="虚页数 4K" delay={18} />
        <ParamRow k="PPN" v="20 − 12 = 8 位" d="页框数 256" delay={22} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <BitStrip
          segs={[
            { label: "VPN", sub: "0x321", bits: "12 位", flex: 1, color: T.blue, bg: T.blueSoft },
            { label: "VPO", sub: "0x654", bits: "12 位", flex: 1, color: T.amber, bg: T.amberSoft },
          ]}
          delay={26}
          height={94}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Arrow width={70} label="查页表" delay={34} color={T.purple} />
          <FadeUp
            delay={38}
            style={{
              flex: 1,
              fontFamily: T.cn,
              fontSize: 20,
              color: T.ink2,
              background: T.panel,
              border: `1.5px dashed ${T.purple}`,
              borderRadius: 10,
              padding: "10px 16px",
            }}
          >
            下标 <Mono size={20} color={T.purple}>0x321</Mono> → 看 valid：0 缺页，1 取 PPN
          </FadeUp>
        </div>
        <BitStrip
          segs={[
            { label: "PPN", sub: "来自页表项", bits: "8 位", flex: 2, color: T.green, bg: T.greenSoft },
            { label: "PPO", sub: "0x654 照抄", bits: "12 位", flex: 3, color: T.amber, bg: T.amberSoft },
          ]}
          delay={44}
          height={94}
        />
        <KeyLine delay={52} size={21}>
          翻译只换页号，偏移原样搬过去
        </KeyLine>
      </div>
    </div>
  </Scene>
);

// ==================== 07 单级页表的问题 ====================

export const S07: React.FC = () => (
  <Scene id="s07" no="07" title="单级页表的困境" en="The 4 MB Problem">
    <div style={{ display: "flex", gap: 34, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "0 0 700px", display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeUp delay={4}>
          <Formula label="32 位地址空间" color={T.blue}>
            4 GB ÷ 4 KB = 2<sup>20</sup> 个虚拟页
          </Formula>
        </FadeUp>
        <FadeUp delay={10}>
          <Formula label="页表项数" color={T.purple}>
            2<sup>20</sup> 项 × 4 B = 4 MB
          </Formula>
        </FadeUp>
        <FadeUp delay={16}>
          <div style={{ fontFamily: T.cn, fontSize: 24, color: T.ink2, lineHeight: 1.55 }}>
            这 4 MB 必须<span style={{ color: T.red, fontWeight: 800 }}>常驻内存</span>，
            哪怕程序实际只碰了几百 KB；
            <br />
            而且每个进程都要来一份。
          </div>
        </FadeUp>
        <KeyLine delay={24} color={T.red} bg={T.redSoft} size={22}>
          根源：按最大规模一次铺开，可虚拟空间大部分是空的
        </KeyLine>
      </div>

      <Panel style={{ flex: 1 }} pad={22}>
        <Kicker color={T.red}>一张 4 MB 的页表</Kicker>
        <div style={{ marginTop: 12 }}>
          <BlockGrid
            cols={16}
            rows={8}
            highlight={[0, 1, 2]}
            dimFrom={3}
            cellH={26}
            gap={4}
            delay={20}
            size={10}
            color={T.red}
            bg={T.redSoft}
            labels={Array.from({ length: 128 }, (_, i) => (i < 3 ? "✓" : "·"))}
          />
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 18,
            fontFamily: T.cn,
            fontSize: 18,
            color: T.sub,
          }}
        >
          <span style={{ color: T.red, fontWeight: 700 }}>✓ 真正用到的 3 项</span>
          <span>· 其余 2^20 项全都要占着</span>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 08 多级页表 ====================

const LevelBox: React.FC<{
  title: string;
  sub: string;
  color: string;
  bg: string;
  delay: number;
  wide?: boolean;
}> = ({ title, sub, color, bg, delay, wide }) => (
  <FadeUp
    delay={delay}
    style={{
      width: wide ? 300 : 200,
      background: bg,
      border: `2px solid ${color}`,
      borderRadius: 12,
      padding: "12px 16px",
      textAlign: "center",
    }}
  >
    <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color }}>{title}</div>
    <div style={{ fontFamily: T.mono, fontSize: 15, color: T.sub, marginTop: 3 }}>{sub}</div>
  </FadeUp>
);

export const S08: React.FC = () => (
  <Scene id="s08" no="08" title="多级页表" en="Multi-Level Page Table">
    <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <BitStrip
          segs={[
            { label: "一级索引", bits: "m₁", flex: 1, color: T.blue, bg: T.blueSoft },
            { label: "二级索引", bits: "m₂", flex: 1, color: T.cyan, bg: T.cyanSoft },
            { label: "……", bits: "mₖ₋₁", flex: 1, color: T.purple, bg: T.purpleSoft },
            { label: "末级索引", bits: "mₖ", flex: 1, color: T.green, bg: T.greenSoft },
            { label: "页内偏移", bits: "n", flex: 1.3, color: T.amber, bg: T.amberSoft },
          ]}
          delay={4}
          height={78}
          labelSize={20}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: T.cn, fontSize: 19, color: T.sub }}>
            VPN 再切 <Mono size={19}>k</Mono> 段：前 k−1 段查到的是下一级页表位置，只有末级才查到 PPN
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 700, color: T.faint }}>
            查 k 次页表 = k 次访存
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <LevelBox title="顶级页表" sub="PTBR 指向 · 常驻" color={T.blue} bg={T.blueSoft} delay={14} />
        <Arrow width={54} delay={18} />
        <LevelBox title="二级页表" sub="按需分配" color={T.cyan} bg={T.cyanSoft} delay={20} />
        <Arrow width={54} delay={24} />
        <LevelBox title="末级页表" sub="PTE → PPN" color={T.green} bg={T.greenSoft} delay={26} wide />
        <div style={{ width: 10 }} />
        <Panel pad={16} style={{ width: 330 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Bullet size={19} dot={T.green} delay={32}>
              只有顶级页表必须常驻
            </Bullet>
            <Bullet size={19} dot={T.amber} delay={36}>
              上级 PTE 的 valid = 0 → 不建下级页表
            </Bullet>
            <Bullet size={19} dot={T.red} delay={40}>
              代价：查 k 次页表 = k 次访存
            </Bullet>
          </div>
        </Panel>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <KeyLine delay={46} size={21} color={T.purple} bg={T.purpleSoft} style={{ flex: 1 }}>
          用时间换空间：典型 4 GB 空间里大部分未分配，省下几个数量级
        </KeyLine>
      </div>
    </div>
  </Scene>
);

// ==================== 09 PTBR ====================

export const S09: React.FC = () => (
  <Scene id="s09" no="09" title="进程切换与页表基址" en="PTBR / CR3">
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
        {[
          ["PCB", "保存页表物理基址", T.blue, T.blueSoft],
          ["PTBR / CR3", "指向顶级页表", T.purple, T.purpleSoft],
          ["顶级页表", "在物理内存中", T.green, T.greenSoft],
          ["MMU", "按它逐级翻译", T.cyan, T.cyanSoft],
        ].map(([t, d, c, b], i) => (
          <React.Fragment key={t as string}>
            <FadeUp
              delay={4 + i * 6}
              style={{
                width: 300,
                background: b as string,
                border: `2px solid ${c as string}`,
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, color: c as string }}>{t as string}</div>
              <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 5 }}>{d as string}</div>
            </FadeUp>
            {i < 3 ? <Arrow width={50} delay={8 + i * 6} /> : null}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "flex", gap: 22 }}>
        <Panel style={{ flex: 1 }} pad={20}>
          <Kicker>进程切换时发生了什么</Kicker>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            <Bullet marker="1" size={20} delay={20}>
              保存当前进程 CPU 状态到它的 PCB
            </Bullet>
            <Bullet marker="2" size={20} delay={24}>
              把下一个进程 PCB 里的页表物理基址写进 PTBR
            </Bullet>
            <Bullet marker="3" size={20} delay={28}>
              恢复下一个进程的 CPU 状态
            </Bullet>
          </div>
        </Panel>
        <Panel style={{ flex: 1 }} pad={20} accent={T.red}>
          <Kicker color={T.red}>两个必须记牢的点</Kicker>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            <Bullet marker="!" size={20} dot={T.red} delay={30}>
              PTBR 存的是<span style={{ fontWeight: 800, color: T.red }}>物理地址</span>，不是虚拟地址
            </Bullet>
            <Bullet marker="!" size={20} dot={T.red} delay={34}>
              同一时刻只有一个 PTBR 生效
            </Bullet>
            <Bullet marker="✓" size={20} dot={T.green} delay={38}>
              所以进程切换 = 换一张地址空间的地图
            </Bullet>
          </div>
        </Panel>
      </div>
    </div>
  </Scene>
);
