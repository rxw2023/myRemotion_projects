import * as THREE from "three";
import { clamp, fbm2, lerp, mulberry32, ridgedFbm2, smootherstep } from "./math";

/**
 * 系守湖世界布局 + 地形高度场
 *
 * 构图（相机默认在 +Z 方向俯视）:
 *
 *        远端 -Z
 *   ┌──────────────────┐   ← 环形山脊（最高）
 *   │   ╱▔▔╲   御神体   │
 *   │  ╱ 山脊 ╲ ▲ 山丘  │   ← 视觉中心，占据中景偏后
 *   │ │  湖  ≈≈≈≈  │    │   ← 镜面湖，倒映彗星
 *   │ │ ≈≈≈≈≈≈≈≈  │    │
 *   │  小镇 ▫▫▫▫ 码头   │   ← 近景，暖灯最亮
 *   └──────────────────┘   ← 近端山脊最矮，给相机留出视口
 *        近端 +Z
 *
 * 高度场的叠加顺序很关键:
 *   起伏地面 → 环形山脊 → 溪谷下切 → 御神体山丘 → 湖盆下切 → 平台压平 → 边缘归零
 * 湖盆放在山丘之后下切，这样山丘的侧翼会被水切出一道自然的岸线。
 */

// ==================== 尺寸 ====================

/** 底座半边长 —— 整个世界是 [-50,50]² 的正方形 */
export const HALF = 50;
/** 底座下沿高度（模型剖面） */
export const BASE_BOTTOM = -7;
/** 湖面高度 */
export const WATER_Y = 1.2;
/** 地形网格分段数 */
export const TERRAIN_SEG = 184;

// ==================== 主要地物位置 ====================

/*
 * 糸守湖: 正圆形陨石湖。
 *
 * 第一版做成了 rx 15.5 / rz 12.5 的椭圆 —— 方向就错了。
 * 设定上它是 1200 年前彗星碎片砸出来的陨石湖（原型是长野諏訪湖），
 * 俯瞰时最核心的特征是"近乎正圆的水面 + 一圈环形隆起"，
 * 而且湖要够大，是整个湖盆的主体而不是一个小水塘。
 * 所以这里改成单一半径 r，并在 r≈CRATER_R 处叠一圈环形隆起。
 */
export const LAKE = { x: -7, z: 1, r: 17 };

/** 陨石湖环形隆起的半径与高度 */
export const CRATER_R = 21.5;
const CRATER_H = 8.5;
const CRATER_SIGMA = 7.0;

/** 御神体山丘。往外挪了一点，让山脚正好落在湖的远岸而不是泡在水里 */
export const HILL = { x: 14, z: -19, r: 11, h: 23 };

/** 御神体山腰的鸟居 */
export const TORII = { x: 8.6, z: -13.9 };
/** 御神体岩腔（凹进去的岩壁，内部有供奉台与口嚼酒） */
export const ALCOVE = { x: 10.2, z: -15.4 };
/** 山脚下的宫水神社 */
export const SHRINE = { x: 6.8, z: -12.1 };
/** 湖边小码头 */
export const PIER = { x: -3, z: 19 };
/** 町口的便利店 */
export const STORE = { x: -24, z: 29 };
/** 小学（操场 + 旗杆） */
export const SCHOOL = { x: -27, z: 9 };
/** 稻田 */
export const PADDY = { x: -29, z: 25, r: 8 };
/** 细桥（跨溪谷） */
export const BRIDGE = { x: -33.5, z: -7.5 };
/** 碎光落湖的落点 —— 一圈圈涟漪从这里扩散 */
export const RIPPLE_IMPACT = { x: -4, z: 10 };
/** 小镇在湖岸的重心，用来决定湖面上暖灯倒影的位置 */
export const TOWN_SHORE = { x: -8, z: 17 };

// ==================== 溪谷 ====================
/** 从西侧山脊切下来汇入湖里的一道溪谷 */
export const RAVINE: [number, number][] = [
  [-48, -20],
  [-41, -15],
  [-36.5, -10],
  [-31, -4.5],
  [-27.5, 0.5],
  [-25, 3.5],
];

/** 山道（车灯会沿着它走） */
export const ROAD: [number, number][] = [
  [-9, 30],
  [-18, 24],
  [-24, 17],
  [-29, 8],
  [-33.5, -3],
  [-34.2, -7.5], // 过桥
  [-38, -14],
  [-43, -19],
  [-47, -24],
];

