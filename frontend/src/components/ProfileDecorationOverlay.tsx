import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { AVATAR_DECORATION_PRESETS } from "@/constants/profileDecorations";
import { LottieRenderer } from "@/components/LottieRenderer";
import type { ProfileDecoration } from "@/types/profile";

interface ProfileDecorationOverlayProps {
  presetId?: string;
  customImageUrl?: string;
  decorations?: ProfileDecoration[];
  avatarSize?: number;
  className?: string;
}

type PresetEffectKind =
  | "rain"
  | "fire"
  | "snow"
  | "petals"
  | "hearts"
  | "notes"
  | "cosmic"
  | "clouds"
  | "storm"
  | "bubbles"
  | "leaves"
  | "spark"
  | "waves"
  | "animals"
  | "fruit"
  | "sweet"
  | "mythic"
  | "landscape";

type ThemeDefinition = {
  kind: PresetEffectKind;
  primary: string;
  secondary: string;
  glow: string;
  ring: string;
};

const THEME_MAP: Record<string, ThemeDefinition> = {
  raindrops: { kind: "rain", primary: "#bae6fd", secondary: "#38bdf8", glow: "rgba(56,189,248,0.34)", ring: "rgba(186,230,253,0.85)" },
  flames: { kind: "fire", primary: "#fde68a", secondary: "#f97316", glow: "rgba(249,115,22,0.38)", ring: "rgba(254,215,170,0.82)" },
  snow: { kind: "snow", primary: "#ffffff", secondary: "#bfdbfe", glow: "rgba(191,219,254,0.30)", ring: "rgba(255,255,255,0.86)" },
  petals: { kind: "petals", primary: "#fbcfe8", secondary: "#f472b6", glow: "rgba(244,114,182,0.28)", ring: "rgba(251,207,232,0.84)" },
  butterflies: { kind: "petals", primary: "#ddd6fe", secondary: "#a855f7", glow: "rgba(168,85,247,0.30)", ring: "rgba(221,214,254,0.86)" },
  hearts: { kind: "hearts", primary: "#fecdd3", secondary: "#fb7185", glow: "rgba(244,114,182,0.28)", ring: "rgba(254,205,211,0.84)" },
  notes: { kind: "notes", primary: "#f5d0fe", secondary: "#818cf8", glow: "rgba(129,140,248,0.28)", ring: "rgba(233,213,255,0.84)" },
  cosmic: { kind: "cosmic", primary: "#fde68a", secondary: "#818cf8", glow: "rgba(99,102,241,0.30)", ring: "rgba(253,230,138,0.82)" },
  clouds: { kind: "clouds", primary: "#ffffff", secondary: "#cbd5e1", glow: "rgba(226,232,240,0.34)", ring: "rgba(255,255,255,0.86)" },
  storm: { kind: "storm", primary: "#a5f3fc", secondary: "#facc15", glow: "rgba(34,211,238,0.34)", ring: "rgba(165,243,252,0.84)" },
  bubbles: { kind: "bubbles", primary: "#ffffff", secondary: "#7dd3fc", glow: "rgba(125,211,252,0.28)", ring: "rgba(224,242,254,0.84)" },
  leaves: { kind: "leaves", primary: "#fed7aa", secondary: "#f97316", glow: "rgba(249,115,22,0.30)", ring: "rgba(254,215,170,0.84)" },
  spark: { kind: "spark", primary: "#f5d0fe", secondary: "#22d3ee", glow: "rgba(168,85,247,0.30)", ring: "rgba(233,213,255,0.84)" },
  waves: { kind: "waves", primary: "#bae6fd", secondary: "#2563eb", glow: "rgba(37,99,235,0.28)", ring: "rgba(186,230,253,0.82)" },
  animals: { kind: "animals", primary: "#fef3c7", secondary: "#f59e0b", glow: "rgba(251,191,36,0.28)", ring: "rgba(254,243,199,0.84)" },
  fruit: { kind: "fruit", primary: "#fed7aa", secondary: "#f43f5e", glow: "rgba(251,146,60,0.28)", ring: "rgba(255,237,213,0.84)" },
  sweet: { kind: "sweet", primary: "#fce7f3", secondary: "#fb7185", glow: "rgba(244,114,182,0.28)", ring: "rgba(252,231,243,0.84)" },
  mythic: { kind: "mythic", primary: "#a7f3d0", secondary: "#14b8a6", glow: "rgba(20,184,166,0.30)", ring: "rgba(167,243,208,0.84)" },
  landscape: { kind: "landscape", primary: "#cbd5e1", secondary: "#60a5fa", glow: "rgba(96,165,250,0.26)", ring: "rgba(226,232,240,0.82)" },
};

