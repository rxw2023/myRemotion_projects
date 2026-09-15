import React, { createContext, useContext } from "react";
import { SEASONS, type Season, type SeasonPreset } from "./seasons";

/**
 * 季节上下文
 *
 * 为什么用 context 而不是逐层传 prop:
 *   场景里读配色的组件有六七个（地形、湖面、天空、松林、小镇、神社），
 *   季节还会在视频中途切换 —— 逐层传 prop 会把每一层的签名都污染一遍。
 *
 * 注意一个渲染上的坑:
 *   季节在视频中途会变，而地形/松林的几何体是 useMemo 建的。
 *   凡是几何里烘了顶点色的地方，useMemo 的依赖里都必须带上 season.id，
 *   否则切季之后几何不会重建，颜色会停在上一季。
 */
const SeasonContext = createContext<SeasonPreset>(SEASONS.summer);

export const SeasonProvider: React.FC<{
  season: Season;
  children: React.ReactNode;
}> = ({ season, children }) => {
  return (
    <SeasonContext.Provider value={SEASONS[season]}>
      {children}
    </SeasonContext.Provider>
  );
};

export function useSeason(): SeasonPreset {
  return useContext(SeasonContext);
}

/** 把季节配置转成 three 能用的颜色（顺手统一入口，避免各处 new THREE.Color） */
export function seasonLight(season: SeasonPreset) {
  return season.light;
}

export type { SeasonPreset };
