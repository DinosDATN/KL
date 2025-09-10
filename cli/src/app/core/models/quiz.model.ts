export interface Quiz {
  id: number;
  title: string;
  description?: string | null;
  lesson_id?: number | null;
  type: 'multiple_choice' | 'true_false' | 'code';
  time_limit?: number | null;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options?: string | null; // JSON string for multiple-choice
  correct_answer: string;
  explanation?: string | null;
  points: number;
  position: number;
  created_at: string;
  updated_at?: string | null;
}

export interface UserQuizResult {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  completed_at: string;
}
