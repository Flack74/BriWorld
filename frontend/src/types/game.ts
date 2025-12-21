export interface GameState {
  status: 'waiting' | 'in_progress' | 'completed';
  current_round: number;
  total_rounds: number;
  question?: Question;
  scores: Record<string, number>;
  time_remaining: number;
  game_mode: 'FLAG' | 'WORLD_MAP';
  room_type: 'SINGLE' | 'PRIVATE' | 'PUBLIC';
  map_play_mode?: 'FREE';
  player_colors?: Record<string, string>;
  current_country?: string;
  painted_countries?: Record<string, string>;
  deadline?: number;
}

export interface Question {
  type: string;
  flag_code?: string;
  country_name: string;
  time_limit: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  color?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
  reactions?: Record<string, string[]>;
}

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

export interface RoomUpdate {
  players: string[];
  current_count: number;
  status: string;
  current_round: number;
  player_colors?: Record<string, string>;
  player_avatars?: Record<string, string>;
  owner?: string;
  game_mode?: 'FLAG' | 'WORLD_MAP';
}

export interface AnswerSubmitted {
  player: string;
  is_correct: boolean;
  country_name?: string;
  country_code?: string;
  color?: string;
}

export interface GameConfig {
  username: string;
  gameMode: 'FLAG' | 'WORLD_MAP';
  rounds: number;
  roomType: 'SINGLE' | 'PRIVATE' | 'PUBLIC';
  roomCode?: string;
  timeout?: number;
}