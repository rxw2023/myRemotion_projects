import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import {
  BRIDGE,
  LAKE,
  PADDY,
  PIER,
  ROAD,
  SCHOOL,
  STORE,
  WATER_Y,
  terrainHeight,
  terrainSlope,
} from "./layout";
import { TOWN } from "./palette";
import {
  box,
  cylinder,
  gableRoof,
  hipRoof,
  mergeParts,
  mulberry32,
  xf,
  type Part,
} from "./math";
import { createGlowMaterial, type SceneMaterials } from "./materials";
import { BillboardGlow } from "./Glow";

/**
 * 系守町 —— 湖畔小镇
 *
 * 布局没有用随机撒点，而是沿四条"街道弧线"排屋:
 * 从湖心向外按固定半径走一圈，每步放一栋、朝街道切线方向摆正。
 * 随机撒点得到的是"一堆房子"，沿弧线排才读得出"町"。
 *
 * 屋舍墙体与屋顶合并成 1 个 draw call；
 * 窗灯是另一个 draw call（因为需要逐窗独立明灭的动画）。
 */

// ==================== 街道与房屋 ====================

interface House {
  x: number;
  y: number;
  z: number;
  /** 朝向（绕 Y） */
  rot: number;
  w: number;
  d: number;
  wallH: number;
  roofH: number;
  hip: boolean;
  wallColor: string;
  roofColor: string;
}

/**
 * 街道半径 —— 从湖心往外，一圈一圈像年轮。
 * 湖改成半径 17 的正圆陨石湖、环形隆起在 21.5 之后，
 * 第一圈正好落在隆起的外坡上，整座町就架在陨石坑的边缘。
 */
const STREET_RADII = [22.5, 26.5, 30.5, 34.5];
const ARC_FROM = 0.2;
const ARC_TO = 2.85;

/**
 * 町的正面留一个缺口。
 *
 * 环形隆起把小镇抬到陨石坑边缘上之后，从南侧低角度看过去，
 * 近岸的屋群正好挡在相机和湖之间 —— 最后一帧糊成一团屋顶，湖被埋了。
 * 这里挖掉一段，缺口的位置正好是山道进镇的地方（ROAD 起点在 a≈1.64），
 * 所以读起来是"町口"，而不是一个没有理由的空档。
 */
const ARC_GAP: [number, number] = [1.2, 1.64];

function buildHouses(): House[] {
  const rand = mulberry32(778899);
  const out: House[] = [];

  for (let si = 0; si < STREET_RADII.length; si++) {
    const r = STREET_RADII[si];
    const steps = 30 + si * 4;
    for (let k = 0; k < steps; k++) {
      // 沿弧线均匀走，再抖动一点，免得像用尺子画的
      const t = k / (steps - 1);
      const a = ARC_FROM + (ARC_TO - ARC_FROM) * t + (rand() - 0.5) * 0.05;
      if (rand() < 0.16) continue; // 留出空地
      if (a > ARC_GAP[0] && a < ARC_GAP[1]) continue; // 町口缺口

      // 垂直于街道方向的偏移: 街道两侧各排一列
      const side = k % 2 === 0 ? 2.0 : -2.0;
      const rr = r + side + (rand() - 0.5) * 0.7;
      const x = LAKE.x + Math.cos(a) * rr;
      const z = LAKE.z + Math.sin(a) * rr;

      const y = terrainHeight(x, z);
      // 泡在水里或挂在陡坡上的直接丢掉
      if (y < WATER_Y + 0.9) continue;
      if (terrainSlope(x, z, 1.2) > 0.4) continue;

      const w = 2.0 + rand() * 2.6;
      const d = 2.2 + rand() * 3.2;
      const wallH = 1.5 + rand() * 1.5;
      const hip = rand() > 0.55;

      out.push({
        x,
        y,
        z,
        // 沿街道切线方向摆正（切线 = 角度 + 90°）
        rot: -(a + Math.PI / 2) + (rand() - 0.5) * 0.28,
        w,
        d,
        wallH,
        roofH: 0.8 + rand() * 1.0,
        hip,
        wallColor: [TOWN.wall, TOWN.wallAlt, TOWN.wallPale][Math.floor(rand() * 3)],
        roofColor: [TOWN.roof, TOWN.roofAlt, TOWN.roofBlue][Math.floor(rand() * 3)],
      });
    }
  }
  return out;
}

