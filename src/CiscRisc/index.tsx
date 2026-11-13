import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CueProvider } from "../shared/b3b/ui";
import { CUES, SCENE_FRAMES, SCENE_ORDER, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";
import { S00, S01, S02, S03, S04, S05 } from "./scenes-a";
import { S06, S07, S08, S09, S10 } from "./scenes-b";

export { TOTAL_FRAMES };

const SCENES = { s00: S00, s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07, s08: S08, s09: S09, s10: S10 };

const BGM_VOL = 0.1;

/**
 * 《指令系统 · ISA 与 CISC / RISC》— 408 计算机组成原理 · 指令系统
 *
 * 第三期知识点视频，视觉语言与前两期一致（3b1b 深灰底 + 等宽字 + 一笔一笔写出来），
 * 组件库沿用 src/shared/b3b/，字幕通过 CueProvider 注入。
 *
 * 全片只有一条主线：ISA 是"规定做什么"的契约，微架构是"怎么做到"的实现。
 * CISC / RISC 是同一份契约的两种写法，定长 / 变长又能顺着流水线一路推到性能。
 * 总帧数 = Σ场景帧 − Σ转场帧（11 个场景、10 段 8 帧淡入淡出）。
 */
export const CiscRisc: React.FC = () => {
  return (
    <CueProvider cues={CUES}>
      <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
        <TransitionSeries>
          {SCENE_ORDER.map((id, i) => {
            const Scene = SCENES[id];
            return (
              <React.Fragment key={id}>
                <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES[id]}>
                  <Audio src={staticFile(`cisc-risc/${id}.mp3`)} />
                  <Scene />
                </TransitionSeries.Sequence>
                {i < SCENE_ORDER.length - 1 ? (
                  <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </TransitionSeries>

        {/* BGM：与前两期同一首，压到 10%，首尾淡入淡出 */}
        <Audio
          src={staticFile("shared/bgm.mp3")}
          loop
          volume={(frame) =>
            interpolate(frame, [0, 75, TOTAL_FRAMES - 150, TOTAL_FRAMES], [0, BGM_VOL, BGM_VOL, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </AbsoluteFill>
    </CueProvider>
  );
};
