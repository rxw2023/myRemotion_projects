import React, { useMemo } from "react";
import * as THREE from "three";
import {
  ALCOVE,
  HILL,
  SHRINE as SHRINE_POS,
  TORII,
  WATER_Y,
  terrainHeight,
} from "./layout";
import { SHRINE as C } from "./palette";
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
 * 御神体 + 山脚的宫水神社
 *
 * 全片唯一有"内容"的两处内部空间，所以做得最实:
 *   岩腔: 凹进岩壁的一个石室，正面敞开、上方有岩檐压着，
 *         里面有供奉台、并排的口嚼酒坛、缠着结绳的酒坛、两支烛火与白瓷供杯。
 *   社殿: 敞开的格子门 + 半掀的御帘，能看进奉纳箱、摇铃绳、绘马架、
 *         神镜、榊枝、褪色挂历和角落的巫女装束木箱。
 *
 * 烛火与石灯笼的暖光从这两处漏出来，和外面冷蓝的天形成对比 ——
 * 这是整张图冷暖关系的支点。
 */

/** 岩腔的开口朝向: 从御神体山心指向岩腔，再往外就是开口方向 */
const ALCOVE_YAW = Math.atan2(ALCOVE.x - HILL.x, ALCOVE.z - HILL.z);
/** 社殿朝向: 让格子门正对相机那一侧 */
const SHRINE_YAW = 0.2;

// ==================== 岩腔石室 ====================

function buildAlcoveShell(): THREE.BufferGeometry {
  const rand = mulberry32(9091);
  const parts: Part[] = [];

  // 地面
  parts.push({
    geo: box(6.4, 0.4, 5.6),
    color: C.stoneDark,
    matrix: xf({ pos: [0, -0.2, 0.4] }),
  });
  // 后壁与两侧壁
  parts.push({
    geo: box(6.4, 3.6, 0.8),
    color: "#33343a",
    matrix: xf({ pos: [0, 1.8, -2.6] }),
  });
  parts.push({
    geo: box(0.8, 3.6, 5.6),
    color: "#35363c",
    matrix: xf({ pos: [-3.2, 1.8, 0.4] }),
  });
  parts.push({
    geo: box(0.8, 3.6, 5.6),
    color: "#35363c",
    matrix: xf({ pos: [3.2, 1.8, 0.4] }),
  });
  // 顶: 一块压出来的岩檐，向前多探 1.6，才有"凹进去"的感觉
  parts.push({
    geo: box(7.2, 1.0, 7.2),
    color: "#2e2f35",
    matrix: xf({ pos: [0, 4.0, 1.6] }),
  });
  // 檐口再压一块斜的，做出岩壁的厚度
  parts.push({
    geo: box(7.4, 0.7, 1.4),
    color: "#292a30",
    matrix: xf({ pos: [0, 3.4, 4.4], rot: [0.32, 0, 0] }),
  });

  // 洞口周围堆一圈乱石，把方盒子打散成岩腔
  const base = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const r = 3.2 + rand() * 2.6;
    const local = new THREE.Vector3(Math.cos(a) * r, rand() * 4.2, Math.sin(a) * r + 1.2);
    // 洞口正前方留空
    if (Math.abs(local.x) < 2.6 && local.z > 1.4 && local.y < 3.2) continue;
    const s = 0.7 + rand() * 1.7;
    parts.push({
      geo: base,
      color: rand() > 0.5 ? "#3d3f47" : "#2b2d34",
      matrix: xf({
        pos: [local.x, local.y, local.z],
        rot: [rand() * 3.14, rand() * 3.14, rand() * 3.14],
        scale: [s, s * (0.6 + rand() * 0.5), s * (0.7 + rand() * 0.5)],
      }),
    });
  }

  return mergeParts(parts);
}