function buildHouseGeometry(houses: House[]): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const h of houses) {
    const base = xf({ pos: [h.x, h.y, h.z], rot: [0, h.rot, 0] });
    const wallM = base.clone().multiply(xf({ pos: [0, h.wallH / 2, 0] }));
    parts.push({ geo: box(h.w, h.wallH, h.d), color: h.wallColor, matrix: wallM });

    const roofM = base.clone().multiply(xf({ pos: [0, h.wallH, 0] }));
    // 屋檐略微外挑，屋顶在夜景里就能压出一条清楚的暗边
    parts.push({
      geo: h.hip ? hipRoof(h.w + 0.5, h.d + 0.5, h.roofH) : gableRoof(h.w + 0.5, h.d + 0.5, h.roofH),
      color: h.roofColor,
      matrix: roofM,
    });
  }
  return mergeParts(parts);
}

// ==================== 窗灯（次第明灭）====================

const WINDOW_VERT = /* glsl */ `
attribute float aSeed;
varying float vSeed;
varying vec2 vUv;
void main() {
  vSeed = aSeed;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WINDOW_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uColorDim;
uniform float uTime;
uniform float uIntensity;
varying float vSeed;
varying vec2 vUv;

void main() {
  /*
   * 每扇窗有自己的周期与相位。
   * 用 smoothstep 削正弦而不是 step 硬开关 —— 硬开关在这个尺度上会像故障灯，
   * 缓慢起伏才像"有人在家"。
   */
  float period = 0.16 + vSeed * 0.5;
  float f = sin(uTime * period + vSeed * 41.0);
  float level = smoothstep(-0.35, 0.45, f);

  // 一小部分窗户会彻底熄掉再亮起来
  float switchy = step(0.84, fract(vSeed * 137.0));
  float slot = floor(uTime * 0.14 + vSeed * 23.0);
  float gate = switchy > 0.5 ? step(0.45, fract(sin(slot * 12.9898 + vSeed * 78.233) * 43758.5453)) : 1.0;

  float bright = mix(0.45, 1.0, level) * gate;

  // 窗框边缘稍暗，避免糊成一块方光
  vec2 e = abs(vUv - 0.5) * 2.0;
  float frame = 1.0 - 0.45 * smoothstep(0.72, 1.0, max(e.x, e.y));

  vec3 col = mix(uColorDim, uColor, bright);
  gl_FragColor = vec4(col * uIntensity * bright * frame, frame);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function buildWindowGeometry(houses: House[]): THREE.BufferGeometry {
  const parts: Part[] = [];
  const rand = mulberry32(5150);

  for (const h of houses) {
    // 面朝街道的两个立面各开一扇窗（街道在局部 +Z 方向）
    const base = xf({ pos: [h.x, h.y, h.z], rot: [0, h.rot, 0] });
    const rows = h.wallH > 2.3 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      const wy = 0.55 + r * 1.05;
      const n = 2 + (rand() > 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const wx = (i - (n - 1) / 2) * 0.95;
        // 窗要开得够大: 在整片全景的尺度上，0.5 单位的窗只有 1~2 像素，
        // 撑不起"镇上灯火全亮"这句话
        const ww = 0.66;
        const wh = 0.62;
        const m = base.clone().multiply(xf({ pos: [wx, wy, h.d / 2 + 0.03] }));
        parts.push({
          geo: new THREE.PlaneGeometry(ww, wh),
          color: 0xffffff,
          matrix: m,
        });
      }
    }
  }

  const geo = mergeParts(parts);
  // 逐窗种子写进顶点属性
  const count = geo.getAttribute("position").count;
  const seeds = new Float32Array(count);
  const rand2 = mulberry32(6161);
  // 每个窗 6 个顶点，同一扇窗共用种子
  for (let i = 0; i < count; i += 6) {
    const s = rand2();
    for (let k = 0; k < 6 && i + k < count; k++) seeds[i + k] = s;
  }
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geo;
}

// ==================== 码头 / 小船 ====================

function buildPier(): THREE.BufferGeometry {
  const parts: Part[] = [];
  const rand = mulberry32(2468);

  // 从岸边伸进湖里的木栈桥，方向朝湖心
  const dirX = LAKE.x - PIER.x;
  const dirZ = LAKE.z - PIER.z;
  const len = Math.hypot(dirX, dirZ);
  const ux = dirX / len;
  const uz = dirZ / len;
  const deckLen = 7.5;
  const y = WATER_Y + 0.55;

  // 桥面
  for (let i = 0; i < 16; i++) {
    const t = (i / 15) * deckLen;
    const px = PIER.x + ux * t;
    const pz = PIER.z + uz * t;
    parts.push({
      geo: box(0.22, 0.12, 1.5),
      color: i % 2 === 0 ? "#4a3a28" : "#3e3022",
      matrix: xf({ pos: [px, y, pz], rot: [0, -Math.atan2(ux, uz), 0] }),
    });
  }
  // 桥桩
  for (let i = 1; i < 6; i++) {
    const t = (i / 5) * deckLen;
    const px = PIER.x + ux * t;
    const pz = PIER.z + uz * t;
    for (const side of [-0.62, 0.62]) {
      parts.push({
        geo: cylinder(0.09, 0.11, 2.4, 6),
        color: "#33281c",
        matrix: xf({
          pos: [px - uz * side, y - 1.15, pz + ux * side],
        }),
      });
    }
  }

  // 系在栈桥边的小船
  for (let b = 0; b < 2; b++) {
    const t = 3.0 + b * 2.6;
    const px = PIER.x + ux * t - uz * 1.9;
    const pz = PIER.z + uz * t + ux * 1.9;
    const rot = -Math.atan2(ux, uz) + (rand() - 0.5) * 0.4;
    const by = WATER_Y + 0.1;
    parts.push({
      geo: box(0.85, 0.42, 2.3),
      color: "#4a4238",
      matrix: xf({ pos: [px, by, pz], rot: [0, rot, 0] }),
    });
    parts.push({
      geo: box(0.62, 0.12, 1.9),
      color: "#6a5c48",
      matrix: xf({ pos: [px, by + 0.24, pz], rot: [0, rot, 0] }),
    });
    // 船头的一根短桩
    parts.push({
      geo: cylinder(0.05, 0.06, 0.9, 5),
      color: "#3a3026",
      matrix: xf({
        pos: [px + Math.sin(rot) * 0.9, by + 0.5, pz + Math.cos(rot) * 0.9],
      }),
    });
  }

  return mergeParts(parts);
}

// ==================== 细桥 ====================

function buildBridge(): THREE.BufferGeometry {
  const y = terrainHeight(BRIDGE.x, BRIDGE.z);
  const parts: Part[] = [];
  // 桥沿着溪谷的横向架过去，所以朝着溪谷走向的垂直方向
  const rot = 0.35;
  const span = 9.5;

  parts.push({
    geo: box(span, 0.34, 2.2),
    color: "#453b2e",
    matrix: xf({ pos: [BRIDGE.x, y + 1.9, BRIDGE.z], rot: [0, rot, 0] }),
  });
  // 栏杆
  for (const side of [-1, 1]) {
    parts.push({
      geo: box(span, 0.12, 0.12),
      color: "#5a4a34",
      matrix: xf({
        pos: [BRIDGE.x - Math.sin(rot) * side * 1.05, y + 3.0, BRIDGE.z - Math.cos(rot) * side * 1.05],
        rot: [0, rot, 0],
      }),
    });
    for (let i = 0; i < 6; i++) {
      const t = (i / 5 - 0.5) * span * 0.9;
      parts.push({
        geo: cylinder(0.06, 0.07, 1.15, 5),
        color: "#5a4a34",
        matrix: xf({
          pos: [
            BRIDGE.x + Math.cos(rot) * t - Math.sin(rot) * side * 1.05,
            y + 2.4,
            BRIDGE.z - Math.sin(rot) * t - Math.cos(rot) * side * 1.05,
          ],
        }),
      });
    }
  }
  // 桥台
  for (const s of [-1, 1]) {
    parts.push({
      geo: box(1.6, 2.6, 2.6),
      color: "#3c3a38",
      matrix: xf({
        pos: [BRIDGE.x + Math.cos(rot) * s * span * 0.5, y + 0.6, BRIDGE.z - Math.sin(rot) * s * span * 0.5],
        rot: [0, rot, 0],
      }),
    });
  }
  return mergeParts(parts);
}

// ==================== 町口: 便利店 + 加油站 ====================

function buildStore(): THREE.BufferGeometry {
  const y = terrainHeight(STORE.x, STORE.z);
  const parts: Part[] = [];
  const rot = 0.5;

  // 店体
  parts.push({
    geo: box(6.5, 2.6, 4.4),
    color: "#3e3a34",
    matrix: xf({ pos: [STORE.x, y + 1.3, STORE.z], rot: [0, rot, 0] }),
  });
  parts.push({
    geo: box(7.0, 0.28, 4.9),
    color: "#2a2c34",
    matrix: xf({ pos: [STORE.x, y + 2.72, STORE.z], rot: [0, rot, 0] }),
  });
  // 玻璃面（夜间透出惨白灯光）
  parts.push({
    geo: new THREE.PlaneGeometry(5.4, 1.7),
    color: "#cfe6f2",
    matrix: xf({
      pos: [STORE.x + Math.sin(rot) * 2.23, y + 1.35, STORE.z + Math.cos(rot) * 2.23],
      rot: [0, rot, 0],
    }),
  });
  // 停车场
  parts.push({
    geo: new THREE.PlaneGeometry(11, 7),
    color: "#3a3730",
    matrix: xf({ pos: [STORE.x - 3.2, y + 0.04, STORE.z + 3.0], rot: [-Math.PI / 2, 0, rot] }),
  });
  // 路边的一处加油站罩棚
  const gx = STORE.x + 7.5;
  const gz = STORE.z - 3.5;
  const gy = terrainHeight(gx, gz);
  for (const [ox, oz] of [
    [-2.0, -1.4],
    [2.0, -1.4],
    [-2.0, 1.4],
    [2.0, 1.4],
  ]) {
    parts.push({
      geo: cylinder(0.14, 0.16, 3.4, 6),
      color: "#3a3f46",
      matrix: xf({ pos: [gx + ox, gy + 1.7, gz + oz] }),
    });
  }
  parts.push({
    geo: box(5.6, 0.32, 4.2),
    color: "#4a5058",
    matrix: xf({ pos: [gx, gy + 3.55, gz] }),
  });
  // 罩棚下的加油机
  parts.push({
    geo: box(0.6, 1.3, 0.5),
    color: "#5a6068",
    matrix: xf({ pos: [gx, gy + 0.65, gz + 1.0] }),
  });

  return mergeParts(parts);
}

// ==================== 小学 ====================

function buildSchool(): THREE.BufferGeometry {
  const y = terrainHeight(SCHOOL.x, SCHOOL.z);
  const parts: Part[] = [];
  const rot = -0.28;

  // 校舍: 两层长条
  parts.push({
    geo: box(11, 2.4, 3.4),
    color: "#463f34",
    matrix: xf({ pos: [SCHOOL.x, y + 1.2, SCHOOL.z - 3.2], rot: [0, rot, 0] }),
  });
  parts.push({
    geo: box(11.6, 2.2, 3.9),
    color: "#2e3038",
    matrix: xf({ pos: [SCHOOL.x, y + 2.9, SCHOOL.z - 3.2], rot: [0, rot, 0] }),
  });
  // 操场（压平的台地上铺一层深色土）
  parts.push({
    geo: new THREE.PlaneGeometry(13, 9),
    color: "#4b4a3e",
    matrix: xf({ pos: [SCHOOL.x, y + 0.05, SCHOOL.z + 2.6], rot: [-Math.PI / 2, 0, rot] }),
  });
  // 旗杆
  const fx = SCHOOL.x + 5.0;
  const fz = SCHOOL.z + 5.4;
  parts.push({
    geo: cylinder(0.07, 0.09, 6.2, 6, false),
    color: "#8a8f96",
    matrix: xf({ pos: [fx, terrainHeight(fx, fz) + 3.1, fz] }),
  });
  // 单杠
  for (const s of [-2.2, 2.2]) {
    const bx = SCHOOL.x - 3.5 + s;
    const bz = SCHOOL.z + 5.0;
    const by = terrainHeight(bx, bz);
    parts.push({
      geo: cylinder(0.06, 0.06, 1.6, 5),
      color: "#52565c",
      matrix: xf({ pos: [bx, by + 0.8, bz] }),
    });
  }
  parts.push({
    geo: cylinder(0.06, 0.06, 4.4, 5),
    color: "#52565c",
    matrix: xf({
      pos: [SCHOOL.x - 3.5, terrainHeight(SCHOOL.x - 3.5, SCHOOL.z + 5.0) + 1.6, SCHOOL.z + 5.0],
      rot: [0, 0, Math.PI / 2],
    }),
  });

  return mergeParts(parts);
}

// ==================== 稻田 / 电线杆 ====================

function buildPaddy(): THREE.BufferGeometry {
  const parts: Part[] = [];
  const rand = mulberry32(1357);
  const N = 7;
  for (let ix = 0; ix < N; ix++) {
    for (let iz = 0; iz < N; iz++) {
      const x = PADDY.x + (ix - (N - 1) / 2) * 2.05;
      const z = PADDY.z + (iz - (N - 1) / 2) * 2.05;
      const y = terrainHeight(x, z);
      // 田埂略高于水面，田里积一层浅水
      parts.push({
        geo: box(1.95, 0.16, 1.95),
        color: rand() > 0.5 ? TOWN.paddy : TOWN.paddyWater,
        matrix: xf({ pos: [x, y + 0.08, z] }),
      });
      parts.push({
        geo: box(1.55, 0.1, 1.55),
        color: "#3a4a52",
        matrix: xf({ pos: [x, y + 0.2, z] }),
      });
    }
  }
  return mergeParts(parts);
}

function buildPoles(): THREE.BufferGeometry {
  const parts: Part[] = [];
  // 沿山道立杆，再沿着山道拉几根线
  const pts: [number, number][] = [];
  for (let i = 0; i < ROAD.length; i++) {
    const [rx, rz] = ROAD[i];
    // 电线杆退到路边
    const off = 2.6;
    const nx = rx + off;
    const nz = rz + off * 0.4;
    const y = terrainHeight(nx, nz);
    if (y < WATER_Y + 0.5) continue;
    pts.push([nx, nz]);

    parts.push({
      geo: cylinder(0.1, 0.14, 5.6, 6),
      color: TOWN.pole,
      matrix: xf({ pos: [nx, y + 2.8, nz] }),
    });
    // 横担
    parts.push({
      geo: box(2.0, 0.09, 0.09),
      color: TOWN.pole,
      matrix: xf({ pos: [nx, y + 5.2, nz] }),
    });
    parts.push({
      geo: box(1.5, 0.08, 0.08),
      color: TOWN.pole,
      matrix: xf({ pos: [nx, y + 4.75, nz] }),
    });
    // 变压器（每三根挂一台）
    if (pts.length % 3 === 0) {
      parts.push({
        geo: cylinder(0.22, 0.22, 0.6, 6, false),
        color: "#4a4a4a",
        matrix: xf({ pos: [nx + 0.5, y + 4.2, nz] }),
      });
    }
  }

  // 电线: 用细圆柱把相邻两根杆连起来（略下垂，用两段折线近似）
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const ay = terrainHeight(ax, az) + 5.2;
    const by = terrainHeight(bx, bz) + 5.2;
    const midX = (ax + bx) / 2;
    const midZ = (az + bz) / 2;
    const midY = (ay + by) / 2 - 0.6; // 垂度
    for (const [p, q] of [
      [
        [ax, ay, az],
        [midX, midY, midZ],
      ],
      [
        [midX, midY, midZ],
        [bx, by, bz],
      ],
    ] as [[number, number, number], [number, number, number]][]) {
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      const dz = q[2] - p[2];
      const len = Math.hypot(dx, dy, dz);
      if (len < 0.01) continue;
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx, dy, dz).normalize(),
      );
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2),
        quat,
        new THREE.Vector3(1, 1, 1),
      );
      parts.push({ geo: cylinder(0.035, 0.035, len, 4), color: "#1e1c1a", matrix: m });
    }
  }

  return mergeParts(parts);
}

// ==================== 组装 ====================

export const Town: React.FC<{ mat: SceneMaterials; time: number }> = ({
  mat,
  time,
}) => {
  const houses = useMemo(() => buildHouses(), []);
  const houseGeo = useMemo(() => buildHouseGeometry(houses), [houses]);
  const windowGeo = useMemo(() => buildWindowGeometry(houses), [houses]);
  const pierGeo = useMemo(() => buildPier(), []);
  const bridgeGeo = useMemo(() => buildBridge(), []);
  const storeGeo = useMemo(() => buildStore(), []);
  const schoolGeo = useMemo(() => buildSchool(), []);
  const paddyGeo = useMemo(() => buildPaddy(), []);
  const poleGeo = useMemo(() => buildPoles(), []);

  const windowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WINDOW_VERT,
        fragmentShader: WINDOW_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(TOWN.windowBright) },
          uColorDim: { value: new THREE.Color(TOWN.windowDim) },
          uTime: { value: 0 },
          uIntensity: { value: 2.6 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  // 便利店灯箱 + 路灯的加色光斑
  const signMat = useMemo(() => createGlowMaterial("#bfe4ff", 1.5, 2.0), []);
  const lampMat = useMemo(() => createGlowMaterial(TOWN.window, 1.2, 2.4), []);
  const signGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const lampSpots = useMemo(() => {
    const out: { x: number; y: number; z: number }[] = [];
    const rand = mulberry32(3131);
    for (let i = 0; i < 24; i++) {
      const a = ARC_FROM + rand() * (ARC_TO - ARC_FROM);
      const r = 22 + rand() * 12;
      const x = LAKE.x + Math.cos(a) * r;
      const z = LAKE.z + Math.sin(a) * r;
      const y = terrainHeight(x, z);
      if (y < WATER_Y + 0.8) continue;
      out.push({ x, y: y + 2.6, z });
    }
    return out;
  }, []);

  const storeY = terrainHeight(STORE.x, STORE.z);

  useLayoutEffect(() => {
    windowMat.uniforms.uTime.value = time;
  });

  return (
    <>
      <mesh geometry={houseGeo} material={mat.misc} />
      <mesh geometry={houseGeo} material={mat.outlineFine} />
      <mesh geometry={windowGeo} material={windowMat} renderOrder={3} />

      <mesh geometry={pierGeo} material={mat.wood} />
      <mesh geometry={bridgeGeo} material={mat.wood} />
      <mesh geometry={poleGeo} material={mat.misc} />
      <mesh geometry={schoolGeo} material={mat.misc} />
      <mesh geometry={paddyGeo} material={mat.misc} />

      <mesh geometry={storeGeo} material={mat.misc} />

      {/* 便利店的灯箱: 夜里是整条町口最亮的一点 */}
      <mesh
        geometry={signGeo}
        material={signMat}
        position={[STORE.x + Math.sin(0.5) * 2.4, storeY + 3.15, STORE.z + Math.cos(0.5) * 2.4]}
        rotation={[0, 0.5, 0]}
        scale={[5.8, 0.9, 1]}
        renderOrder={4}
      />

      {/* 街灯。光斑必须每帧对齐相机，否则侧过来就成一条线 */}
      {lampSpots.map((s, i) => (
        <BillboardGlow key={i} material={lampMat} position={[s.x, s.y, s.z]} scale={2.6} />
      ))}
    </>
  );
};
