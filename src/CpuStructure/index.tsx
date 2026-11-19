import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CueProvider } from "../shared/b3b/ui";
import { CUES, SCENE_FRAMES, SCENE_ORDER, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";
import { S00, S01, S02, S03, S04, S05, S06 } from "./scenes-a";
import { S07, S08, S09, S10, S11, S12, S13 } from "./scenes-b";

export { TOTAL_FRAMES };

const SCENES = {
  s00: S00,
  s01: S01,
  s02: S02,
  s03: S03,
  s04: S04,
  s05: S05,
  s06: S06,
  s07: S07,
  s08: S08,
  s09: S09,
  s10: S10,
  s11: S11,
  s12: S12,
  s13: S13,
};

const BGM_VOL = 0.08;

/**
 * 《CPU 的结构》— 408 计算机组成原理 · CPU
 *
 * 接上一期《指令操作码》：上期说"每条指令都在改某几份状态"，
 * 这一期问"这些状态住在哪个元件里、元件之间怎么连"。
 *
 * 全片一条主线：**一条总线，两种元件**。
 *   总线决定部件怎么连（数据通路 / 控制器 / 暂存器 / 三态门 / 指令队列）
 *   时钟决定谁能记住（组合逻辑 vs 时序逻辑）
 * 于是"寄存器那张表"和"可见性"都不是背的，是从这两条推出来的。
 *
 * 14 场：主题 / 两分法 / 数据通路 / 组合元件 / 时序元件 / 单总线与 T /
 *        控制器四步 / 8086 全景 / 寄存器五类 / CS:IP / 段与栈帧 /
 *        标志寄存器 / 引脚 / 收口表
 *
 * 总帧数 = Σ场景帧 − Σ转场帧（14 个场景、13 段 8 帧淡入淡出）。
 *
 * 音频：DeepSeek TTS（voice stella，pcm 24kHz）一句一请求 ——
 * 见 scripts/cpu-structure/generate_tts.py。
 */
export const CpuStructure: React.FC = () => {
  return (
    <CueProvider cues={CUES}>
      <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
        <TransitionSeries>
          {SCENE_ORDER.map((id, i) => {
            const Scene = SCENES[id];
            return (
              <React.Fragment key={id}>
                <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES[id]}>
                  <Audio src={staticFile(`cpu-structure/${id}.wav`)} />
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
