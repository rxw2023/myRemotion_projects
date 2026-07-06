import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { TerminalBox } from "../FuckUCode/components/TerminalBox";
import type { TerminalLine } from "../FuckUCode/components/TerminalBox";

// ==================== 暗色终端配色 ====================
const C = {
  bg: "#0D1117",
  bgCard: "#161B22",
  bgCard2: "#21262D",
  accent: "#58A6FF",
  accentGreen: "#3FB950",
  accentOrange: "#D29922",
  accentRed: "#F85149",
  accentPurple: "#A371F7",
  text: "#F0F6FC",
  textDim: "#8B949E",
  textMid: "#C9D1D9",
  border: "#30363D",
  shadow: "0 4px 24px rgba(0,0,0,0.4)",
};

// ==================== 字幕文本（与 TTS 完全一致） ====================
const SUBTITLES: Record<string, string> = {
  intro:
    "今天我们来聊聊GitHub的正确打开方式。从Fork到Merge，一个完整的Pull Request工作流到底该怎么走？",
  fork:
    "首先，你应该先Fork我的仓库，而不是直接clone。Fork会在你自己的账户下创建一份副本，这样你就有了完整的读写权限，不会影响原仓库。",
  branch:
    "然后从develop分支checkout一个新的feature分支，比如叫feature/confession。记住，永远不要在main或develop分支上直接开发，功能分支隔离是关键。",
  code:
    "接着把你的代码写出来，并为它写好单元测试和集成测试，确保代码覆盖率达到百分之九十五以上。没有测试的代码，谁敢合并？",
  lintcommit:
    "跑一下Linter，通过所有的代码风格检查。然后commit，commit message要遵循Conventional Commits规范，比如feat: add confession feature。",
  pushpr:
    "把这个分支push到你自己的远程仓库，然后提一个Pull Request。在PR描述里详细说明你的功能改动和实现思路，并且at我和至少两个其他的评审。",
  reviewmerge:
    "我们会review你的代码，可能会留下一些评论，你需要解决所有的thread。等CI/CD流水线全部通过，并且拿到至少两个LGTM之后，我才会考虑把你的分支squash and merge到develop里，等待下一个版本发布。",
  wrongmain:
    "你怎么能直接commit到我的main分支？GitHub上不是这样！main分支是保护分支，所有的改动都应该通过Pull Request进来。",
  wrongforce:
    "怎么直接上来就想force push到main？GitHub上根本不是这样！force push会覆盖远程历史，别人的代码可能就丢了。我拒绝合并！",
  outro:
    "回顾一下：Fork仓库，创建feature分支，写代码加测试，通过Lint，规范commit，提PR，通过review，squash and merge。记住这个流程，开源协作不迷路。点赞收藏关注，下期见。",
};

// ==================== 场景时长（TTS + 40f buffer） ====================
const DURATIONS = {
  intro: 311,       // 9.05s * 30 + 40
  fork: 411,        // 12.38s * 30 + 40
  branch: 431,      // 13.06s * 30 + 40
  code: 376,        // 11.21s * 30 + 40
  lintcommit: 379,  // 11.30s * 30 + 40
  pushpr: 431,      // 13.06s * 30 + 40
  reviewmerge: 568, // 17.62s * 30 + 40
  wrongmain: 358,   // 10.63s * 30 + 40
  wrongforce: 389,  // 11.64s * 30 + 40
  outro: 544,       // 16.82s * 30 + 40
};

