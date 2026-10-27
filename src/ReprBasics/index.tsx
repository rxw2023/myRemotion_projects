import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { S00, S01, S02, S03, S04, S05, S06 } from "./scenes-a";
import { S07, S08, S09, S10, S11, S12, S13 } from "./scenes-b";
import { SCENE_FRAMES, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";

export { TOTAL_FRAMES };

const D = SCENE_FRAMES;
const T = TRANSITION_FRAMES;

const slideIn = () => slide({ direction: "from-right" });
const fadeIn = () => fade();

/**
 * 《整数与浮点数表示》— 408 组成原理 · 数据的表示
 * 逐句字幕与旁白时间轴来自 scripts/repr-basics/generate_tts.py（见 timings.ts）。
 * 总帧数 = Σ场景帧 − Σ转场帧，由 timings.ts 自动算出。
 */
export const IntegerFloatRepr: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={D.s00}>
        <S00 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s01}>
        <S01 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s02}>
        <S02 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s03}>
        <S03 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s04}>
        <S04 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s05}>
        <S05 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s06}>
        <S06 />
      </TransitionSeries.Sequence>

      {/* 整数 → 浮点：段落切换用 slide */}
      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s07}>
        <S07 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s08}>
        <S08 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s09}>
        <S09 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s10}>
        <S10 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s11}>
        <S11 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s12}>
        <S12 />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={D.s13}>
        <S13 />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