/** 岩腔内部的神道陈设 */
function buildAlcoveInterior(): THREE.BufferGeometry {
  const rand = mulberry32(4321);
  const parts: Part[] = [];

  // 供奉台: 台面 + 四条腿
  parts.push({
    geo: box(3.2, 0.22, 1.1),
    color: C.offeringTable,
    matrix: xf({ pos: [0, 0.86, -1.5] }),
  });
  for (const ox of [-1.4, 1.4]) {
    for (const oz of [-0.42, 0.42]) {
      parts.push({
        geo: box(0.16, 0.78, 0.16),
        color: C.woodDark,
        matrix: xf({ pos: [ox, 0.39, -1.5 + oz] }),
      });
    }
  }

  // 并排的口嚼酒坛
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 1.0;
    const tilt = (rand() - 0.5) * 0.05;
    parts.push({
      geo: cylinder(0.3, 0.36, 0.72, 10),
      color: C.sakeJar,
      matrix: xf({ pos: [x, 1.36, -1.5], rot: [tilt, rand() * 3.1, tilt] }),
    });
    // 坛肩
    parts.push({
      geo: cylinder(0.17, 0.3, 0.22, 10),
      color: C.sakeJarDark,
      matrix: xf({ pos: [x, 1.82, -1.5] }),
    });
    // 坛口的注连绳与纸垂
    parts.push({
      geo: new THREE.TorusGeometry(0.19, 0.05, 4, 12),
      color: C.rope,
      matrix: xf({ pos: [x, 1.9, -1.5], rot: [Math.PI / 2, 0, 0] }),
    });
    parts.push({
      geo: box(0.1, 0.26, 0.02),
      color: C.paper,
      matrix: xf({ pos: [x, 1.76, -1.31] }),
    });
  }

  // 白瓷供杯
  for (const x of [-0.62, 0.62]) {
    parts.push({
      geo: cylinder(0.13, 0.1, 0.16, 8, false),
      color: C.cup,
      matrix: xf({ pos: [x, 1.05, -0.62] }),
    });
    parts.push({
      geo: cylinder(0.11, 0.11, 0.05, 8, false),
      color: "#cfcabc",
      matrix: xf({ pos: [x, 1.14, -0.62] }),
    });
  }

  // 两支烛台（烛芯的自发光由光斑材质负责）
  for (const x of [-1.75, 1.75]) {
    parts.push({
      geo: cylinder(0.12, 0.16, 0.1, 8, false),
      color: "#5a5348",
      matrix: xf({ pos: [x, 0.95, -1.0] }),
    });
    parts.push({
      geo: cylinder(0.07, 0.07, 0.62, 8, false),
      color: "#5a5348",
      matrix: xf({ pos: [x, 1.31, -1.0] }),
    });
    parts.push({
      geo: cylinder(0.055, 0.065, 0.34, 7, false),
      color: "#e8ddc4",
      matrix: xf({ pos: [x, 1.79, -1.0] }),
    });
  }

  // 横挂在洞口内的注连绳
  const ropePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = -2.8 + t * 5.6;
    // 两端高、中间垂
    const y = 2.95 - Math.sin(t * Math.PI) * 0.42;
    ropePts.push(new THREE.Vector3(x, y, 2.2));
  }
  const ropeCurve = new THREE.CatmullRomCurve3(ropePts);
  parts.push({
    geo: new THREE.TubeGeometry(ropeCurve, 24, 0.11, 6, false),
    color: C.rope,
    matrix: xf({}),
  });
  // 纸垂
  for (let i = 0; i < 4; i++) {
    const t = 0.16 + (i / 3) * 0.68;
    const y = 2.95 - Math.sin(t * Math.PI) * 0.42 - 0.3;
    parts.push({
      geo: box(0.14, 0.4, 0.015),
      color: C.paper,
      matrix: xf({ pos: [-2.8 + t * 5.6, y, 2.2], rot: [0, 0, (i - 1.5) * 0.03] }),
    });
  }

  return mergeParts(parts);
}

// ==================== 鸟居 ====================

function buildTorii(h: number): THREE.BufferGeometry {
  const s = h / 4.4;
  const parts: Part[] = [
    // 两根柱
    {
      geo: cylinder(0.19, 0.24, 4.2, 9, false),
      color: C.torii,
      matrix: xf({ pos: [-1.6, 2.1, 0] }),
    },
    {
      geo: cylinder(0.19, 0.24, 4.2, 9, false),
      color: C.torii,
      matrix: xf({ pos: [1.6, 2.1, 0] }),
    },
    // 笠木（最上面那根，两端微微上翘）
    {
      geo: box(4.5, 0.3, 0.44),
      color: C.toriiDark,
      matrix: xf({ pos: [0, 4.42, 0] }),
    },
    // 岛木
    {
      geo: box(4.0, 0.24, 0.34),
      color: C.torii,
      matrix: xf({ pos: [0, 4.0, 0] }),
    },
    // 额束
    {
      geo: box(0.46, 0.6, 0.2),
      color: C.woodOld,
      matrix: xf({ pos: [0, 4.05, 0.06] }),
    },
    // 贯（下横梁）
    {
      geo: box(3.8, 0.22, 0.28),
      color: C.torii,
      matrix: xf({ pos: [0, 3.1, 0] }),
    },
  ];
  return mergeParts(parts.map((p) => ({ ...p, matrix: xf({ scale: s }).multiply(p.matrix!) })));
}