// ==================== 平台压平 ====================

interface Pad {
  x: number;
  z: number;
  /** 完全压平的半径 */
  r: number;
  /** 过渡到自然地形的外半径 */
  rSoft: number;
  /** 目标高度；null 表示用中心点的自然高度 */
  y: number | null;
}

/**
 * 这些平台让建筑有平地可站。
 * 不做这一步的话，程序化生成的地面上会出现"半边悬空的房子"。
 */
const PADS: Pad[] = [
  // 小镇主台地（南岸，压在环形隆起的外坡上）。
  // 刻意做小: 台地一大就把陨石湖那圈环形隆起推平了。
  { x: -17, z: 25, r: 7, rSoft: 12, y: null },
  // 小学操场
  { x: SCHOOL.x, z: SCHOOL.z, r: 6, rSoft: 10, y: null },
  // 神社境内
  { x: SHRINE.x, z: SHRINE.z, r: 5, rSoft: 8.5, y: null },
  // 便利店停车场
  { x: STORE.x, z: STORE.z, r: 4.5, rSoft: 8, y: null },
  // 稻田
  { x: PADDY.x, z: PADDY.z, r: 6.5, rSoft: 9, y: null },
  // 御神体山脚的缓冲台地
  { x: 8, z: -9, r: 5.5, rSoft: 9, y: null },
];

// ==================== 工具 ====================

/** 点到折线的最短距离（XZ 平面） */
function distToPolyline(x: number, z: number, pts: [number, number][]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const vx = bx - ax;
    const vz = bz - az;
    const wx = x - ax;
    const wz = z - az;
    const len2 = vx * vx + vz * vz;
    const t = len2 > 0 ? clamp((wx * vx + wz * vz) / len2, 0, 1) : 0;
    const px = ax + vx * t - x;
    const pz = az + vz * t - z;
    const d = Math.sqrt(px * px + pz * pz);
    if (d < best) best = d;
  }
  return best;
}

/** 归一化的方形半径: 1 = 正好在底座边缘 */
export function squareRadius(x: number, z: number): number {
  return Math.max(Math.abs(x), Math.abs(z)) / HALF;
}

/** 湖的径向距离: <1 在水面范围内（正圆，不是椭圆） */
export function lakeDistance(x: number, z: number): number {
  return Math.hypot(x - LAKE.x, z - LAKE.z) / LAKE.r;
}

/**
 * 噪声扰动后的湖岸距离。
 * 扰动幅度刻意压到 ±0.12 —— 陨石湖要"一眼看出是圆的"，
 * 第一版给到 ±0.21，圆度被搅没了，读起来像个不规则水塘。
 */
export function warpedLakeDistance(x: number, z: number): number {
  return lakeDistance(x, z) + (fbm2(x * 0.085, z * 0.085, 3, 6151) - 0.5) * 0.24;
}

/** 湖面掩码: 1 = 湖心，0 = 岸外 */
export function lakeMask(x: number, z: number): number {
  return 1 - smootherstep(0.68, 1.08, warpedLakeDistance(x, z));
}

// ==================== 高度场 ====================

