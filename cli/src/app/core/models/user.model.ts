export interface User {
  id: number;
  name: string;
  email: string;
  password?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'creator' | 'admin';
  is_active: boolean;
  is_online: boolean;
  last_seen_at?: string | null;
  subscription_status: 'free' | 'premium';
  subscription_end_date?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string | null;
  birthday?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  address?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  preferred_language: string;
  theme_mode: 'light' | 'dark' | 'system';
  layout: 'compact' | 'expanded';
  notifications: boolean;
  visibility_profile: boolean;
  visibility_achievements: boolean;
  visibility_progress: boolean;
  visibility_activity: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface UserStat {
  id: number;
  user_id: number;
  xp: number;
  level: number;
  rank: number;
  courses_completed: number;
  hours_learned: number;
  problems_solved: number;
  current_streak: number;
  longest_streak: number;
  average_score: number;
  created_at: string;
  updated_at?: string | null;
}

export interface UserGoal {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  target: number;
  current: number;
  unit: string;
  deadline?: string | null;
  category: 'learning' | 'practice' | 'achievement';
  created_at: string;
  updated_at?: string | null;
}

export interface Achievement {
  id: number;
  title: string;
  description?: string | null;
  icon?: string | null;
  category: 'learning' | 'teaching' | 'community' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at: string;
  updated_at?: string | null;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  date_earned: string;
  created_at: string;
  updated_at?: string | null;
}

export interface UserActivityLog {
  id: number;
  user_id: number;
  type:
    | 'course_started'
    | 'course_completed'
    | 'quiz_taken'
    | 'problem_solved'
    | 'badge_earned'
    | 'course_published';
  title: string;
  description?: string | null;
  date: string;
  duration?: number | null;
  created_at: string;
  updated_at?: string | null;
}