/** 挂在鸟居上的注连绳。单独一个 group，方便随风轻摆。 */
const ToriiRope: React.FC<{ mat: SceneMaterials; sway: number }> = ({ mat, sway }) => {
  const geo = useMemo(() => {
    const parts: Part[] = [];
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = -1.55 + t * 3.1;
      const y = 3.62 - Math.sin(t * Math.PI) * 0.34;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.push({
      geo: new THREE.TubeGeometry(curve, 28, 0.13, 6, false),
      color: C.rope,
      matrix: xf({}),
    });
    // 绳上的三处结
    for (const t of [0.2, 0.5, 0.8]) {
      const x = -1.55 + t * 3.1;
      parts.push({
        geo: new THREE.TorusGeometry(0.16, 0.05, 4, 10),
        color: C.ropeShadow,
        matrix: xf({ pos: [x, 3.62 - Math.sin(t * Math.PI) * 0.34, 0] }),
      });
    }
    // 纸垂
    for (let i = 0; i < 4; i++) {
      const t = 0.18 + (i / 3) * 0.64;
      const x = -1.55 + t * 3.1;
      const y = 3.62 - Math.sin(t * Math.PI) * 0.34;
      parts.push({
        geo: box(0.13, 0.44, 0.014),
        color: C.paper,
        matrix: xf({ pos: [x, y - 0.34, 0.02] }),
      });
    }
    return mergeParts(parts);
  }, []);

  return (
    <mesh
      geometry={geo}
      material={mat.wood}
      // 注连绳在夜风里微微摆动 —— 绕悬挂点小角度晃
      rotation={[0, 0, sway]}
    />
  );
};

// ==================== 山道石阶 ====================

function buildSteps(): THREE.BufferGeometry {
  const parts: Part[] = [];
  const from = new THREE.Vector2(9.0, -4.2);
  const to = new THREE.Vector2(ALCOVE.x, ALCOVE.z);
  const N = 30;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = from.x + (to.x - from.x) * t;
    const z = from.y + (to.y - from.y) * t;
    const y = terrainHeight(x, z);
    const rot = -Math.atan2(to.x - from.x, to.y - from.y);
    // 石阶略微嵌进坡里，只露出台面
    parts.push({
      geo: box(2.0, 0.3, 0.72),
      color: i % 3 === 0 ? C.stoneStep : C.stoneDark,
      matrix: xf({ pos: [x, y + 0.06, z], rot: [0, rot, 0] }),
    });
  }
  return mergeParts(parts);
}

// ==================== 山脚社殿 ====================

