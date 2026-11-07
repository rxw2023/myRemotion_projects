import React from "react";
import { T } from "./tokens";
import {
  Arrow,
  BitStrip,
  Bullet,
  CN,
  Chip,
  DataTable,
  EntryTable,
  FadeUp,
  FlowRow,
  KeyLine,
  Kicker,
  Mono,
  Panel,
  Scene,
} from "./components";

// ==================== 10 TLB ====================

export const S10: React.FC = () => (
  <Scene id="s10" no="10" title="TLB：翻译结果的小缓存" en="Translation Lookaside Buffer">
    <div style={{ display: "flex", gap: 30, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeUp delay={4}>
          <div style={{ fontFamily: T.cn, fontSize: 23, color: T.ink2, lineHeight: 1.5 }}>
            页表在内存里 —— 翻译一次就要多访存一次；
            四级页表要访存四次。于是 CPU 里加了一小块缓存。
          </div>
        </FadeUp>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <CN size={19} color={T.sub}>
            虚拟页号按映射方式切分
          </CN>
          <BitStrip
            segs={[
              { label: "TLBT 标记", sub: "与表项 tag 比对", bits: "高位", flex: 3, color: T.purple, bg: T.purpleSoft },
              { label: "index", sub: "选行 / 选组", bits: "低位", flex: 2, color: T.blue, bg: T.blueSoft },
            ]}
            delay={10}
            height={82}
            labelSize={21}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip color={T.blue} bg={T.blueSoft} size={16}>
            直接映射 · index = 行号
          </Chip>
          <Chip color={T.green} bg={T.greenSoft} size={16}>
            组相联 · index = 组号
          </Chip>
          <Chip color={T.amber} bg={T.amberSoft} size={16}>
            全相联 · index = 0 位
          </Chip>
        </div>
        <KeyLine delay={26} size={20} color={T.purple} bg={T.purpleSoft}>
          命中条件：valid = 1 且 tag 相同 → 直接拿 PPN
        </KeyLine>
      </div>

      <Panel style={{ flex: "0 0 620px" }} pad={22}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Kicker color={T.purple}>TLB 表项结构</Kicker>
          <span style={{ fontFamily: T.cn, fontSize: 17, color: T.faint }}>命中一行就省掉一次访存</span>
        </div>
        <EntryTable
          cols={["tag", "PPN", "valid"]}
          rows={[
            ["0x1A2", "0x0F3", "1"],
            ["0x2C7", "0x01B", "1"],
            ["0x0D4", "0x1E0", "0"],
            ["0x3B1", "0x0A6", "1"],
          ]}
          highlight={1}
          accent={T.purple}
          width={560}
          size={21}
          indexLabel="行"
          delay={12}
        />
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1.5px dashed ${T.line}`,
            fontFamily: T.cn,
            fontSize: 19,
            color: T.sub,
            lineHeight: 1.5,
          }}
        >
          没命中就去查页表，查到之后再把这条映射<span style={{ color: T.purple, fontWeight: 800 }}>填回 TLB</span>。
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 11 TLB vs Cache ====================

export const S11: React.FC = () => (
  <Scene id="s11" no="11" title="TLB 与 Cache 的区别" en="TLB vs Cache">
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <DataTable
        delay={4}
        size={22}
        widths={["220px", undefined, undefined]}
        head={["维度", "TLB", "Cache"]}
        rows={[
          {
            cells: ["存的是什么", "物理页号 PPN —— 映射关系", "主存数据块 —— 真正的内容"],
            accent: T.purple,
            bg: T.purpleSoft,
          },
          {
            cells: ["用什么查", "虚拟页号 VPN", "物理地址中的主存块号"],
            accent: T.blue,
            bg: T.blueSoft,
          },
          {
            cells: ["什么时候用", "地址翻译阶段（VA → PA）", "拿到物理地址之后（取数据）"],
            accent: T.green,
            bg: T.greenSoft,
          },
        ]}
      />

      <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <Panel style={{ flex: 1 }} pad={20} accent={T.purple}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Chip color={T.purple} bg={T.purpleSoft} size={18}>
              TLB
            </Chip>
            <span style={{ fontFamily: T.cn, fontSize: 22, color: T.sub }}>对</span>
            <Chip color={T.blue} bg={T.blueSoft} size={18}>
              页表
            </Chip>
            <span style={{ fontFamily: T.cn, fontSize: 20, color: T.faint }}>＝ 映射的缓存</span>
          </div>
        </Panel>
        <Panel style={{ flex: 1 }} pad={20} accent={T.green}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Chip color={T.green} bg={T.greenSoft} size={18}>
              Cache
            </Chip>
            <span style={{ fontFamily: T.cn, fontSize: 22, color: T.sub }}>对</span>
            <Chip color={T.amber} bg={T.amberSoft} size={18}>
              主存
            </Chip>
            <span style={{ fontFamily: T.cn, fontSize: 20, color: T.faint }}>＝ 数据的缓存</span>
          </div>
        </Panel>
      </div>

      <FadeUp delay={20}>
        <div style={{ fontFamily: T.cn, fontSize: 22, color: T.ink2, textAlign: "center" }}>
          两者都是<span style={{ fontWeight: 800, color: T.ink }}>硬件</span>、都在 MMU 附近、都用三种映射方式 ——
          区别只在<span style={{ fontWeight: 800, color: T.purple }}>存什么、查什么、何时用</span>。
        </div>
      </FadeUp>
    </div>
  </Scene>
);

// ==================== 12 缺页中断 ====================

export const S12: React.FC = () => (
  <Scene id="s12" no="12" title="缺页中断" en="Page Fault">
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <FadeUp delay={4}>
        <div style={{ fontFamily: T.cn, fontSize: 23, color: T.ink2 }}>
          MMU 查到页表项，<Mono size={23} color={T.red}>valid = 0</Mono>，翻译进行不下去 ——
          触发一个异常，交给内核处理。
        </div>
      </FadeUp>

      <FlowRow
        delay={10}
        gap={8}
        size={21}
        steps={[
          { no: "1", title: "触发异常", desc: "valid = 0，翻译走不下去", color: T.red, bg: T.redSoft },
          { no: "2", title: "判断原因", desc: "未分配 / 已换出 / 非法访问", color: T.amber, bg: T.amberSoft },
          { no: "3", title: "找物理页框", desc: "有闲页直接用，否则置换", color: T.blue, bg: T.blueSoft },
          { no: "4", title: "从磁盘读入", desc: "把这一页搬进内存", color: T.cyan, bg: T.cyanSoft },
          { no: "5", title: "更新页表", desc: "写 PPN，valid 置 1", color: T.purple, bg: T.purpleSoft },
          { no: "6", title: "重新执行", desc: "回到那条指令，这次能翻", color: T.green, bg: T.greenSoft },
        ]}
      />

      <div style={{ display: "flex", gap: 20 }}>
        <Panel style={{ flex: 1 }} pad={18} accent={T.red}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Chip color={T.red} bg={T.redSoft} size={17}>
              非法访问
            </Chip>
            <CN size={21} color={T.ink2}>
              越界或权限不足 → 直接终止进程，就是常见的段错误
            </CN>
          </div>
        </Panel>
        <Panel style={{ flex: 1 }} pad={18} accent={T.purple}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Chip color={T.purple} bg={T.purpleSoft} size={17}>
              命名
            </Chip>
            <CN size={21} color={T.ink2}>
              严格说该叫「缺页异常」，教材沿用「中断」，别纠结
            </CN>
          </div>
        </Panel>
      </div>

      <KeyLine delay={34} size={21}>
        处理后回到<span style={{ fontWeight: 800 }}>同一条指令</span>重新执行 —— 所以缺页是可恢复的
      </KeyLine>
    </div>
  </Scene>
);

// ==================== 13 请求页式管理 ====================

export const S13: React.FC = () => (
  <Scene id="s13" no="13" title="请求页式管理" en="Demand Paging">
    <div style={{ display: "flex", gap: 26, width: "100%", alignItems: "stretch" }}>
      <Panel style={{ flex: 1 }} pad={22} accent={T.blue}>
        <Kicker>默认策略</Kicker>
        <div style={{ fontFamily: T.cn, fontSize: 27, fontWeight: 800, color: T.ink, margin: "8px 0 12px" }}>
          请求页式（懒加载）
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bullet size={20} delay={6}>
            进程启动时一页都不装
          </Bullet>
          <Bullet size={20} delay={10}>
            访问到哪一页，才把哪一页调进来
          </Bullet>
          <Bullet size={20} delay={14}>
            考研说「虚拟存储」，默认就是它
          </Bullet>
        </div>
      </Panel>

      <Panel style={{ flex: 1 }} pad={22} accent={T.amber} soft>
        <Kicker color={T.amber}>对照策略</Kicker>
        <div style={{ fontFamily: T.cn, fontSize: 27, fontWeight: 800, color: T.ink, margin: "8px 0 12px" }}>
          预调页
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bullet size={20} dot={T.amber} delay={8}>
            进程运行前，提前装入一部分或全部页面
          </Bullet>
          <Bullet size={20} dot={T.amber} delay={12}>
            换来启动更平稳，但可能白装
          </Bullet>
          <Bullet size={20} dot={T.amber} delay={16}>
            考试里一般不作为默认口径
          </Bullet>
        </div>
      </Panel>

      <Panel style={{ flex: "0 0 560px" }} pad={22} accent={T.red}>
        <Kicker color={T.red}>一个常见误解</Kicker>
        <div style={{ fontFamily: T.cn, fontSize: 25, fontWeight: 800, color: T.ink, margin: "8px 0 10px" }}>
          缺页 ≠ 一定要置换
        </div>
        <div style={{ fontFamily: T.cn, fontSize: 19.5, color: T.ink2, lineHeight: 1.55 }}>
          缺页的本质是 <Mono size={19} color={T.red}>valid = 0</Mono>，映射不完整。
          内核要做的是把映射补上：建映射、分配页框、读磁盘都可能。
        </div>
        <div style={{ marginTop: 10 }}>
          <KeyLine delay={24} size={19} color={T.red} bg={T.redSoft}>
            教材那句「缺页就换页」是简化模型
          </KeyLine>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 14 页面置换 ====================

export const S14: React.FC = () => (
  <Scene id="s14" no="14" title="页面置换与写回" en="Replacement & Write-Back">
    <div style={{ display: "flex", gap: 26, width: "100%", alignItems: "center" }}>
      <div
        style={{
          flex: "1 1 0",
          alignSelf: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <FadeUp delay={4}>
          <div style={{ fontFamily: T.cn, fontSize: 22, color: T.sub }}>缺页时先问一句：还有空闲页框吗？</div>
        </FadeUp>
        <div style={{ display: "flex", gap: 12 }}>
          <FadeUp
            delay={8}
            style={{
              flex: 1,
              background: T.greenSoft,
              border: `2px solid ${T.green}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.green }}>有</div>
            <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 4 }}>
              直接拿来用，不发生置换
            </div>
          </FadeUp>
          <FadeUp
            delay={12}
            style={{
              flex: 1,
              background: T.redSoft,
              border: `2px solid ${T.red}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.red }}>没有</div>
            <div style={{ fontFamily: T.cn, fontSize: 19, color: T.ink2, marginTop: 4 }}>
              按置换算法挑一页换出，LRU / 时钟
            </div>
          </FadeUp>
        </div>

        <Panel pad={18} style={{ marginTop: 2 }}>
          <Kicker color={T.purple}>脏位决定要不要写回</Kicker>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
            <Bullet size={20} dot={T.red} marker="1" delay={18}>
              <Mono size={20} color={T.red}>dirty = 1</Mono>：被写过，必须先写回磁盘再腾位置
            </Bullet>
            <Bullet size={20} dot={T.green} marker="0" delay={22}>
              <Mono size={20} color={T.green}>dirty = 0</Mono>：磁盘上还有副本，直接丢掉
            </Bullet>
          </div>
        </Panel>
      </div>

      <Panel style={{ flex: "0 0 640px" }} pad={22}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Kicker color={T.green}>物理内存</Kicker>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {[
                ["PP0", "常驻", T.green, T.greenSoft],
                ["PP1", "要被换出", T.red, T.redSoft],
                ["PP2", "常驻", T.green, T.greenSoft],
                ["PP3", "空闲", T.faint, "#F5F7FA"],
              ].map(([n, s, c, b], i) => (
                <FadeUp
                  key={n as string}
                  delay={14 + i * 4}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: b as string,
                    border: `1.5px solid ${c as string}`,
                    borderRadius: 8,
                    padding: "8px 14px",
                  }}
                >
                  <span style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: c as string }}>
                    {n as string}
                  </span>
                  <span style={{ fontFamily: T.cn, fontSize: 17, color: T.ink2 }}>{s as string}</span>
                </FadeUp>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20 }}>
            <Arrow width={96} delay={26} label="换出" color={T.red} />
            <Arrow width={96} delay={32} label="调入" color={T.green} dashed />
          </div>

          <div style={{ flex: 1 }}>
            <Kicker color={T.red}>磁盘 · 交换分区</Kicker>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {["swap 区（页文件）", "被换出的页写在这里", "再次需要时读回内存"].map((s, i) => (
                <FadeUp
                  key={s}
                  delay={28 + i * 4}
                  style={{
                    background: T.redSoft,
                    border: `1.5px dashed ${T.red}`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontFamily: T.cn,
                    fontSize: 17,
                    color: T.ink2,
                  }}
                >
                  {s}
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <KeyLine delay={40} size={19} color={T.amber} bg={T.amberSoft}>
            一次缺页 = 可能一次磁盘读 + 一次磁盘写（脏页换出）
          </KeyLine>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 15 完整访存流程 ====================

export const S15: React.FC = () => (
  <Scene id="s15" no="15" title="完整的一次访存" en="The Full Walk">
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <FlowRow
        delay={4}
        gap={8}
        size={19}
        steps={[
          { no: "1", title: "取 VPN", desc: "从虚拟地址切出页号", color: T.blue, bg: T.blueSoft },
          { no: "2", title: "查 TLB", desc: "tag 比对 + valid", color: T.purple, bg: T.purpleSoft },
          { no: "3", title: "查页表", desc: "TLB 未命中才走", color: T.cyan, bg: T.cyanSoft },
          { no: "4", title: "拼物理地址", desc: "PPN + 页内偏移", color: T.green, bg: T.greenSoft },
          { no: "5", title: "查 Cache", desc: "命中直接出数据", color: T.amber, bg: T.amberSoft },
          { no: "6", title: "访主存", desc: "未命中并回填 Cache", color: T.red, bg: T.redSoft },
        ]}
      />

      <div style={{ display: "flex", gap: 18 }}>
        {[
          ["快路", T.purple, T.purpleSoft, "TLB 命中 → PPN → 拼地址 → 查 cache"],
          ["慢路", T.cyan, T.cyanSoft, "TLB 未命中 → 查页表取 PPN → 填回 TLB"],
          ["异常路", T.red, T.redSoft, "valid = 0 → 缺页 → 调页改表 → 重执行"],
        ].map(([tag, color, bg, text], i) => (
          <FadeUp
            key={tag as string}
            delay={18 + i * 4}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              minHeight: 76,
              background: T.panel,
              border: `2px solid ${color as string}`,
              borderLeft: `6px solid ${color as string}`,
              borderRadius: 12,
              padding: "0 16px",
            }}
          >
            <Chip color={color as string} bg={bg as string} size={17}>
              {tag as string}
            </Chip>
            <span style={{ fontFamily: T.cn, fontSize: 19, fontWeight: 600, color: T.ink2, lineHeight: 1.4 }}>
              {text as string}
            </span>
          </FadeUp>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {[
          ["TLB 命中 · cache 命中", "1 次访存", T.green, T.greenSoft],
          ["TLB 未命中 · 单级页表", "2 次访存", T.blue, T.blueSoft],
          ["发生缺页", "+ 1 次磁盘读", T.red, T.redSoft],
        ].map(([k, v, c, b], i) => (
          <FadeUp
            key={k as string}
            delay={26 + i * 5}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 12,
              background: b as string,
              border: `1.5px solid ${c as string}55`,
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <span style={{ fontFamily: T.cn, fontSize: 18, color: T.ink2 }}>{k as string}</span>
            <span style={{ fontFamily: T.mono, fontSize: 21, fontWeight: 800, color: c as string }}>
              {v as string}
            </span>
          </FadeUp>
        ))}
      </div>

      <KeyLine delay={44} size={22}>
        一条链：VA → TLB → 页表 → PA → Cache → 主存
      </KeyLine>
    </div>
  </Scene>
);

// ==================== 16 访存次数 ====================

export const S16: React.FC = () => (
  <Scene id="s16" no="16" title="访存次数怎么数" en="Counting Memory Accesses">
    <div style={{ display: "flex", gap: 28, width: "100%", alignItems: "center" }}>
      <div style={{ flex: "1 1 0" }}>
        <DataTable
          delay={4}
          size={21}
          widths={["440px", "150px", undefined]}
          head={["情形", "访存次数", "拆解"]}
          rows={[
            {
              cells: ["TLB 命中 · cache 命中", "1 次", "只访问 cache"],
              accent: T.green,
              bg: T.greenSoft,
            },
            {
              cells: ["TLB 未命中（单级页表）· cache 命中", "2 次", "查页表 1 + cache 1"],
              accent: T.blue,
              bg: T.blueSoft,
            },
            {
              cells: ["TLB 未命中（两级页表）· cache 命中", "3 次", "查页表 2 + cache 1"],
              accent: T.cyan,
              bg: T.cyanSoft,
            },
            {
              cells: ["cache 未命中", "再加 1 次", "多访一次主存"],
              accent: T.amber,
              bg: T.amberSoft,
            },
            {
              cells: ["发生缺页", "再加 1 次 +", "磁盘读；脏页换出再 +1"],
              accent: T.red,
              bg: T.redSoft,
            },
          ]}
        />
      </div>

      <Panel style={{ flex: "0 0 520px" }} pad={22}>
        <Kicker>计数口诀</Kicker>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
          <Bullet marker="1" size={21} delay={8}>
            先数<span style={{ fontWeight: 800, color: T.purple }}>翻译</span>：TLB 命中 0 次，否则几级几次
          </Bullet>
          <Bullet marker="2" size={21} dot={T.green} delay={14}>
            再数<span style={{ fontWeight: 800, color: T.green }}>取数</span>：cache 命中 1 次，否则 +1
          </Bullet>
          <Bullet marker="3" size={21} dot={T.red} delay={20}>
            缺页另算：磁盘读 1 次，脏页写回 +1
          </Bullet>
        </div>
        <div style={{ marginTop: 14 }}>
          <KeyLine delay={26} size={19} color={T.red} bg={T.redSoft}>
            页表本身也在内存里 —— 查页表就是访存
          </KeyLine>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 17 综合例题 ====================

const CalcRow: React.FC<{ k: string; v: string; delay: number; color?: string }> = ({
  k,
  v,
  delay,
  color = T.ink,
}) => (
  <FadeUp
    delay={delay}
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
      borderBottom: `1.5px dashed ${T.line}`,
      paddingBottom: 6,
    }}
  >
    <span style={{ fontFamily: T.cn, fontSize: 19, color: T.sub }}>{k}</span>
    <Mono size={21} color={color}>
      {v}
    </Mono>
  </FadeUp>
);

export const S17: React.FC = () => (
  <Scene id="s17" no="17" title="综合例题：把数算一遍" en="Putting Numbers Together">
    <div style={{ display: "flex", gap: 24, width: "100%", alignItems: "stretch" }}>
      <Panel style={{ flex: "0 0 400px", display: "flex", flexDirection: "column" }} pad={20}>
        <Kicker>已知条件</Kicker>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          <CalcRow k="虚拟地址" v="32 位" delay={4} color={T.blue} />
          <CalcRow k="页面大小" v="4 KB" delay={7} color={T.blue} />
          <CalcRow k="页表项大小" v="4 B" delay={10} color={T.blue} />
          <CalcRow k="页表级数" v="2 级 · 10 + 10" delay={13} color={T.blue} />
          <CalcRow k="TLB" v="64 项 · 4 路" delay={16} color={T.purple} />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <CN size={18} color={T.faint}>
            先切地址，再算表，最后算 TLB 表项宽度。
          </CN>
        </div>
      </Panel>

      <Panel style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }} pad={20}>
        <Kicker color={T.green}>第一步 · 地址切分</Kicker>
        <div style={{ marginTop: 12 }}>
          <BitStrip
            segs={[
              { label: "一级", bits: "10", flex: 1, color: T.blue, bg: T.blueSoft },
              { label: "二级", bits: "10", flex: 1, color: T.cyan, bg: T.cyanSoft },
              { label: "页内偏移", bits: "12", flex: 1.2, color: T.amber, bg: T.amberSoft },
            ]}
            delay={20}
            height={70}
            labelSize={19}
          />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", flexDirection: "column", gap: 5 }}>
          <CalcRow k="偏移位数" v="log₂ 4KB = 12" delay={26} color={T.amber} />
          <CalcRow k="VPN 位数" v="32 − 12 = 20" delay={30} color={T.blue} />
        </div>
      </Panel>

      <Panel style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }} pad={20}>
        <Kicker color={T.purple}>第二步 · 页表与 TLB</Kicker>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          <CalcRow k="每级页表项数" v="2¹⁰ = 1024" delay={24} color={T.cyan} />
          <CalcRow k="每级页表大小" v="1024 × 4B = 4KB" delay={28} color={T.cyan} />
          <CalcRow k="TLB 组数" v="64 ÷ 4 = 16" delay={32} color={T.purple} />
          <CalcRow k="index 位数" v="log₂ 16 = 4" delay={36} color={T.purple} />
          <CalcRow k="tag 位数" v="20 − 4 = 16" delay={40} color={T.purple} />
          <CalcRow k="PPN 位数" v="32 − 12 = 20" delay={44} color={T.green} />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <KeyLine delay={48} size={19} color={T.purple} bg={T.purpleSoft}>
            表项宽 = 16 + 20 + 1 + 1 = 38 位
          </KeyLine>
        </div>
      </Panel>
    </div>
  </Scene>
);

// ==================== 18 易错点 ====================

const Pitfall: React.FC<{ n: string; children: React.ReactNode; delay: number }> = ({
  n,
  children,
  delay,
}) => (
  <FadeUp
    delay={delay}
    style={{
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      background: T.panel,
      border: `1.5px solid ${T.line}`,
      borderRadius: 12,
      padding: "12px 16px",
    }}
  >
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 18,
        fontWeight: 800,
        color: T.red,
        background: T.redSoft,
        borderRadius: 7,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {n}
    </span>
    <span style={{ fontFamily: T.cn, fontSize: 20.5, fontWeight: 600, color: T.ink2, lineHeight: 1.45 }}>
      {children}
    </span>
  </FadeUp>
);

export const S18: React.FC = () => (
  <Scene id="s18" no="18" title="七个高频易错点" en="Common Pitfalls">
    <div style={{ display: "flex", gap: 22, width: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
        <Pitfall n="1" delay={4}>
          页内偏移两边完全相同，翻译<span style={{ color: T.red, fontWeight: 800 }}>只换页号</span>
        </Pitfall>
        <Pitfall n="2" delay={8}>
          TLB 用<span style={{ color: T.blue, fontWeight: 800 }}>虚拟页号</span>查，cache 用
          <span style={{ color: T.green, fontWeight: 800 }}>物理地址</span>查
        </Pitfall>
        <Pitfall n="3" delay={12}>
          页表本身存在内存里，查页表<span style={{ color: T.red, fontWeight: 800 }}>就是一次访存</span>
        </Pitfall>
        <Pitfall n="4" delay={16}>
          缺页是 valid 为 0，<span style={{ color: T.red, fontWeight: 800 }}>不是 cache 没命中</span>
        </Pitfall>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
        <Pitfall n="5" delay={20}>
          有效位有两个含义：页表里表示在不在内存，TLB 里表示表项能不能用
        </Pitfall>
        <Pitfall n="6" delay={24}>
          多级页表省的是<span style={{ color: T.purple, fontWeight: 800 }}>空间</span>，
          代价是<span style={{ color: T.red, fontWeight: 800 }}>访存次数</span>
        </Pitfall>
        <Pitfall n="7" delay={28}>
          脏位决定换出时<span style={{ color: T.red, fontWeight: 800 }}>要不要写回磁盘</span>
        </Pitfall>
        <FadeUp
          delay={32}
          style={{
            background: T.greenSoft,
            border: `2px solid ${T.green}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: T.cn,
            fontSize: 20,
            fontWeight: 700,
            color: T.green,
          }}
        >
          这七条记牢，选择题基本不会错。
        </FadeUp>
      </div>
    </div>
  </Scene>
);

