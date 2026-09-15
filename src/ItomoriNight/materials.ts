import * as THREE from "three";
import { INK, SHRINE } from "./palette";
import type { SeasonPreset } from "./seasons";

/**
 * 三渲二（cel / toon）材质
 *
 * 为什么不用 MeshToonMaterial + onBeforeCompile:
 *   onBeforeCompile 注入依赖 three 内部的 shader chunk 名字，
 *   three 升个小版本就可能改名，整个画面直接黑掉。
 *   这里自己写完整 shader，只依赖 modelMatrix / normalMatrix /
 *   cameraPosition 这几个十年不变的 built-in uniform，稳得多。
 *
 * 分层结构（从下往上）:
 *   1. ambient     — 极暗的冷色底，保证暗部不是死黑
 *   2. key  月光   — 冷蓝白，量化成 N 档 → 这就是三渲二的"硬边"
 *   3. fill 补光   — 更暗的冷色，从反侧压一层
 *   4. warm points — 烛火/石灯笼/小镇灯，3 盏，带距离衰减和量化
 *   5. rim         — 菲涅尔边缘，把背光侧收成一条亮边
 *   6. haze        — 按离相机距离混向雾霭色，制造纵深层次
 *   7. outline     — 由独立的反向壳材质画（见 createOutlineMaterial）
 */

// ==================== 全局共享的暖点光源 ====================
/**
 * 三盏暖光的 uniform 对象由所有材质共享引用。
 * 这样每帧只需要改一处，整个场景的暖光就同步了。
 */
export const SHARED_WARM = {
  uLightPos: {
    value: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
  },
  uLightColor: {
    value: [
      new THREE.Color(SHRINE.candle),
      new THREE.Color(SHRINE.lantern),
      new THREE.Color("#ff9a4a"),
    ],
  },
  uLightPower: { value: [0, 0, 0] },
};