function buildShrineBody(): THREE.BufferGeometry {
  const parts: Part[] = [];
  const W = 4.6;
  const D = 3.6;
  const postH = 2.5;

  // 基座（石）
  parts.push({
    geo: box(W + 1.1, 0.55, D + 1.1),
    color: C.stone,
    matrix: xf({ pos: [0, 0.27, 0] }),
  });
  // 木地板
  parts.push({
    geo: box(W, 0.18, D),
    color: C.woodOld,
    matrix: xf({ pos: [0, 0.62, 0] }),
  });
  // 四角柱
  for (const ox of [-W / 2 + 0.2, W / 2 - 0.2]) {
    for (const oz of [-D / 2 + 0.2, D / 2 - 0.2]) {
      parts.push({
        geo: box(0.22, postH, 0.22),
        color: C.wood,
        matrix: xf({ pos: [ox, 1.95, oz] }),
      });
    }
  }
  // 后壁与两侧壁（只做下半段，上面留出格子窗的暗部）
  parts.push({
    geo: box(W - 0.4, postH - 0.3, 0.14),
    color: C.woodDark,
    matrix: xf({ pos: [0, 1.85, -D / 2 + 0.14] }),
  });
  for (const ox of [-W / 2 + 0.14, W / 2 - 0.14]) {
    parts.push({
      geo: box(0.14, postH - 0.3, D - 0.4),
      color: C.woodDark,
      matrix: xf({ pos: [ox, 1.85, 0] }),
    });
  }
  // 前檐下的横枋
  parts.push({
    geo: box(W, 0.2, 0.16),
    color: C.wood,
    matrix: xf({ pos: [0, 3.16, D / 2 - 0.1] }),
  });
  // 格子门: 只做左半扇（右半扇是敞开的，视线从这里进去）
  for (let i = 0; i < 7; i++) {
    parts.push({
      geo: box(0.06, 1.5, 0.07),
      color: C.woodOld,
      matrix: xf({ pos: [-W / 2 + 0.35 + i * 0.24, 1.45, D / 2 - 0.06] }),
    });
  }
  for (let i = 0; i < 4; i++) {
    parts.push({
      geo: box(1.7, 0.06, 0.07),
      color: C.woodOld,
      matrix: xf({ pos: [-W / 2 + 1.07, 0.75 + i * 0.42, D / 2 - 0.06] }),
    });
  }
  // 敞开的右半扇: 一扇门板斜靠在柱边
  parts.push({
    geo: box(1.5, 1.8, 0.09),
    color: C.woodOld,
    matrix: xf({ pos: [W / 2 - 0.35, 1.55, D / 2 - 0.55], rot: [0, -0.5, 0] }),
  });

  // 屋顶: 大挑檐的切妻，加千木与鰹木
  parts.push({
    geo: gableRoof(W + 2.6, D + 2.6, 1.5),
    color: "#1f2129",
    matrix: xf({ pos: [0, 3.35, 0] }),
  });
  parts.push({
    geo: box(W + 2.8, 0.18, D + 2.8),
    color: "#1a1c22",
    matrix: xf({ pos: [0, 3.4, 0] }),
  });
  // 千木（屋顶两端交叉的木）
  for (const ox of [-(W + 2.6) / 2 + 0.2, (W + 2.6) / 2 - 0.2]) {
    for (const s of [-1, 1]) {
      parts.push({
        geo: box(0.1, 1.5, 0.1),
        color: "#2a2c34",
        matrix: xf({ pos: [ox, 4.5, 0], rot: [0, 0, s * 0.45] }),
      });
    }
  }
  // 鰹木
  for (let i = -1; i <= 1; i++) {
    parts.push({
      geo: cylinder(0.11, 0.11, 0.5, 6, false),
      color: "#2a2c34",
      matrix: xf({ pos: [i * 0.9, 4.9, 0], rot: [0, 0, Math.PI / 2] }),
    });
  }

  return mergeParts(parts);
}