// ==================== 字幕组件 ====================
const SubtitleBar: React.FC<{
  sceneKey: keyof typeof DURATIONS;
  alert?: boolean;
}> = ({ sceneKey, alert = false }) => {
  const frame = useCurrentFrame();
  const dur = DURATIONS[sceneKey];
  const text = SUBTITLES[sceneKey];
  const opacity = interpolate(
    frame,
    [0, 8, dur - 5, dur - 1],
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
          background: alert ? "rgba(248,81,73,0.82)" : "rgba(0,0,0,0.78)",
          backdropFilter: "blur(8px)",
          borderRadius: 14,
          padding: "14px 36px",
          maxWidth: "88%",
          textAlign: "center",
          border: alert ? "1.5px solid rgba(248,81,73,0.6)" : "none",
          boxShadow: alert
            ? "0 4px 24px rgba(248,81,73,0.25)"
            : "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 26,
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

// ==================== 场景1：标题开场 ====================
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const subtitleOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const iconOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_intro.mp3")} />
      <SubtitleBar sceneKey="intro" />

      {/* 粒子背景 */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = (i * 137 + 50) % 100;
        const y = (i * 89 + 30) % 100;
        const py = interpolate(frame, [0, DURATIONS.intro], [y, y - 8 - (i % 6)], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${py}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              backgroundColor: i % 4 === 0 ? C.accent : i % 4 === 1 ? C.accentGreen : C.accentPurple,
              opacity: 0.12 + (i % 5) * 0.04,
            }}
          />
        );
      })}

      {/* GitHub 图标 */}
      <div
        style={{
          opacity: iconOpacity,
          fontSize: 64,
          marginBottom: 20,
        }}
      >
        🐙
      </div>

      {/* 主标题 */}
      <div
        style={{
          fontSize: 60,
          fontWeight: "bold",
          color: C.text,
          transform: `scale(${titleScale})`,
          letterSpacing: 3,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        GitHub PR
        <br />
        工作流
      </div>

      {/* 副标题 */}
      <div
        style={{
          fontSize: 22,
          color: C.textDim,
          marginTop: 24,
          opacity: subtitleOpacity,
          letterSpacing: 1.5,
          textAlign: "center",
        }}
      >
        从 Fork 到 Merge 的正确姿势
      </div>

      {/* 底部进度提示 */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          opacity: subtitleOpacity,
        }}
      >
        <div
          style={{
            background: `${C.accent}18`,
            border: `1px solid ${C.accent}30`,
            borderRadius: 20,
            padding: "8px 20px",
            color: C.accent,
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          核心流程篇
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景2：Fork 仓库 ====================
const ForkScene: React.FC = () => {
  const frame = useCurrentFrame();

  const terminalLines: TerminalLine[] = [
    { type: "command", text: "gh repo fork upstream/repo" },
    { type: "output", text: "✓ Forking upstream/repo..." },
    { type: "output", text: "✓ Created fork: your-username/repo" },
    { type: "empty" },
    { type: "command", text: "git clone https://github.com/your-username/repo.git" },
    { type: "output", text: "Cloning into 'repo'..." },
    { type: "output", text: "remote: Enumerating objects: 247, done." },
    { type: "output", text: "Receiving objects: 100% (247/247), 1.2 MiB" },
    { type: "empty" },
    { type: "command", text: "cd repo && git remote -v" },
    { type: "output", text: "origin  https://github.com/your-username/repo.git (fetch)" },
    { type: "output", text: "origin  https://github.com/your-username/repo.git (push)" },
  ];

  const explainOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_fork.mp3")} />
      <SubtitleBar sceneKey="fork" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 10,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第一步：Fork 仓库
      </h1>

      <TerminalBox
        lines={terminalLines}
        title="fork & clone"
        startFrame={10}
        lineDelay={7}
        style={{ maxWidth: 760 }}
      />

      {/* 说明卡片 */}
      <div
        style={{
          opacity: explainOpacity,
          marginTop: 14,
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "14px 24px",
          maxWidth: 760,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>💡</span>
        <span style={{ color: C.textDim, fontSize: 16, letterSpacing: 0.5 }}>
          Fork 在你自己账户下创建副本，拥有完整读写权限，不会影响原仓库
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景3：Feature Branch ====================
const BranchScene: React.FC = () => {
  const frame = useCurrentFrame();

  const terminalLines: TerminalLine[] = [
    { type: "command", text: "git checkout develop" },
    { type: "output", text: "Switched to branch 'develop'" },
    { type: "output", text: "Your branch is up to date with 'origin/develop'." },
    { type: "empty" },
    { type: "command", text: "git checkout -b feature/confession" },
    { type: "output", text: "Switched to a new branch 'feature/confession'" },
    { type: "empty" },
    { type: "command", text: "git branch" },
    { type: "output", text: "  develop" },
    { type: "accent", text: "* feature/confession" },
    { type: "output", text: "  main" },
  ];

  // 分支树形图动画
  const treeOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "46px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_branch.mp3")} />
      <SubtitleBar sceneKey="branch" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 8,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第二步：创建 Feature Branch
      </h1>

      <div style={{ display: "flex", gap: 18, width: "100%", maxWidth: 860, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <TerminalBox
            lines={terminalLines}
            title="feature/confession"
            startFrame={8}
            lineDelay={7}
          />
        </div>

        {/* 分支树形图 */}
        <div
          style={{
            opacity: treeOpacity,
            flex: "0 0 260px",
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "20px",
            position: "relative",
            height: 180,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: C.textDim,
              marginBottom: 14,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            Branch Tree
          </div>
          {/* 连线 */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            viewBox="0 0 260 180"
          >
            {/* main → develop */}
            <line x1={60} y1={54} x2={60} y2={80} stroke={C.textDim} strokeWidth={2} />
            {/* develop → feature */}
            <line x1={60} y1={80} x2={160} y2={80} stroke={C.accentGreen} strokeWidth={2} />
            {/* main node */}
            <circle cx={60} cy={54} r={8} fill={C.textDim} />
            {/* develop node */}
            <circle cx={60} cy={80} r={8} fill={C.accent} />
            {/* feature node */}
            <circle cx={160} cy={80} r={8} fill={C.accentGreen} />
            {/* labels */}
            <text x={78} y={58} fill={C.textDim} fontSize={13}>main</text>
            <text x={78} y={84} fill={C.accent} fontSize={13}>develop</text>
            <text x={175} y={84} fill={C.accentGreen} fontSize={13} fontWeight="bold">
              feature/
            </text>
            <text x={175} y={100} fill={C.accentGreen} fontSize={13} fontWeight="bold">
              confession
            </text>
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景4：写代码 & 测试 ====================
const CodeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const testLines: TerminalLine[] = [
    { type: "command", text: "npm test -- --coverage" },
    { type: "empty" },
    { type: "output", text: " PASS  src/__tests__/confession.test.ts" },
    { type: "accent", text: "  ✓ should express true feelings" },
    { type: "accent", text: "  ✓ should not return null" },
    { type: "accent", text: "  ✓ should handle rejection gracefully" },
    { type: "accent", text: "  ✓ should pass integration test" },
    { type: "empty" },
    { type: "output", text: "Test Suites: 3 passed, 3 total" },
    { type: "output", text: "Tests:       12 passed, 12 total" },
    { type: "output", text: "Coverage:    96.8% (threshold: 95%)" },
    { type: "empty" },
    { type: "accent", text: "✓ All checks passed!" },
  ];

  const codeOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const coverageHighlight = interpolate(frame, [200, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "42px 28px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_code.mp3")} />
      <SubtitleBar sceneKey="code" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 6,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第三步：写代码 & 写测试
      </h1>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 900 }}>
        {/* 代码 diff mock */}
        <div
          style={{
            opacity: codeOpacity,
            flex: 1,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              background: C.bgCard2,
              padding: "8px 16px",
              fontSize: 13,
              color: C.textDim,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            src/confession.ts
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.text }}> 1</span> {"// confession feature"}
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.text }}> 2</span> {""}
            </div>
            <div style={{ background: "rgba(63,185,80,0.12)", color: C.accentGreen }}>
              <span style={{ color: C.text }}> 3</span> + export function confess(
            </div>
            <div style={{ background: "rgba(63,185,80,0.12)", color: C.accentGreen }}>
              <span style={{ color: C.text }}> 4</span> + {"  message: string"}
            </div>
            <div style={{ background: "rgba(63,185,80,0.12)", color: C.accentGreen }}>
              <span style={{ color: C.text }}> 5</span> + ): Confession {"{"}
            </div>
            <div style={{ background: "rgba(63,185,80,0.12)", color: C.accentGreen }}>
              <span style={{ color: C.text }}> 6</span> + {"  return { message, sincere: true };"}
            </div>
            <div style={{ background: "rgba(63,185,80,0.12)", color: C.accentGreen }}>
              <span style={{ color: C.text }}> 7</span> + {"}"}
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.text }}> 8</span> {""}
            </div>
          </div>
        </div>

        {/* 终端测试结果 */}
        <div style={{ flex: 1.1 }}>
          <TerminalBox
            lines={testLines}
            title="npm test"
            startFrame={30}
            lineDelay={8}
          />
          {/* 覆盖率高亮 badge */}
          <div
            style={{
              opacity: coverageHighlight,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            <span
              style={{
                background: `${C.accentGreen}18`,
                color: C.accentGreen,
                border: `1.5px solid ${C.accentGreen}40`,
                borderRadius: 20,
                padding: "8px 20px",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              ✓ Coverage 96.8% &gt; 95%
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景5：Lint & Commit ====================
const LintCommitScene: React.FC = () => {
  const frame = useCurrentFrame();

  const lintLines: TerminalLine[] = [
    { type: "command", text: "npm run lint" },
    { type: "empty" },
    { type: "accent", text: "✓ eslint: 0 errors, 0 warnings" },
    { type: "accent", text: "✓ prettier: all files formatted" },
    { type: "accent", text: "✓ tsc --noEmit: type check passed" },
    { type: "empty" },
    { type: "command", text: "git add ." },
    { type: "command", text: 'git commit -m "feat: add confession feature"' },
    { type: "empty" },
    { type: "output", text: "[feature/confession a1b2c3d] feat: add confession feature" },
    { type: "output", text: " 3 files changed, 142 insertions(+), 2 deletions(-)" },
    { type: "output", text: " create mode 100644 src/confession.ts" },
    { type: "output", text: " create mode 100644 src/__tests__/confession.test.ts" },
  ];

  // CC 规范标签
  const tags = [
    { name: "feat:", desc: "新功能", color: C.accentGreen },
    { name: "fix:", desc: "Bug修复", color: C.accentRed },
    { name: "chore:", desc: "杂项", color: C.textDim },
    { name: "docs:", desc: "文档", color: C.accent },
    { name: "test:", desc: "测试", color: C.accentPurple },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "44px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_lintcommit.mp3")} />
      <SubtitleBar sceneKey="lintcommit" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 6,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第四步：Lint & Commit
      </h1>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 880 }}>
        <div style={{ flex: 1 }}>
          <TerminalBox
            lines={lintLines}
            title="lint & commit"
            startFrame={6}
            lineDelay={6}
          />
        </div>

        {/* Conventional Commits */}
        <div
          style={{
            flex: "0 0 240px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: C.textDim,
              letterSpacing: 1,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Conventional Commits
          </div>
          {tags.map((tag, i) => {
            const delay = 18 + i * 6;
            const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={tag.name}
                style={{
                  opacity,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cascadia Code', 'Consolas', monospace",
                    fontSize: 15,
                    fontWeight: 600,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
                <span style={{ fontSize: 13, color: C.textDim }}>{tag.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景6：Push & PR ====================
const PushPRScene: React.FC = () => {
  const frame = useCurrentFrame();

  const pushLines: TerminalLine[] = [
    { type: "command", text: "git push origin feature/confession" },
    { type: "empty" },
    { type: "output", text: "Enumerating objects: 11, done." },
    { type: "output", text: "Counting objects: 100% (11/11), done." },
    { type: "output", text: "remote: Create a pull request for 'feature/confession':" },
    { type: "accent", text: "remote:   https://github.com/your-username/repo/pull/new/feature/confession" },
    { type: "empty" },
    { type: "output", text: "To https://github.com/your-username/repo.git" },
    { type: "output", text: " * [new branch]  feature/confession -> feature/confession" },
  ];

  const prOpacity = interpolate(frame, [140, 165], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "42px 28px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_pushpr.mp3")} />
      <SubtitleBar sceneKey="pushpr" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 6,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第五步：Push & Pull Request
      </h1>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 900, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <TerminalBox
            lines={pushLines}
            title="git push"
            startFrame={5}
            lineDelay={7}
          />
        </div>

        {/* GitHub PR form mock */}
        <div
          style={{
            opacity: prOpacity,
            flex: 1,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: C.accentGreen,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>📬</span>
            <span style={{ color: "#FFF", fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>
              New Pull Request
            </span>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 4 }}>Title</div>
              <div
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 15,
                  color: C.text,
                  fontFamily: "'Cascadia Code', 'Consolas', monospace",
                }}
              >
                feat: add confession feature
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 4 }}>Description</div>
              <div
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: C.textMid,
                  lineHeight: 1.6,
                }}
              >
                实现了真情告白功能...<br />
                详细改动见 commit history<br />
                <br />
                <span style={{ color: C.accent }}>@rxw</span>{" "}
                <span style={{ color: C.accent }}>@reviewer1</span>{" "}
                <span style={{ color: C.accent }}>@reviewer2</span>
              </div>
            </div>
            <div
              style={{
                background: C.accentGreen,
                color: "#FFF",
                borderRadius: 8,
                padding: "8px 16px",
                textAlign: "center",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              Create Pull Request
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景7：Review & Merge ====================
const ReviewMergeScene: React.FC = () => {
  const frame = useCurrentFrame();

  // CI/CD pipeline
  const ciOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const review1Opacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const review2Opacity = interpolate(frame, [200, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lgtm1Opacity = interpolate(frame, [280, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lgtm2Opacity = interpolate(frame, [340, 360], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mergeOpacity = interpolate(frame, [420, 445], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 28px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_reviewmerge.mp3")} />
      <SubtitleBar sceneKey="reviewmerge" />

      <h1
        style={{
          fontSize: 38,
          fontWeight: "bold",
          color: C.text,
          marginBottom: 8,
          letterSpacing: 2,
          textAlign: "center",
        }}
      >
        第六步：Review & Merge
      </h1>

      {/* CI/CD 流水线 */}
      <div
        style={{
          opacity: ciOpacity,
          display: "flex",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          { label: "Lint", done: true },
          { label: "Build", done: true },
          { label: "Test", done: true },
          { label: "Coverage", done: true },
          { label: "Deploy Preview", done: true },
        ].map((step, i) => {
          const stepDelay = 8 + i * 6;
          const stepOpacity = interpolate(frame, [stepDelay, stepDelay + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={step.label}
              style={{
                opacity: stepOpacity,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: `${C.accentGreen}12`,
                border: `1px solid ${C.accentGreen}30`,
                borderRadius: 10,
                padding: "8px 14px",
              }}
            >
              <span style={{ color: C.accentGreen, fontSize: 14 }}>✓</span>
              <span style={{ color: C.accentGreen, fontSize: 14, fontWeight: 500 }}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Review 区域 */}
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Review 1 */}
        <div
          style={{
            opacity: review1Opacity,
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentPurple, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 14, fontWeight: "bold" }}>R1</div>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>reviewer1</span>
            <span style={{ color: C.textDim, fontSize: 12, marginLeft: "auto" }}>2 hours ago</span>
          </div>
          <div
            style={{
              background: C.bgCard2,
              borderRadius: 8,
              padding: "10px 14px",
              color: C.textMid,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            💬 建议在 <code style={{ color: C.accent, background: `${C.accent}18`, padding: "2px 6px", borderRadius: 4 }}>confess()</code> 函数里
            加一个参数校验，message 为空时抛异常
          </div>
        </div>

        {/* Review 2 */}
        <div
          style={{
            opacity: review2Opacity,
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentOrange, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 14, fontWeight: "bold" }}>R2</div>
            <span style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>reviewer2</span>
            <span style={{ color: C.textDim, fontSize: 12, marginLeft: "auto" }}>1 hour ago</span>
          </div>
          <div
            style={{
              background: C.bgCard2,
              borderRadius: 8,
              padding: "10px 14px",
              color: C.textMid,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            💬 测试覆盖率 👍，代码风格没问题，LGTM
          </div>
        </div>

        {/* LGTM 区域 */}
        <div style={{ padding: "14px 20px", display: "flex", gap: 14, justifyContent: "center" }}>
          <div
            style={{
              opacity: lgtm1Opacity,
              background: `${C.accentGreen}15`,
              border: `1.5px solid ${C.accentGreen}40`,
              borderRadius: 10,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>👍</span>
            <span style={{ color: C.accentGreen, fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
              LGTM
            </span>
          </div>
          <div
            style={{
              opacity: lgtm2Opacity,
              background: `${C.accentGreen}15`,
              border: `1.5px solid ${C.accentGreen}40`,
              borderRadius: 10,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>👍</span>
            <span style={{ color: C.accentGreen, fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
              LGTM
            </span>
          </div>
        </div>
      </div>

      {/* Squash & Merge 按钮 */}
      <div
        style={{
          opacity: mergeOpacity,
          marginTop: 14,
          background: C.accentPurple,
          borderRadius: 10,
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>🔀</span>
        <span style={{ color: "#FFF", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
          Squash & Merge
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景8：错误示范 — 直接 commit main ====================
const WrongMainScene: React.FC = () => {
  const frame = useCurrentFrame();

  const wrongLines: TerminalLine[] = [
    { type: "command", text: "git checkout main" },
    { type: "output", text: "Switched to branch 'main'" },
    { type: "empty" },
    { type: "command", text: "git add ." },
    { type: "command", text: 'git commit -m "fix stuff"' },
    { type: "empty" },
    { type: "error", text: "[main d3e4f5g] fix stuff  ← ⚠️" },
    { type: "error", text: "直接 commit 到 main 分支！" },
  ];

  // 红色警告闪烁
  const alertFlash = interpolate(frame, [140, 144, 148, 152], [0, 1, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const xOpacity = interpolate(frame, [160, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${C.bg} 0%, #1F0F0F 50%, #1A0A0A 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "44px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_wrongmain.mp3")} />
      <SubtitleBar sceneKey="wrongmain" alert />

      {/* 顶部警示标签 */}
      <div
        style={{
          opacity: alertFlash,
          background: `${C.accentRed}20`,
          border: `2px solid ${C.accentRed}`,
          borderRadius: 14,
          padding: "12px 28px",
          marginBottom: 16,
        }}
      >
        <span style={{ color: C.accentRed, fontSize: 30, fontWeight: "bold", letterSpacing: 3 }}>
          ⚠️ WRONG ⚠️
        </span>
      </div>

      <TerminalBox
        lines={wrongLines}
        title="main — PROTECTED BRANCH"
        startFrame={8}
        lineDelay={8}
        style={{
          maxWidth: 720,
          border: "2px solid rgba(248,81,73,0.4)",
          boxShadow: "0 8px 40px rgba(248,81,73,0.2)",
        }}
      />

      {/* 红色 X 覆盖 */}
      <div
        style={{
          opacity: xOpacity,
          position: "absolute",
          top: "32%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 200,
          color: C.accentRed,
          fontWeight: "bold",
          textShadow: "0 0 60px rgba(248,81,73,0.5)",
          zIndex: 50,
        }}
      >
        ✗
      </div>

      {/* 警示文字 */}
      <div
        style={{
          opacity: interpolate(frame, [180, 200], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: C.accentRed,
            fontSize: 32,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          🚫 怎么能直接 commit 到 main？！
        </div>
        <div
          style={{
            color: C.textDim,
            fontSize: 18,
            marginTop: 8,
            letterSpacing: 1,
          }}
        >
          保护分支必须通过 PR 合入
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景9：错误示范 — force push main ====================
const WrongForceScene: React.FC = () => {
  const frame = useCurrentFrame();

  const forceLines: TerminalLine[] = [
    { type: "command", text: "git push --force origin main" },
    { type: "empty" },
    { type: "error", text: "⛔ WARNING: You are force-pushing to main!" },
    { type: "error", text: "⛔ This will overwrite the remote history!" },
    { type: "error", text: "⛔ Other contributors may lose their work!" },
    { type: "empty" },
    { type: "error", text: "!!!!!!!! REJECTED !!!!!!!!" },
  ];

  // 强烈闪烁效果
  const flash = Math.sin(frame * 0.5) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1A0000 0%, #0F0000 50%, #1A0000 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "44px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_wrongforce.mp3")} />
      <SubtitleBar sceneKey="wrongforce" alert />

      {/* 闪烁警戒条 */}
      <div
        style={{
          opacity: flash,
          background: `rgba(248,81,73,${0.25 + flash * 0.35})`,
          border: `2px solid rgba(248,81,73,${0.6 + flash * 0.4})`,
          borderRadius: 14,
          padding: "14px 30px",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            color: C.accentRed,
            fontSize: 32,
            fontWeight: "bold",
            letterSpacing: 4,
          }}
        >
          🚨 CRITICAL ERROR 🚨
        </span>
      </div>

      <TerminalBox
        lines={forceLines}
        title="main — FORCE PUSH BLOCKED"
        startFrame={10}
        lineDelay={10}
        style={{
          maxWidth: 720,
          border: `2px solid rgba(248,81,73,${0.5 + flash * 0.5})`,
          boxShadow: `0 8px 60px rgba(248,81,73,${0.2 + flash * 0.3})`,
        }}
      />

      {/* 分支碎裂示意 */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 16,
          alignItems: "center",
          opacity: interpolate(frame, [120, 140], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            background: `${C.accentRed}15`,
            border: `1px solid ${C.accentRed}40`,
            borderRadius: 10,
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 22 }}>💥</span>
          <span style={{ color: C.accentRed, fontSize: 15, fontWeight: 600 }}>Remote History</span>
          <span style={{ color: C.accentRed, fontSize: 16 }}>OVERWRITTEN</span>
        </div>
      </div>

      {/* 底部大字 */}
      <div
        style={{
          opacity: interpolate(frame, [140, 165], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 18,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: C.accentRed,
            fontSize: 36,
            fontWeight: "bold",
            letterSpacing: 2,
          }}
        >
          🚫 GitHub 上根本不是这样！！
        </div>
        <div
          style={{
            color: C.accentRed,
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 8,
            letterSpacing: 1,
            opacity: flash,
          }}
        >
          我拒绝合并！
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 场景10：总结 ====================
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flowSteps = [
    { step: "Fork", icon: "🍴", color: C.accent },
    { step: "Branch", icon: "🌿", color: C.accentGreen },
    { step: "Code", icon: "💻", color: C.accent },
    { step: "Test", icon: "🧪", color: C.accentGreen },
    { step: "Lint", icon: "✓", color: C.accent },
    { step: "Commit", icon: "📝", color: C.accentGreen },
    { step: "PR", icon: "📬", color: C.accent },
    { step: "Review", icon: "👀", color: C.accentPurple },
    { step: "Merge", icon: "🔀", color: C.accentGreen },
  ];

  const titleScale = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "50px 32px",
      }}
    >
      <Audio src={staticFile("github-pr-workflow/githubpr_outro.mp3")} />
      <SubtitleBar sceneKey="outro" />

      {/* 完 pip 流程 */}
      <div
        style={{
          fontSize: 40,
          fontWeight: "bold",
          color: C.text,
          transform: `scale(${titleScale})`,
          letterSpacing: 3,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        正确流程回顾
      </div>

      {/* 流程图 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 700,
        }}
      >
        {flowSteps.map((s, i) => {
          const delay = 10 + i * 7;
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <React.Fragment key={s.step}>
              <div
                style={{
                  opacity,
                  background: `${s.color}15`,
                  border: `1.5px solid ${s.color}35`,
                  borderRadius: 12,
                  padding: "10px 16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: s.color, fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>
                  {s.step}
                </div>
              </div>
              {i < flowSteps.length - 1 && (
                <div
                  style={{
                    opacity: interpolate(frame, [delay + 3, delay + 6], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    display: "flex",
                    alignItems: "center",
                    color: C.textDim,
                    fontSize: 18,
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 正确 vs 错误对比 */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 24,
        }}
      >
        <div
          style={{
            opacity: interpolate(frame, [80, 95], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            background: `${C.accentGreen}10`,
            border: `1.5px solid ${C.accentGreen}30`,
            borderRadius: 12,
            padding: "16px 22px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
          <div style={{ color: C.accentGreen, fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>
            Fork → Branch → PR
          </div>
          <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>
            Feature Branch 工作流
          </div>
        </div>
        <div
          style={{
            opacity: interpolate(frame, [95, 110], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            background: `${C.accentRed}10`,
            border: `1.5px solid ${C.accentRed}30`,
            borderRadius: 12,
            padding: "16px 22px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>❌</div>
          <div style={{ color: C.accentRed, fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>
            Commit → Force Push
          </div>
          <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>
            直接到 main 分支
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div
        style={{
          opacity: interpolate(frame, [130, 155], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 50,
          display: "flex",
          gap: 18,
          alignItems: "center",
        }}
      >
        <span style={{
          background: `${C.accent}18`,
          color: C.accent,
          border: `1px solid ${C.accent}30`,
          borderRadius: 20,
          padding: "10px 24px",
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: 1,
        }}>
          点赞 · 收藏 · 关注
        </span>
        <span style={{ color: C.textDim, fontSize: 22 }}>🐙</span>
      </div>
    </AbsoluteFill>
  );
};

// ==================== 主组件：TransitionSeries ====================

export const GitHubPRWorkflow: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("shared/bgm.mp3")} volume={0.25} loop />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DURATIONS.intro}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.fork}>
          <ForkScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={slide({ direction: "from-right" })}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.branch}>
          <BranchScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={slide({ direction: "from-right" })}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.code}>
          <CodeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={slide({ direction: "from-right" })}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.lintcommit}>
          <LintCommitScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={slide({ direction: "from-right" })}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.pushpr}>
          <PushPRScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={slide({ direction: "from-right" })}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.reviewmerge}>
          <ReviewMergeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={fade()}
        />
        {/* --- 警示篇分割 --- */}
        <TransitionSeries.Sequence durationInFrames={DURATIONS.wrongmain}>
          <WrongMainScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.wrongforce}>
          <WrongForceScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: 6 })}
          presentation={fade()}
        />
        <TransitionSeries.Sequence durationInFrames={DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
