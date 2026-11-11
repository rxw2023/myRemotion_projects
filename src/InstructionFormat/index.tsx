import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S00, S01, S02, S03, S04, S05, S06, S07, S08, S09 } from "./scenes-a";
import { S10, S11, S12, S13, S14, S15, S16, S17, S18, S19 } from "./scenes-b";
import { SCENE_FRAMES, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";

export { TOTAL_FRAMES };

const D = SCENE_FRAMES;
const T = TRANSITION_FRAMES;

const fadeIn = () => fade();

/** 旁白：每个场景一段，起点与场景首帧对齐 */
const Narration: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <>
    <Audio src={staticFile(`instruction-format/${id}.mp3`)} />
    {children}
  </>
);

const BGM_VOL = 0.1;

/**
 * 《指令格式与寻址方式》— 408 计算机组成原理 · 指令系统
 *
 * 视觉：3Blue1Brown 式深灰底 + 等宽字 + 一笔一笔"写"出来的线条。
 * 节拍：全部动画跟着 timings.ts 里的逐句字幕时间走（scripts/instruction-format/generate_tts.py）。
 * 总帧数 = Σ场景帧 − Σ转场帧（20 个场景、19 段 8 帧淡入淡出）。
 */
export const InstructionFormat: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.s00}>
          <Narration id="s00">
            <S00 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s01}>
          <Narration id="s01">
            <S01 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s02}>
          <Narration id="s02">
            <S02 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s03}>
          <Narration id="s03">
            <S03 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s04}>
          <Narration id="s04">
            <S04 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s05}>
          <Narration id="s05">
            <S05 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s06}>
          <Narration id="s06">
            <S06 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s07}>
          <Narration id="s07">
            <S07 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s08}>
          <Narration id="s08">
            <S08 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s09}>
          <Narration id="s09">
            <S09 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s10}>
          <Narration id="s10">
            <S10 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s11}>
          <Narration id="s11">
            <S11 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s12}>
          <Narration id="s12">
            <S12 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s13}>
          <Narration id="s13">
            <S13 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s14}>
          <Narration id="s14">
            <S14 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s15}>
          <Narration id="s15">
            <S15 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s16}>
          <Narration id="s16">
            <S16 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s17}>
          <Narration id="s17">
            <S17 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s18}>
          <Narration id="s18">
            <S18 />
          </Narration>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fadeIn()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={D.s19}>
          <Narration id="s19">
            <S19 />
          </Narration>
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* BGM：用户指定的 We Never (Remix)，音量压到 10%，首尾各淡入淡出 */}
      <Audio
        src={staticFile("instruction-format/bgm.mp3")}
        loop
        volume={(frame) =>
          interpolate(frame, [0, 75, TOTAL_FRAMES - 150, TOTAL_FRAMES], [0, BGM_VOL, BGM_VOL, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
