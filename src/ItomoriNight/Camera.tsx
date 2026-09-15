import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, smootherstep } from "./math";

/**
 * 分镜与相机
 *
 * 四个季节，每个季节一条**完整的 360° 环绕**，各 15 秒，合计 60 秒。
 * 四季的环绕起点方位不同，而且冬天反向绕，所以连起来看不是同一个转台播四遍。
 *
 * ============ 为什么环绕必须边转边升高 ============
 *
 * 这个模型是个"碗": 地形高度场的方向权重让远端环形山脊最高、近端最低。
 * 相机如果在一个固定高度上水平绕圈，绕到模型背面时那道高脊就会挡在
 * 相机和湖之间 —— 后半圈只能看到一堵山墙。
 *
 * 反解出来的条件: 相机在水平半径 R 处、高 H，看向中心时，
 * 视线在半径 r 处的高度约为  H·(1-(R-r)/R) + T·(R-r)/R。
 * R 越小、H 越高越容易越过 r≈37 处的高脊（近机位 + 俯视最稳）。
 * 所以这里让俯角随方位角变化:
 *     近端（相机在 +Z）  → 俯角 0.34（19°）
 *     远端（模型背面）   → 俯角 0.80（46°）
 * 权重用 (1 - cos(az))/2 —— 它在 az=0 取 0、az=π 取 1，
 * 并且在 0 和 2π 处导数为 0，所以环绕回到起点时俯角平滑接回原值，
 * 接缝处不会跳一下。
 *
 * 另外把环形山脊的脊线振幅从 26 收到 21（见 layout.ts），
 * 让最高峰从约 58 降到约 50，否则远端需要的俯角会大到接近正俯视，
 * 模型看起来像一张地图，失去"微缩景观"的立体感。
 *
 * 不使用 useFrame:
 * Remotion 渲染时 frameloop 是 'never'，靠 ThreeCanvas 手动 advance()，
 * useFrame 回调的时序不可控，会导致画面闪烁。
 * 这里走 useLayoutEffect —— 它会在所有 passive effect 之前跑完，
 * 所以一定早于 ThreeCanvas 里那个负责 advance() 的 effect。
 */

export interface CamKey {
  /** 镜头内的进度 0..1 */
  p: number;
  az: number;
  elev: number;
  dist: number;
  target: [number, number, number];
  fov: number;
}

export interface KeyShot {
  kind: "keys";
  id: string;
  from: number;
  to: number;
  label: string;
  keys: CamKey[];
}

export interface OrbitShot {
  kind: "orbit";
  id: string;
  from: number;
  to: number;
  label: string;
  /** 起始方位角（弧度） */
  az0: number;
  /** 环绕方向: 1 = 逆时针 */
  dir: 1 | -1;
  /** 近端（相机在 +Z 一侧）的俯角 */
  elevLow: number;
  /** 远端（模型背面）的俯角 */
  elevHigh: number;
  /** 基准距离 */
  dist: number;
  /** 距离的起伏幅度 —— 环绕时轻微推拉，避免像转台一样机械 */
  distAmp: number;
  target: [number, number, number];
  fov: number;
}

export type Shot = KeyShot | OrbitShot;

/** 每季秒数 × 30fps */
export const FRAMES_PER_SEASON = 450;

const ELEV_LOW = 0.34;
const ELEV_HIGH = 0.8;

/*
 * 距离是按"模型要装得下"定的:
 * 底座 100 单位见方，斜看时对角线 141 单位，
 * 再加上模型 0~50 的高度，fov 44 之下要推到 104~112 才能留出余量。
 * （原来给 78~86，底座直接溢出了画框。）
 */
export const SHOTS: Shot[] = [
  {
    kind: "orbit",
    id: "sp",
    from: 0,
    to: 450,
    label: "春 · 环绕一周",
    // 四季起点错开，切季时不会觉得在原地重复
    az0: -0.35,
    dir: 1,
    elevLow: ELEV_LOW,
    elevHigh: ELEV_HIGH,
    dist: 108,
    distAmp: 8,
    target: [0, 19, 0],
    fov: 44,
  },
  {
    kind: "orbit",
    id: "su",
    from: 450,
    to: 900,
    label: "夏 · 环绕一周",
    az0: 0.55,
    dir: 1,
    elevLow: ELEV_LOW + 0.03,
    elevHigh: ELEV_HIGH - 0.03,
    dist: 112,
    distAmp: 9,
    target: [0, 18, -2],
    fov: 44,
  },
  {
    kind: "orbit",
    id: "au",
    from: 900,
    to: 1350,
    label: "秋 · 环绕一周",
    az0: 1.45,
    dir: 1,
    elevLow: ELEV_LOW - 0.02,
    elevHigh: ELEV_HIGH + 0.02,
    dist: 104,
    distAmp: 8,
    target: [-2, 20, 0],
    fov: 44,
  },
  {
    kind: "orbit",
    id: "wi",
    from: 1350,
    to: 1800,
    label: "冬 · 环绕一周",
    az0: -1.15,
    // 冬天反向绕，四季连起来是"两正两反"的节奏
    dir: -1,
    elevLow: ELEV_LOW + 0.02,
    elevHigh: ELEV_HIGH,
    dist: 110,
    distAmp: 7,
    target: [0, 19, -1],
    fov: 44,
  },
];

