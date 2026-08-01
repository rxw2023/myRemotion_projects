# DualVectorFoil — 二向箔太阳系二维化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `dual-vector-foil.html` 的 Three.js 3D 场景移植为 Remotion 视频，@react-three/fiber 声明式 Three.js，时间驱动五段式镜头。

**Architecture:** 3 个新文件 + 1 修改。`index.tsx` 是 Remotion 入口 + HTML 文字叠加，`Scene3D.tsx` 包含全部 3D 内容（星空/太阳/行星/箔面/城市）和一个 `useFrame` 动画循环，`textures.ts` 是离屏 Canvas 贴图工厂。

**Tech Stack:** Remotion, @react-three/fiber, three, React 19

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 three + fiber + drei**

```bash
cd "C:\Users\Rao\Desktop\学习\project-vibe\my-video" && pnpm add three @react-three/fiber @react-three/drei && pnpm add -D @types/three
```

- [ ] **Step 2: 验证安装**

```bash
cd "C:\Users\Rao\Desktop\学习\project-vibe\my-video" && node -e "require('three'); require('@react-three/fiber'); console.log('OK')"
```

Expected: `OK` (no errors)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml && git commit -m "chore: add three, @react-three/fiber, @react-three/drei for DualVectorFoil"
```

---

### Task 2: Create foundation modules (timeline, textures, cameras)

**Files:**
- Create: `src/DualVectorFoil/timeline.ts`
- Create: `src/DualVectorFoil/textures.ts`
- Create: `src/DualVectorFoil/cameras.ts`

- [ ] **Step 1: Create `src/DualVectorFoil/timeline.ts`**

```typescript
// 全片常量
export const DURATION = 100; // 秒
export const TOTAL_FRAMES = 3000; // 30fps * 100s

// 箔面扫掠时间区间
export const SWEEP0 = 0.16;
export const SWEEP1 = 0.78;

// 太阳二维化时刻
export const SUN_CATCH_P = 0.53;

// 机位过渡时长
export const CAM_EPSILON = 0.022;

// smoothstep
export const SMOOTH = (t: number): number =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

// 计算箔面 z 位置
export const foilZ = (p: number): number => {
  if (p < SWEEP0) return 60;
  const t = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  return 60 - 120 * t;
};

// 计算某个 z 坐标的行星被二维化的时刻
export const catchP = (z: number): number =>
  SWEEP0 + ((60 - z) / 120) * (SWEEP1 - SWEEP0);
```

- [ ] **Step 2: Create `src/DualVectorFoil/textures.ts`**

```typescript
import * as THREE from "three";

// ---- 颜色工具 ----
export const toHex = (n: number): string =>
  "#" +
  [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");

export const rgba = (hex: string | number, a: number): string => {
  const n = typeof hex === "string" ? parseInt(hex.slice(1), 16) : hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const mixColor = (c: number, t: number, k: number): string => {
  const f = (a: number, b: number) => Math.round(a + (b - a) * k);
  return toHex(
    (f((c >> 16) & 255, (t >> 16) & 255) << 16) |
      (f((c >> 8) & 255, (t >> 8) & 255) << 8) |
      f(c & 255, t & 255),
  );
};

// ---- 离屏 Canvas 工具 ----
export const canvas2d = (size: number): [HTMLCanvasElement, CanvasRenderingContext2D, number] => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!, size / 2];
};

// ---- 光晕贴图 ----
export const glowTexture = (color: string): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(128);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, mixColor(0xffffff, 0x000000, 0.6));
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

// ---- 箔面贴图 ----
export const foilTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(256);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0.0, "rgba(190,215,255,0.62)");
  grad.addColorStop(0.45, "rgba(130,150,235,0.50)");
  grad.addColorStop(0.8, "rgba(95,110,205,0.40)");
  grad.addColorStop(1.0, "rgba(120,80,200,0.30)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  // 斜向彩虹干涉带
  g.save();
  g.translate(r, r);
  g.rotate(-0.5);
  const lg = g.createLinearGradient(-r, 0, r, 0);
  lg.addColorStop(0.0, "rgba(150,120,220,0)");
  lg.addColorStop(0.3, "rgba(120,200,255,0.30)");
  lg.addColorStop(0.5, "rgba(220,220,255,0.36)");
  lg.addColorStop(0.7, "rgba(200,130,240,0.28)");
  lg.addColorStop(1.0, "rgba(130,160,225,0)");
  g.fillStyle = lg;
  g.fillRect(-r, -r, r * 2, r * 2);
  g.restore();
  return new THREE.CanvasTexture(c);
};

