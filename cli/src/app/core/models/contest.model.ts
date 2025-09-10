export interface Contest {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ContestProblem {
  id: number;
  contest_id: number;
  problem_id: number;
  score: number;
  created_at: string;
  updated_at?: string | null;
}

export interface UserContest {
  id: number;
  contest_id: number;
  user_id: number;
  joined_at: string;
}

export interface ContestSubmission {
  id: number;
  user_id: number;
  contest_problem_id: number;
  code_id: number;
  language: string;
  status: 'accepted' | 'wrong' | 'error';
  score: number;
  submitted_at: string;
}
