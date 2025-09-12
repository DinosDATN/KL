import { User } from './user.model';
import { Problem } from './problem.model';

export interface Contest {
  id: number;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
  // Extended fields from API
  Creator?: User;
  ContestProblems?: ContestProblem[];
  UserContests?: UserContest[];
  status?: 'upcoming' | 'active' | 'completed';
  duration?: number; // in minutes
  time_remaining?: number; // in minutes
  problem_count?: number;
  participant_count?: number;
  is_registered?: boolean;
}

export interface ContestProblem {
  id: number;
  contest_id: number;
  problem_id: number;
  score: number;
  created_at: string;
  updated_at?: string | null;
  Problem?: Problem;
}

export interface UserContest {
  id: number;
  contest_id: number;
  user_id: number;
  joined_at: string;
  User?: User;
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
  ContestProblem?: ContestProblem;
  Code?: {
    source_code: string;
  };
  User?: User;
}

export interface ContestLeaderboardEntry {
  user_id: number;
  total_score: number;
  submission_count: number;
  last_submission: string;
  rank: number;
  User: User;
}

export interface CreateContestRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  problem_ids?: Array<{ id: number; score: number } | number>;
}

export interface ContestFilters {
  status?: 'active' | 'upcoming' | 'completed' | 'all';
  created_by?: number;
  searchTerm?: string;
}

export interface ContestSubmissionRequest {
  sourceCode: string;
  language: string;
}

export interface ContestExecutionResult {
  status: 'accepted' | 'wrong' | 'error' | 'timeout';
  executionTime?: number;
  memoryUsed?: number;
  testResults?: Array<{
    status: 'passed' | 'failed';
    input: string;
    output: string;
    expected?: string;
  }>;
}
