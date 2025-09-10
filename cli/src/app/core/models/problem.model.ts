export interface ProblemCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Problem {
  id: number;
  title: string;
  description?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_time?: string | null;
  likes: number;
  dislikes: number;
  acceptance: number;
  total_submissions: number;
  solved_count: number;
  is_new: boolean;
  is_popular: boolean;
  is_premium: boolean;
  category_id: number;
  created_by: number;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string | null;
}

export interface ProblemTag {
  problem_id: number;
  tag_id: number;
}

export interface ProblemExample {
  id: number;
  problem_id: number;
  input: string;
  output: string;
  explanation?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ProblemConstraint {
  id: number;
  problem_id: number;
  constraint_text: string;
  created_at: string;
  updated_at?: string | null;
}

export interface StarterCode {
  id: number;
  problem_id: number;
  language: string;
  code: string;
  created_at: string;
  updated_at?: string | null;
}

export interface SubmissionCode {
  id: number;
  source_code: string;
  created_at: string;
  updated_at?: string | null;
}

export interface Submission {
  id: number;
  user_id: number;
  problem_id: number;
  code_id: number;
  language: string;
  status: 'pending' | 'accepted' | 'wrong' | 'error' | 'timeout';
  score: number;
  exec_time?: number | null;
  memory_used?: number | null;
  submitted_at: string;
}

export interface ProblemComment {
  id: number;
  user_id: number;
  problem_id: number;
  content: string;
  created_at: string;
  updated_at?: string | null;
}

export interface TestCase {
  id: number;
  problem_id: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
  created_at: string;
  updated_at?: string | null;
}