/** 未压平前的自然高度 */
function naturalHeight(x: number, z: number): number {
  const ed = squareRadius(x, z);

  // ---- 1. 起伏地面 ----
  let h = 2.7 + (fbm2(x * 0.032, z * 0.032, 4, 1013) - 0.5) * 3.0;

  // ---- 2. 环形山脊 ----
  // 峰值带落在 ed 0.70~0.78，也就是 |x| 或 |z| ≈ 35~39
  const ring = smootherstep(0.44, 0.70, ed) * (1 - smootherstep(0.78, 0.94, ed));
  if (ring > 0.001) {
    // 方向权重: 远端最高、近端最矮（给相机留视口）、两侧居中
    const nz = z / HALF;
    const nx = x / HALF;
    const farW = smootherstep(0.1, -0.85, nz);
    const nearW = smootherstep(0.15, 0.9, nz);
    const sideW = smootherstep(0.4, 0.95, Math.abs(nx));
    const dirW = clamp(0.46 + 0.62 * farW + 0.3 * sideW - 0.5 * nearW, 0.16, 1.05);

    /*
     * 山脊噪声只用 3 个八度。
     * 加了第 4 个八度（周期约 4.6 单位）之后，陡壁上会生出一排密集的小岩脊，
     * 每个岩脊两个侧面落在不同的量化色阶上，远看就是一排竖向黑斑 ——
     * 第一版远侧崖壁上那些"黑栅栏"就是这么来的。
     * 现在把高频交给顶点色去表现，几何只负责大轮廓。
     */
    const ridge = ridgedFbm2(x * 0.028, z * 0.028, 3, 7717);
    const lumps = fbm2(x * 0.052, z * 0.052, 2, 4421);
    /*
     * 中频起伏: 周期约 11 单位。
     * 少了它，光滑崖壁上的量化色阶会横着切出几条贯穿整面墙的"台阶线"，
     * 看着像楼梯不像山。加一层中频之后色阶被切成不规则的岩块。
     */
    /*
     * 脊线振幅从 26 收到 21。
     *
     * 相机改成完整 360° 环绕之后，绕到模型背面时视线必须越过远侧山脊。
     * 振幅 26 时最高的峰到 58 左右，需要的俯角会大到接近正俯视 ——
     * 模型看起来像一张地图，失去了"微缩景观"的立体感。
     * 收到 21 之后最高峰约 50，环绕在背面用 46° 俯角就能过。
     */
    const detail = fbm2(x * 0.092, z * 0.092, 2, 9319);
    h += ring * dirW * (20 + ridge * 21 + lumps * 3 + detail * 6.5);
  }

  // ---- 3. 溪谷下切 ----
  const rd = distToPolyline(x, z, RAVINE);
  const ravineMask = 1 - smootherstep(1.6, 5.4, rd);
  if (ravineMask > 0.001) {
    // 越靠近湖越浅，最终被湖盆接管
    const depth = 9.5 * ravineMask * smootherstep(0.0, 1.0, rd * 0.25 + 0.35);
    h -= depth;
  }

  // ---- 4. 御神体山丘 ----
  const hdx = x - HILL.x;
  const hdz = z - HILL.z;
  const hd = Math.sqrt(hdx * hdx + hdz * hdz);
  if (hd < HILL.r * 1.35) {
    const t = 1 - smootherstep(0, HILL.r, hd);
    const profile = Math.pow(t, 1.5);
    // 顶部收一个略平的山肩，别做成纯粹的圆锥
    const shoulder = 1 - 0.28 * smootherstep(0.7, 1.0, t);
    h += profile * HILL.h * shoulder;
    // 山脊上的乱石起伏
    h += profile * ridgedFbm2(x * 0.11, z * 0.11, 3, 3301) * 3.4;
  }

  // ---- 5. 湖盆下切 ----
  const lakeMaskV = lakeMask(x, z);
  if (lakeMaskV > 0.001) {
    /*
     * 湖底深度直接决定"看起来有多深"。
     * -4.4 时水面之下 depth 只有 5.6，而 lakeMask 在标称半径处已经衰减到 0.1，
     * 结果是深水色只覆盖 r<11.6，湖的大部分都落在浅滩段里 —— 读起来像一滩浅水。
     * 加深到 -4.9 之后深蓝占了半径的九成。
     */
    const bed = -4.9 + fbm2(x * 0.14, z * 0.14, 2, 8803) * 1.6;
    h = lerp(h, bed, lakeMaskV);
  }

  // ---- 6. 陨石湖的环形隆起 ----
  /*
   * 这是"陨石湖"能不能读出来的关键: 水面之外要有明显的一圈环形高地。
   * 近端（相机那一侧）刻意压到 38% ——
   * 完整的环形会把湖的近岸挡死，从 12~26° 的俯角根本看不进水面，
   * 湖就只剩远侧一条弧线了。
   */
  const dLake = Math.hypot(x - LAKE.x, z - LAKE.z);
  if (dLake < CRATER_R + CRATER_SIGMA * 2.4) {
    const rimFacing = (z - LAKE.z) / Math.max(1, dLake);
    const rimDirW = 1 - 0.62 * smootherstep(0.2, 0.95, rimFacing);
    const bump = Math.exp(-Math.pow((dLake - CRATER_R) / CRATER_SIGMA, 2));
    h += bump * CRATER_H * rimDirW;
  }

  return h;
}

