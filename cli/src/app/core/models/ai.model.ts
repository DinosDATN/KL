export interface AIMessage {
  id: number;
  user_id: number;
  type: 'chat' | 'hint' | 'review' | 'progress_report';
  prompt?: string | null;
  response?: string | null;
  related_problem_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AICodeReview {
  id: number;
  submission_id: number;
  review: string;
  score?: number | null;
  created_at: string;
  updated_at?: string | null;
}
