# ExternalStorage 科普视频设计

## 概述

基于 [计算机考研杂货铺 - 外存](https://www.csgraduates.com/constitution_principle/storage/storage/) 内容，制作一个竖屏科普视频，介绍机械硬盘（HDD）、RAID、固态硬盘（SSD）的原理与对比。

## 内容范围

三个主题合并为一个视频：
1. **机械硬盘 HDD** — 物理结构（盘片/磁道/柱面/扇区），CHS 寻址（含例题），性能指标计算
2. **RAID** — 磁盘镜像/条带化/奇偶校验，RAID 1/5/6 简介
3. **固态硬盘 SSD** — NAND Flash 原理，与 HDD 完整对比

## 技术参数

- 竖屏 1080×1920，30fps
- `TransitionSeries` + 交替 fade(6f)/slide(8f) 转场
- 共享组件：`FadeIn`、`SlideUp`、`WhiteCard`、`SubtitleBar`、`SHARED_COLORS`
- BGM：复用 `public/shared/bgm-storage.mp3`，volume 0.08

## 场景设计

### 场景 1：标题开场
- 标签 "计算机组成原理"，大标题 "外部存储"，副标题 "机械硬盘 · RAID · 固态硬盘"
- 装饰圆点背景，弹簧动画标题
- TTS 字幕：课程定位、视频内容概览

### 场景 2：HDD 结构与 CHS 寻址
- WhiteCard：盘片/磁道/柱面/扇区概念卡片
- CHS 地址计算：C + H + S 位数公式，例题（1000柱面/4盘面/32扇区 → 17位）
- 三字段分开展示，逐一动画进入

### 场景 3：HDD 性能指标
- WhiteCard：平均存取时间 = 寻道时间 + 旋转延迟 + 传输时间
- 三个分项各一小卡片说明
- 数据传输率 Dr = r × N 公式卡片
- 转速示例：5400 RPM ≈ 90 rev/s, 7200 RPM ≈ 120 rev/s

### 场景 4：RAID 简介
- 三列卡片：磁盘镜像/条带化/奇偶校验
- 底部 RAID 级别标注：RAID 1（镜像）、RAID 5（条带化+校验）、RAID 6（双校验）
- 标注低优先级提示（考研仅考过1题）

### 场景 5：SSD vs HDD
- 双列对比 WhiteCard：存储介质、机械部件、读写速度、随机访问、耐用性、噪音重量、碎片化、适用场景
- SSD 列绿色强调优势，HDD 列灰色标注

### 场景 6：结尾
- "谢谢观看" 大标题，知识点标签列表
- 点赞 · 收藏 · 关注

## 文件清单

### 新建
- `src/ExternalStorage/index.tsx` — 单文件，所有场景 + 导出
- `public/external-storage/durations.json` — TTS 时长
- `public/external-storage/scene1_title.mp3` ~ `scene6_outro.mp3` — 6 个 TTS 音频

### 修改
- `src/Root.tsx` — 注册 `ExternalStorage` composition

## 帧数估算

| 场景 | TTS 估算 | 帧数 |
|------|----------|------|
| 标题 | ~8s | 280 |
| HDD结构+CHS | ~25s | 790 |
| HDD性能指标 | ~22s | 700 |
| RAID | ~18s | 580 |
| SSD vs HDD | ~22s | 700 |
| 结尾 | ~10s | 340 |
| **合计** | | **3390** |

转场消耗：5 × 平均7f = 35f。`durationInFrames` = 3390 - 35 = ~3355。