/** 各平台的目标高度，在自然地形上采样一次即可 */
let padHeights: number[] | null = null;
function getPadHeights(): number[] {
  if (!padHeights) {
    padHeights = PADS.map((p) => p.y ?? naturalHeight(p.x, p.z));
  }
  return padHeights;
}

/** 最终地形高度 */
export function terrainHeight(x: number, z: number): number {
  let h = naturalHeight(x, z);

  // ---- 6. 平台压平 ----
  const ys = getPadHeights();
  for (let i = 0; i < PADS.length; i++) {
    const p = PADS[i];
    const dx = x - p.x;
    const dz = z - p.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < p.rSoft) {
      /*
       * 乘上 (1 - 湖面掩码)。
       * 小镇、小学这两个平台离湖岸只有 5~6 单位，rSoft 会伸进湖里，
       * 不挡的话会在水面上压出一圈诡异的平台阶。
       */
      const w = (1 - smootherstep(p.r, p.rSoft, d)) * (1 - lakeMask(x, z));
      h = lerp(h, ys[i], w);
    }
  }

  // ---- 7. 边界归零 ----
  // 让地形在底座边缘收成 y=0 的平地，模型才有一个干净的方形切口
  const ed = squareRadius(x, z);
  const edgeFade = 1 - smootherstep(0.9, 1.0, ed);
  if (edgeFade < 1) h *= edgeFade;

  return h;
}

/** 坡度的近似值（0 = 水平，1 = 垂直） */
export function terrainSlope(x: number, z: number, eps = 0.9): number {
  const hL = terrainHeight(x - eps, z);
  const hR = terrainHeight(x + eps, z);
  const hD = terrainHeight(x, z - eps);
  const hU = terrainHeight(x, z + eps);
  const gx = (hR - hL) / (2 * eps);
  const gz = (hU - hD) / (2 * eps);
  const g = Math.sqrt(gx * gx + gz * gz);
  return g / (1 + g);
}

/** 地面法线 */
export function terrainNormal(x: number, z: number, eps = 0.9): THREE.Vector3 {
  const hL = terrainHeight(x - eps, z);
  const hR = terrainHeight(x + eps, z);
  const hD = terrainHeight(x, z - eps);
  const hU = terrainHeight(x, z + eps);
  return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
}

/**
 * 森林覆盖度 [0,1]
 * 山脊上长得最密，湖里与镇上不长。
 * hIn / slopeIn 允许调用方把已经算过的高度和坡度传进来，省掉重复的高度场采样。
 */
export function forestCover(
  x: number,
  z: number,
  hIn?: number,
  slopeIn?: number,
): number {
  const ed = squareRadius(x, z);
  const h = hIn ?? terrainHeight(x, z);
  if (h < WATER_Y + 0.4) return 0;
  const slope = slopeIn ?? terrainSlope(x, z);
  /*
   * 坡度上限收到 0.70、衰减起点收到 0.44。
   *
   * 之前为了"山脊别秃"放宽到 0.78 —— 结果陡岩面上也长满了树，
   * 整圈环形山脊被树冠糊成一整块色块（春天尤其明显: 一片粉把湖都埋了）。
   * 真实的陡岩面挂不住林，留出裸岩反而让山脊的形体读得出来。
   */
  if (slope > 0.7) return 0;

  // 基础覆盖: 越高越密，但山脊线附近留出裸岩
  let cover = smootherstep(2.0, 8.0, h) * 0.85 + 0.15;
  cover *= 1 - smootherstep(0.44, 0.74, slope);

  // 大尺度的林班斑块，避免均匀铺满
  const patch = fbm2(x * 0.045, z * 0.045, 3, 2207);
  cover *= smootherstep(0.28, 0.56, patch);

  // 靠近底座边缘的平地不长
  cover *= smootherstep(0.2, 0.42, ed) * (1 - smootherstep(0.86, 0.95, ed));

  // 镇上 / 稻田里不长 —— 用平台圆盘挖空
  const clearings: [number, number, number][] = [
    [-17, 25, 14],
    [SCHOOL.x, SCHOOL.z, 10],
    [SHRINE.x, SHRINE.z, 8],
    [STORE.x, STORE.z, 7],
    [PADDY.x, PADDY.z, 10],
  ];
  for (const [cx, cz, cr] of clearings) {
    const d = Math.hypot(x - cx, z - cz);
    cover *= smootherstep(cr * 0.65, cr * 1.15, d);
  }

  // 湖面留白
  cover *= smootherstep(0.95, 1.25, warpedLakeDistance(x, z));

  // 御神体山顶保持裸岩
  const hillD = Math.hypot(x - HILL.x, z - HILL.z);
  cover *= smootherstep(HILL.r * 0.32, HILL.r * 0.62, hillD);

  return clamp(cover, 0, 1);
}

