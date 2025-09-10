export interface Hint {
  id: number;
  problem_id: number;
  content: string;
  coin_cost: number;
  created_at: string;
  updated_at?: string | null;
}

export interface UserHintUsage {
  id: number;
  user_id: number;
  hint_id: number;
  used_at: string;
}
