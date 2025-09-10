export interface UserRecommendation {
  id: number;
  user_id: number;
  recommended_type: 'course' | 'problem' | 'document';
  recommended_id: number;
  reason?: string | null;
  score: number;
  created_at: string;
  updated_at?: string | null;
}
