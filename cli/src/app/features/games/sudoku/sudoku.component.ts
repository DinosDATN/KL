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
import { NotificationService } from '../../../core/services/notification.service';
import { UserStatsService } from '../../../core/services/user-stats.service';

type Difficulty = 'easy' | 'medium' | 'hard';
type CellState = {
  value: number;
  isGiven: boolean;
  isError: boolean;
  isCorrect: boolean; // Thêm trạng thái đúng
  isSelected: boolean;
  isHighlighted: boolean;
  notes: number[]; // Ghi chú bút chì
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
  pausedTime = 0; // Thời gian đã pause (tính bằng milliseconds)
  pauseStartTime: Date | null = null; // Thời điểm bắt đầu pause
  timerInterval: any = null;

  // UI state
  showSolution = false;
  showHints = false;
  showDifficultySelector = true;
  pencilMode = false; // Chế độ bút chì
  errorCount = 0; // Số lần sai
  maxErrors = 3; // Số lần sai tối đa
  gameLost = false; // Trạng thái thua
  errorCells: Set<string> = new Set(); // Track các ô đã sai để không đếm lại
  isPaused = false; // Trạng thái pause
  currentPoints = 0; // Điểm thưởng hiện tại
  hintCost = 5; // Chi phí sử dụng gợi ý
  isLoadingHint = false; // Trạng thái đang xử lý hint

  private destroy$ = new Subject<void>();

  constructor(
    private gameService: GameService,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    private userStatsService: UserStatsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load current reward points
      this.loadRewardPoints();
    }
  }

  /**
   * Load current reward points
   */
  private loadRewardPoints(): void {
    this.userStatsService
      .getRewardPoints()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentPoints = response.data.rewardPoints || 0;
          }
        },
        error: (error) => {
          console.error('Error loading reward points:', error);
          // Set to 0 if error, but don't block the game
          this.currentPoints = 0;
        },
      });
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
    this.gameLost = false;
    this.showSolution = false;
    this.showHints = false;
    this.selectedCell = null;
    this.selectedNumber = null;
    this.pencilMode = false;
    this.errorCount = 0;
    this.errorCells.clear();
    this.isPaused = false;
    this.pausedTime = 0;
    this.pauseStartTime = null;
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
          isCorrect: false,
          isSelected: false,
          isHighlighted: false,
          notes: [],
        };
      }
    }
  }

  /**
   * Handle cell click
   */
  onCellClick(row: number, col: number): void {
    if (!this.gameStarted || this.gameCompleted || this.isPaused) return;
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

    // Hủy chọn số khi chọn ô mới
    this.selectedNumber = null;
  }

  /**
   * Handle number selection
   */
  onNumberSelect(number: number | null): void {
    if (this.isPaused) return;

    if (number === null || number === 0) {
      this.selectedNumber = null;
      if (this.selectedCell) {
        this.clearCell();
      }
      return;
    }

    // Nếu có ô được chọn, điền số vào ô đó và hủy chọn số
    if (this.selectedCell) {
      this.placeNumber(this.selectedCell.row, this.selectedCell.col, number);
      this.selectedNumber = null; // Hủy chọn số sau khi điền
    } else {
      // Nếu chưa có ô được chọn, chỉ chọn số
      this.selectedNumber = number;
    }
  }

  /**
   * Toggle pencil mode
   */
  togglePencilMode(): void {
    this.pencilMode = !this.pencilMode;
  }

  /**
   * Place a number in a cell
   */
  private placeNumber(row: number, col: number, number: number): void {
    if (!this.gameStarted || this.gameCompleted || this.gameLost) return;
    if (this.grid[row][col].isGiven) return;

    // Nếu ở chế độ bút chì, thêm/xóa note
    if (this.pencilMode) {
      const cell = this.grid[row][col];
      const index = cell.notes.indexOf(number);
      if (index > -1) {
        cell.notes.splice(index, 1);
      } else {
        cell.notes.push(number);
        cell.notes.sort();
      }
      return;
    }

    // Chế độ điền số bình thường
    // Clear previous value
    if (this.grid[row][col].value === number) {
      this.grid[row][col].value = 0;
      this.grid[row][col].isError = false;
      this.grid[row][col].isCorrect = false;
      this.grid[row][col].notes = [];
    } else {
      this.grid[row][col].value = number;
      this.grid[row][col].notes = []; // Xóa notes khi điền số
      this.checkForErrors(row, col);

      // Kiểm tra nếu sai quá 3 lần (chỉ đếm lần đầu tiên sai ở ô này)
      if (this.grid[row][col].isError) {
        const cellKey = `${row}-${col}`;
        if (!this.errorCells.has(cellKey)) {
          this.errorCells.add(cellKey);
          this.errorCount++;
          if (this.errorCount >= this.maxErrors) {
            this.gameLost = true;
            this.clearTimer();
          }
        }
      } else {
        // Nếu sửa thành đúng, xóa khỏi danh sách error cells
        const cellKey = `${row}-${col}`;
        if (this.errorCells.has(cellKey)) {
          this.errorCells.delete(cellKey);
          // Không giảm errorCount vì đã sai rồi
        }
      }
    }

    // Check if game is completed
    this.checkGameCompletion();
  }

  /**
   * Check for errors in a cell - so sánh với solution thực tế
   */
  private checkForErrors(row: number, col: number): void {
    if (!this.puzzle) return;

    const value = this.grid[row][col].value;
    if (value === 0) {
      this.grid[row][col].isError = false;
      this.grid[row][col].isCorrect = false;
      return;
    }

    const correctValue = this.puzzle.solution[row][col];

    // So sánh với solution
    if (value === correctValue) {
      this.grid[row][col].isError = false;
      this.grid[row][col].isCorrect = true;
    } else {
      this.grid[row][col].isError = true;
      this.grid[row][col].isCorrect = false;
    }
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
   * Get a hint (show one correct number) - requires payment
   */
  getHint(): void {
    if (!this.puzzle || !this.selectedCell) {
      this.notificationService.warning(
        'Chưa chọn ô',
        'Vui lòng chọn một ô để sử dụng gợi ý.'
      );
      return;
    }

    const { row, col } = this.selectedCell;
    if (this.grid[row][col].isGiven) {
      this.notificationService.info(
        'Ô đã có sẵn',
        'Ô này đã có số sẵn, không thể sử dụng gợi ý.'
      );
      return;
    }

    // Check if already filled
    if (this.grid[row][col].value !== 0) {
      this.notificationService.info(
        'Ô đã có giá trị',
        'Ô này đã có giá trị, vui lòng chọn ô khác.'
      );
      return;
    }

    // Check if user has enough points
    if (this.currentPoints < this.hintCost) {
      this.notificationService.error(
        'Không đủ điểm',
        `Bạn cần ${this.hintCost} điểm để sử dụng gợi ý. Hiện tại bạn có ${this.currentPoints} điểm.`
      );
      return;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoadingHint) {
      return;
    }

    this.isLoadingHint = true;

    // Call API to deduct points
    this.gameService
      .useSudokuHint(this.puzzle?.gameId, this.difficulty)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Update current points
          this.currentPoints = result.newBalance;

          // Apply hint
          this.grid[row][col].value = this.puzzle!.solution[row][col];
          this.grid[row][col].isError = false;
          this.grid[row][col].isCorrect = true;

          // Show success notification
          this.notificationService.success(
            'Đã sử dụng gợi ý',
            `Đã trừ ${this.hintCost} điểm. Số dư còn lại: ${result.newBalance} điểm.`
          );

          // Check game completion
          this.checkGameCompletion();
          this.isLoadingHint = false;
        },
        error: (error) => {
          console.error('Error using hint:', error);

          // Show error notification
          if (error.error?.message) {
            this.notificationService.error(
              'Lỗi sử dụng gợi ý',
              error.error.message
            );
          } else {
            this.notificationService.error(
              'Lỗi sử dụng gợi ý',
              'Không thể sử dụng gợi ý. Vui lòng thử lại sau.'
            );
          }

          this.isLoadingHint = false;
        },
      });
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
      this.grid[row][col].isCorrect = false;
      this.grid[row][col].notes = [];
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
    this.gameLost = false;
    this.showSolution = false;
    this.errorCount = 0;
    this.errorCells.clear();
    this.isPaused = false;
    this.startTime = null;
    this.elapsedTime = 0;
    this.pausedTime = 0;
    this.pauseStartTime = null;
    this.startTimer();
  }

  /**
   * Start timer
   */
  private startTimer(): void {
    this.clearTimer();

    if (!this.startTime) {
      // Game mới bắt đầu
      this.startTime = new Date();
      this.elapsedTime = 0;
      this.pausedTime = 0;
    } else if (this.pauseStartTime) {
      // Resume từ pause: cộng thêm thời gian đã pause
      const pauseDuration =
        new Date().getTime() - this.pauseStartTime.getTime();
      this.pausedTime += pauseDuration;
      this.pauseStartTime = null;
    }

    this.timerInterval = setInterval(() => {
      if (this.startTime && !this.isPaused) {
        const now = new Date().getTime();
        const totalElapsed = now - this.startTime.getTime() - this.pausedTime;
        this.elapsedTime = Math.floor(totalElapsed / 1000);
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
   * Toggle pause/resume game
   */
  togglePause(): void {
    if (this.gameCompleted || this.gameLost || !this.gameStarted) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pause: lưu thời điểm pause và dừng timer
      this.pauseStartTime = new Date();
      this.clearTimer();
    } else {
      // Resume: tiếp tục timer
      this.startTimer();
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
   * Parse integer helper for template
   */
  parseInt(value: string): number {
    return parseInt(value, 10);
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

    // Thicker borders for 3x3 box separation - bottom border for rows 2, 5, 8
    if (row % 3 === 2 && row < 8) {
      classes += 'border-b-[3px] border-blue-500 dark:border-blue-400/60 ';
    }
    // Thicker borders for 3x3 box separation - right border for columns 2, 5, 8
    if (col % 3 === 2 && col < 8) {
      classes += 'border-r-[3px] border-blue-500 dark:border-blue-400/60 ';
    }

    // State-based styling - ưu tiên error và correct
    if (cell.isError) {
      classes +=
        'bg-red-200 dark:bg-red-900/50 border-red-400 dark:border-red-600 ';
    } else if (cell.isCorrect && !cell.isGiven) {
      classes +=
        'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 ';
    } else if (cell.isSelected) {
      classes +=
        'bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500 dark:ring-blue-400 ';
    } else if (cell.isHighlighted) {
      classes += 'bg-blue-50 dark:bg-blue-900/20 ';
    } else {
      classes += 'bg-white/60 dark:bg-gray-800 ';
    }

    if (cell.isGiven) {
      classes += 'font-bold ';
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
    } else if (cell.isError) {
      classes += 'text-red-800 dark:text-red-200 font-semibold ';
    } else if (cell.isCorrect) {
      classes += 'text-green-700 dark:text-green-300 font-semibold ';
    } else {
      classes += 'text-blue-600 dark:text-blue-400 ';
    }

    return classes.trim();
  }

  /**
   * Get tooltip text for hint button
   */
  getHintTooltip(): string {
    if (this.currentPoints < this.hintCost) {
      return `Cần ${this.hintCost} điểm. Bạn có ${this.currentPoints} điểm.`;
    }
    return `Sử dụng gợi ý (trừ ${this.hintCost} điểm)`;
  }
}
