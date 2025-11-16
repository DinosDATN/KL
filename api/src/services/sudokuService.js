class SudokuService {
  constructor() {
    this.SIZE = 9;
    this.BOX_SIZE = 3;

    // Difficulty levels: number of given cells
    this.DIFFICULTY_LEVELS = {
      easy: 36, // 36 given cells (40% filled)
      medium: 27, // 27 given cells (30% filled)
      hard: 17, // 17 given cells (19% filled) - minimum for unique solution
    };
  }

  /**
   * Generate a complete solved Sudoku grid
   * @returns {Array} 9x9 solved Sudoku grid
   */
  generateSolvedGrid() {
    const grid = Array(this.SIZE)
      .fill(null)
      .map(() => Array(this.SIZE).fill(0));

    // Fill diagonal boxes first (they are independent)
    this.fillDiagonalBoxes(grid);

    // Fill remaining cells using backtracking
    this.solveSudoku(grid);

    return grid;
  }

  /**
   * Fill the diagonal 3x3 boxes (they are independent)
   * @param {Array} grid - The Sudoku grid
   */
  fillDiagonalBoxes(grid) {
    for (let box = 0; box < this.SIZE; box += this.BOX_SIZE) {
      this.fillBox(grid, box, box);
    }
  }

  /**
   * Fill a 3x3 box with random valid numbers
   * @param {Array} grid - The Sudoku grid
   * @param {number} row - Starting row of the box
   * @param {number} col - Starting column of the box
   */
  fillBox(grid, row, col) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.shuffleArray(numbers);

    let index = 0;
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        grid[row + i][col + j] = numbers[index++];
      }
    }
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Solve Sudoku using backtracking
   * @param {Array} grid - The Sudoku grid
   * @returns {boolean} True if solved, false otherwise
   */
  solveSudoku(grid) {
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          this.shuffleArray(numbers);

          for (const num of numbers) {
            if (this.isValidMove(grid, row, col, num)) {
              grid[row][col] = num;

              if (this.solveSudoku(grid)) {
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if a number can be placed at a position
   * @param {Array} grid - The Sudoku grid
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @param {number} num - Number to check
   * @returns {boolean} True if valid, false otherwise
   */
  isValidMove(grid, row, col, num) {
    // Check row
    for (let c = 0; c < this.SIZE; c++) {
      if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < this.SIZE; r++) {
      if (grid[r][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
    const boxCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

    for (let r = boxRow; r < boxRow + this.BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + this.BOX_SIZE; c++) {
        if (grid[r][c] === num) return false;
      }
    }

    return true;
  }

  /**
   * Count the number of solutions for a Sudoku puzzle
   * @param {Array} grid - The Sudoku grid
   * @param {number} maxSolutions - Maximum number of solutions to find (default: 2)
   * @returns {number} Number of solutions found (up to maxSolutions)
   */
  countSolutions(grid, maxSolutions = 2) {
    let count = 0;
    const gridCopy = grid.map((row) => [...row]);

    const solve = (g) => {
      if (count >= maxSolutions) return;

      for (let row = 0; row < this.SIZE; row++) {
        for (let col = 0; col < this.SIZE; col++) {
          if (g[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (this.isValidMove(g, row, col, num)) {
                g[row][col] = num;
                solve(g);
                if (count >= maxSolutions) return;
                g[row][col] = 0;
              }
            }
            return;
          }
        }
      }
      count++;
    };

    solve(gridCopy);
    return count;
  }

  /**
   * Remove cells from a solved grid to create a puzzle
   * @param {Array} solvedGrid - The complete solved Sudoku grid
   * @param {number} cellsToRemove - Number of cells to remove
   * @returns {Array} Puzzle grid with removed cells set to 0
   */
  createPuzzle(solvedGrid, cellsToRemove) {
    const puzzle = solvedGrid.map((row) => [...row]);
    const totalCells = this.SIZE * this.SIZE;
    const positions = [];

    // Create list of all positions
    for (let i = 0; i < totalCells; i++) {
      positions.push(i);
    }

    // Shuffle positions
    this.shuffleArray(positions);

    // Remove cells one by one, ensuring unique solution
    let removed = 0;
    for (const pos of positions) {
      if (removed >= cellsToRemove) break;

      const row = Math.floor(pos / this.SIZE);
      const col = pos % this.SIZE;
      const originalValue = puzzle[row][col];

      // Try removing this cell
      puzzle[row][col] = 0;

      // Check if puzzle still has unique solution
      const solutionCount = this.countSolutions(puzzle, 2);

      if (solutionCount === 1) {
        removed++;
      } else {
        // Restore the cell if removing it breaks uniqueness
        puzzle[row][col] = originalValue;
      }
    }

    return puzzle;
  }

  /**
   * Generate a Sudoku puzzle with specified difficulty
   * @param {string} difficulty - Difficulty level: 'easy', 'medium', or 'hard'
   * @returns {Object} Object containing puzzle and solution
   */
  generatePuzzle(difficulty = "medium") {
    const difficultyLower = difficulty.toLowerCase();

    if (!this.DIFFICULTY_LEVELS[difficultyLower]) {
      throw new Error(
        `Invalid difficulty level: ${difficulty}. Must be 'easy', 'medium', or 'hard'`
      );
    }

    const givenCells = this.DIFFICULTY_LEVELS[difficultyLower];
    const cellsToRemove = this.SIZE * this.SIZE - givenCells;

    // Generate solved grid
    const solvedGrid = this.generateSolvedGrid();

    // Create puzzle by removing cells
    let puzzle = this.createPuzzle(solvedGrid, cellsToRemove);

    // Ensure we have the right number of given cells
    // If we couldn't remove enough cells while maintaining uniqueness,
    // try a different approach: remove more aggressively
    let attempts = 0;
    const maxAttempts = 10;

    while (
      this.countGivenCells(puzzle) < givenCells &&
      attempts < maxAttempts
    ) {
      // Generate a new solved grid and try again
      const newSolvedGrid = this.generateSolvedGrid();
      puzzle = this.createPuzzle(newSolvedGrid, cellsToRemove);
      attempts++;
    }

    // Final check: ensure unique solution
    const solutionCount = this.countSolutions(puzzle, 2);
    if (solutionCount !== 1) {
      // If not unique, generate again
      return this.generatePuzzle(difficulty);
    }

    return {
      puzzle: puzzle,
      solution: solvedGrid,
      difficulty: difficultyLower,
      givenCells: this.countGivenCells(puzzle),
    };
  }

  /**
   * Count the number of given (non-zero) cells in a puzzle
   * @param {Array} grid - The Sudoku grid
   * @returns {number} Number of given cells
   */
  countGivenCells(grid) {
    let count = 0;
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (grid[row][col] !== 0) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Validate a Sudoku solution
   * @param {Array} grid - The Sudoku grid to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateSolution(grid) {
    // Check each row
    for (let row = 0; row < this.SIZE; row++) {
      const rowSet = new Set();
      for (let col = 0; col < this.SIZE; col++) {
        const num = grid[row][col];
        if (num < 1 || num > 9 || rowSet.has(num)) {
          return false;
        }
        rowSet.add(num);
      }
    }

    // Check each column
    for (let col = 0; col < this.SIZE; col++) {
      const colSet = new Set();
      for (let row = 0; row < this.SIZE; row++) {
        const num = grid[row][col];
        if (num < 1 || num > 9 || colSet.has(num)) {
          return false;
        }
        colSet.add(num);
      }
    }

    // Check each 3x3 box
    for (let boxRow = 0; boxRow < this.SIZE; boxRow += this.BOX_SIZE) {
      for (let boxCol = 0; boxCol < this.SIZE; boxCol += this.BOX_SIZE) {
        const boxSet = new Set();
        for (let r = boxRow; r < boxRow + this.BOX_SIZE; r++) {
          for (let c = boxCol; c < boxCol + this.BOX_SIZE; c++) {
            const num = grid[r][c];
            if (num < 1 || num > 9 || boxSet.has(num)) {
              return false;
            }
            boxSet.add(num);
          }
        }
      }
    }

    return true;
  }
}

module.exports = new SudokuService();
