export interface AvatarDecorationPreset {
  id: string;
  name: string;
  emoji: string;
  accent: string;
  vibe: string;
}

export const AVATAR_DECORATION_PRESETS: AvatarDecorationPreset[] = [
  { id: "rain", name: "Raining", emoji: "🌧️", accent: "from-sky-400 to-slate-600", vibe: "raindrops" },
  { id: "fire", name: "Fire", emoji: "🔥", accent: "from-orange-400 to-red-600", vibe: "flames" },
  { id: "flowers", name: "Flowers", emoji: "🌸", accent: "from-pink-300 to-rose-500", vibe: "petals" },
  { id: "cherry_blossom", name: "Cherry Blossom", emoji: "🌺", accent: "from-rose-200 to-pink-500", vibe: "petals" },
  { id: "cute", name: "Cute", emoji: "💖", accent: "from-fuchsia-300 to-pink-500", vibe: "hearts" },
  { id: "snow", name: "Snow", emoji: "❄️", accent: "from-cyan-100 to-sky-500", vibe: "snow" },
  { id: "butterflies", name: "Butterflies", emoji: "🦋", accent: "from-indigo-300 to-violet-500", vibe: "butterflies" },
  { id: "strawberries", name: "Strawberries", emoji: "🍓", accent: "from-rose-300 to-red-500", vibe: "fruit" },
  { id: "mangos", name: "Mangos", emoji: "🥭", accent: "from-yellow-300 to-orange-500", vibe: "fruit" },
  { id: "citrus", name: "Citrus Pop", emoji: "🍊", accent: "from-orange-300 to-amber-500", vibe: "fruit" },
  { id: "grapes", name: "Grapes", emoji: "🍇", accent: "from-purple-300 to-fuchsia-600", vibe: "fruit" },
  { id: "watermelon", name: "Watermelon", emoji: "🍉", accent: "from-emerald-300 to-rose-500", vibe: "fruit" },
  { id: "cats", name: "Cats", emoji: "🐱", accent: "from-amber-200 to-orange-400", vibe: "animals" },
  { id: "dogs", name: "Dogs", emoji: "🐶", accent: "from-yellow-200 to-amber-500", vibe: "animals" },
  { id: "pandas", name: "Pandas", emoji: "🐼", accent: "from-slate-200 to-slate-600", vibe: "animals" },
  { id: "foxes", name: "Foxes", emoji: "🦊", accent: "from-orange-300 to-amber-600", vibe: "animals" },
  { id: "dragons", name: "Dragons", emoji: "🐉", accent: "from-emerald-300 to-teal-700", vibe: "mythic" },
  { id: "anime", name: "Anime Burst", emoji: "✨", accent: "from-pink-400 to-indigo-600", vibe: "spark" },
  { id: "music", name: "Music", emoji: "🎵", accent: "from-indigo-300 to-cyan-500", vibe: "notes" },
  { id: "music_notes", name: "Music Notes", emoji: "🎶", accent: "from-violet-300 to-fuchsia-500", vibe: "notes" },
  { id: "gaming", name: "Gaming", emoji: "🎮", accent: "from-sky-400 to-indigo-600", vibe: "spark" },
  { id: "fireworks", name: "Fireworks", emoji: "🎆", accent: "from-fuchsia-400 to-orange-500", vibe: "spark" },
  { id: "autumn_leaves", name: "Autumn Leaves", emoji: "🍁", accent: "from-orange-300 to-red-700", vibe: "leaves" },
  { id: "mountains", name: "Mountains", emoji: "🏔️", accent: "from-slate-300 to-blue-700", vibe: "landscape" },
  { id: "cake", name: "Cake", emoji: "🎂", accent: "from-pink-200 to-rose-400", vibe: "sweet" },
  { id: "dessert", name: "Dessert", emoji: "🍰", accent: "from-amber-200 to-pink-400", vibe: "sweet" },
  { id: "moon", name: "Moon", emoji: "🌙", accent: "from-indigo-300 to-slate-700", vibe: "cosmic" },
  { id: "sun", name: "Sun", emoji: "☀️", accent: "from-yellow-300 to-orange-500", vibe: "cosmic" },
  { id: "stars", name: "Stars", emoji: "⭐", accent: "from-amber-200 to-yellow-500", vibe: "cosmic" },
  { id: "starry_night", name: "Starry Night", emoji: "🌌", accent: "from-indigo-500 to-slate-900", vibe: "cosmic" },
  { id: "clouds", name: "Clouds", emoji: "☁️", accent: "from-slate-200 to-sky-500", vibe: "clouds" },
  { id: "lightning", name: "Lightning", emoji: "⚡", accent: "from-cyan-300 to-yellow-400", vibe: "storm" },
  { id: "hearts", name: "Hearts", emoji: "💘", accent: "from-rose-300 to-red-500", vibe: "hearts" },
  { id: "bubbles", name: "Bubbles", emoji: "🫧", accent: "from-cyan-200 to-blue-400", vibe: "bubbles" },
  { id: "sakura", name: "Sakura Dream", emoji: "🌷", accent: "from-pink-200 to-fuchsia-500", vibe: "petals" },
  { id: "neon_arcade", name: "Neon Arcade", emoji: "🕹️", accent: "from-cyan-400 to-purple-600", vibe: "spark" },
  { id: "ocean", name: "Ocean Tide", emoji: "🌊", accent: "from-sky-300 to-blue-700", vibe: "waves" },
  { id: "forest", name: "Forest Glow", emoji: "🌿", accent: "from-lime-300 to-emerald-700", vibe: "leaves" },
  { id: "planets", name: "Planets", emoji: "🪐", accent: "from-violet-300 to-slate-800", vibe: "cosmic" },
  { id: "birds", name: "Birdsong", emoji: "🕊️", accent: "from-slate-100 to-sky-400", vibe: "animals" },
];