const DEFAULT_THEME = THEME_MAP.cosmic;
const VIEWBOX = 160;
const CENTER = 80;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTheme(presetId?: string) {
  const preset = AVATAR_DECORATION_PRESETS.find((item) => item.id === presetId);
  if (!preset) return DEFAULT_THEME;
  return THEME_MAP[preset.vibe] || DEFAULT_THEME;
}

function getPreset(presetId?: string) {
  return AVATAR_DECORATION_PRESETS.find((item) => item.id === presetId);
}

function getAvatarFrameScale(scale?: number) {
  return clamp(scale ?? 1.18, 1.1, 1.25);
}

function inferAssetType(assetUrl: string): "image" | "gif" | "lottie" {
  const normalized = assetUrl.split("?")[0]?.toLowerCase() || "";
  if (normalized.endsWith(".json")) return "lottie";
  if (normalized.endsWith(".gif")) return "gif";
  return "image";
}

function polarPoint(angleDeg: number, radius: number) {
  const angle = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function ringMaskStyle() {
  return {
    WebkitMaskImage: "radial-gradient(circle, transparent 59%, white 64%, white 81%, transparent 85%)",
    maskImage: "radial-gradient(circle, transparent 59%, white 64%, white 81%, transparent 85%)",
  } as const;
}

function DecorationMedia({
  assetUrl,
  assetType,
  loop = true,
  speed = 1,
  size,
  scale = 1,
  rotation = 0,
  zIndex = 1,
}: {
  assetUrl: string;
  assetType: "image" | "gif" | "lottie";
  loop?: boolean;
  speed?: number;
  size: number;
  scale?: number;
  rotation?: number;
  zIndex?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" style={{ zIndex }}>
      <div
        className="relative aspect-square shrink-0"
        style={{
          width: size,
          height: size,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        {assetType === "lottie" ? (
          <LottieRenderer src={assetUrl} loop={loop} speed={speed} className="h-full w-full" />
        ) : (
          <img src={assetUrl} alt="" className="h-full w-full object-contain" draggable={false} />
        )}
      </div>
    </div>
  );
}

function BaseFrame({ theme }: { theme: ThemeDefinition }) {
  const sheenRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!sheenRef.current) return;
    const tween = gsap.fromTo(
      sheenRef.current,
      { rotate: -10, opacity: 0.24 },
      { rotate: 12, opacity: 0.62, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" },
    );
    return () => tween.kill();
  }, []);

  return (
    <>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <filter id="frame-glow">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={CENTER} cy={CENTER} r="72" fill="none" stroke={theme.ring} strokeWidth="4" opacity="0.85" />
        <circle cx={CENTER} cy={CENTER} r="76" fill="none" stroke={theme.glow} strokeWidth="10" opacity="0.32" filter="url(#frame-glow)" />
      </svg>
      <div
        ref={sheenRef}
        className="absolute inset-0 rounded-full"
        style={{
          ...ringMaskStyle(),
          background: `conic-gradient(from 0deg, transparent 0deg, ${theme.primary} 42deg, transparent 82deg, transparent 220deg, ${theme.secondary} 290deg, transparent 325deg)`,
          mixBlendMode: "screen",
          opacity: 0.55,
        }}
      />
    </>
  );
}

function RainFrame({ theme }: { theme: ThemeDefinition }) {
  const rootRef = useRef<SVGSVGElement | null>(null);
  const dropRefs = useRef<SVGLineElement[]>([]);
  const splashRefs = useRef<SVGCircleElement[]>([]);
  dropRefs.current = [];
  splashRefs.current = [];

  const drops = useMemo(
    () => Array.from({ length: 24 }).map((_, index) => {
      const angle = (360 / 24) * index;
      return {
        index,
        start: polarPoint(angle, 60),
        end: polarPoint(angle + 2.5, 82),
      };
    }),
    [],
  );

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      dropRefs.current.forEach((drop, index) => {
        const splash = splashRefs.current[index];
        const driftX = index % 2 === 0 ? 3 : -3;
        gsap.set(drop, { y: -22 - (index % 4) * 4, x: -driftX, opacity: 0 });
        gsap.set(splash, { scale: 0.35, opacity: 0 });
        const tl = gsap.timeline({ repeat: -1, delay: index * 0.07 });
        tl.to(drop, { y: 0, x: driftX, opacity: 1, duration: 0.56 + (index % 3) * 0.08, ease: "none" });
        tl.to(drop, { opacity: 0, duration: 0.04, ease: "none" });
        tl.to(splash, { opacity: 0.95, scale: 1.08, duration: 0.12, ease: "power1.out" }, "<");
        tl.to(splash, { opacity: 0, scale: 1.6, duration: 0.18, ease: "power1.out" });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <BaseFrame theme={theme} />
      <svg ref={rootRef} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {drops.map(({ index, start, end }) => (
          <g key={index}>
            <line
              ref={(node) => { if (node) dropRefs.current[index] = node; }}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={index % 3 === 0 ? theme.primary : theme.secondary}
              strokeWidth={index % 3 === 0 ? 2.8 : 2.2}
              strokeLinecap="round"
            />
            <circle
              ref={(node) => { if (node) splashRefs.current[index] = node; }}
              cx={end.x}
              cy={end.y}
              r="2.1"
              fill={theme.primary}
            />
          </g>
        ))}
      </svg>
    </>
  );
}

function FireFrame({ theme }: { theme: ThemeDefinition }) {
  const rootRef = useRef<SVGSVGElement | null>(null);
  const flameRefs = useRef<SVGGElement[]>([]);
  flameRefs.current = [];

  const flames = useMemo(
    () => Array.from({ length: 18 }).map((_, index) => {
      const angle = (360 / 18) * index;
      const anchor = polarPoint(angle, 81);
      const width = 7 + (index % 3) * 2;
      const height = 16 + (index % 4) * 3;
      return { index, angle, anchor, width, height };
    }),
    [],
  );

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      flameRefs.current.forEach((flame, index) => {
        gsap.set(flame, { transformOrigin: "50% 100%" });
        gsap.to(flame, {
          y: -7 - (index % 3) * 2,
          scaleY: 1.34,
          scaleX: 0.84,
          opacity: 0.96,
          duration: 0.44 + (index % 3) * 0.07,
          delay: index * 0.035,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <BaseFrame theme={theme} />
      <svg ref={rootRef} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="56%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {flames.map(({ index, angle, anchor, width, height }) => (
          <g
            key={index}
            ref={(node) => { if (node) flameRefs.current[index] = node; }}
            transform={`translate(${anchor.x}, ${anchor.y}) rotate(${angle + 180})`}
          >
            <path
              d={`M 0 0 C ${width * 0.5} ${-height * 0.18}, ${width * 0.34} ${-height * 0.82}, 0 ${-height} C ${-width * 0.34} ${-height * 0.82}, ${-width * 0.5} ${-height * 0.18}, 0 0 Z`}
              fill="url(#flame-gradient)"
            />
            <path
              d={`M 0 -2 C ${width * 0.22} ${-height * 0.28}, ${width * 0.16} ${-height * 0.58}, 0 ${-height * 0.74} C ${-width * 0.16} ${-height * 0.58}, ${-width * 0.22} ${-height * 0.28}, 0 -2 Z`}
              fill={theme.primary}
              opacity="0.72"
            />
          </g>
        ))}
      </svg>
    </>
  );
}

function MotifFrame({
  theme,
  symbol,
  count = 8,
  radius = 80,
  size = 14,
  drift = 10,
}: {
  theme: ThemeDefinition;
  symbol: string;
  count?: number;
  radius?: number;
  size?: number;
  drift?: number;
}) {
  const refs = useRef<HTMLSpanElement[]>([]);
  refs.current = [];
  const items = useMemo(() => Array.from({ length: count }).map((_, index) => {
    const angle = (360 / count) * index;
    return { index, point: polarPoint(angle, radius), angle };
  }), [count, radius]);

  useLayoutEffect(() => {
    refs.current.forEach((node, index) => {
      gsap.set(node, { xPercent: -50, yPercent: -50 });
      gsap.to(node, {
        y: index % 2 === 0 ? -drift : drift * 0.7,
        x: index % 3 === 0 ? drift * 0.45 : -drift * 0.35,
        rotate: index % 2 === 0 ? 16 : -16,
        scale: 1.08,
        duration: 1.8 + (index % 3) * 0.18,
        delay: index * 0.08,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
    return () => gsap.killTweensOf(refs.current);
  }, [drift]);

  return (
    <>
      <BaseFrame theme={theme} />
      {items.map(({ index, point }) => (
        <span
          key={index}
          ref={(node) => { if (node) refs.current[index] = node; }}
          className="absolute"
          style={{
            left: point.x,
            top: point.y,
            fontSize: size,
            filter: `drop-shadow(0 0 10px ${theme.glow})`,
        }}
      >
          {symbol}
        </span>
      ))}
    </>
  );
}

function BubbleFrame({ theme }: { theme: ThemeDefinition }) {
  const refs = useRef<HTMLDivElement[]>([]);
  refs.current = [];
  const items = useMemo(() => Array.from({ length: 8 }).map((_, index) => {
    const angle = 180 + index * 18;
    const point = polarPoint(angle, 78);
    return { index, point, size: 8 + (index % 3) * 4 };
  }), []);

  useLayoutEffect(() => {
    refs.current.forEach((node, index) => {
      gsap.to(node, {
        y: -18 - (index % 3) * 5,
        x: index % 2 === 0 ? 8 : -8,
        scale: 1.15,
        opacity: 0.4,
        duration: 1.9 + (index % 3) * 0.2,
        delay: index * 0.12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
    return () => gsap.killTweensOf(refs.current);
  }, []);

  return (
    <>
      <BaseFrame theme={theme} />
      {items.map(({ index, point, size }) => (
        <div
          key={index}
          ref={(node) => { if (node) refs.current[index] = node; }}
          className="absolute rounded-full border"
          style={{
            left: point.x - size / 2,
            top: point.y - size / 2,
            width: size,
            height: size,
            borderColor: theme.primary,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.25), 0 0 12px ${theme.glow}`,
            background: "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </>
  );
}

function CloudFrame({ theme }: { theme: ThemeDefinition }) {
  const refs = useRef<HTMLDivElement[]>([]);
  refs.current = [];
  const items = useMemo(() => [210, 258, 306].map((angle, index) => ({
    index,
    point: polarPoint(angle, 80),
  })), []);

  useLayoutEffect(() => {
    refs.current.forEach((node, index) => {
      gsap.to(node, {
        x: index % 2 === 0 ? 12 : -12,
        duration: 2.8 + index * 0.3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
    return () => gsap.killTweensOf(refs.current);
  }, []);

  return (
    <>
      <BaseFrame theme={theme} />
      {items.map(({ index, point }) => (
        <div
          key={index}
          ref={(node) => { if (node) refs.current[index] = node; }}
          className="absolute"
          style={{ left: point.x - 16, top: point.y - 10, width: 32, height: 20 }}
        >
          <div className="absolute bottom-0 left-1 h-3 w-7 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
          <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-white/92" />
          <div className="absolute left-3 top-0 h-5 w-5 rounded-full bg-white/96" />
          <div className="absolute right-1 top-2 h-4 w-4 rounded-full bg-white/92" />
        </div>
      ))}
    </>
  );
}

function StormFrame({ theme }: { theme: ThemeDefinition }) {
  const boltRefs = useRef<HTMLDivElement[]>([]);
  boltRefs.current = [];
  const items = useMemo(() => [232, 262, 292].map((angle, index) => ({
    index,
    point: polarPoint(angle, 80),
  })), []);

  useLayoutEffect(() => {
    boltRefs.current.forEach((node, index) => {
      const tl = gsap.timeline({ repeat: -1, delay: index * 0.45 });
      tl.set(node, { opacity: 0.12, scale: 0.86 });
      tl.to(node, { opacity: 1, scale: 1.08, duration: 0.08, ease: "power2.out" });
      tl.to(node, { opacity: 0.15, duration: 0.18, ease: "power2.out" });
      tl.to(node, { opacity: 0.88, duration: 0.06, ease: "power2.out" });
      tl.to(node, { opacity: 0.14, duration: 0.34, ease: "power1.out" });
    });
    return () => gsap.killTweensOf(boltRefs.current);
  }, []);

  return (
    <>
      <RainFrame theme={theme} />
      {items.map(({ index, point }) => (
        <div
          key={index}
          ref={(node) => { if (node) boltRefs.current[index] = node; }}
          className="absolute text-[14px]"
          style={{
            left: point.x - 7,
            top: point.y - 8,
            color: theme.secondary,
            textShadow: `0 0 14px ${theme.glow}`,
          }}
        >
          ⚡
        </div>
      ))}
    </>
  );
}

function WaveFrame({ theme }: { theme: ThemeDefinition }) {
  const refs = useRef<HTMLDivElement[]>([]);
  refs.current = [];
  const items = useMemo(() => [200, 230, 260, 290, 320].map((angle, index) => ({
    index,
    point: polarPoint(angle, 80),
  })), []);

  useLayoutEffect(() => {
    refs.current.forEach((node, index) => {
      gsap.to(node, {
        y: index % 2 === 0 ? -6 : 6,
        x: index % 2 === 0 ? 8 : -8,
        duration: 1.8 + index * 0.12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
    return () => gsap.killTweensOf(refs.current);
  }, []);

  return (
    <>
      <BaseFrame theme={theme} />
      {items.map(({ index, point }) => (
        <div
          key={index}
          ref={(node) => { if (node) refs.current[index] = node; }}
          className="absolute text-[16px]"
          style={{
            left: point.x - 8,
            top: point.y - 8,
            color: theme.primary,
            textShadow: `0 0 10px ${theme.glow}`,
          }}
        >
          ≋
        </div>
      ))}
    </>
  );
}

function PresetFrameEffect({
  presetId,
  frameSize,
}: {
  presetId: string;
  frameSize: number;
}) {
  const theme = getTheme(presetId);
  const preset = getPreset(presetId);
  const emoji = preset?.emoji || "✦";

  let frame: JSX.Element;
  switch (theme.kind) {
    case "rain":
      frame = <RainFrame theme={theme} />;
      break;
    case "fire":
      frame = <FireFrame theme={theme} />;
      break;
    case "snow":
      frame = <MotifFrame theme={theme} symbol={emoji} count={9} size={14} drift={8} />;
      break;
    case "petals":
      frame = <MotifFrame theme={theme} symbol={emoji} count={8} size={15} drift={10} />;
      break;
    case "hearts":
      frame = <MotifFrame theme={theme} symbol={emoji} count={8} size={14} drift={8} />;
      break;
    case "notes":
      frame = <MotifFrame theme={theme} symbol={emoji} count={7} size={16} drift={10} />;
      break;
    case "cosmic":
      frame = <MotifFrame theme={theme} symbol={emoji} count={9} size={14} drift={7} />;
      break;
    case "clouds":
      frame = <CloudFrame theme={theme} />;
      break;
    case "storm":
      frame = <StormFrame theme={theme} />;
      break;
    case "bubbles":
      frame = <BubbleFrame theme={theme} />;
      break;
    case "leaves":
      frame = <MotifFrame theme={theme} symbol={emoji} count={8} size={15} drift={10} />;
      break;
    case "spark":
      frame = <MotifFrame theme={theme} symbol={emoji} count={8} size={14} drift={8} />;
      break;
    case "waves":
      frame = <WaveFrame theme={theme} />;
      break;
    case "animals":
      frame = <MotifFrame theme={theme} symbol={emoji} count={6} size={16} drift={6} />;
      break;
    case "fruit":
      frame = <MotifFrame theme={theme} symbol={emoji} count={7} size={15} drift={9} />;
      break;
    case "sweet":
      frame = <MotifFrame theme={theme} symbol={emoji} count={7} size={15} drift={8} />;
      break;
    case "mythic":
      frame = <MotifFrame theme={theme} symbol={emoji} count={8} size={16} drift={9} />;
      break;
    case "landscape":
      frame = <WaveFrame theme={theme} />;
      break;
    default:
      frame = <BaseFrame theme={theme} />;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible transition-transform duration-300 group-hover/profile-avatar:scale-[1.02]"
      style={{ zIndex: 1 }}
    >
      <div
        className="relative aspect-square"
        style={{
          width: frameSize,
          height: frameSize,
          filter: `drop-shadow(0 0 24px ${theme.glow})`,
        }}
      >
        {frame}
      </div>
    </div>
  );
}

export function ProfileDecorationOverlay({
  presetId,
  customImageUrl,
  decorations = [],
  avatarSize = 128,
  className = "",
}: ProfileDecorationOverlayProps) {
  const frameSize = clamp(Math.round(avatarSize * 1.18), 140, 160);
  const avatarFrames = useMemo(
    () => decorations
      .filter((item) => item.target === "avatar" && item.enabled)
      .sort((a, b) => a.z_index - b.z_index),
    [decorations],
  );

  if (!presetId && !customImageUrl && avatarFrames.length === 0) {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible ${className}`}>
      {presetId ? <PresetFrameEffect presetId={presetId} frameSize={frameSize} /> : null}

      {customImageUrl ? (
        <DecorationMedia
          assetUrl={customImageUrl}
          assetType={inferAssetType(customImageUrl)}
          size={frameSize}
          scale={1}
          zIndex={2}
        />
      ) : null}

      {avatarFrames.map((item) => (
        <DecorationMedia
          key={item.id || `${item.name}-${item.z_index}`}
          assetUrl={item.asset_url}
          assetType={item.asset_type}
          loop={item.loop}
          speed={item.speed}
          size={frameSize}
          scale={getAvatarFrameScale(item.scale)}
          rotation={item.rotation}
          zIndex={3 + item.z_index}
        />
      ))}
    </div>
  );
}
