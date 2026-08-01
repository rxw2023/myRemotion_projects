# DualVectorFoil — 二向箔太阳系二维化 视频设计

> 2026-08-01 | 横版 | ~3000 帧 (~100s) | 纯画面 + 文字，无 TTS

## 概述

把 `dual-vector-foil.html`（Three.js 3D 交互场景）移植为 Remotion 视频，用 `@react-three/fiber` 声明式重建，时间驱动动画，保留原作五段式电影级镜头调度。

## 文件结构

```
src/DualVectorFoil/
├── index.tsx              # Remotion 主组件，计算 p = frame / totalFrames
├── Scene.tsx              # Canvas + 所有 3D 内容
├── timeline.ts            # 时序常量（DURATION, SWEEP0, SWEEP1 等）
├── cameras.ts             # 五机位 lerp 调度
├── textures.ts            # 离屏 Canvas 贴图工厂
├── overlay.ts             # CAPTIONS / QUOTES 文字数据
└── components/
    ├── Sun.tsx            # 太阳球体 + Sprite 光晕 + 二维画 + 涟漪
    ├── Planets.tsx        # 九行星（含水冥），3D 球 + 二维画
    ├── SpaceCities.tsx    # 掩体城市点阵
    ├── Starfield.tsx      # 星空 Points
    └── Foil.tsx           # 二向箔半透明面片 + 边框
```

## 组件树

```
<AbsoluteFill>               ← 1920×1080
  <Canvas>                   ← @react-three/fiber
    <Scene>
      <Starfield />
      <Sun />                ← 3D 球 + 光晕（三维）
      <Planets />            ← 9 个行星组（三维球 + 轨道环）
      <SpaceCities />        ← 48 个城市点
      <Foil>                 ← 箔面 Group
        <Plane />            ←   半透明箔面
        <Edges />            ←   发光边框
        <SunPaint />         ←   太阳二维画（CircleGeometry）
        <SunGlow />          ←   太阳二维光晕（Sprite）
        <Ripple />           ←   涟漪环
        <PlanetPaints />     ←   9 个行星二维画
        <CityPaints />       ←   48 个城市二维点
      </Foil>
    </Scene>
    <OrbitControls />        ← 仅 dev 时可用（方便调试）
  </Canvas>
  <OverlayText />            ← HTML 叠加层（标题/字幕/引用）
</AbsoluteFill>
```

## 关键约束

1. **无 orbit controls 自动控制** — 原页面用 orbit controls 做用户交互，视频里镜头完全由 `cameras.ts` 驱动，不依赖 controls
2. **贴图全部 Canvas 生成** — 不依赖外部图片，`textures.ts` 里的工厂函数用离屏 Canvas 画太阳年轮、行星剖面、光晕、箔面渐变
3. **二维画挂在箔面上** — 行星被摊平后，对应的 `CircleGeometry` 贴在 `foilGroup` 的位置 = 原行星 3D 位置的 (x, y, 0)
4. **动画进度 `p = frame / totalFrames`** — 范围 [0, 1]，所有动画用这个值驱动，不依赖帧计数

## 时序常量

```ts
const DURATION = 100        // 秒
const SWEEP0 = 0.16         // 箔面扫掠开始
const SWEEP1 = 0.78         // 箔面扫掠结束
const SUN_CATCH_P = 0.53    // 太阳二维化时刻
```

## 镜头序列（五个机位 + 横移过渡）

拷贝原 HTML `camAt()` 的 lerp 逻辑，五个机位之间用快速横移过渡（E=0.022）：

| 机位 | p 范围 | 描述 |
|------|--------|------|
| S0 | 0.00–0.20 | 远景开场，从高空俯瞰太阳系 |
| S1 | 0.20–0.40 | 贴箔近景，镜头悬在箔面后上方 |
| S2 | 0.40–0.62 | 太阳特写，推向太阳，分层展开 |
| S3 | 0.62–0.82 | 行星特写，掠过地球→木星 |
| S4 | 0.82–1.00 | 大远景收官，程心回望画卷 |

## 二维化动画逻辑

移植原 HTML `update()` 函数：

1. **行星公转** — p < 0.12 期间行星沿轨道转几度，之后凝固在原位
2. **箔面推进** — p 从 SWEEP0 到 SWEEP1，箔面 z 从 60 降到 -60，scale 从 0.12 涨到 1.0
3. **行星二维化** — 当箔面 z 碰到某行星 z 时，该行星球体压扁(z scale→0)+淡出，同时二维画在箔面渐显放大
4. **太空城市** — 同上逻辑，被吸入平面
5. **太阳压轴** — p=0.53 时太阳开始二维化，比行星慢（duration 0.12 vs 0.03），有涟漪扩散效果

## 文字叠加

取自原 HTML `CAPTIONS` / `QUOTES`，用 Remotion 原生 DOM 层（`absolute` 定位），右下角排版：

- 标题 "二向箔" → p∈[0.10, 0.26]
- 四段 CAPTIONS → 分别对应掩体计划、箔面投入、二维化蔓延、城市展开
- 两段 QUOTES → 太阳展开描写、地球虹膜描写
- 最终文字 "那是坟墓,也是纪念碑…" → p≥0.92

## 依赖

需要安装（当前项目未装）：
- `@react-three/fiber` — React 声明式 Three.js
- `@react-three/drei` — 常用 helper（OrbitControls 等，dev 调试用）
- `three` — 核心库
- `@types/three` — TypeScript 类型

## 不在范围内

- 背景音乐（后续添加）
- TTS 配音
- 交互式 orbit controls（仅调试用）
- 响应式移动端适配