// ---- 太阳二维画 ----
export const sunTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(512);
  const zones: [number, number, string][] = [
    [0.0, 0.14, "#fffbe0"],
    [0.14, 0.3, "#fff3c0"],
    [0.3, 0.5, "#ffe06a"],
    [0.5, 0.66, "#ffc040"],
    [0.66, 0.8, "#ffa020"],
    [0.8, 0.9, "#ff8a2a"],
    [0.9, 1.0, "#ff5a2a"],
  ];
  zones.forEach(([a, b, col]) => {
    const nn = parseInt(col.slice(1), 16);
    const grd = g.createRadialGradient(r, r, r * a, r, r, r * b);
    grd.addColorStop(0, col);
    grd.addColorStop(1, mixColor(nn, 0x000000, 0.22));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(r, r, r * b, 0, 7);
    if (a > 0) g.arc(r, r, r * a, 0, 7, true);
    g.fill();
  });
  [0.14, 0.3, 0.5, 0.66, 0.8, 0.9].forEach((x) => {
    g.strokeStyle = "rgba(150,70,10,0.4)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(r, r, r * x, 0, 7);
    g.stroke();
  });
  g.save();
  g.globalAlpha = 0.16;
  for (let i = 0; i < 150; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = (0.3 + Math.random() * 0.5) * r;
    const len = (0.05 + Math.random() * 0.13) * r;
    g.strokeStyle = Math.random() > 0.5 ? "#ffffff" : "#ff7000";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
    g.lineTo(r + Math.cos(a) * (rr + len), r + Math.sin(a) * (rr + len));
    g.stroke();
  }
  g.restore();
  return new THREE.CanvasTexture(c);
};

// ---- 行星二维画 ----
export interface PlanetPaintOpts {
  core: string | number;
  mantle?: string | number;
  crust: string | number;
  halo?: string;
  earth?: boolean;
  bands?: string[];
  saturnRing?: boolean;
}

export const planetTexture = (o: PlanetPaintOpts): THREE.CanvasTexture => {
  const core = typeof o.core === "number" ? toHex(o.core) : o.core;
  const mantle = typeof o.mantle === "number" ? toHex(o.mantle) : o.mantle ?? core;
  const crust = typeof o.crust === "number" ? toHex(o.crust) : o.crust;
  const [c, g, r] = canvas2d(512);

  // 大气晕环
  if (o.halo) {
    const hg = g.createRadialGradient(r, r, r * 0.72, r, r, r * 1.3);
    hg.addColorStop(0, rgba(o.halo, 0.5));
    hg.addColorStop(0.75, rgba(o.halo, 0.14));
    hg.addColorStop(1, rgba(o.halo, 0));
    g.fillStyle = hg;
    g.beginPath();
    g.arc(r, r, r * 1.3, 0, 7);
    g.fill();
  }

  // 行星盘本体
  g.fillStyle = crust;
  g.beginPath();
  g.arc(r, r, r, 0, 7);
  g.fill();

  if (o.earth) {
    const spots: [number, number, number][] = [
      [0.5, 0.2, 0.3],
      [-0.32, 0.16, 0.22],
      [0.18, -0.42, 0.3],
      [-0.22, -0.14, 0.18],
      [0.42, -0.04, 0.14],
      [-0.48, 0.36, 0.16],
    ];
    spots.forEach(([x, y, s]) => {
      const grd = g.createRadialGradient(r + x * r, r + y * r, 2, r + x * r, r + y * r, s * r);
      grd.addColorStop(0, "rgba(140,200,110,0.95)");
      grd.addColorStop(0.6, "rgba(110,150,80,0.85)");
      grd.addColorStop(1, "rgba(80,130,60,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(r + x * r, r + y * r, s * r, 0, 7);
      g.fill();
    });
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = (0.2 + Math.random() * 0.6) * r;
      const sz = (0.08 + Math.random() * 0.12) * r;
      const grd = g.createRadialGradient(
        r + Math.cos(a) * rr, r + Math.sin(a) * rr, 1,
        r + Math.cos(a) * rr, r + Math.sin(a) * rr, sz,
      );
      grd.addColorStop(0, "rgba(255,255,255,0.9)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(r + Math.cos(a) * rr, r + Math.sin(a) * rr, sz, 0, 7);
      g.fill();
    }
    g.strokeStyle = "rgba(90,60,30,0.5)";
    g.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const rr = (0.5 + Math.random() * 0.35) * r;
      g.beginPath();
      g.moveTo(r, r);
      g.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
      g.stroke();
    }
  } else if (o.bands) {
    g.save();
    g.filter = "blur(1px)";
    const n = o.bands.length;
    o.bands.forEach((col, i) => {
      g.globalAlpha = 0.8;
      g.fillStyle = col;
      const y = r - (n / 2 - i) * r * 0.3;
      g.beginPath();
      g.ellipse(r, y, r * 1.05, r * 0.16, 0, 0, 7);
      g.fill();
    });
    g.restore();
  } else {
    const mg = g.createRadialGradient(r, r, r * 0.3, r, r, r * 0.78);
    mg.addColorStop(0, mantle);
    mg.addColorStop(1, mixColor(parseInt(mantle.slice(1), 16), 0x000000, 0.2));
    g.fillStyle = mg;
    g.beginPath();
    g.arc(r, r, r * 0.78, 0, 7);
    g.fill();
    const kg = g.createRadialGradient(r, r, r * 0.05, r, r, r * 0.34);
    kg.addColorStop(0, "#ffffff");
    kg.addColorStop(0.45, core);
    kg.addColorStop(1, rgba(core, 0.75));
    g.fillStyle = kg;
    g.beginPath();
    g.arc(r, r, r * 0.34, 0, 7);
    g.fill();
    g.strokeStyle = rgba(mixColor(parseInt(crust.slice(1), 16), 0x000000, 0.4), 0.5);
    g.lineWidth = 3;
    g.beginPath();
    g.arc(r, r, r * 0.78, 0, 7);
    g.stroke();
  }

  // 土星环
  if (o.saturnRing) {
    g.strokeStyle = "rgba(235,215,165,0.8)";
    g.lineWidth = 9;
    g.beginPath();
    g.ellipse(r, r, r * 1.34, r * 0.42, 0, 0, 7);
    g.stroke();
    g.strokeStyle = "rgba(235,215,165,0.4)";
    g.lineWidth = 17;
    g.beginPath();
    g.ellipse(r, r, r * 1.42, r * 0.48, 0, 0, 7);
    g.stroke();
  }

  // 轨道环
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(r, r, r * 1.55, 0, 7);
  g.stroke();
  g.strokeStyle = "rgba(140,180,235,0.3)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(r, r, r * 1.45, 0, 7);
  g.stroke();

  return new THREE.CanvasTexture(c);
};

