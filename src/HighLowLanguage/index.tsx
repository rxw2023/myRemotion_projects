import React from "react";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CueProvider } from "../shared/b3b/ui";
import { CUES, SCENE_FRAMES, SCENE_ORDER, TOTAL_FRAMES, TRANSITION_FRAMES } from "./timings";
import { S00, S01, S02, S03, S04, S05 } from "./scenes-a";
import { S06, S07, S08, S09, S10, S11 } from "./scenes-b";

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
};

const BGM_VOL = 0.08;

/**
 * 《高级语言与机器码》— 408 计算机组成原理 · 指令系统
 *
 * 视觉语言、组件库、音频管线都接上一期（UdpBasics）：
 * 深灰底 + 等宽字 + 一笔一笔写出来，字幕走 CueProvider 注入。
 *
 * 与之前几期不同的一点：s00 是**主题页**（标题 + 三条目录 + 全片主线），
 * 不再是直接抛问题的钩子 —— 这一期知识点密、跨度大，先给门牌再进门。
 *
 * 全片一条主线：高级语言负责让人写得舒服，机器码负责让机器跑得动。
 * 上半场走流程（预处理 → 编译 → 汇编 → 链接），下半场走代码
 * （选择 → 循环 → 栈帧 → add → func），最后一张表收口。
 *
 * 总帧数 = Σ场景帧 − Σ转场帧（12 个场景、11 段 8 帧淡入淡出）。
 *
 * 音频：DeepSeek TTS（voice stella，pcm 24kHz）一句一请求，
 * 每句自己合成所以时长精确 —— 见 scripts/high-low-language/generate_tts.py。
 */
export const HighLowLanguage: React.FC = () => {
  return (
    <CueProvider cues={CUES}>
      <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
        <TransitionSeries>
          {SCENE_ORDER.map((id, i) => {
            const Scene = SCENES[id];
            return (
              <React.Fragment key={id}>
                <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES[id]}>
                  <Audio src={staticFile(`high-low-language/${id}.wav`)} />
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