/** 社殿内部: 从敞开的右半扇与御帘下方能看进去 */
function buildShrineInterior(): THREE.BufferGeometry {
  const rand = mulberry32(1618);
  const parts: Part[] = [];
  const W = 4.6;
  const D = 3.6;

  // 奉纳箱（带格栅口的木箱）
  parts.push({
    geo: box(1.5, 0.85, 0.9),
    color: C.offeringBox,
    matrix: xf({ pos: [0.9, 1.13, D / 2 - 1.0] }),
  });
  for (let i = -2; i <= 2; i++) {
    parts.push({
      geo: box(0.16, 0.1, 0.9),
      color: "#2e1e12",
      matrix: xf({ pos: [0.9 + i * 0.26, 1.56, D / 2 - 1.0] }),
    });
  }

  // 摇铃绳: 从梁上垂下来 + 铃 + 纸垂
  parts.push({
    geo: cylinder(0.035, 0.035, 1.5, 5, false),
    color: C.rope,
    matrix: xf({ pos: [0.9, 2.5, D / 2 - 1.0] }),
  });
  parts.push({
    geo: new THREE.SphereGeometry(0.2, 8, 6),
    color: C.bell,
    matrix: xf({ pos: [0.9, 1.86, D / 2 - 1.0], scale: [1, 0.82, 1] }),
  });
  for (const s of [-1, 1]) {
    parts.push({
      geo: box(0.14, 0.36, 0.014),
      color: C.paper,
      matrix: xf({ pos: [0.9 + s * 0.2, 1.98, D / 2 - 1.0] }),
    });
  }

  // 神镜: 后壁上的圆镜
  parts.push({
    geo: new THREE.CircleGeometry(0.34, 20),
    color: C.mirror,
    matrix: xf({ pos: [0, 2.1, -D / 2 + 0.24] }),
  });
  parts.push({
    geo: new THREE.TorusGeometry(0.35, 0.05, 4, 18),
    color: "#8a7a58",
    matrix: xf({ pos: [0, 2.1, -D / 2 + 0.24] }),
  });

  // 榊枝
  parts.push({
    geo: cylinder(0.1, 0.13, 0.26, 6, false),
    color: "#4a4436",
    matrix: xf({ pos: [-1.2, 1.7, -D / 2 + 0.7] }),
  });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    parts.push({
      geo: box(0.1, 0.52, 0.02),
      color: C.sakaki,
      matrix: xf({
        pos: [-1.2 + Math.cos(a) * 0.14, 2.08, -D / 2 + 0.7 + Math.sin(a) * 0.14],
        rot: [Math.sin(a) * 0.32, -a, Math.cos(a) * 0.3],
      }),
    });
  }

  // 褪色的旧挂历
  parts.push({
    geo: new THREE.PlaneGeometry(0.9, 0.66),
    color: C.calendar,
    matrix: xf({ pos: [-1.62, 2.24, -D / 2 + 0.24] }),
  });
  for (let i = 0; i < 5; i++) {
    parts.push({
      geo: box(0.7, 0.014, 0.006),
      color: "#7a6d52",
      matrix: xf({ pos: [-1.62, 2.42 - i * 0.1, -D / 2 + 0.26] }),
    });
  }
  // 手写祭事日程
  parts.push({
    geo: new THREE.PlaneGeometry(0.66, 0.5),
    color: "#bfae8c",
    matrix: xf({ pos: [1.68, 2.3, -D / 2 + 0.24], rot: [0, 0, 0.03] }),
  });

  // 绘马架: 立在左侧，挂满木牌
  const ex = -W / 2 + 0.85;
  const ez = -0.4;
  for (const s of [-1, 1]) {
    parts.push({
      geo: box(0.1, 1.5, 0.1),
      color: C.woodDark,
      matrix: xf({ pos: [ex + s * 0.62, 1.4, ez] }),
    });
  }
  parts.push({
    geo: box(1.5, 0.1, 0.12),
    color: C.woodDark,
    matrix: xf({ pos: [ex, 2.1, ez] }),
  });
  parts.push({
    geo: box(1.5, 0.1, 0.12),
    color: C.woodDark,
    matrix: xf({ pos: [ex, 1.55, ez] }),
  });
  parts.push({
    geo: box(1.8, 0.14, 0.5),
    color: "#2a2118",
    matrix: xf({ pos: [ex, 2.28, ez - 0.12] }),
  });
  // 成排的绘马
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const mx = ex - 0.56 + i * 0.28;
      const my = row === 0 ? 1.92 : 1.37;
      parts.push({
        geo: box(0.22, 0.28, 0.02),
        color: row === 0 && i % 2 === 0 ? C.ema : C.emaWood,
        matrix: xf({
          pos: [mx, my, ez + 0.02],
          rot: [0.06, 0, (rand() - 0.5) * 0.16],
        }),
      });
    }
  }

  // 角落叠好的巫女装束木箱
  parts.push({
    geo: box(1.0, 0.6, 0.72),
    color: C.chest,
    matrix: xf({ pos: [W / 2 - 0.75, 1.01, -D / 2 + 0.7] }),
  });
  parts.push({
    geo: box(1.0, 0.34, 0.72),
    color: "#3d2a1c",
    matrix: xf({ pos: [W / 2 - 0.75, 1.48, -D / 2 + 0.7] }),
  });
  // 木箱里露出的红色巫女装束
  parts.push({
    geo: box(0.66, 0.14, 0.44),
    color: "#8f3b34",
    matrix: xf({ pos: [W / 2 - 0.75, 1.71, -D / 2 + 0.7] }),
  });
  parts.push({
    geo: box(0.5, 0.12, 0.34),
    color: "#e6e0d0",
    matrix: xf({ pos: [W / 2 - 0.75, 1.83, -D / 2 + 0.7] }),
  });

  // 叠在木架上的旧御守与神签
  for (let i = 0; i < 4; i++) {
    parts.push({
      geo: box(0.28, 0.09, 0.2),
      color: i % 2 === 0 ? "#9a3f4a" : "#c9a86e",
      matrix: xf({
        pos: [W / 2 - 1.5, 0.76 + i * 0.1, -D / 2 + 0.55],
        rot: [0, (rand() - 0.5) * 0.4, 0],
      }),
    });
  }

  return mergeParts(parts);
}

