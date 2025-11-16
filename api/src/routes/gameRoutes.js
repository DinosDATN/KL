const express = require("express");
const gameController = require("../controllers/gameController");
const {
  authenticateToken,
  optionalAuth,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * ==================== GAME ROUTES ====================
 */

// Get available games (public)
router.get("/", gameController.getAvailableGames);

// Get user's game progress (authenticated)
router.get("/progress", authenticateToken, gameController.getUserProgress);

// Start or update a game session (authenticated)
router.post(
  "/session/start",
  authenticateToken,
  gameController.startGameSession
);

// Validate Sudoku solution (optional auth - can validate without login, but saves progress if authenticated)
router.post(
  "/sudoku/validate",
  optionalAuth,
  gameController.validateSudokuSolution
);

// Generate Sudoku puzzle (direct endpoint - must come before /:game)
router.get("/sudoku", gameController.generateSudokuPuzzle);

// Get game puzzle by game type and difficulty (parameterized route - must be last)
router.get("/:game", gameController.getGamePuzzle);

module.exports = router;