const TOON_VERT = /* glsl */ `
attribute vec3 aTint;
varying vec3 vWorld;
varying vec3 vNrm;
varying vec3 vTint;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  // 全场景都是均匀缩放，mat3(modelMatrix) 足够当法线矩阵用
  vNrm = normalize(mat3(modelMatrix) * normal);
  vTint = aTint;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const TOON_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uBase;
uniform vec3 uShadeMul;
/** 暗部地板色 —— 保证背光面沉下去但永远不死黑 */
uniform vec3 uShadeAdd;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uAmbient;
uniform float uBands;
uniform float uFillBands;
uniform vec3 uRimColor;
uniform float uRimStart;
uniform float uRimStrength;
uniform vec3 uEmissive;
uniform float uOpacity;
uniform vec3 uLightPos[3];
uniform vec3 uLightColor[3];
uniform float uLightPower[3];
uniform vec3 uHazeColor;
uniform float uHazeNear;
uniform float uHazeFar;
uniform float uHazeStrength;
/** 高处的雾霭衰减系数: 1 = 越高越清晰, 0 = 不分高度 */
uniform float uHazeHeightBias;

varying vec3 vWorld;
varying vec3 vNrm;
varying vec3 vTint;

void main() {
  vec3 N = normalize(vNrm);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 albedo = uBase * vTint;

  /*
   * 三渲二的核心不是"把颜色乘暗"，而是暗部换一个色相。
   * 亮部 = 固有色 x 月光色；暗部 = 固有色 x 冷蓝乘子 + 一点地板色。
   * 这样背光的松林会变成青蓝色而不是黑块，才像日式动画的夜景。
   */
  vec3 litCol = albedo * uKeyColor;
  vec3 shadeCol = albedo * uShadeMul + uShadeAdd * vTint;

  /*
   * 量化成 uBands 档 —— 硬边就是这么来的。
   * 用 clamp(ndl,0,1) 而不是 ndl*0.5+0.5:
   * 背光面必须真的掉到最暗档，否则夜景会被抬成一片均匀的亮灰。
   */
  float ndl = dot(N, normalize(uKeyDir));
  float band = floor(clamp(ndl, 0.0, 1.0) * uBands + 0.5) / uBands;
  vec3 col = mix(shadeCol, litCol, band);

  // ---- 天光: 从上方压下来的冷色补光，让朝上的面不至于和侧壁一样黑 ----
  float up = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  float upBand = floor(up * uFillBands + 0.5) / uFillBands;
  col += albedo * uFillColor * upBand;
  col += albedo * uAmbient;

  // ---- 暖点光源（烛火 / 石灯笼 / 小镇灯火）----
  for (int i = 0; i < 3; i++) {
    if (uLightPower[i] <= 0.0) continue;
    vec3 d = uLightPos[i] - vWorld;
    float dist = length(d);
    float att = uLightPower[i] / (1.0 + dist * dist * 0.045);
    float nl = clamp(dot(N, d / max(dist, 0.001)), 0.0, 1.0);
    // 暖光也量化，避免出现与整体画风不符的柔和高光渐变
    float q = floor(nl * 3.0 + 0.5) / 3.0;
    col += albedo * uLightColor[i] * att * (0.25 + 0.75 * q);
  }

  // ---- 菲涅尔轮廓边 ----
  float fres = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  col = mix(col, uRimColor, smoothstep(uRimStart, 1.0, fres) * uRimStrength);

  // ---- 自发光（窗口 / 灯箱 / 烛芯）----
  col += uEmissive;

  // ---- 距离雾霭: 远山沉入雾里，制造层次 ----
  float dc = length(cameraPosition - vWorld);
  float hz = smoothstep(uHazeNear, uHazeFar, dc) * uHazeStrength;
  if (uHazeHeightBias > 0.0) {
    hz *= mix(1.0, 0.3, clamp((vWorld.y - 3.0) / 32.0, 0.0, 1.0) * uHazeHeightBias);
  }
  col = mix(col, uHazeColor, clamp(hz, 0.0, 1.0));

  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export interface ToonOpts {
  /** 固有色，默认白 —— 颜色一般走顶点色 aTint */
  base?: THREE.ColorRepresentation;
  /** 暗部乘子，默认偏冷的蓝灰 */
  shadeMul?: THREE.ColorRepresentation;
  /** 暗部地板色，避免背光面死黑 */
  shadeAdd?: THREE.ColorRepresentation;
  keyDir?: [number, number, number];
  keyColor?: THREE.ColorRepresentation;
  /** 月光强度 —— 夜景里主光必须显著大于 1，否则固有色一乘就沉底 */
  keyIntensity?: number;
  fillDir?: [number, number, number];
  fillColor?: THREE.ColorRepresentation;
  fillIntensity?: number;
  ambient?: THREE.ColorRepresentation;
  bands?: number;
  fillBands?: number;
  rimColor?: THREE.ColorRepresentation;
  rimStart?: number;
  rimStrength?: number;
  emissive?: THREE.ColorRepresentation;
  opacity?: number;
  hazeColor?: THREE.ColorRepresentation;
  hazeNear?: number;
  hazeFar?: number;
  hazeStrength?: number;
  hazeHeightBias?: number;
}

/**
 * 主光（keyDir / keyColor / keyIntensity / shadeMul / shadeAdd / ambient /
 * fillColor / rimColor）以及总增益 lightGain 全部来自季节配置。
 *
 * 季节感有一半来自光的角度和色温，而不是来自把树叶换个颜色 ——
 * 所以四季的 keyDir 差别给得很大（春是斜上方柔白光、秋是最低角的琥珀光、
 * 冬是冷蓝高对比），阴影色相也跟着换（春紫 / 夏冷紫 / 秋暖褐 / 冬蓝紫）。
 */
const FILL_DIR: [number, number, number] = [0.62, 0.5, -0.6];

export function createToonMaterial(
  season: SeasonPreset,
  opts: ToonOpts = {},
): THREE.ShaderMaterial {
  const L = season.light;
  const keyColor = new THREE.Color(opts.keyColor ?? L.keyColor).multiplyScalar(
    (opts.keyIntensity ?? L.keyIntensity) * season.lightGain,
  );
  const fillColor = new THREE.Color(opts.fillColor ?? L.fillColor).multiplyScalar(
    opts.fillIntensity ?? 1,
  );

  const mat = new THREE.ShaderMaterial({
    vertexShader: TOON_VERT,
    fragmentShader: TOON_FRAG,
    uniforms: {
      uBase: { value: new THREE.Color(opts.base ?? 0xffffff) },
      uShadeMul: { value: new THREE.Color(opts.shadeMul ?? L.shadeMul) },
      uShadeAdd: { value: new THREE.Color(opts.shadeAdd ?? L.shadeAdd) },
      uKeyDir: { value: new THREE.Vector3(...(opts.keyDir ?? L.keyDir)).normalize() },
      uKeyColor: { value: keyColor },
      uFillDir: { value: new THREE.Vector3(...(opts.fillDir ?? FILL_DIR)).normalize() },
      uFillColor: { value: fillColor },
      uAmbient: { value: new THREE.Color(opts.ambient ?? L.ambient) },
      uBands: { value: opts.bands ?? 3 },
      uFillBands: { value: opts.fillBands ?? 2 },
      uRimColor: { value: new THREE.Color(opts.rimColor ?? L.rimColor) },
      uRimStart: { value: opts.rimStart ?? 0.6 },
      uRimStrength: { value: opts.rimStrength ?? 0.3 },
      uEmissive: { value: new THREE.Color(opts.emissive ?? 0x000000) },
      uOpacity: { value: opts.opacity ?? 1 },
      uHazeColor: { value: new THREE.Color(opts.hazeColor ?? season.sky.haze) },
      uHazeNear: { value: opts.hazeNear ?? 55 },
      uHazeFar: { value: opts.hazeFar ?? 165 },
      uHazeStrength: { value: opts.hazeStrength ?? 0.55 },
      uHazeHeightBias: { value: opts.hazeHeightBias ?? 0 },
      // 共享引用 —— 不要 clone
      uLightPos: SHARED_WARM.uLightPos,
      uLightColor: SHARED_WARM.uLightColor,
      uLightPower: SHARED_WARM.uLightPower,
    },
  });
  if ((opts.opacity ?? 1) < 1) {
    mat.transparent = true;
    mat.depthWrite = false;
  }
  return mat;
}

// ==================== 反向壳描边 ====================

const OUTLINE_VERT = /* glsl */ `
uniform float uThickness;
void main() {
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // 乘以 -mv.z 让描边在屏幕上粗细恒定（不随远近变化）
  mv.xyz += n * uThickness * (-mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  gl_FragColor = vec4(uColor, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * 轮廓线材质。
 * 用法: 同一个 geometry 再渲染一遍，side = BackSide，沿法线外扩。
 * thickness 是"每单位深度外扩多少世界单位"，所以是屏幕等宽的。
 *   相机距离 ~85 时，0.0035 大约对应 1px 左右。
 */
export function createOutlineMaterial(
  thickness = 0.0035,
  color: THREE.ColorRepresentation = INK.line,
  opacity = 1,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    side: THREE.BackSide,
  });
}

// ==================== 叠加发光 ====================

const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
/** 光斑的收束程度: 越大越紧 */
uniform float uFalloff;
varying vec2 vUv;

void main() {
  vec2 d = vUv - 0.5;
  float r = length(d) * 2.0;
  float a = pow(clamp(1.0 - r, 0.0, 1.0), uFalloff);
  gl_FragColor = vec4(uColor * uIntensity * a, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** 加色光斑 —— 用于烛火、灯箱、光晕、萤火 */
export function createGlowMaterial(
  color: THREE.ColorRepresentation,
  intensity = 1,
  falloff = 2.6,
  opacity = 1,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uFalloff: { value: falloff },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// ==================== 球状软光晕 ====================

const SOFT_GLOW_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNrm;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNrm = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SOFT_GLOW_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
/** 越大中心越紧 */
uniform float uPower;
varying vec3 vWorld;
varying vec3 vNrm;

void main() {
  vec3 N = normalize(vNrm);
  vec3 V = normalize(cameraPosition - vWorld);
  float facing = clamp(dot(N, V), 0.0, 1.0);
  float a = pow(facing, uPower);
  gl_FragColor = vec4(uColor * uIntensity * a, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * 球状软光晕 —— 不依赖朝向，任何角度都是一团柔和的光。
 *
 * 比 billboard 光斑好用: 不需要每帧算朝向相机，
 * 而且 dot(N,V) 天然给出中心亮、边缘淡的径向衰减。
 * 用途: 彗核、烛火、石灯笼、便利店灯箱。
 */
export function createSoftGlowMaterial(
  color: THREE.ColorRepresentation,
  intensity = 1,
  power = 2.4,
  opacity = 1,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SOFT_GLOW_VERT,
    fragmentShader: SOFT_GLOW_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ==================== 场景公用材质单例 ====================

export interface SceneMaterials {
  /** 地形 / 山体：雾霭更强，强调纵深 */
  terrain: THREE.ShaderMaterial;
  /** 岩石：更硬的分档 */
  rock: THREE.ShaderMaterial;
  /** 木构建筑、鸟居、神社 */
  wood: THREE.ShaderMaterial;
  /** 石：灯籠、石阶、桥 */
  stone: THREE.ShaderMaterial;
  /** 植被：松林、苔 */
  foliage: THREE.ShaderMaterial;
  /** 通用杂项（小镇、道具） */
  misc: THREE.ShaderMaterial;
  /**
   * 底座专用。
   * 底座侧面是一整面大平面，用通用石材质的话菲涅尔轮廓会把它整面刷成淡蓝，
   * 在画面左缘亮成一条惨白的竖带。
   */
  base: THREE.ShaderMaterial;
  /** 山体轮廓 */
  outlineTerrain: THREE.ShaderMaterial;
  /** 建筑轮廓（细一点） */
  outlineFine: THREE.ShaderMaterial;
}

export function createSceneMaterials(season: SeasonPreset): SceneMaterials {
  return {
    terrain: createToonMaterial(season, {
      // 4 档而不是 3 档: 山壁的法线变化剧烈，档少了大面积翻色更明显
      bands: 4,
      // 黄昏的霾要收一点: 0.6 会把远山整片冲成暖紫，失掉纵深
      hazeStrength: 0.44,
      hazeHeightBias: 0.85,
      hazeNear: 60,
      hazeFar: 230,
      /*
       * 菲涅尔轮廓必须收窄。
       * rimStart 0.58 时，所有侧向对着镜头的山壁（fres→1）都会被大面积混向 rimColor，
       * 整圈山因此泛成灰白。抬到 0.70 之后只剩真正掠射的轮廓线上有光。
       *
       * 强度从 0.34 收到 0.24: 近处的山坡在掠射角下会被边光**整片**铺亮 ——
       * 秋/春那种亮色 rimColor 一配，前景山坡就变成一大块发光的金色，
       * 把湖和小镇全压住。边光只该是轮廓上的一线，不该是一整片。
       */
      rimStrength: 0.24,
      rimStart: 0.72,
      keyIntensity: 1.5,
    }),
    rock: createToonMaterial(season, {
      bands: 3,
      hazeStrength: 0.42,
      hazeHeightBias: 0.6,
      rimStrength: 0.3,
      rimStart: 0.68,
      keyIntensity: 2.0,
    }),
    wood: createToonMaterial(season, {
      bands: 3,
      hazeStrength: 0.34,
      hazeHeightBias: 0.4,
      rimStrength: 0.28,
      rimStart: 0.68,
      keyIntensity: 2.1,
    }),
    stone: createToonMaterial(season, {
      bands: 3,
      hazeStrength: 0.4,
      hazeHeightBias: 0.5,
      rimStrength: 0.28,
      rimStart: 0.68,
      keyIntensity: 2.0,
    }),
    foliage: createToonMaterial(season, {
      // 3 档而不是 2 档: 阔叶树的树冠是一堆多面体团，
      // 2 档会在每个面上做出高对比的平色块，读起来像水晶而不是叶子
      bands: 3,
      fillBands: 2,
      hazeStrength: 0.44,
      hazeHeightBias: 0.55,
      rimStrength: 0.22,
      rimStart: 0.74,
      /*
       * 植被的主光单独收一档（1.3，其他材质在 1.5~2.1）。
       * 总光量上去之后绿色/粉色是最先过曝的 ——
       * 树冠会变成一片没有层次的亮块。
       */
      keyIntensity: 1.3,
    }),
    misc: createToonMaterial(season, {
      bands: 3,
      hazeStrength: 0.36,
      hazeHeightBias: 0.4,
      rimStrength: 0.28,
      rimStart: 0.7,
      keyIntensity: 2.0,
    }),
    /*
     * 描边粗细是按 1920 宽、相机距离 ~98 标定的:
     * 该距离上画面宽 162 世界单位 / 1920px → 约 11.9 px 每单位，
     * 0.0012 × 98 = 0.118 单位 ≈ 1.4px。第一版用了 0.0038，画出来 4px 多，像描了粗黑边。
     */
    base: createToonMaterial(season, {
      bands: 3,
      hazeStrength: 0.3,
      hazeHeightBias: 0.2,
      // 底座是"展台"，边缘光收着点；但它本身不能黑成一团
      rimStrength: 0.12,
      rimStart: 0.8,
      keyIntensity: 1.9,
    }),
    outlineTerrain: createOutlineMaterial(0.0012),
    outlineFine: createOutlineMaterial(0.00085),
  };
}

/** 相机默认距离，用来给描边粗细定量 */
export const OUTLINE_CALIBRATION_DIST = 88;

export function disposeSceneMaterials(m: SceneMaterials): void {
  const all: THREE.ShaderMaterial[] = [
    m.terrain,
    m.rock,
    m.wood,
    m.stone,
    m.foliage,
    m.misc,
    m.base,
    m.outlineTerrain,
    m.outlineFine,
  ];
  for (const mat of all) mat.dispose();
}

/** 把暖光位置/强度从一帧的状态写进共享 uniform */
export function setWarmLights(
  slots: {
    pos: [number, number, number];
    power: number;
    color?: THREE.ColorRepresentation;
  }[],
): void {
  for (let i = 0; i < 3; i++) {
    const s = slots[i];
    if (!s) {
      SHARED_WARM.uLightPower.value[i] = 0;
      continue;
    }
    SHARED_WARM.uLightPos.value[i].set(s.pos[0], s.pos[1], s.pos[2]);
    SHARED_WARM.uLightPower.value[i] = s.power;
    if (s.color) SHARED_WARM.uLightColor.value[i].set(s.color);
  }
}