/** 半掀的御帘 —— 挂在社殿正面，上缘固定、整体随风轻摆 */
const Misu: React.FC<{ mat: SceneMaterials; sway: number }> = ({ mat, sway }) => {
  const geo = useMemo(() => {
    const parts: Part[] = [];
    const W = 4.6;
    const D = 3.6;
    // 一排竖向的苇帘条，长度不一 —— 右侧掀得高一些，露出里面
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const x = -W / 2 + 0.2 + t * (W - 0.4);
      // 半掀: 左侧垂到腰，右侧掀到只盖住上沿
      const hang = 0.95 + (1 - t) * 0.85;
      parts.push({
        geo: box(0.16, hang, 0.04),
        // 第一版用了 #8e7f57 / #a89670，在夜景里亮得像一只木板箱，
        // 把整个神社正面都压住了。苇帘在月光下应该是很暗的。
        color: i % 2 === 0 ? "#544b39" : "#463f31",
        matrix: xf({ pos: [x, 3.05 - hang / 2, D / 2 + 0.12] }),
      });
    }
    // 上缘的横杆
    parts.push({
      geo: box(W - 0.2, 0.1, 0.1),
      color: C.woodDark,
      matrix: xf({ pos: [0, 3.1, D / 2 + 0.12] }),
    });
    return mergeParts(parts);
  }, []);

  return <mesh geometry={geo} material={mat.wood} rotation={[0, sway * 0.35, sway]} />;
};

// ==================== 石灯笼 ====================

function buildLantern(): THREE.BufferGeometry {
  const parts: Part[] = [
    { geo: cylinder(0.34, 0.42, 0.24, 6, false), color: C.stoneDark, matrix: xf({ pos: [0, 0.12, 0] }) },
    { geo: cylinder(0.16, 0.2, 0.9, 6, false), color: C.stone, matrix: xf({ pos: [0, 0.7, 0] }) },
    { geo: cylinder(0.36, 0.3, 0.16, 6, false), color: C.stone, matrix: xf({ pos: [0, 1.22, 0] }) },
    // 火袋
    { geo: box(0.44, 0.42, 0.44), color: C.stone, matrix: xf({ pos: [0, 1.5, 0] }) },
    { geo: hipRoof(0.86, 0.86, 0.3), color: C.stoneDark, matrix: xf({ pos: [0, 1.71, 0] }) },
    { geo: new THREE.SphereGeometry(0.1, 6, 5), color: C.stoneDark, matrix: xf({ pos: [0, 2.06, 0] }) },
  ];
  return mergeParts(parts);
}

// ==================== 组装 ====================