// ==================== 19 总结 ====================

const ChainNode: React.FC<{ title: string; sub: string; color: string; bg: string; delay: number }> = ({
  title,
  sub,
  color,
  bg,
  delay,
}) => (
  <FadeUp
    delay={delay}
    style={{
      flex: 1,
      background: bg,
      border: `2px solid ${color}`,
      borderRadius: 12,
      padding: "12px 8px",
      textAlign: "center",
    }}
  >
    <div style={{ fontFamily: T.cn, fontSize: 21, fontWeight: 800, color }}>{title}</div>
    <div style={{ fontFamily: T.mono, fontSize: 14, color: T.sub, marginTop: 3 }}>{sub}</div>
  </FadeUp>
);

export const S19: React.FC = () => (
  <Scene id="s19" no="19" title="串成一条链" en="Summary">
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ChainNode title="虚拟地址" sub="VA" color={T.blue} bg={T.blueSoft} delay={4} />
        <Arrow width={38} delay={8} />
        <ChainNode title="TLB" sub="翻译缓存" color={T.purple} bg={T.purpleSoft} delay={10} />
        <Arrow width={38} delay={14} />
        <ChainNode title="页表" sub="VPN → PPN" color={T.cyan} bg={T.cyanSoft} delay={16} />
        <Arrow width={38} delay={20} />
        <ChainNode title="物理地址" sub="PA" color={T.green} bg={T.greenSoft} delay={22} />
        <Arrow width={38} delay={26} />
        <ChainNode title="Cache" sub="数据缓存" color={T.amber} bg={T.amberSoft} delay={28} />
        <Arrow width={38} delay={32} />
        <ChainNode title="主存" sub="DRAM" color={T.red} bg={T.redSoft} delay={34} />
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <Panel style={{ flex: 1 }} pad={18}>
          <Kicker>四个抓手</Kicker>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bullet size={19} delay={38}>
              划分：空间切页，地址切页号 + 偏移
            </Bullet>
            <Bullet size={19} delay={42}>
              翻译：页表映射，单级一次、多级多次
            </Bullet>
            <Bullet size={19} delay={46}>
              加速：TLB 用 VPN 查，命中省掉访存
            </Bullet>
            <Bullet size={19} delay={50}>
              兜底：缺页调页、置换写回
            </Bullet>
          </div>
        </Panel>
        <Panel style={{ flex: 1 }} pad={18} accent={T.blue}>
          <Kicker>一句话收束</Kicker>
          <div style={{ fontFamily: T.cn, fontSize: 22, fontWeight: 600, color: T.ink2, lineHeight: 1.6, marginTop: 8 }}>
            虚拟存储器把逻辑地址空间和物理内存
            <span style={{ color: T.blue, fontWeight: 800 }}>解耦</span>：
            程序看到连续，硬件负责翻译，缺页负责扩容。
          </div>
        </Panel>
      </div>

      <FadeUp delay={54}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 2,
          }}
        >
          <span style={{ fontFamily: T.cn, fontSize: 21, color: T.sub }}>
            把这条链画熟，408 的存储大题就有抓手了。
          </span>
          <Chip color={T.blue} bg={T.blueSoft} size={18}>
            MRDave先生 · 计算机组成原理
          </Chip>
        </div>
      </FadeUp>
    </div>
  </Scene>
);
