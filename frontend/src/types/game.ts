/* -------------------------------------------------------------------------- */
/*                                CORE ENUMS                                  */
/* -------------------------------------------------------------------------- */

export type GameStatus = "waiting" | "in_progress" | "completed";

export type GameMode =
  | "FLAG"
  | "WORLD_MAP"
  | "CAPITAL_RUSH"
  | "LAST_STANDING"
  | "SILHOUETTE"
  | "TEAM_BATTLE"
  | "EMOJI"
  | "BORDER_LOGIC"; // AUDIO reserved

export type RoomType = "SINGLE" | "PRIVATE" | "PUBLIC";

export type MapPlayMode = "FREE";

/* -------------------------------------------------------------------------- */
/*                              TEAM BATTLE TYPES                             */
/* -------------------------------------------------------------------------- */

export interface TeamVote {
  /** Raw answer text submitted by player */
  answer?: string;
  /** ISO country code if backend normalizes answers */
  country_code?: string;
  /** Unix timestamp (ms) for ordering / anti-spam */
  timestamp?: number;
}

export interface TeamBattleState {
  red_team: string[];
  blue_team: string[];
  red_score: number;
  blue_score: number;
  votes: Record<string, TeamVote>; // player -> vote (STRICT, no any)
  voting_ended: boolean;
  red_answer?: string;
  blue_answer?: string;
}

/* -------------------------------------------------------------------------- */
/*                                GAME STATE                                  */
/* -------------------------------------------------------------------------- */

export interface GameState {
  status: GameStatus;
  current_round: number;
  total_rounds: number;
  question?: Question;
  scores: Record<string, number>;
  time_remaining: number;

  game_mode: GameMode;
  room_type: RoomType;

  // Map modes
  map_play_mode?: MapPlayMode;
  current_country?: string;
  painted_countries?: Record<string, string>;
  player_colors?: Record<string, string>;

  // Timers / sync (reconnect + WS sync)
  deadline?: number; // unix timestamp from backend (authoritative)

  // Gameplay systems
  combo_multiplier?: Record<string, number>;
  penalties?: Record<string, number>;
  answered?: Record<string, boolean>;
  eliminated_players?: Record<string, boolean>;
  active_players?: number;
  hints_revealed?: number;

  // Modes
  team_battle?: TeamBattleState;

  audio?: {
    anthem_url: string;
    played: Record<string, boolean>;
  };

  emoji?: {
    emoji_sequence: string;
    valid_answers: string[];
  };
}

/* -------------------------------------------------------------------------- */
/*                                 QUESTION                                   */
/* -------------------------------------------------------------------------- */

export interface Question {
  type: string;
  flag_code?: string;
  country_name: string;
  country_code?: string;
  time_limit: number;

  // Mode-specific fields
  emoji?: string;
  silhouette?: string; // IMPORTANT for silhouette bug you mentioned
  capital?: string;
  neighbors?: string[];
  options?: string[];

  hints?: {
    region?: string;
    neighbors?: number;
    first_letter?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                               COUNTRY DATA                                 */
/* -------------------------------------------------------------------------- */

export interface CountryFacts {
  code: string;
  name: string;
  capital: string;
  population: string;
  region: string;
  flag: string;
}

/* -------------------------------------------------------------------------- */
/*                                 PLAYER                                     */
/* -------------------------------------------------------------------------- */

export interface Player {
  id: string;
  name: string;
  score: number;
  color?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 CHAT                                       */
/* -------------------------------------------------------------------------- */

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
  reactions?: Record<string, string[]>;
}

/* -------------------------------------------------------------------------- */
/*                              ROOM UPDATE (WS)                              */
/* -------------------------------------------------------------------------- */

export interface RoomUpdate {
  players: string[];
  current_count: number;
  status: GameStatus;
  current_round: number;

  owner?: string;
  game_mode?: GameMode;
  map_mode?: string;

  player_colors?: Record<string, string>;
  player_avatars?: Record<string, string>;

  team_battle?: TeamBattleState;
}

/* -------------------------------------------------------------------------- */
/*                           WEBSOCKET PAYLOAD TYPES                          */
/* -------------------------------------------------------------------------- */

export type RoomUpdatePayload = RoomUpdate;

export type StateSnapshotPayload = GameState;

export interface AnswerSubmittedPayload {
  player: string;
  is_correct: boolean;
  country_name?: string;
  country_code?: string;
  color?: string;
}

export interface PlayerEventPayload {
  player: string;
}

export interface PlayerDisconnectedPayload {
  player: string;
  grace_period_sec: number;
}

export interface ErrorPayload {
  message: string;
}

/* -------------------------------------------------------------------------- */
/*                       PRODUCTION-GRADE WS MESSAGE CONTRACT                 */
/* -------------------------------------------------------------------------- */

export type WebSocketMessage =
  | { type: "room_joined"; payload: StateSnapshotPayload }
  | { type: "room_update"; payload: RoomUpdatePayload }
  | { type: "state_snapshot"; payload: StateSnapshotPayload }
  | { type: "game_started"; payload: StateSnapshotPayload }
  | { type: "answer_submitted"; payload: AnswerSubmittedPayload }
  | { type: "score_update"; payload: { scores: Record<string, number> } }
  | { type: "player_joined"; payload: PlayerEventPayload }
  | { type: "player_reconnected"; payload: PlayerEventPayload }
  | { type: "player_disconnected"; payload: PlayerDisconnectedPayload }
  | { type: "player_removed_inactive"; payload: PlayerEventPayload }
  | { type: "round_started"; payload: StateSnapshotPayload }
  | { type: "round_ended"; payload: StateSnapshotPayload }
  | { type: "game_over"; payload: StateSnapshotPayload }
  | { type: "error"; payload: ErrorPayload };

/* -------------------------------------------------------------------------- */
/*                             LEGACY SAFE FALLBACK                           */       
/* -------------------------------------------------------------------------- */

export interface UnknownWebSocketMessage {
  type: string;
  payload?: unknown; // NEVER use `any` in production
}


/* -------------------------------------------------------------------------- */
/*                              ANSWER EVENT                                  */
/* -------------------------------------------------------------------------- */

export interface AnswerSubmitted {
  player: string;
  is_correct: boolean;
  country_name?: string;
  country_code?: string;
  color?: string;
}

/* -------------------------------------------------------------------------- */
/*                              GAME CONFIG                                   */
/* -------------------------------------------------------------------------- */

export interface GameConfig {
  username: string;
  gameMode: GameMode;
  rounds: number;
  roomType: RoomType;
  roomCode?: string;
  timeout?: number;
}
