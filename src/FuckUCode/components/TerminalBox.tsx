import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// ==================== 终端配色 ====================
const T = {
  bg: "#1E1E2E",
  titleBar: "#2D2D3F",
  text: "#CDD6F4",
  prompt: "#A6E3A1",
  error: "#F38BA8",
  warning: "#FAB387",
  accent: "#89B4FA",
  dim: "#6C7086",
  titleText: "#BAC2DE",
  dotRed: "#F38BA8",
  dotYellow: "#FAB387",
  dotGreen: "#A6E3A1",
};

// ==================== 行数据类型 ====================
export type TerminalLine =
  | { type: "command"; text: string }
  | { type: "output"; text: string }
  | { type: "error"; text: string }
  | { type: "warning"; text: string }
  | { type: "accent"; text: string }
  | { type: "empty" }
  | { type: "header"; text: string }
  | { type: "prompt"; text: string };

// ==================== Props ====================
interface TerminalBoxProps {
  lines: TerminalLine[];
  title?: string;
  startFrame?: number;
  /** 每行的打字动画延迟（帧），默认 8 */
  lineDelay?: number;
  style?: React.CSSProperties;
}

// ==================== 组件 ====================
export const TerminalBox: React.FC<TerminalBoxProps> = ({
  lines,
  title = "Terminal",
  startFrame = 0,
  lineDelay = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  // 整体透明度入场
  const boxOpacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      opacity: boxOpacity,
      background: T.bg,
      borderRadius: 14,
      border: `1px solid ${T.titleBar}`,
      boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      overflow: "hidden",
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      fontSize: 17,
      lineHeight: 1.7,
      maxWidth: 820,
      width: "100%",
      ...style,
    }}>
      {/* 标题栏 */}
      <div style={{
        background: T.titleBar,
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotRed }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotYellow }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: T.dotGreen }} />
        </div>
        <span style={{
          color: T.titleText, fontSize: 14, marginLeft: 8,
          fontWeight: 500, letterSpacing: 0.5,
        }}>
          {title}
        </span>
      </div>

      {/* 终端内容 */}
      <div style={{ padding: "16px 22px" }}>
        {lines.map((line, i) => {
          const lineStart = i * lineDelay;
          const lineOpacity = interpolate(localFrame, [lineStart, lineStart + 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          if (line.type === "empty") {
            return <div key={i} style={{ height: 8 }} />;
          }

          const colorMap: Record<string, string> = {
            command: T.prompt,
            output: T.text,
            error: T.error,
            warning: T.warning,
            accent: T.accent,
            header: T.accent,
            prompt: T.prompt,
          };

          return (
            <div key={i} style={{
              opacity: lineOpacity,
              color: colorMap[line.type] || T.text,
              whiteSpace: "pre-wrap",
              paddingBottom: 1,
            }}>
              {line.type === "command" || line.type === "prompt"
                ? <><span style={{ color: T.prompt }}>$ </span>{line.text}</>
                : line.text
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};
