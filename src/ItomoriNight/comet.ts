import * as THREE from "three";
import { clamp, smoothstep } from "./math";

/**
 * 彗星总开关。
 *
 * 关掉时: 天空不画彗星、湖面不做彗星镜面反射，
 * 但彗星轨迹、双尾、碎光这些实现全部保留 ——
 * 想再打开只要把它改成 true。
 *
 * 注意: 关掉之后全片就没有"随时间推进的大尺度事件"了，
 * 剩下的动态只有涟漪、萤火、窗灯明灭、雾的流动、烛火跳动 ——
 * 也就是说画面会变成一套纯氛围镜头。
 */
export const SHOW_COMET = false;

/**
 * 彗星轨迹
 *
 * 天文学上彗尾总是背向太阳，这里为了画面服务:
 * 尾巴始终拖在运动方向的后方，随着时间慢慢从一条分裂成两条。
 *
 * 位置定得很远（距原点 ~500），这样:
 *   1. 彗星在画面上几乎不产生透视位移 —— 像"挂在天上"的一道光
 *   2. 不需要跟着相机移动，深度排序也简单
 */

/**
 * 彗星起点/终点 —— 一条**自上而下**的坠落轨迹。
 *
 * 这两个点是从相机反推出来的:
 *   开场机位俯角 8.6°、垂直半视角 24°，所以画面上缘只到地平线以上约 15°。
 *   也就是说这颗彗星能走的仰角范围只有 0~15°，"从上到下"必须在这个带里走完。
 *   末段又不能压到 4° 以下 —— 远侧山脊最高的峰在地平线以上约 2.7°，
 *   再低就被山挡住了（黄昏的山脊是暗的，彗星一沉进去就看不见了）。
 *
 * 所以: 仰角 14.5° → 4°，同时方位角从 -34° 扫到 +22°。
 * 合起来约 57° 的角行程，比原来（33°）长了七成 —— 这是"速度快一点"的一半来源。
 */
const FROM = new THREE.Vector3(-204, 225, -519);
const TO = new THREE.Vector3(348, 94, -314);

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/** 弧线: 在直线插值上叠一条轻微的弯曲，免得轨迹是死板的一条直线 */
function rawPos(e: number, out: THREE.Vector3): THREE.Vector3 {
  out.lerpVectors(FROM, TO, e);
  const arc = Math.sin(e * Math.PI);
  out.y -= arc * 12;
  out.z += arc * 16;
  return out;
}

export interface CometState {
  /** 彗核世界坐标 */
  pos: THREE.Vector3;
  /** 运动方向（单位向量） */
  dir: THREE.Vector3;
  /** 0..1 尾巴分裂程度 */
  split: number;
  /** 亮度呼吸 */
  glow: number;
}

/**
 * @param p 整片视频的归一化进度 0..1
 */
export function cometState(p: number): CometState {
  const t = clamp(p, 0, 1);
  /*
   * 速度:
   *   1. 角行程从 33° 加到 57°（见上方 FROM/TO 的注释）
   *   2. 时间曲线用 pow(t/0.88, 0.95) —— 比线性略快，而且提前走完:
   *      到全片 88% 处轨迹就走完了，最后那一小段彗星停在低空，
   *      配合完全张开的两条尾巴收尾。
   * 两项合起来，中段看起来比原来快约两倍。
   */
  const e = Math.pow(clamp(t / 0.88, 0, 1), 0.95);

  const pos = rawPos(e, new THREE.Vector3());
  rawPos(clamp(e - 0.006, 0, 1), _a);
  rawPos(clamp(e + 0.006, 0, 1), _b);
  const dir = _b.sub(_a).normalize().clone();

  // 分裂: 中段开始，末段完全张开
  const split = smoothstep(0.16, 0.8, t);
  // 极缓的亮度呼吸
  const glow = 0.86 + 0.14 * Math.sin(t * 21.0) * Math.sin(t * 6.3);

  return { pos, dir, split, glow };
}

/** 彗尾在水平面上的方位（湖面倒影用） */
export function cometAzimuth(state: CometState, out: THREE.Vector2): THREE.Vector2 {
  return out.set(state.pos.x, state.pos.z).normalize();
}

/**
 * 彗星在画面里的"高度感" —— 越接近地平线，湖面倒影越弱。
 * 上限压到 1.0: 原来放到 1.4，等于把湖面倒影整体提亮四成，
 * 和 #c4eef8 这种接近白的倒影色一乘，湖心直接过曝。
 */
export function cometHorizonFactor(state: CometState): number {
  return clamp(state.pos.y / 90, 0.35, 1.0);
}

/**
 * 尾迹的碎光: 沿彗尾分布、缓慢向下飘落的小亮点。
 * 位置在"彗尾局部坐标系"里给出，由调用方乘上彗星的世界变换。
 */
export const COMET_SPARK_COUNT = 260;

export interface CometSparkSeed {
  /** 沿尾巴的距离参数 1..2.4（1 = 彗核附近） */
  along: number;
  /** 横向偏移 -1..1 */
  lateral: number;
  /** 竖向偏移 -1..1 */
  vertical: number;
  /** 掉落相位 */
  phase: number;
  /** 掉落速度 */
  speed: number;
  size: number;
}

export function buildCometSparkSeeds(rand: () => number): CometSparkSeed[] {
  const out: CometSparkSeed[] = [];
  for (let i = 0; i < COMET_SPARK_COUNT; i++) {
    out.push({
      along: 0.06 + Math.pow(rand(), 1.5) * 1.35,
      lateral: (rand() * 2 - 1) * (0.35 + rand() * 0.75),
      vertical: (rand() * 2 - 1) * (0.35 + rand() * 0.75),
      phase: rand(),
      speed: 0.35 + rand() * 0.85,
      size: 0.8 + rand() * 1.9,
    });
  }
  return out;
}