// ---- 太空城市光点贴图 ----
export const dotTexture = (): THREE.CanvasTexture => {
  const [c, g, r] = canvas2d(32);
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, "rgba(225,238,255,0.95)");
  grd.addColorStop(0.5, "rgba(150,190,230,0.6)");
  grd.addColorStop(1, "rgba(150,190,230,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
};
```

- [ ] **Step 3: Create `src/DualVectorFoil/cameras.ts`**

```typescript
import { SMOOTH, foilZ, CAM_EPSILON } from "./timeline";

type Vec3 = [number, number, number];
type Shot = { pos: Vec3; target: Vec3 };

const lerpCam = (a: Shot, b: Shot, s: number): Shot => ({
  pos: a.pos.map((v, j) => v + (b.pos[j] - v) * s) as Vec3,
  target: a.target.map((v, j) => v + (b.target[j] - v) * s) as Vec3,
});

// S1 贴箔近景
const shot1At = (p: number): Shot => {
  const fz = foilZ(p);
  const t = (p - 0.2) / 0.2;
  const h = 20 - 4 * t;
  const d = 30 - 6 * t;
  const sway = Math.sin(t * Math.PI * 5) * 3;
  return { pos: [sway, h, fz + d], target: [0, 0, fz] };
};

export const camAt = (p: number): Shot => {
  const fz = foilZ(p);
  const E = CAM_EPSILON;

  if (p <= 0.2) {
    // S0 远景开场
    return lerpCam(
      { pos: [0, 62, 130], target: [0, 0, 0] },
      { pos: [0, 32, 78], target: [0, 0, 0] },
      SMOOTH(p / 0.2),
    );
  }
  if (p <= 0.2 + E) {
    // S0→S1
    return lerpCam(
      { pos: [0, 32, 78], target: [0, 0, 0] },
      shot1At(0.2 + E),
      SMOOTH((p - 0.2) / E),
    );
  }
  if (p <= 0.4) {
    // S1
    return shot1At(p);
  }
  if (p <= 0.4 + E) {
    // S1→S2
    return lerpCam(
      shot1At(0.4),
      { pos: [-28, 14, 44], target: [0, 0, 0] },
      SMOOTH((p - 0.4) / E),
    );
  }
  if (p <= 0.62) {
    // S2 太阳特写
    return lerpCam(
      { pos: [-28, 14, 44], target: [0, 0, 0] },
      { pos: [0, 5, 2], target: [0, 0, 0] },
      SMOOTH((p - 0.4) / 0.22),
    );
  }
  if (p <= 0.62 + E) {
    // S2→S3
    return lerpCam(
      { pos: [0, 5, 2], target: [0, 0, 0] },
      { pos: [-18, 6, fz + 10], target: [-8.46, 0, fz] },
      SMOOTH((p - 0.62) / E),
    );
  }
  if (p <= 0.82) {
    // S3 行星特写
    const e = SMOOTH((p - 0.62) / 0.2);
    return lerpCam(
      { pos: [-18, 6, fz + 10], target: [-8.46, 0, fz] },
      { pos: [4, 6, fz + 10], target: [13, 0, fz] },
      e,
    );
  }
  if (p <= 0.82 + E) {
    // S3→S4
    return lerpCam(
      { pos: [4, 6, fz + 10], target: [13, 0, fz] },
      { pos: [8, 22, -42], target: [0, 0, -60] },
      SMOOTH((p - 0.82) / E),
    );
  }
  // S4 大远景
  return lerpCam(
    { pos: [8, 22, -42], target: [0, 0, -60] },
    { pos: [-120, 60, -145], target: [0, 0, -60] },
    SMOOTH((p - 0.82) / 0.18),
  );
};
```

- [ ] **Step 4: Commit**

```bash
git add src/DualVectorFoil/timeline.ts src/DualVectorFoil/textures.ts src/DualVectorFoil/cameras.ts
git commit -m "feat: add DualVectorFoil foundation modules"
```

---

### Task 3: Create Scene3D.tsx — 静态 3D 场景搭建

**Files:**
- Create: `src/DualVectorFoil/Scene3D.tsx`

- [ ] **Step 1: 写入完整 Scene3D.tsx**

这个文件包含所有 3D 内容：星空、太阳、行星、箔面、太空城市、二维画，以及 `useFrame` 动画循环。

```typescript
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  DURATION,
  SWEEP0,
  SWEEP1,
  SUN_CATCH_P,
  SMOOTH,
  foilZ,
  catchP,
} from "./timeline";
import {
  glowTexture,
  foilTexture,
  sunTexture,
  planetTexture,
  dotTexture,
  PlanetPaintOpts,
} from "./textures";
import { camAt } from "./cameras";

