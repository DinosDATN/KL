export interface UserStats {
  id: number;
  user_id: number;
  xp: number;
  level: number;
  rank: number;
  reward_points: number;
  courses_completed: number;
  hours_learned: number;
  problems_solved: number;
  current_streak: number;
  longest_streak: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  progressPercentage: number;
}
