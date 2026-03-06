export interface DailyChallenge {
  id: string;
  date: string;
  game_mode: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  country_code?: string;
  reward: number;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface SeasonRank {
  id: string;
  user_id: string;
  season_id: string;
  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  points: number;
  wins: number;
  losses: number;
}

export interface CountryMastery {
  id: string;
  user_id: string;
  country_code: string;
  level: number;
  xp: number;
  correct: number;
  incorrect: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface CustomRoomRules {
  time_limit: number;
  allow_hints: boolean;
  region_filter?: string;
  difficulty_level: 'EASY' | 'NORMAL' | 'HARD';
  max_players: number;
  min_players: number;
}