export const Shrine: React.FC<{ mat: SceneMaterials; time: number }> = ({
  mat,
  time,
}) => {
  const alcoveY = terrainHeight(ALCOVE.x, ALCOVE.z);
  const toriiY = terrainHeight(TORII.x, TORII.z);
  const shrineY = terrainHeight(SHRINE_POS.x, SHRINE_POS.z);

  const shellGeo = useMemo(() => buildAlcoveShell(), []);
  const interiorGeo = useMemo(() => buildAlcoveInterior(), []);
  const toriiGeo = useMemo(() => buildTorii(1), []);
  const smallToriiGeo = useMemo(() => buildTorii(0.62), []);
  const stepsGeo = useMemo(() => buildSteps(), []);
  const bodyGeo = useMemo(() => buildShrineBody(), []);
  const shrineInteriorGeo = useMemo(() => buildShrineInterior(), []);
  const lanternGeo = useMemo(() => buildLantern(), []);

  // 夜风: 两个不同周期的正弦叠加，摆动才不会像节拍器
  const ropeSway = 0.028 * Math.sin(time * 1.15) + 0.014 * Math.sin(time * 2.7 + 1.1);
  const misuSway = 0.022 * Math.sin(time * 0.92 + 0.6);

  const candleGlow = useMemo(
    () => createGlowMaterial("#ffb35c", 1.5, 2.2),
    [],
  );
  const lanternGlow = useMemo(
    () => createGlowMaterial("#ffa24d", 1.3, 2.0),
    [],
  );

  return (
    <>
      {/* ---------- 御神体 ---------- */}
      <group position={[ALCOVE.x, alcoveY, ALCOVE.z]} rotation={[0, ALCOVE_YAW, 0]}>
        <mesh geometry={shellGeo} material={mat.rock} />
        <mesh geometry={shellGeo} material={mat.outlineFine} />
        <mesh geometry={interiorGeo} material={mat.wood} />
        {/* 岩腔里的两支烛火 */}
        <BillboardGlow material={candleGlow} position={[-1.75, 1.95, -1.0]} scale={1.1} />
        <BillboardGlow material={candleGlow} position={[1.75, 1.95, -1.0]} scale={1.1} />
        {/* 供奉台上一团整体的暖光 */}
        <BillboardGlow material={candleGlow} position={[0, 1.9, -1.5]} scale={2.6} />
      </group>

      <mesh geometry={stepsGeo} material={mat.stone} />

      {/* 山腰的鸟居 */}
      <group position={[TORII.x, toriiY, TORII.z]} rotation={[0, ALCOVE_YAW, 0]}>
        <mesh geometry={toriiGeo} material={mat.wood} />
        <mesh geometry={toriiGeo} material={mat.outlineFine} />
        <group position={[0, 0, 0]}>
          <ToriiRope mat={mat} sway={ropeSway} />
        </group>
      </group>

      {/* ---------- 山脚的宫水神社 ---------- */}
      <group position={[SHRINE_POS.x, shrineY, SHRINE_POS.z]} rotation={[0, SHRINE_YAW, 0]}>
        <mesh geometry={bodyGeo} material={mat.wood} />
        <mesh geometry={bodyGeo} material={mat.outlineFine} />
        <mesh geometry={shrineInteriorGeo} material={mat.wood} />
        <Misu mat={mat} sway={misuSway} />
        {/* 社殿内透出的暖光（从敞开的右半扇和御帘下方漏出来） */}
        <BillboardGlow material={lanternGlow} position={[0.9, 1.8, 0.9]} scale={2.4} />
        <BillboardGlow material={lanternGlow} position={[-0.2, 1.9, 0.6]} scale={2.0} />
      </group>

      {/* 参道两侧的石灯笼 */}
      {[
        [-3.6, 6.2],
        [3.6, 6.2],
        [-1.6, 10.2],
        [1.6, 10.2],
      ].map(([ox, oz], i) => {
        // 灯笼排在神社正前方，沿神社朝向摆放
        const wx = SHRINE_POS.x + Math.cos(SHRINE_YAW) * ox + Math.sin(SHRINE_YAW) * oz;
        const wz = SHRINE_POS.z - Math.sin(SHRINE_YAW) * ox + Math.cos(SHRINE_YAW) * oz;
        const wy = terrainHeight(wx, wz);
        if (wy < WATER_Y + 0.4) return null;
        return (
          <group key={i} position={[wx, wy, wz]}>
            <mesh geometry={lanternGeo} material={mat.stone} />
            <BillboardGlow material={lanternGlow} position={[0, 1.5, 0]} scale={1.5} />
          </group>
        );
      })}

      {/* 神社入口的小鸟居 */}
      <group
        position={[
          SHRINE_POS.x + Math.sin(SHRINE_YAW) * 8.6,
          terrainHeight(
            SHRINE_POS.x + Math.sin(SHRINE_YAW) * 8.6,
            SHRINE_POS.z + Math.cos(SHRINE_YAW) * 8.6,
          ),
          SHRINE_POS.z + Math.cos(SHRINE_YAW) * 8.6,
        ]}
        rotation={[0, SHRINE_YAW, 0]}
      >
        <mesh geometry={smallToriiGeo} material={mat.wood} />
      </group>
    </>
  );
};