// ==================== 行星数据 ====================
interface PlanetData {
  name: string;
  r: number;
  orbit: number;
  frozen: number;
  color: number;
  paintOpts: PlanetPaintOpts;
  paintR: number;
}

const PLANETS: PlanetData[] = [
  {
    name: "水星",
    r: 0.5,
    orbit: 5,
    frozen: 60,
    color: 0xb8a899,
    paintOpts: { core: 0xf0dcc0, mantle: 0xb8a899, crust: 0x8a7a68, halo: "#c9c2b8" },
    paintR: 1.2,
  },
  {
    name: "金星",
    r: 0.8,
    orbit: 7,
    frozen: 160,
    color: 0xe8c39e,
    paintOpts: { core: 0xffe8c8, mantle: 0xe8c39e, crust: 0xc99f6e, halo: "#f0d8b8" },
    paintR: 1.92,
  },
  {
    name: "地球",
    r: 0.9,
    orbit: 9,
    frozen: 200,
    color: 0x4f86e8,
    paintOpts: { core: 0x9a4a1a, mantle: 0x6a5a3a, crust: 0x3a6ec9, halo: "#9fc4ef", earth: true },
    paintR: 2.16,
  },
  {
    name: "火星",
    r: 0.7,
    orbit: 11,
    frozen: 320,
    color: 0xc96b4a,
    paintOpts: { core: 0xf0a080, mantle: 0xc96b4a, crust: 0x8a4a32, halo: "#e08a66" },
    paintR: 1.68,
  },
  {
    name: "木星",
    r: 2.1,
    orbit: 15,
    frozen: 30,
    color: 0xd9a066,
    paintOpts: {
      core: 0xfff0d8,
      crust: 0xd9a066,
      halo: "#e8c9a0",
      bands: ["#f0e0c8", "#d9a066", "#b57f4a", "#e8c9a0", "#c98d52"],
    },
    paintR: 5.04,
  },
  {
    name: "土星",
    r: 1.8,
    orbit: 19,
    frozen: 120,
    color: 0xe0c68a,
    paintOpts: {
      core: 0xfff0d8,
      crust: 0xe0c68a,
      halo: "#e9d5a8",
      bands: ["#e9d5a8", "#c7a968", "#e0c68a"],
      saturnRing: true,
    },
    paintR: 4.32,
  },
  {
    name: "天王星",
    r: 1.4,
    orbit: 23,
    frozen: 210,
    color: 0x8fd4d0,
    paintOpts: {
      core: 0xffffff,
      crust: 0x8fd4d0,
      halo: "#b6e6e2",
      bands: ["#c8ecea", "#8fd4d0", "#6abcb8"],
    },
    paintR: 3.36,
  },
  {
    name: "海王星",
    r: 1.4,
    orbit: 27,
    frozen: 300,
    color: 0x4a6bd9,
    paintOpts: {
      core: 0xffffff,
      crust: 0x4a6bd9,
      halo: "#6b8ae6",
      bands: ["#8aa6ee", "#4a6bd9", "#3a55b0"],
    },
    paintR: 3.36,
  },
  {
    name: "冥王星",
    r: 0.45,
    orbit: 31,
    frozen: 40,
    color: 0x9aa0a8,
    paintOpts: { core: 0xd8dce0, mantle: 0x9aa0a8, crust: 0x70747a, halo: "#b8bec4" },
    paintR: 1.08,
  },
];

