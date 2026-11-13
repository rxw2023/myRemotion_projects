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

const BGM_VOL = 0.09;

/**
 * 《UDP》— 408 计算机网络 · 传输层
 *
 * 视觉语言与前几期知识点视频一致（3b1b 深灰底 + 等宽字 + 一笔一笔写出来），
 * 组件库沿用 src/shared/b3b/，字幕通过 CueProvider 注入。
 *
 * 全片一条主线：UDP 把"可靠"整件事外包给了应用层，于是自己只剩 8 个字节，
 * 也只剩"发出去"这一个动作。首部 → 分用 → 校验（伪首部 / 四步 / 算例 / 验证）
 * → 五个特点 → 应用场景 → 考点表，最后回到开头那张明信片。
 * 总帧数 = Σ场景帧 − Σ转场帧（11 个场景、10 段 8 帧淡入淡出）。
 *
 * 算例数值：192.168.1.1 → .2、端口 1024 → 2048、数据「Hel」，
 * 12 个 16 位分组累加回卷 2 次得 0x43E1，取反 0xBC1E。
 * （原页面写作 0xC4E0 / 0x3B1F，复算不符，本片用复算值。）
 */
export const UdpBasics: React.FC = () => {
  return (
    <CueProvider cues={CUES}>
      <AbsoluteFill style={{ backgroundColor: "#1C1C1C" }}>
        <TransitionSeries>
          {SCENE_ORDER.map((id, i) => {
            const Scene = SCENES[id];
            return (
              <React.Fragment key={id}>
                <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES[id]}>
                  <Audio src={staticFile(`udp-basics/${id}.mp3`)} />
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

        {/* BGM：与前几期同一首，压到 9%，首尾淡入淡出 */}
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
