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
 * 《指令操作码》— 408 计算机组成原理 · 指令系统
 *
 * 接上一期《高级语言与机器码》：上期把 C 翻译成汇编，这期说明这些汇编在干什么。
 * 视觉语言、组件库、音频管线都沿用（深灰底 + 等宽字 + 一笔一笔写出来）。
 *
 * 全片一条主线：**每条指令都在改某几份状态**。
 *   寄存器 REG / 内存 MEM / 标志位 FLAGS / 程序计数器 PC / I/O 端口 PORT
 * 五格状态板 Board 每场出现一次，亮的那几格就是这条指令动到的东西 ——
 * 于是最后一张表（s11）不是背出来的，是把每一场画过的板子摞在一起。
 *
 * 12 场七块：主题 / 五份状态 / MOV / 栈 / 加减乘除 / 位运算移位 /
 *            CMP / 跳转 / 子程序 / 陷阱 / 中断与 I/O / 收口表
 *
 * 总帧数 = Σ场景帧 − Σ转场帧（12 个场景、11 段 8 帧淡入淡出）。
 *
 * 音频：DeepSeek TTS（voice stella，pcm 24kHz）一句一请求 ——
 * 见 scripts/instruction-ops/generate_tts.py。
 */
export const InstructionOps: React.FC = () => {
  return (
    <CueProvider cues={CUES}>
      <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
        <TransitionSeries>
          {SCENE_ORDER.map((id, i) => {
            const Scene = SCENES[id];
            return (
              <React.Fragment key={id}>
                <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES[id]}>
                  <Audio src={staticFile(`instruction-ops/${id}.wav`)} />
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
