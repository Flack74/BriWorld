export interface RankInfo {
  rating: number;
  rank: string;
  rank_tier: number;
  position: number;
  placement_matches: number;
  is_placement_complete: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url?: string;
  rating: number;
  rank: string;
  rank_tier: number;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const RANK_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF',
  MASTER: '#9D4EDD',
  GRANDMASTER: '#FF006E',
  CONTINENTAL: '#FB5607',
  WORLD_CLASS: '#FFBE0B',
  LEGEND: '#FF0054',
};

export const RANK_NAMES: Record<string, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
  MASTER: 'Master',
  GRANDMASTER: 'Grandmaster',
  CONTINENTAL: 'Continental',
  WORLD_CLASS: 'World-Class',
  LEGEND: 'Legend',
};
