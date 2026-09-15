import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import {
  HALF,
  TERRAIN_SEG,
  sampleSurfaceShape,
  terrainColor,
  type SurfaceShape,
} from "./layout";
import { BASE } from "./palette";
import { box, mergeParts, xf } from "./math";
import type { SceneMaterials } from "./materials";
import { useSeason } from "./SeasonContext";

/**
 * 地形网格 + 方形收藏底座
 *
 * 四季地形的高度场完全一样，只有**顶点色**不一样。
 * 所以这里做了一个拆分:
 *   几何体（位置 / 法线 / 每个顶点的 h、slope、cover）只建一次；
 *   季节变了只重跑一遍上色循环，更新 aTint 这个属性。
 *
 * 直接重建几何的话要重跑 3.4 万次 sampleSurface（每次 5 次高度场采样 + 多层噪声），
 * 一秒多；只重算颜色是几毫秒。片子里要切四次季节，这个差别很实在。
 */
export const Terrain: React.FC<{ mat: SceneMaterials }> = ({ mat }) => {
  const season = useSeason();

  const { geo, samples } = useMemo(() => {
    const g = new THREE.PlaneGeometry(HALF * 2, HALF * 2, TERRAIN_SEG, TERRAIN_SEG);
    // 平面默认在 XY，转到 XZ 平面，然后 y 就是高度
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;
    const cache: SurfaceShape[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // 只算形，不算色 —— 色是随季节重算的
      const s = sampleSurfaceShape(x, z);
      cache[i] = s;
      pos.setY(i, s.h);
    }

    g.setAttribute("aTint", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    pos.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
    // 只在挂载时建一次。这里没有任何季节相关的输入，
    // 所以依赖数组是空的，也不会触发 exhaustive-deps 警告
    return { geo: g, samples: cache };
  }, []);

  // 季节变化 → 只重算顶点色
  useLayoutEffect(() => {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const tint = geo.getAttribute("aTint") as THREE.BufferAttribute;
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const s = samples[i];
      terrainColor(pos.getX(i), pos.getZ(i), s.h, s.slope, s.cover, season.terrain, tmp);
      tint.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    tint.needsUpdate = true;
  }, [geo, samples, season]);

  /**
   * 底座: 两级台阶 + 顶部一圈压边。
   * 做成"可收藏模型"的感觉 —— 上层收进去，下层稍微外扩。
   */
  const baseGeo = useMemo(() => {
    const s = HALF * 2;
    return mergeParts([
      // 主体（地表以下的"土体"）
      // 顶面压到 -0.25 而不是 0: 地形外围平地正好落在 y=0，
      // 两者共面会在底座边缘擦出 z-fighting 条纹
      {
        geo: box(s, 4.9, s),
        color: BASE.soilMid,
        matrix: xf({ pos: [0, -2.7, 0] }),
      },
      // 下层台阶，外扩 1
      {
        geo: box(s + 2.0, 2.2, s + 2.0),
        color: BASE.soil,
        matrix: xf({ pos: [0, -6.1, 0] }),
      },
      // 顶部压边，稍微外扩一点点，形成一圈亮线
      {
        geo: box(s + 0.7, 0.44, s + 0.7),
        color: BASE.edge,
        matrix: xf({ pos: [0, -0.32, 0] }),
      },
      // 底封板
      {
        geo: box(s - 0.5, 0.4, s - 0.5),
        color: BASE.bottom,
        matrix: xf({ pos: [0, -7.4, 0] }),
      },
    ]);
  }, []);

  return (
    <group>
      {/* 底座 */}
      <mesh geometry={baseGeo} material={mat.base} />
      <mesh geometry={baseGeo} material={mat.outlineFine} />

      {/* 地表 */}
      <mesh geometry={geo} material={mat.terrain} />
      <mesh geometry={geo} material={mat.outlineTerrain} />
    </group>
  );
};
