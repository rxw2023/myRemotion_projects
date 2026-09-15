import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Scene } from "./Scene";
import { FRAMES_PER_SEASON, INITIAL_CAMERA, SHOTS, TOTAL_FRAMES } from "./Camera";
import { seasonAtFrame } from "./seasons";

export { TOTAL_FRAMES };

/**
 * 系守湖 · 四季 —— 微缩模型
 *
 * 一个"可以拿在手里转着看"的三维微缩景观:
 * 方形底座上，环形山峦环抱一片正圆形的陨石湖，御神体山丘立在湖的对岸，
 * 山腰有鸟居与岩腔，山脚是宫水神社，湖畔铺开一座亮着灯却空无一人的小镇。
 *
 * 画面里没有任何 UI —— 连一行字都没有。
 *
 * 全片 60 秒 / 4 个机位 / 硬切，春 → 夏 → 秋 → 冬 各 15 秒:
 *   春 · 樱    樱花、嫩绿、柔白斜光、飘落花瓣
 *   夏 · 黄昏  深绿松林、暖橙夕照、萤火
 *   秋 · 红叶  红金层林、最低角的琥珀光、落叶
 *   冬 · 雪    覆雪地面、雪压松、冷蓝高对比、落雪
 *
 * 四季共用同一套场景（地形、湖、町、神社、机位几何约束），
 * 差别全部收在 seasons.ts 里 —— 改一季只改一处，不是维护四份副本。
 * 每季不是"同一组镜头重新上色" —— 环绕起点方位逐季错开，冬天还反向绕，
 * 所以四段连起来看不出是同一个转台播了四遍。
 *
 * 相机是帧号的纯函数，Studio 里拖动时间轴即可预览整段。
 */

// ==================== BGM ====================
/*
 * 三葉のテーマ（RADWIMPS，《你的名字。》）。
 * 全片没有旁白，BGM 是唯一的声部，所以音量可以比带解说的片子给得高
 * （那些压到 0.08~0.25 是为了给 TTS 让路）。
 * 素材全长 4:03，比全片 60 秒长，因此不 loop —— 只取开头这一段，
 * 用首尾淡入淡出收干净，否则末帧会硬切。
 */
const BGM_SRC = "itomori-night/bgm.mp3";
const BGM_VOLUME = 0.85;
const BGM_FADE_IN_FRAMES = 45; // 1.5s
const BGM_FADE_OUT_FRAMES = 90; // 3s

/** 音量包络：0 → 满 → 满 → 0（写成帧函数，播放中变化不触发重渲染） */
const bgmVolume = (f: number): number =>
  interpolate(
    f,
    [
      0,
      BGM_FADE_IN_FRAMES,
      TOTAL_FRAMES - BGM_FADE_OUT_FRAMES,
      TOTAL_FRAMES - 1,
    ],
    [0, BGM_VOLUME, BGM_VOLUME, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

export const ItomoriNight: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // 注意 progress 用的是**全局**帧号:
  // 涟漪、窗灯明灭、烛火这些是连续事件，不该在切镜头或切季时重置
  const progress = frame / (TOTAL_FRAMES - 1);
  const time = frame / fps;

  // 曝光也按季节取（冬天的天更亮、夏天的黄昏更暗）
  const season = seasonAtFrame(frame, FRAMES_PER_SEASON);

  return (
    <AbsoluteFill style={{ background: "#04060e" }}>
      {/* BGM：三葉のテーマ —— 全片铺底，首尾淡入淡出 */}
      <Audio src={staticFile(BGM_SRC)} volume={bgmVolume} />
      <ThreeCanvas
        width={width}
        height={height}
        /*
         * dpr=1 很关键: ThreeCanvas 会把 drawing buffer 设成 width*dpr × height*dpr。
         * 合成是 1920×1080，dpr>1 只会白白多画几倍像素。
         */
        dpr={1}
        // 初值取自第一个机位的首帧，避免首帧跳一下
        camera={{ position: INITIAL_CAMERA.position, fov: INITIAL_CAMERA.fov, near: 0.5, far: 2400 }}
        /*
         * ACES 色调映射（跟参考实现一致）。
         *
         * 好处: 高光滚降。彗核、倒影碎光、窗灯这些超过 1.0 的加色项
         *       会平滑压到接近白而不是硬切在 1.0 上 ——
         *       夜景点光源多，这一条对画面干净程度影响很大。
         * 代价: 中间调轻微去饱和并整体下沉，所以调色板要重新配一轮。
         *
         * 注意: 自定义 ShaderMaterial 不会自动走色调映射，
         *       每个 shader 结尾都必须自己写
         *         #include <tonemapping_fragment>
         *         #include <colorspace_fragment>
         *       顺序不能反 —— 色调映射必须在线性空间、sRGB 转换之前做。
         */
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          /*
           * 曝光按季节取（seasons.ts 里每季一个值）。
           * three 的 ACES 实现里先做 color *= toneMappingExposure / 0.6，
           * 所以 1.3 大约相当于 2.17 倍提升。
           * 和季节配置里的 lightGain 一起构成亮度的两个总开关:
           * 只想整体提亮就调曝光；想让暗部也跟着抬起来就调 lightGain。
           */
          toneMappingExposure: season.exposure,
        }}
      >
        <Scene progress={progress} time={time} frame={frame} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/** 分镜清单，给调试/文档用 */
export { SHOTS };
