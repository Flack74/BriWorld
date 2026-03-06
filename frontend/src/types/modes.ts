export type GameMode =
    | 'FLAG'
    | 'WORLD_MAP'
    | 'CAPITAL_RUSH'
    | 'SILHOUETTE'
    | 'EMOJI'
    | 'TEAM_BATTLE'
    | 'LAST_STANDING'
    | 'BORDER_LOGIC';
    // | 'AUDIO'; // TODO: Will be added later

export interface GameModeConfig {
    id: GameMode;
    title: string;
    description: string;
    isTimed: boolean;
    defaultTimeout: number; // in seconds, 0 for untimed
    minPlayers: number;
    icon: string;
}

export const MODES: Record<GameMode, GameModeConfig> = {
    FLAG: {
        id: 'FLAG',
        title: 'Flag Quiz',
        description: 'Identify countries by their flags',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 1,
        icon: '🚩'
    },
    WORLD_MAP: {
        id: 'WORLD_MAP',
        title: 'World Map',
        description: 'Find countries on the map',
        isTimed: false,
        defaultTimeout: 0,
        minPlayers: 1,
        icon: '🗺️'
    },
    CAPITAL_RUSH: {
        id: 'CAPITAL_RUSH',
        title: 'Capital Rush',
        description: 'Match capitals to countries',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 1,
        icon: '🏛️'
    },
    SILHOUETTE: {
        id: 'SILHOUETTE',
        title: 'Silhouette',
        description: 'Identify country by shape',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 1,
        icon: '👥'
    },
    EMOJI: {
        id: 'EMOJI',
        title: 'Emoji Quiz',
        description: 'Guess country from emojis',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 1,
        icon: '😀'
    },
    TEAM_BATTLE: {
        id: 'TEAM_BATTLE',
        title: 'Team Battle',
        description: 'Compete in teams',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 2,
        icon: '⚔️'
    },
    LAST_STANDING: {
        id: 'LAST_STANDING',
        title: 'Last Keep Standing',
        description: 'Battle royale style elimination',
        isTimed: true,
        defaultTimeout: 15,
        minPlayers: 2,
        icon: '🏆'
    },
    BORDER_LOGIC: {
        id: 'BORDER_LOGIC',
        title: 'Border Logic',
        description: 'Guess neighbors of countries',
        isTimed: true,
        defaultTimeout: 20,
        minPlayers: 1,
        icon: '🧩'
    }
    // AUDIO: { // TODO: Will be added later
    //     id: 'AUDIO',
    //     title: 'Audio',
    //     description: 'Guess from national anthems',
    //     isTimed: true,
    //     defaultTimeout: 20,
    //     minPlayers: 1,
    //     icon: '🎵'
    // }
};

export const isTimedMode = (mode: GameMode): boolean => {
    return MODES[mode]?.isTimed ?? true;
};

export const isMultiplayerOnly = (mode: GameMode): boolean => {
    return MODES[mode]?.minPlayers > 1;
};
