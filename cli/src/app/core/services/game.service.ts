import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import {
  Game,
  GameLevel,
  UserGameProcess,
  SudokuPuzzle,
  SudokuValidationRequest,
  SudokuValidationResult,
  GameSession,
  UserGameProgress,
} from '../models/game.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get available games
   */
  getAvailableGames(): Observable<Game[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([
        {
          id: 1,
          name: 'Sudoku',
          description: 'Classic number puzzle game',
          difficultyLevels: ['easy', 'medium', 'hard'],
        },
      ]);
    }

    return this.http.get<ApiResponse<Game[]>>(`${this.apiUrl}/games`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error fetching available games:', error);
        return of([
          {
            id: 1,
            name: 'Sudoku',
            description: 'Classic number puzzle game',
            difficultyLevels: ['easy', 'medium', 'hard'],
          },
        ]);
      })
    );
  }

  /**
   * Generate a Sudoku puzzle
   * @param difficulty - Difficulty level: 'easy', 'medium', or 'hard'
   * @param levelNumber - Level number (default: 1)
   */
  generateSudokuPuzzle(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    levelNumber: number = 1
  ): Observable<SudokuPuzzle> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return empty puzzle for SSR
      return of({
        difficulty: 'medium',
        puzzle: Array(9)
          .fill(null)
          .map(() => Array(9).fill(0)),
        solution: Array(9)
          .fill(null)
          .map(() => Array(9).fill(0)),
        givenCells: 0,
        totalCells: 81,
        generatedAt: new Date().toISOString(),
      });
    }

    let params = new HttpParams()
      .set('difficulty', difficulty)
      .set('level_number', levelNumber.toString());

    return this.http
      .get<ApiResponse<SudokuPuzzle>>(`${this.apiUrl}/games/sudoku`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error generating Sudoku puzzle:', error);
          throw error;
        })
      );
  }

  /**
   * Get game puzzle by game type
   * @param game - Game type (e.g., 'sudoku')
   * @param difficulty - Difficulty level
   * @param levelNumber - Level number (default: 1)
   */
  getGamePuzzle(
    game: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    levelNumber: number = 1
  ): Observable<SudokuPuzzle> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        difficulty: difficulty,
        puzzle: Array(9)
          .fill(null)
          .map(() => Array(9).fill(0)),
        solution: Array(9)
          .fill(null)
          .map(() => Array(9).fill(0)),
        givenCells: 0,
        totalCells: 81,
        generatedAt: new Date().toISOString(),
      });
    }

    let params = new HttpParams()
      .set('difficulty', difficulty)
      .set('level_number', levelNumber.toString());

    return this.http
      .get<ApiResponse<SudokuPuzzle>>(`${this.apiUrl}/games/${game}`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching game puzzle:', error);
          throw error;
        })
      );
  }

  /**
   * Validate a Sudoku solution
   * @param request - Validation request with solution and optional game/level info
   */
  validateSudokuSolution(
    request: SudokuValidationRequest
  ): Observable<SudokuValidationResult> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        isValid: false,
        message: 'Cannot validate solution during SSR',
      });
    }

    return this.http
      .post<ApiResponse<SudokuValidationResult>>(
        `${this.apiUrl}/games/sudoku/validate`,
        request,
        { withCredentials: true } // Send HttpOnly cookie for authentication
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error validating Sudoku solution:', error);
          throw error;
        })
      );
  }

  /**
   * Get user's game progress
   * @param gameId - Optional game ID to filter by specific game
   */
  getUserProgress(gameId?: number): Observable<UserGameProgress[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    let params = new HttpParams();
    if (gameId) {
      params = params.set('gameId', gameId.toString());
    }

    return this.http
      .get<ApiResponse<UserGameProgress[]>>(`${this.apiUrl}/games/progress`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching user progress:', error);
          return of([]);
        })
      );
  }

  /**
   * Start or update a game session
   * @param gameId - Game ID
   * @param levelId - Level ID
   */
  startGameSession(gameId: number, levelId: number): Observable<GameSession> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        id: 0,
        status: 'playing',
        score: 0,
        timeSpent: 0,
      });
    }

    return this.http
      .post<ApiResponse<GameSession>>(`${this.apiUrl}/games/session/start`, {
        gameId,
        levelId,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error starting game session:', error);
          throw error;
        })
      );
  }

  /**
   * Use hint for Sudoku game (deducts points)
   * @param gameId - Optional game ID
   * @param difficulty - Optional difficulty level
   */
  useSudokuHint(gameId?: number, difficulty?: string): Observable<{
    newBalance: number;
    pointsDeducted: number;
  }> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        newBalance: 0,
        pointsDeducted: 5,
      });
    }

    return this.http
      .post<ApiResponse<{
        newBalance: number;
        pointsDeducted: number;
      }>>(
        `${this.apiUrl}/games/sudoku/hint`,
        {
          gameId,
          difficulty,
        },
        { withCredentials: true } // Send HttpOnly cookie for authentication
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error using Sudoku hint:', error);
          throw error;
        })
      );
  }
}