/** 全片帧数直接由镜头表推导 —— 改了分镜，时长自动跟着变 */
export const TOTAL_FRAMES = SHOTS[SHOTS.length - 1].to;

/** 当前帧落在第几个机位（0 基） */
export function shotIndexAt(frame: number): number {
  for (let i = 0; i < SHOTS.length; i++) {
    if (frame < SHOTS[i].to) return i;
  }
  return SHOTS.length - 1;
}

export interface CamState {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/** 由 方位角 / 俯角 / 距离 / 注视点 求出相机位置 */
function fromSpherical(
  az: number,
  elev: number,
  dist: number,
  tx: number,
  ty: number,
  tz: number,
  fov: number,
  out: CamState,
): CamState {
  out.target.set(tx, ty, tz);
  const ce = Math.cos(elev);
  out.pos.set(
    tx + dist * ce * Math.sin(az),
    ty + dist * Math.sin(elev),
    tz + dist * ce * Math.cos(az),
  );
  out.fov = fov;
  return out;
}

function evalKeys(keys: CamKey[], p: number, out: CamState): CamState {
  const t = clamp(p, 0, 1);
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].p) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const span = Math.max(1e-6, b.p - a.p);
  const k = smootherstep(0, 1, clamp((t - a.p) / span, 0, 1));

  return fromSpherical(
    a.az + (b.az - a.az) * k,
    a.elev + (b.elev - a.elev) * k,
    a.dist + (b.dist - a.dist) * k,
    a.target[0] + (b.target[0] - a.target[0]) * k,
    a.target[1] + (b.target[1] - a.target[1]) * k,
    a.target[2] + (b.target[2] - a.target[2]) * k,
    a.fov + (b.fov - a.fov) * k,
    out,
  );
}

function evalOrbit(shot: OrbitShot, p: number, out: CamState): CamState {
  const t = clamp(p, 0, 1);
  const az = shot.az0 + shot.dir * Math.PI * 2 * t;

  // 俯角随方位角起伏；(1-cos)/2 首尾连续，接缝处不跳
  const far = (1 - Math.cos(az)) / 2;
  const elev = shot.elevLow + (shot.elevHigh - shot.elevLow) * far;

  // 距离做一次完整正弦起伏，同样首尾连续。
  // 再叠一项"背面拉近": 高俯角下看一块平板模型，画框下方会越过模型看到虚空 ——
  // 拉近能让模型占更大比例。而且拉近的相机在同样俯角下越过山脊的余量更大。
  const dist = shot.dist + shot.distAmp * Math.sin(az - shot.az0) - far * 16;

  return fromSpherical(
    az,
    elev,
    dist,
    shot.target[0],
    shot.target[1],
    shot.target[2],
    shot.fov,
    out,
  );
}

const _camState: CamState = {
  pos: new THREE.Vector3(),
  target: new THREE.Vector3(),
  fov: 44,
};

/** 按帧号求相机 —— 先定位机位，再在机位内部求值 */
export function shotCamera(frame: number, out: CamState): CamState {
  const idx = shotIndexAt(frame);
  const shot = SHOTS[idx];
  // 用 (to - from - 1) 是为了让最后一个帧正好落在 p=1，
  // 否则每个机位的尾帧都会差一点点到不了终点，切点会有微小的位置突跳
  const span = Math.max(1, shot.to - shot.from - 1);
  const local = (frame - shot.from) / span;
  return shot.kind === "orbit"
    ? evalOrbit(shot, local, out)
    : evalKeys(shot.keys, local, out);
}

export const CinematicCamera: React.FC<{ frame: number }> = ({ frame }) => {
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    shotCamera(frame, _camState);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(_camState.pos);
    cam.lookAt(_camState.target);
    if (Math.abs(cam.fov - _camState.fov) > 1e-4) {
      cam.fov = _camState.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
};

/** 开场第一帧的相机，用于 ThreeCanvas 的 camera 初值，避免首帧跳一下 */
export const INITIAL_CAMERA = (() => {
  const s = shotCamera(0, {
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 44,
  });
  return { position: s.pos.toArray() as [number, number, number], fov: s.fov };
})();
