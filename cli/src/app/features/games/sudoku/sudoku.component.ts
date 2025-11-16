import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GameService } from '../../../core/services/game.service';
import { SudokuPuzzle } from '../../../core/models/game.model';
import { ThemeService } from '../../../core/services/theme.service';

type Difficulty = 'easy' | 'medium' | 'hard';
type CellState = {
  value: number;
  isGiven: boolean;
  isError: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
};

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sudoku.component.html',
  styleUrl: './sudoku.component.css',
})
export class SudokuComponent implements OnInit, OnDestroy {
  // Game state
  puzzle: SudokuPuzzle | null = null;
  grid: CellState[][] = [];
  selectedCell: { row: number; col: number } | null = null;
  selectedNumber: number | null = null;
  difficulty: Difficulty = 'medium';
  loading = false;
  error: string | null = null;
  gameStarted = false;
  gameCompleted = false;
  startTime: Date | null = null;
  elapsedTime = 0;
  timerInterval: any = null;

  // UI state
  showSolution = false;
  showHints = false;
  showDifficultySelector = true;

  private destroy$ = new Subject<void>();

  constructor(
    private gameService: GameService,
    public themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Component initialized
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimer();
  }

  /**
   * Start a new game with selected difficulty
   */
  startNewGame(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.loading = true;
    this.error = null;
    this.gameStarted = false;
    this.gameCompleted = false;
    this.showSolution = false;
    this.showHints = false;
    this.selectedCell = null;
    this.selectedNumber = null;
    this.clearTimer();

    this.gameService
      .generateSudokuPuzzle(difficulty)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (puzzle) => {
          this.puzzle = puzzle;
          this.initializeGrid(puzzle);
          this.gameStarted = true;
          this.showDifficultySelector = false;
          this.startTimer();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading puzzle:', error);
          this.error = 'Failed to load puzzle. Please try again.';
          this.loading = false;
        },
      });
  }

  /**
   * Initialize the grid from puzzle data
   */
  private initializeGrid(puzzle: SudokuPuzzle): void {
    this.grid = [];
    for (let row = 0; row < 9; row++) {
      this.grid[row] = [];
      for (let col = 0; col < 9; col++) {
        const value = puzzle.puzzle[row][col];
        this.grid[row][col] = {
          value: value,
          isGiven: value !== 0,
          isError: false,
          isSelected: false,
          isHighlighted: false,
        };
      }
    }
  }

  /**
   * Handle cell click
   */
  onCellClick(row: number, col: number): void {
    if (!this.gameStarted || this.gameCompleted) return;
    if (this.grid[row][col].isGiven) return;

    // Deselect previous cell
    if (this.selectedCell) {
      this.grid[this.selectedCell.row][this.selectedCell.col].isSelected =
        false;
      this.clearHighlights();
    }

    // Select new cell
    this.selectedCell = { row, col };
    this.grid[row][col].isSelected = true;
    this.highlightRelatedCells(row, col);

    // If a number is selected, place it
    if (this.selectedNumber !== null) {
      this.placeNumber(row, col, this.selectedNumber);
    }
  }

  /**
   * Handle number selection
   */
  onNumberSelect(number: number): void {
    this.selectedNumber = number;

    if (this.selectedCell) {
      this.placeNumber(this.selectedCell.row, this.selectedCell.col, number);
    }
  }

  /**
   * Place a number in a cell
   */
  private placeNumber(row: number, col: number, number: number): void {
    if (!this.gameStarted || this.gameCompleted) return;
    if (this.grid[row][col].isGiven) return;

    // Clear previous value
    if (this.grid[row][col].value === number) {
      this.grid[row][col].value = 0;
      this.grid[row][col].isError = false;
    } else {
      this.grid[row][col].value = number;
      this.checkForErrors(row, col);
    }

    // Check if game is completed
    this.checkGameCompletion();
  }

  /**
   * Check for errors in a cell
   */
  private checkForErrors(row: number, col: number): void {
    const value = this.grid[row][col].value;
    if (value === 0) {
      this.grid[row][col].isError = false;
      return;
    }

    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && this.grid[row][c].value === value) {
        this.grid[row][col].isError = true;
        return;
      }
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && this.grid[r][col].value === value) {
        this.grid[row][col].isError = true;
        return;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (r !== row && c !== col && this.grid[r][c].value === value) {
          this.grid[row][col].isError = true;
          return;
        }
      }
    }

    this.grid[row][col].isError = false;
  }

  /**
   * Highlight related cells (same row, column, or box)
   */
  private highlightRelatedCells(row: number, col: number): void {
    this.clearHighlights();

    // Highlight row
    for (let c = 0; c < 9; c++) {
      this.grid[row][c].isHighlighted = true;
    }

    // Highlight column
    for (let r = 0; r < 9; r++) {
      this.grid[r][col].isHighlighted = true;
    }

    // Highlight box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        this.grid[r][c].isHighlighted = true;
      }
    }
  }

  /**
   * Clear all highlights
   */
  private clearHighlights(): void {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.grid[row][col].isHighlighted = false;
      }
    }
  }

  /**
   * Check if game is completed
   */
  private checkGameCompletion(): void {
    if (!this.puzzle) return;

    // Check if all cells are filled
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col].value === 0) {
          return;
        }
        if (this.grid[row][col].isError) {
          return;
        }
      }
    }

    // Validate solution
    this.validateSolution();
  }

  /**
   * Validate the current solution
   */
  private validateSolution(): void {
    if (!this.puzzle) return;

    const solution: number[][] = [];
    for (let row = 0; row < 9; row++) {
      solution[row] = [];
      for (let col = 0; col < 9; col++) {
        solution[row][col] = this.grid[row][col].value;
      }
    }

    // Prepare validation request with game/level info if available
    const validationRequest = {
      solution,
      gameId: this.puzzle.gameId,
      levelId: this.puzzle.levelId,
      timeSpent: this.elapsedTime,
    };

    this.gameService
      .validateSudokuSolution(validationRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid) {
            this.gameCompleted = true;
            this.clearTimer();
          }
        },
        error: (error) => {
          console.error('Error validating solution:', error);
        },
      });
  }

  /**
   * Show solution
   */
  showSolutionGrid(): void {
    if (!this.puzzle) return;
    this.showSolution = true;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.grid[row][col].value = this.puzzle.solution[row][col];
        this.grid[row][col].isError = false;
      }
    }
  }

  /**
   * Get a hint (show one correct number)
   */
  getHint(): void {
    if (!this.puzzle || !this.selectedCell) return;

    const { row, col } = this.selectedCell;
    if (this.grid[row][col].isGiven) return;

    this.grid[row][col].value = this.puzzle.solution[row][col];
    this.grid[row][col].isError = false;
    this.checkGameCompletion();
  }

  /**
   * Clear current cell
   */
  clearCell(): void {
    if (!this.selectedCell) return;

    const { row, col } = this.selectedCell;
    if (!this.grid[row][col].isGiven) {
      this.grid[row][col].value = 0;
      this.grid[row][col].isError = false;
    }
  }

  /**
   * Reset game to initial state
   */
  resetGame(): void {
    if (!this.puzzle) return;

    this.initializeGrid(this.puzzle);
    this.selectedCell = null;
    this.selectedNumber = null;
    this.gameCompleted = false;
    this.showSolution = false;
    this.startTimer();
  }

  /**
   * Start timer
   */
  private startTimer(): void {
    this.clearTimer();
    this.startTime = new Date();
    this.elapsedTime = 0;

    this.timerInterval = setInterval(() => {
      if (this.startTime) {
        this.elapsedTime = Math.floor(
          (new Date().getTime() - this.startTime!.getTime()) / 1000
        );
      }
    }, 1000);
  }

  /**
   * Clear timer
   */
  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Format elapsed time
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Handle keyboard input
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.gameStarted || this.gameCompleted) return;

    const key = event.key;

    // Number keys (1-9)
    if (key >= '1' && key <= '9') {
      const number = parseInt(key);
      if (this.selectedCell) {
        this.placeNumber(this.selectedCell.row, this.selectedCell.col, number);
      } else {
        this.onNumberSelect(number);
      }
    }

    // Delete/Backspace to clear
    if ((key === 'Delete' || key === 'Backspace') && this.selectedCell) {
      this.clearCell();
    }

    // Arrow keys for navigation
    if (this.selectedCell) {
      let { row, col } = this.selectedCell;

      switch (key) {
        case 'ArrowUp':
          row = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          row = Math.min(8, row + 1);
          break;
        case 'ArrowLeft':
          col = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          col = Math.min(8, col + 1);
          break;
        default:
          return;
      }

      this.onCellClick(row, col);
    }
  }

  /**
   * Return to difficulty selection
   */
  backToMenu(): void {
    this.showDifficultySelector = true;
    this.gameStarted = false;
    this.gameCompleted = false;
    this.puzzle = null;
    this.grid = [];
    this.selectedCell = null;
    this.selectedNumber = null;
    this.showSolution = false;
    this.clearTimer();
  }

  /**
   * Get CSS classes for a cell
   */
  getCellClasses(cell: CellState, row: number, col: number): string {
    let classes = '';

    // Border styling for 3x3 boxes
    if (row % 3 === 2 && row < 8) {
      classes += 'border-b-2 border-gray-900 dark:border-gray-100 ';
    }
    if (col % 3 === 2 && col < 8) {
      classes += 'border-r-2 border-gray-900 dark:border-gray-100 ';
    }

    // State-based styling
    if (cell.isSelected) {
      classes +=
        'bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500 dark:ring-blue-400 ';
    } else if (cell.isHighlighted) {
      classes += 'bg-blue-50 dark:bg-blue-900/30 ';
    } else {
      classes += 'bg-white dark:bg-gray-800 ';
    }

    if (cell.isGiven) {
      classes += 'font-bold text-gray-900 dark:text-gray-100 ';
    }

    if (cell.isError) {
      classes += 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 ';
    }

    return classes.trim();
  }

  /**
   * Get CSS classes for cell text
   */
  getCellTextClasses(cell: CellState): string {
    let classes = '';

    if (cell.isGiven) {
      classes += 'text-gray-900 dark:text-gray-100 font-bold ';
    } else {
      classes += 'text-blue-600 dark:text-blue-400 ';
    }

    if (cell.isError) {
      classes += 'text-red-800 dark:text-red-200 ';
    }

    return classes.trim();
  }
}
