import { AbsoluteFill, useVideoConfig, staticFile } from "remotion";
import { Gif } from "@remotion/gif";

export const ErisPet: React.FC = () => {
  const { width, height } = useVideoConfig();

  // GIF 原始比例 384:416 ≈ 0.923（略高于正方形）
  // 竖版 1080x1920，让 GIF 尽量大、水平居中、垂直居中
  const gifW = width;                        // 铺满宽度
  const gifH = Math.round(gifW * (416 / 384)); // 保持原始比例

  const gifX = 0;
  const gifY = Math.round((height - gifH) / 2); // 垂直居中

  return (
    <AbsoluteFill>
      {/* 灰色背景 */}
      <AbsoluteFill style={{ background: "#b0b0b0" }} />

      {/* GIF 居中展示 */}
      <div
        style={{
          position: "absolute",
          left: gifX,
          top: gifY,
          width: gifW,
          height: gifH,
        }}
      >
        <Gif
          src={staticFile("eris-pet/eris-all-actions.gif")}
          width={gifW}
          height={gifH}
          fit="fill"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </AbsoluteFill>
  );
};
