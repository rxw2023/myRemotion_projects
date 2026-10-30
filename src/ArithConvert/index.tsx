import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { S00, S01, S02, S03, S04, S05, S06, S07 } from "./scenes-a";
import { S08, S09, S10, S11, S12, S13, S14 } from "./scenes-b";
import { SCENE_FRAMES, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";

export { TOTAL_FRAMES };

const D = SCENE_FRAMES;
const T = TRANSITION_FRAMES;

const slideIn = () => slide({ direction: "from-right" });
const fadeIn = () => fade();

/**
 * 《运算电路与类型转换》— 408 组成原理 · 数据的表示（第二期）
 * 逐句字幕与旁白时间轴来自 scripts/arith-convert/generate_tts.py（见 timings.ts）。
 * 总帧数 = Σ场景帧 − Σ转场帧。
 */
export const ArithConvert: React.FC = () => {
  return (
    <AbsoluteFill>
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
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s07}>
          <S07 />
        </TransitionSeries.Sequence>
        {/* 电路 → 转换：段落切换用 slide */}
        <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s08}>
          <S08 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s09}>
          <S09 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s10}>
          <S10 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s11}>
          <S11 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s12}>
          <S12 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s13}>
          <S13 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slideIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s14}>
          <S14 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* BGM：压在旁白下面，音量 9% */}
      <Audio src={staticFile("shared/bgm-storage.mp3")} volume={0.09} loop />
    </AbsoluteFill>
  );
};
