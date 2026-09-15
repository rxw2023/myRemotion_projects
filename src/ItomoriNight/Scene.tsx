import React, { useLayoutEffect, useMemo } from "react";
import { ALCOVE, SHRINE, TOWN_SHORE, terrainHeight } from "./layout";
import { createSceneMaterials, setWarmLights } from "./materials";
import { Terrain } from "./Terrain";
import { Water } from "./Water";
import { Sky } from "./Sky";
import { Forest } from "./Forest";
import { Town } from "./Town";
import { Shrine } from "./Shrine";
import { CinematicCamera, FRAMES_PER_SEASON } from "./Camera";
import { cometState } from "./comet";
import { SeasonProvider } from "./SeasonContext";
import { seasonAtFrame } from "./seasons";

/** 三盏暖光的锚点高度，直接从高度场取，保证和地形对得上 */
function anchors() {
  return {
    alcove: terrainHeight(ALCOVE.x, ALCOVE.z),
    shrine: terrainHeight(SHRINE.x + 2.2, SHRINE.z + 2.0),
    town: terrainHeight(TOWN_SHORE.x, TOWN_SHORE.z),
  };
}

export const Scene: React.FC<{
  /** 0..1 整片进度（全局，驱动彗星轨迹） */
  progress: number;
  /** 已推进的秒数 */
  time: number;
  /** 当前帧号（驱动分镜相机与季节切换） */
  frame: number;
}> = ({ progress, time, frame }) => {
  /*
   * 季节由帧号决定，并且**必须在这里算** ——
   * SeasonProvider 要被放在 ThreeCanvas 内部。
   * R3F 的 Canvas 是把 children 渲染进另一个 reconciler root 的，
   * Remotion 自己的 context 靠 ThreeCanvas 里的 RemotionContextProvider 桥接，
   * 但我自己这个 SeasonContext 不在桥接范围内 —— 放在 Canvas 外面不会生效。
   */
  const season = useMemo(() => seasonAtFrame(frame, FRAMES_PER_SEASON), [frame]);

  // 材质随季节重建：主光方向/色温、暗部色相、轮廓边光都在材质里
  const mat = useMemo(() => createSceneMaterials(season), [season]);
  const comet = useMemo(() => cometState(progress), [progress]);
  const a = useMemo(() => anchors(), []);

  // ---- 石灯笼 / 烛火的跳动 ----
  // 两个不同频率的正弦叠加，比单一正弦更像火焰
  const candleFlicker =
    0.82 +
    0.1 * Math.sin(time * 7.3) +
    0.08 * Math.sin(time * 13.1 + 1.7) +
    0.05 * Math.sin(time * 23.7 + 0.4);
  const lanternFlicker = 0.9 + 0.07 * Math.sin(time * 3.1) + 0.04 * Math.sin(time * 8.7 + 2.1);

  // ---- 小镇灯火的总亮度: 缓慢起伏，像有人在镇上走动开灯 ----
  const lampGlow = 0.4 + 0.16 * (0.5 + 0.5 * Math.sin(time * 0.53)) + 0.08 * Math.sin(time * 2.1);

  useLayoutEffect(() => {
    setWarmLights([
      // 0: 御神体岩腔里的两支烛火
      { pos: [ALCOVE.x + 0.2, a.alcove + 2.3, ALCOVE.z - 0.4], power: 3.1 * candleFlicker },
      // 1: 山脚神社的石灯笼
      { pos: [SHRINE.x + 2.2, a.shrine + 1.7, SHRINE.z + 2.0], power: 2.2 * lanternFlicker },
      // 2: 小镇灯火
      { pos: [TOWN_SHORE.x, a.town + 3.2, TOWN_SHORE.z], power: 1.35 * lampGlow },
    ]);
  });

  return (
    <SeasonProvider season={season.id}>
      <CinematicCamera frame={frame} />

      <Sky progress={progress} time={time} />
      <Terrain mat={mat} />
      <Water time={time} comet={comet} lampGlow={lampGlow} />
      <Forest mat={mat} time={time} />
      <Shrine mat={mat} time={time} />
      <Town mat={mat} time={time} />
    </SeasonProvider>
  );
};
