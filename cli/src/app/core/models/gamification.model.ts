export interface BadgeCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Badge {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category_id: number;
  created_at: string;
  updated_at?: string | null;
}

export interface Level {
  id: number;
  level: number;
  name: string;
  xp_required: number;
  xp_to_next: number;
  color?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface LeaderboardEntry {
  id: number;
  user_id: number;
  xp: number;
  type: 'weekly' | 'monthly';
  created_at: string;
  updated_at?: string | null;
}

export interface GameStat {
  id: number;
  user_id: number;
  level_id: number;
  next_level_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
}
