import { GameMode, RoomType } from '../types/lobby';

interface GameModeConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  roomTypes: RoomType[];
}

// EXPLORATION MODES - No rounds, no timers, no round state
const EXPLORATION_MODES = [];

// ROUND-BASED MODES - Have rounds, timers, round state
// const ROUND_BASED_MODES = ['FLAG', 'WORLD_MAP', 'CAPITAL_RUSH', 'SILHOUETTE', 'EMOJI', 'TEAM_BATTLE', 'LAST_STANDING', 'BORDER_LOGIC']; // 'AUDIO' - TODO: Will be added later
const ROUND_BASED_MODES = ['FLAG', 'WORLD_MAP', 'SILHOUETTE', 'EMOJI', 'LAST_STANDING', 'BORDER_LOGIC']; // 'CAPITAL_RUSH', 'TEAM_BATTLE' - TODO: Will be added later

export const isExplorationMode = (mode: string): boolean => EXPLORATION_MODES.includes(mode);
export const isRoundBasedMode = (mode: string): boolean => ROUND_BASED_MODES.includes(mode);

const GAME_MODE_CONFIG: GameModeConfig[] = [
  // Classic Modes
  { id: "FLAG", title: "Flag Quiz", description: "Identify countries by their flags", icon: "🚩", roomTypes: ["single", "private", "public"] },
  { id: "WORLD_MAP", title: "World Map", description: "Paint countries on the map", icon: "🗺️", roomTypes: ["single", "private", "public"] },
  // { id: "CAPITAL_RUSH", title: "Capital Rush", description: "Name capitals or countries", icon: "🏛️", roomTypes: ["single", "private", "public"] }, // TODO: Will be added later
  { id: "SILHOUETTE", title: "Silhouette", description: "Guess country by outline", icon: "🗾", roomTypes: ["single", "private", "public"] },
  { id: "EMOJI", title: "Emoji Puzzle", description: "Decode country emoji sequences", icon: "😀", roomTypes: ["single", "private", "public"] },

  // Speed & Reaction Modes
  { id: "LAST_STANDING", title: "Last Standing", description: "Wrong answer = eliminated", icon: "💀", roomTypes: ["single", "private", "public"] },

  // Knowledge & Deduction Modes
  { id: "BORDER_LOGIC", title: "Border Logic", description: "Guess country by neighbors", icon: "🧠", roomTypes: ["single", "private", "public"] },

  // Team Modes (Multiplayer only)
  // { id: "TEAM_BATTLE", title: "Team Battle", description: "Red vs Blue team competition", icon: "⚔️", roomTypes: ["private", "public"] }, // TODO: Will be added later

  // Creative Modes
  // { id: "AUDIO", title: "Audio Mode", description: "Guess by national anthems", icon: "🎵", roomTypes: ["single", "private", "public"] }, // TODO: Will be added later
];

const generateGameModes = (): Record<string, GameMode> => {
  return GAME_MODE_CONFIG.reduce((acc, mode) => {
    const key = mode.id === "FLAG" ? "FLAG_QUIZ" : mode.id;
    acc[key] = {
      id: mode.id,
      title: mode.title,
      description: mode.description,
      icon: mode.icon,
    };
    return acc;
  }, {} as Record<string, GameMode>);
};

const generateModeVisibility = (): Record<RoomType, string[]> => {
  const visibility: Record<RoomType, string[]> = {
    single: [],
    private: [],
    public: [],
  };

  GAME_MODE_CONFIG.forEach(mode => {
    const key = mode.id === "FLAG" ? "FLAG_QUIZ" : mode.id;
    mode.roomTypes.forEach(roomType => {
      visibility[roomType].push(key);
    });
  });

  return visibility;
};

export const GAME_MODES = generateGameModes();
export const MODE_VISIBILITY = generateModeVisibility();