/** 道路的横向距离，用于把路面画进地形贴图 / 铺路面 */
export function roadDistance(x: number, z: number): number {
  return distToPolyline(x, z, ROAD);
}

/** 地表着色 —— 直接烘进地形顶点色 */
export function terrainColor(
  x: number,
  z: number,
  h: number,
  slope: number,
  cover: number,
  palette: {
    grassLow: string;
    grassMid: string;
    forestFloor: string;
    forestFloorDeep: string;
    rock: string;
    rockDark: string;
    moss: string;
    shore: string;
    shoreWet: string;
    pale: string;
    snow: string;
    lakeBedMud: string;
    lakeBedDeep: string;
    shoreShallow: string;
    /** 地面整体覆雪量 0..1（冬季用） */
    groundSnow: number;
  },
  /** 复用的输出对象，避免逐顶点 new Color */
  out?: THREE.Color,
): THREE.Color {
  const c = out ?? new THREE.Color();

  /*
   * 噪声坐标必须带上高度 h。
   * 只用 (x, z) 的话，在近乎垂直的崖壁上 x/z 的跨度趋近于 0 而 y 变化几十个单位，
   * 噪声就会被拉成一排竖向条纹（第一版远侧崖壁上那些"黑栅栏"就是这么来的）。
   */
  const nx = x + h * 0.19;
  const nz = z + h * 0.13;

  /*
   * 只有真的落在湖里的低地才按"水下"上色。
   *
   * 这里必须带 lakeMask 判断: 外围那圈平地被 edgeFade 强行压到 y=0，
   * 本来就低于 WATER_Y=1.2 —— 不加这个条件，整个底座边缘都会被涂成
   * 亮青的浅滩色，在模型四周显出一圈"发光护城河"。
   * 这个 bug 一直存在，只是以前水下用的是暗泥色所以看不出来。
   */
  if (h < WATER_Y + 0.15 && lakeMask(x, z) > 0.02) {
    /*
     * 水下分三段: 极浅的亮青 → 湖床 → 深湖底。
     * 最靠岸那一圈亮青是日式动画湖面的招牌特征 ——
     * 水浅处透出沙石，形成一圈明显比深水亮得多的环。
     * 水面在岸边是半透明的，所以这一圈真的会透出来。
     */
    const t = clamp((WATER_Y - h) / 3.4, 0, 1);
    c.set(palette.shoreShallow);
    c.lerp(new THREE.Color(palette.lakeBedMud), smootherstep(0.0, 0.26, t));
    c.lerp(new THREE.Color(palette.lakeBedDeep), smootherstep(0.28, 1.0, t));
    return c;
  }

  // ---- 湖岸碎石带 ----
  const shoreT = 1 - smootherstep(WATER_Y + 0.15, WATER_Y + 1.5, h);

  // ---- 基础草/林地 ----
  c.set(palette.grassMid);
  c.lerp(new THREE.Color(palette.grassLow), smootherstep(2.2, 3.4, h));
  c.lerp(new THREE.Color(palette.forestFloor), clamp(cover, 0, 1) * 0.8);
  c.lerp(new THREE.Color(palette.forestFloorDeep), clamp(cover * cover, 0, 1) * 0.5);

  // ---- 陡坡露岩 ----
  const rockT = smootherstep(0.34, 0.66, slope);
  const rock = new THREE.Color(palette.rock);
  rock.lerp(new THREE.Color(palette.rockDark), fbm2(nx * 0.3, nz * 0.3, 2, 991) * 0.7);
  c.lerp(rock, rockT);

  // ---- 苔藓: 岩壁缓处 ----
  const mossT =
    rockT * (1 - rockT) * 4 * smootherstep(0.35, 0.65, fbm2(nx * 0.16, nz * 0.16, 2, 555));
  c.lerp(new THREE.Color(palette.moss), mossT * 0.6);

  /*
   * 高处覆雪 / 云海压顶。
   * 阈值必须高过环形山的主体高度，而且混入比例不能大 ——
   * 第一版 19~34 混 0.8，整圈山被刷成雪白；
   * 改成 34~45 混 0.55 之后，远侧崖壁的上半段仍然平得像一块洗淡的板子。
   */
  const snowT = smootherstep(37, 48, h);
  const pale = new THREE.Color(palette.pale);
  pale.lerp(new THREE.Color(palette.snow), smootherstep(43, 52, h));
  c.lerp(pale, snowT * 0.38);

  // ---- 岸线 ----
  c.lerp(new THREE.Color(palette.shore), shoreT * 0.7);
  c.lerp(new THREE.Color(palette.shoreWet), shoreT * shoreT * 0.35);

  /*
   * 冬季整体覆雪。
   * 光靠上面那条"高处才有雪"的高度阈值做不出冬天 ——
   * 冬天地面是整片盖住的，只是陡坡挂不住雪，所以按坡度削减。
   */
  if (palette.groundSnow > 0.001) {
    const hold = 1 - smootherstep(0.3, 0.66, slope);
    c.lerp(new THREE.Color(palette.snow), palette.groundSnow * hold);
  }

  return c;
}

