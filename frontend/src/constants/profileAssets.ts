import type { ProfileAsset } from "@/types/profile";

export interface ProfileEffectTheme {
  id: string;
  name: string;
  description: string;
  avatarAsset: ProfileAsset;
  bannerAsset: ProfileAsset;
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeAvatarFrameSvg({
  strokeA,
  strokeB,
  accent,
  dash = "28 16",
}: {
  strokeA: string;
  strokeB: string;
  accent: string;
  dash?: string;
}) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${strokeA}" />
          <stop offset="100%" stop-color="${strokeB}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="256" cy="256" r="250" fill="url(#glow)" />
      <circle cx="256" cy="256" r="214" fill="none" stroke="url(#ring)" stroke-width="34" stroke-dasharray="${dash}" stroke-linecap="round"/>
      <circle cx="256" cy="256" r="188" fill="none" stroke="rgba(255,255,255,0.46)" stroke-width="8" />
      <circle cx="256" cy="58" r="12" fill="${accent}" />
      <circle cx="426" cy="160" r="9" fill="${strokeA}" />
      <circle cx="396" cy="396" r="11" fill="${strokeB}" />
      <circle cx="110" cy="382" r="10" fill="${accent}" />
      <circle cx="76" cy="172" r="8" fill="${strokeA}" />
    </svg>
  `);
}

function makeBannerEffectSvg({
  topA,
  topB,
  bottomA,
  bottomB,
  spark,
}: {
  topA: string;
  topB: string;
  bottomA: string;
  bottomB: string;
  spark: string;
}) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${topA}" stop-opacity="0.82"/>
          <stop offset="55%" stop-color="${topB}" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="${bottomB}" stop-opacity="0.12"/>
        </linearGradient>
        <linearGradient id="flare" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${spark}" stop-opacity="0"/>
          <stop offset="50%" stop-color="${spark}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="${spark}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="orb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${spark}" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="${spark}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#sky)"/>
      <path d="M0 272 C160 214 278 336 430 286 C570 240 662 168 806 198 C955 229 1071 318 1200 260 V420 H0 Z" fill="${bottomA}" fill-opacity="0.28"/>
      <path d="M0 304 C162 244 330 388 488 330 C648 271 760 204 916 232 C1044 255 1120 324 1200 298 V420 H0 Z" fill="${bottomB}" fill-opacity="0.18"/>
      <rect x="120" y="82" width="960" height="3" rx="2" fill="url(#flare)"/>
      <circle cx="196" cy="110" r="84" fill="url(#orb)"/>
      <circle cx="992" cy="86" r="92" fill="url(#orb)"/>
      <circle cx="628" cy="70" r="44" fill="${spark}" fill-opacity="0.22"/>
      <circle cx="584" cy="124" r="6" fill="${spark}" fill-opacity="0.8"/>
      <circle cx="622" cy="142" r="8" fill="${spark}" fill-opacity="0.7"/>
      <circle cx="662" cy="114" r="5" fill="${spark}" fill-opacity="0.85"/>
    </svg>
  `);
}

function buildAsset(id: string, name: string, url: string): ProfileAsset {
  return {
    id,
    user_id: "prebuilt",
    kind: "decoration",
    asset_type: "image",
    name,
    url,
  };
}

function createTheme(def: {
  id: string;
  name: string;
  description: string;
  avatar: { strokeA: string; strokeB: string; accent: string; dash?: string };
  banner: { topA: string; topB: string; bottomA: string; bottomB: string; spark: string };
}): ProfileEffectTheme {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    avatarAsset: buildAsset(
      `prebuilt-${def.id}-avatar`,
      `${def.name} Avatar Effect`,
      makeAvatarFrameSvg(def.avatar),
    ),
    bannerAsset: buildAsset(
      `prebuilt-${def.id}-banner`,
      `${def.name} Banner Effect`,
      makeBannerEffectSvg(def.banner),
    ),
  };
}

export const PROFILE_EFFECT_THEMES: ProfileEffectTheme[] = [
  createTheme({
    id: "snowfall",
    name: "Snowfall",
    description: "Icy banner glow with a snow halo around the avatar.",
    avatar: { strokeA: "#e0f2fe", strokeB: "#93c5fd", accent: "#ffffff" },
    banner: { topA: "#dbeafe", topB: "#c7d2fe", bottomA: "#93c5fd", bottomB: "#0f172a", spark: "#ffffff" },
  }),
  createTheme({
    id: "blossom",
    name: "Cherry Blossom",
    description: "Soft pink bloom across the banner and avatar ring.",
    avatar: { strokeA: "#fbcfe8", strokeB: "#f472b6", accent: "#fff1f2" },
    banner: { topA: "#fecdd3", topB: "#f9a8d4", bottomA: "#fb7185", bottomB: "#831843", spark: "#fff1f2" },
  }),
  createTheme({
    id: "ember",
    name: "Ember",
    description: "Warm cinematic glow with a fire-style avatar frame.",
    avatar: { strokeA: "#fdba74", strokeB: "#ef4444", accent: "#fff7ed", dash: "22 14" },
    banner: { topA: "#fdba74", topB: "#fb7185", bottomA: "#ea580c", bottomB: "#431407", spark: "#fff7ed" },
  }),
  createTheme({
    id: "neon",
    name: "Neon Pulse",
    description: "Electric cyan-violet effect pair with a modern Discord-like feel.",
    avatar: { strokeA: "#67e8f9", strokeB: "#a855f7", accent: "#e9d5ff", dash: "16 18" },
    banner: { topA: "#67e8f9", topB: "#818cf8", bottomA: "#a855f7", bottomB: "#111827", spark: "#e9d5ff" },
  }),
  createTheme({
    id: "midnight",
    name: "Midnight Stars",
    description: "Celestial banner haze and a clean cosmic avatar effect.",
    avatar: { strokeA: "#fde68a", strokeB: "#818cf8", accent: "#ffffff" },
    banner: { topA: "#312e81", topB: "#1e293b", bottomA: "#0f172a", bottomB: "#020617", spark: "#fde68a" },
  }),
];

export const PREBUILT_PROFILE_ASSETS: ProfileAsset[] = PROFILE_EFFECT_THEMES.flatMap((theme) => [
  theme.avatarAsset,
  theme.bannerAsset,
]);
