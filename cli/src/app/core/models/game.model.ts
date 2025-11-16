export interface Game {
  id: number;
  name: string;
  description?: string | null;
  difficultyLevels?: string[];
  levels?: GameLevel[];
  createdAt?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface GameLevel {
  id: number;
  gameId?: number;
  game_id?: number;
  levelNumber?: number;
  level_number: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt?: string;
  created_at?: string;
}

export interface UserGameProcess {
  id: number;
  userId?: number;
  user_id: number;
  gameId?: number;
  game_id: number;
  levelId?: number;
  level_id: number;
  status: 'playing' | 'completed';
  score: number;
  timeSpent?: number;
  time_spent: number;
  completedAt?: string | null;
  completed_at?: string | null;
  createdAt?: string;
  created_at?: string;
  // Related data
  game?: Game;
  level?: GameLevel;
}

export interface SudokuPuzzle {
  gameId?: number;
  gameName?: string;
  levelId?: number;
  levelNumber?: number;
  game?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  puzzle: number[][];
  solution: number[][];
  givenCells: number;
  totalCells: number;
  generatedAt: string;
}

export interface SudokuValidationRequest {
  solution: number[][];
  gameId?: number;
  levelId?: number;
  timeSpent?: number;
}

export interface SudokuValidationResult {
  isValid: boolean;
  message: string;
}

export interface GameSession {
  id: number;
  status: 'playing' | 'completed';
  score: number;
  timeSpent: number;
}

export interface UserGameProgress {
  id: number;
  game: Game;
  level: GameLevel;
  status: 'playing' | 'completed';
  score: number;
  timeSpent: number;
  completedAt?: string | null;
  createdAt?: string;
}