// ==================== 地表一次性采样 ====================

export interface SurfaceShape {
  h: number;
  slope: number;
  cover: number;
}

/**
 * 只算"形"（高度 / 坡度 / 植被覆盖度），不算颜色。
 *
 * 四季的地形形状完全一样，只有顶点色不一样 ——
 * 所以建几何时只调这个，把颜色留给季节变化时单独重算。
 * 这样建几何的 useMemo 完全不依赖季节，切季不会重建 3.4 万顶点的地形。
 */
export function sampleSurfaceShape(x: number, z: number, eps = 0.9): SurfaceShape {
  const h = terrainHeight(x, z);
  const hL = terrainHeight(x - eps, z);
  const hR = terrainHeight(x + eps, z);
  const hD = terrainHeight(x, z - eps);
  const hU = terrainHeight(x, z + eps);
  const gx = (hR - hL) / (2 * eps);
  const gz = (hU - hD) / (2 * eps);
  const g = Math.sqrt(gx * gx + gz * gz);
  const slope = g / (1 + g);
  return { h, slope, cover: forestCover(x, z, h, slope) };
}

export interface SurfaceSample extends SurfaceShape {
  color: THREE.Color;
}

/**
 * 形 + 色一起算（调试或一次性生成时用）。
 * 生成地形网格时不要用它 —— 顶点色是随季节重算的，这里算的会被丢掉。
 */
export function sampleSurface(
  x: number,
  z: number,
  palette: Parameters<typeof terrainColor>[5],
  eps = 0.9,
): SurfaceSample {
  const s = sampleSurfaceShape(x, z, eps);
  return { ...s, color: terrainColor(x, z, s.h, s.slope, s.cover, palette) };
}

// ==================== 摆放工具 ====================

export interface PlacementOptions {
  /** 采样区域半径 */
  radius: number;
  /** 采样中心 */
  cx: number;
  cz: number;
  /** 数量 */
  count: number;
  /** 种子 */
  seed: number;
  /** 只在这些位置放（返回 0..1 的权重，<=0 跳过） */
  accept: (x: number, z: number, rand: () => number) => number;
}

export interface Placed {
  x: number;
  z: number;
  y: number;
  /** 0..1 的接受权重 */
  w: number;
  rand: () => number;
}

/**
 * 带拒绝采样的散布。
 * 用确定性 PRNG，所以每次渲染得到的布局完全一致。
 */
export function scatter(opts: PlacementOptions): Placed[] {
  const rand = mulberry32(opts.seed);
  const out: Placed[] = [];
  const maxTries = opts.count * 14;
  for (let i = 0; i < maxTries && out.length < opts.count; i++) {
    // 在方形区域内均匀撒点，再靠 accept 剪裁
    const x = opts.cx + (rand() * 2 - 1) * opts.radius;
    const z = opts.cz + (rand() * 2 - 1) * opts.radius;
    const w = opts.accept(x, z, rand);
    if (w <= 0) continue;
    if (rand() > w) continue;
    out.push({ x, z, y: terrainHeight(x, z), w, rand: mulberry32(Math.floor(rand() * 0xffffffff)) });
  }
  return out;
}
