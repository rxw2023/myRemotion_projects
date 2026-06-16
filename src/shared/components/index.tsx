import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// ==================== 共享颜色 ====================
export const SHARED_COLORS = {
  bg: "#F8F9FC",
  bgCard: "#FFFFFF",
  bgCard2: "#F0F2F8",
  accent: "#2563EB",
  accent2: "#059669",
  accent3: "#D97706",
  accent4: "#DC2626",
  accent5: "#7C3AED",
  text: "#1F2937",
  textDim: "#9CA3AF",
  textMid: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 24px rgba(0,0,0,0.08)",
};

// ==================== 通用动画组件 ====================

export const FadeIn: React.FC<{
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, duration = 10, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 12], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

export const SlideUp: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 14], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

export const WhiteCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: SHARED_COLORS.bgCard,
      border: `1px solid ${SHARED_COLORS.border}`,
      borderRadius: 16,
      padding: "24px 32px",
      boxShadow: SHARED_COLORS.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

// ==================== 字幕条组件（通用版） ====================

export const SubtitleBar: React.FC<{
  text: string;
  startFrame?: number;
  endFrame?: number;
  fontSize?: number;
}> = ({ text, startFrame = 0, endFrame = 9999, fontSize = 28 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, endFrame - 10, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          padding: "14px 36px",
          maxWidth: "88%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize,
            fontWeight: 500,
            letterSpacing: 1.2,
            lineHeight: 1.6,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