// 太空城市轨道
const CITY_ORBS = [16.5, 17.5, 19.5, 20.5, 23.5, 24.5, 27.5, 28.5];

// ==================== 星空 ====================
const Stars: React.FC = () => {
  const geo = useMemo(() => {
    const N = 2600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 160 + Math.random() * 320;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial
        color={0xffffff}
        size={1.1}
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
};

// ==================== 箔面 ====================
const Foil: React.FC<{ p: number }> = ({ p }) => {
  const sheetMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const rimMatRef = useRef<THREE.LineBasicMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const sheetTex = useMemo(() => foilTexture(), []);
  const rimGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-90, -90, 0),
      new THREE.Vector3(90, -90, 0),
      new THREE.Vector3(90, 90, 0),
      new THREE.Vector3(-90, 90, 0),
      new THREE.Vector3(-90, -90, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const fade = SMOOTH(Math.min(1, Math.max(0, (p - 0.12) / 0.06)));
  const sw = Math.min(1, Math.max(0, (p - SWEEP0) / (SWEEP1 - SWEEP0)));
  const grow = 0.12 + 0.88 * sw;
  const visible = p > 0.12;

  useFrame(() => {
    if (sheetMatRef.current) sheetMatRef.current.opacity = 0.32 * fade;
    if (rimMatRef.current) rimMatRef.current.opacity = 0.9 * fade;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, 0, foilZ(p)]} scale={[grow, grow, 1]}>
      {/* 箔面 */}
      <mesh>
        <planeGeometry args={[180, 180]} />
        <meshBasicMaterial
          ref={sheetMatRef}
          map={sheetTex}
          transparent
          opacity={0.32 * fade}
          depthWrite={false}
        />
      </mesh>
      {/* 发光边框 */}
      <line>
        <primitive object={rimGeo} attach="geometry" />
        <lineBasicMaterial
          ref={rimMatRef}
          color={0x9aa6c0}
          transparent
          opacity={0.9 * fade}
        />
      </line>
    </group>
  );
};

// ==================== 太阳 3D ====================
const Sun3D: React.FC<{ p: number }> = ({ p }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const glowTex = useMemo(() => glowTexture("#ffe9a8"), []);

  // 二维画 refs
  const paintRef = useRef<THREE.Mesh>(null);
  const paintGlowRef = useRef<THREE.Sprite>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const rippleMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const sunTex = useMemo(() => sunTexture(), []);
  const paintGlowTex = useMemo(() => glowTexture("#fff0c0"), []);

  useFrame(() => {
    const sphere = sphereRef.current;
    const glow = glowRef.current;
    const paint = paintRef.current;
    const paintGlow = paintGlowRef.current;
    const ripple = rippleRef.current;

    if (p >= SUN_CATCH_P) {
      const sq = Math.min(1, (p - SUN_CATCH_P) / 0.05);
      const k = 1 + 0.3 * sq;
      if (sphere) {
        sphere.scale.set(k, k, 1 - 0.95 * sq);
        (sphere.material as THREE.MeshBasicMaterial).opacity = 1 - sq;
        sphere.visible = sq < 1;
      }
      if (glow) {
        glow.material.opacity = 0.8 * (1 - sq);
      }
      // 二维画
      const g = Math.min(1, (p - SUN_CATCH_P) / 0.12);
      if (paint) {
        paint.visible = g > 0.02;
        paint.scale.setScalar(9 * Math.max(0.001, 0.12 + 0.88 * g));
        (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.2);
      }
      if (paintGlow) {
        paintGlow.visible = g > 0.02;
        const breathe = 0.82 + 0.18 * Math.sin(p * Math.PI * 18);
        paintGlow.material.opacity = Math.min(0.9, g * 1.6) * breathe;
      }
      // 涟漪
      const rk = p - SUN_CATCH_P;
      if (ripple) {
        ripple.visible = rk < 0.16;
        if (ripple.visible) {
          const cyc = (rk % 0.04) / 0.04;
          ripple.scale.setScalar(1 + cyc * 13);
          ripple.rotation.z = rk * 2.5;
        }
      }
      if (rippleMatRef.current) {
        rippleMatRef.current.opacity = ripple?.visible ? (1 - ((p - SUN_CATCH_P) % 0.04) / 0.04) * 0.5 : 0;
      }
    } else {
      if (sphere) {
        sphere.scale.set(1, 1, 1);
        (sphere.material as THREE.MeshBasicMaterial).opacity = 1;
        sphere.visible = true;
      }
      if (glow) glow.material.opacity = 0.8;
      if (paint) paint.visible = false;
      if (paintGlow) paintGlow.visible = false;
      if (ripple) ripple.visible = false;
    }
  });

  return (
    <>
      {/* 3D 太阳 */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[3, 48, 48]} />
        <meshBasicMaterial color={0xffd76a} />
      </mesh>
      <sprite ref={glowRef} scale={[46, 46, 1]}>
        <spriteMaterial
          map={glowTex}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* 二维画 (挂在箔面上, 位置 z=0) */}
      <mesh ref={paintRef} visible={false}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial map={sunTex} transparent opacity={0} depthWrite={false} />
      </mesh>
      <sprite ref={paintGlowRef} scale={[70, 70, 1]} visible={false}>
        <spriteMaterial
          map={paintGlowTex}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={rippleRef} visible={false}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial
          ref={rippleMatRef}
          color={0xffffff}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
};

// ==================== 行星 ====================
const Planets: React.FC<{ p: number }> = ({ p }) => {
  const planetRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Line | null)[]>([]);
  const paintRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 预生成贴图
  const paintTextures = useMemo(
    () => PLANETS.map((d) => planetTexture(d.paintOpts)),
    [],
  );

  // 轨道环点
  const orbitPts = useMemo(
    () =>
      PLANETS.map((d) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          pts.push(new THREE.Vector3(d.orbit * Math.cos(a), 0, d.orbit * Math.sin(a)));
        }
        return new THREE.BufferGeometry().setFromPoints(pts);
      }),
    [],
  );

  useFrame(() => {
    planetRefs.current.forEach((sphere, i) => {
      if (!sphere) return;
      const d = PLANETS[i];
      const ring = ringRefs.current[i];
      const paint = paintRefs.current[i];

      // 公转 (仅片头)
      const t = SMOOTH(Math.min(1, p / 0.12));
      const a0 = (d.frozen * Math.PI) / 180;
      const a = a0 + (3 / d.orbit) * t * Math.PI * 2;
      const px = d.orbit * Math.cos(a);
      const pz = d.orbit * Math.sin(a);
      sphere.position.set(px, 0, pz);

      // 二维化
      const cp = catchP(sphere.position.z);
      if (p >= cp) {
        const sq = Math.min(1, (p - cp) / 0.03);
        const k = 1 + 0.2 * sq;
        sphere.scale.set(k, k, 1 - 0.95 * sq);
        (sphere.material as THREE.MeshLambertMaterial).opacity = 1 - sq;
        sphere.visible = sq < 1;
        if (ring) ring.visible = sq < 1;
        // 二维画
        if (paint) {
          const g = Math.min(1, (p - cp) / 0.06);
          paint.visible = g > 0.02;
          paint.position.set(px, 0, 0);
          paint.scale.setScalar(d.paintR * Math.max(0.001, 0.15 + 0.85 * g));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.2);
        }
      } else {
        sphere.scale.set(1, 1, 1);
        (sphere.material as THREE.MeshLambertMaterial).opacity = 1;
        sphere.visible = true;
        if (ring) ring.visible = true;
        if (paint) paint.visible = false;
      }
    });
  });

  return (
    <>
      {PLANETS.map((d, i) => (
        <React.Fragment key={d.name}>
          {/* 3D 球体 */}
          <mesh
            ref={(el) => {
              planetRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[d.r, 28, 28]} />
            <meshLambertMaterial color={d.color} transparent />
          </mesh>
          {/* 轨道环 */}
          <line
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            geometry={orbitPts[i]}
          >
            <lineBasicMaterial color={0x7f97b8} transparent opacity={0.35} />
          </line>
          {/* 二维画 (初始隐藏) */}
          <mesh
            ref={(el) => {
              paintRefs.current[i] = el;
            }}
            visible={false}
          >
            <circleGeometry args={[1, 48]} />
            <meshBasicMaterial
              map={paintTextures[i]}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
};

// ==================== 太空城市 ====================
const Cities: React.FC<{ p: number }> = ({ p }) => {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const paintRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sizes = useRef<number[]>([]);

  const dotTex = useMemo(() => dotTexture(), []);

  // 初始化城市位置 (仅一次)
  const cityData = useMemo(() => {
    const data: { pos: [number, number, number]; sz: number }[] = [];
    for (let i = 0; i < 48; i++) {
      const orb = CITY_ORBS[i % CITY_ORBS.length] + (Math.random() * 0.8 - 0.4);
      const a = Math.PI * (1.35 + Math.random() * 0.3);
      const x = orb * Math.cos(a);
      const z = orb * Math.sin(a);
      const y = (Math.random() * 0.8 - 0.4) * 0.5;
      data.push({ pos: [x, y, z], sz: 0.2 + Math.random() * 0.12 });
    }
    sizes.current = data.map((d) => d.sz);
    return data;
  }, []);

  useFrame(() => {
    cityData.forEach((cd, i) => {
      const mesh = meshRefs.current[i];
      const paint = paintRefs.current[i];
      if (!mesh) return;

      const cp = catchP(cd.pos[2]);
      if (p >= cp) {
        mesh.visible = false;
        if (paint) {
          const g = Math.min(1, (p - cp) / 0.02);
          paint.visible = g > 0;
          paint.position.set(cd.pos[0], cd.pos[1], 0);
          paint.scale.setScalar(sizes.current[i] * Math.max(0.001, 0.2 + 0.8 * g));
          (paint.material as THREE.MeshBasicMaterial).opacity = Math.min(1, g * 2.5);
        }
      } else {
        mesh.visible = true;
        if (paint) paint.visible = false;
      }
    });
  });

  return (
    <>
      {cityData.map((cd, i) => (
        <React.Fragment key={i}>
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={cd.pos}
          >
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshLambertMaterial color={0x9fb4cf} />
          </mesh>
          <mesh
            ref={(el) => {
              paintRefs.current[i] = el;
            }}
            visible={false}
          >
            <circleGeometry args={[1, 20]} />
            <meshBasicMaterial
              map={dotTex}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
};

// ==================== 主场景 ====================
const Scene: React.FC<{ p: number }> = ({ p }) => {
  useFrame(({ camera }) => {
    const cam = camAt(p);
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
  });

  return (
    <>
      <Stars />
      <Sun3D p={p} />
      <Planets p={p} />
      <Cities p={p} />
      <Foil p={p} />
      <ambientLight intensity={0.6} color={0x8899bb} />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={220} color={0xffe3b0} />
    </>
  );
};

// ==================== Canvas 包装 ====================
const Scene3D: React.FC<{ p: number }> = ({ p }) => {
  return (
    <Canvas
      camera={{ position: [30, 45, 110], fov: 50, near: 0.1, far: 3000 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[0x02030a]} />
      <Scene p={p} />
    </Canvas>
  );
};

export default Scene3D;
```

- [ ] **Step 2: 检查 TypeScript 编译**

```bash
cd "C:\Users\Rao\Desktop\学习\project-vibe\my-video" && npx tsc --noEmit src/DualVectorFoil/Scene3D.tsx 2>&1 | head -30
```

Expected: no errors (可能有一些 three/fiber 类型警告，先忽略)

- [ ] **Step 3: Commit**

```bash
git add src/DualVectorFoil/Scene3D.tsx && git commit -m "feat: add DualVectorFoil 3D scene"
```

---

### Task 4: Create index.tsx — Remotion 入口 + 文字叠加

**Files:**
- Create: `src/DualVectorFoil/index.tsx`

- [ ] **Step 1: 创建 `src/DualVectorFoil/index.tsx`**

```typescript
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TOTAL_FRAMES, DURATION } from "./timeline";
import Scene3D from "./Scene3D";

// ==================== 文字数据 ====================
const CAPTIONS: [number, number, string][] = [
  [0.03, 0.09, "掩体计划 · 在巨行星阴影中苟活的人类,以为能躲过黑暗森林的打击"],
  [0.28, 0.36, "二向箔投入太阳系"],
  [0.40, 0.47, "二维化从冥王星轨道附近开始,如瘟疫般蔓延"],
  [0.74, 0.80, "太空城市与人类,被展开成二维的图案"],
];

const QUOTES: [number, number, string][] = [
  [
    0.535,
    0.645,
    "太阳在二维平面上展开了,像一幅在上帝的画板上绘成的画。核心、辐射层、对流层……这是一幅最壮丽也最恐怖的画。",
  ],
  [
    0.66,
    0.78,
    "地球在二维空间中展开,像一只巨眼的虹膜——蓝色的大洋,褐色的大陆,白色的云层,都精致地画在那个圆盘上。",
  ],
];

// ==================== 文字叠加组件 ====================
const OverlayText: React.FC<{ p: number }> = ({ p }) => {
  // 标题
  const titleOpacity = p >= 0.1 && p <= 0.26 ? 1 : 0;

  // 字幕
  let caption = "";
  for (const [a, b, t] of CAPTIONS) {
    if (p >= a && p <= b) caption = t;
  }
  const captionOpacity = caption ? 1 : 0;

  // 引用
  let quote = "";
  for (const [a, b, t] of QUOTES) {
    if (p >= a && p <= b) quote = t;
  }
  const quoteOpacity = quote ? 1 : 0;

  // 最终文字
  const finalOpacity = p >= 0.92 ? 1 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* 文字块: 右下角 */}
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 78,
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          maxWidth: "46vw",
        }}
      >
        {/* 标题 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 200,
            letterSpacing: "0.4em",
            color: "#eaf3ff",
            opacity: titleOpacity,
            textShadow:
              "0 0 30px rgba(150,210,255,0.55), 0 0 90px rgba(90,170,255,0.35)",
            transition: "opacity 0.1s ease",
          }}
        >
          二向箔
        </div>

        {/* 字幕 */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: "0.25em",
            color: "#cfe0f5",
            opacity: captionOpacity,
            textShadow: "0 0 20px rgba(120,180,255,0.5)",
            transition: "opacity 0.1s ease",
            minHeight: 28,
          }}
        >
          {caption || "\u00A0"}
        </div>

        {/* 引用 */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: "0.15em",
            lineHeight: 1.8,
            color: "#eef4ff",
            opacity: quoteOpacity,
            maxWidth: "38vw",
            textAlign: "right",
            textShadow:
              "0 0 24px rgba(150,200,255,0.5), 0 2px 24px rgba(0,0,0,0.85)",
            transition: "opacity 0.1s ease",
            minHeight: 36,
          }}
        >
          {quote || "\u00A0"}
        </div>

        {/* 最终文字 */}
        <div
          style={{
            opacity: finalOpacity,
            transition: "opacity 0.1s ease",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 300,
              letterSpacing: "0.2em",
              lineHeight: 1.8,
              color: "#eaf3ff",
              textShadow: "0 0 24px rgba(150,210,255,0.5)",
            }}
          >
            那是坟墓,也是纪念碑,是人类文明最宏伟的墓志铭。
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: "0.4em",
              color: "#8aa3c4",
            }}
          >
            ——《三体III · 死神永生》
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 主组件 ====================
const DualVectorFoil: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frame / (fps * DURATION); // [0, 1]

  return (
    <AbsoluteFill style={{ background: "#02030a" }}>
      <Scene3D p={Math.min(p, 1)} />
      <OverlayText p={p} />
    </AbsoluteFill>
  );
};

export default DualVectorFoil;
export { TOTAL_FRAMES, DURATION };
```

- [ ] **Step 2: Commit**

```bash
git add src/DualVectorFoil/index.tsx && git commit -m "feat: add DualVectorFoil entry + overlay"
```

---

### Task 5: Register in Root.tsx

**Files:**
- Modify: `src/Root.tsx`

- [ ] **Step 1: 添加 import 和 composition entry**

在 `src/Root.tsx` 顶部的 import 区域添加：

```typescript
import DualVectorFoil, { TOTAL_FRAMES as DualVectorFoilFrames } from "./DualVectorFoil";
```

在 `compositions` 数组的合适位置添加（放在其他 landscape 视频附近）：

```typescript
{
  id: "DualVectorFoil",
  component: DualVectorFoil,
  durationInFrames: DualVectorFoilFrames,
  orientation: "landscape",
  category: "video",
  description: "二向箔 · 太阳系二维化 — 三体系列名场面，3D可视化重现",
},
```

- [ ] **Step 2: Commit**

```bash
git add src/Root.tsx && git commit -m "feat: register DualVectorFoil composition"
```

---

### Task 6: Test in Remotion Studio

**Files:** (none — validation only)

- [ ] **Step 1: 启动 dev server 验证**

```bash
cd "C:\Users\Rao\Desktop\学习\project-vibe\my-video" && pnpm run dev
```

打开 Remotion Studio，选择 `DualVectorFoil` composition，播放检查：
- 星空背景正常渲染
- 太阳 + 光晕可见
- 9 个行星沿轨道分布
- 太空城市光点在巨行星附近
- 拖动进度条到 ~20% 时箔面出现
- 行星逐个被二维化
- 太阳约 53% 时开始二维化展开
- 右下角文字按时间叠加

- [ ] **Step 2: 如有问题修复后提交**

```bash
git add -A && git commit -m "fix: DualVectorFoil tweaks"
```
