const sudokuService = require("../services/sudokuService");
const { Game, GameLevel, UserGameProcess } = require("../models");
const { Op } = require("sequelize");
const rewardService = require("../services/rewardService");

class GameController {
  /**
   * Get available games
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableGames(req, res) {
    try {
      const games = await Game.findAll({
        include: [
          {
            model: GameLevel,
            as: "Levels",
            attributes: ["id", "level_number", "difficulty"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Format response
      const formattedGames = games.map((game) => {
        const gameData = game.toJSON();
        const difficultyLevels = [
          ...new Set(gameData.Levels.map((level) => level.difficulty)),
        ];
        return {
          id: gameData.id,
          name: gameData.name,
          description: gameData.description,
          difficultyLevels: difficultyLevels.sort(),
          levels: gameData.Levels.map((level) => ({
            id: level.id,
            levelNumber: level.level_number,
            difficulty: level.difficulty,
          })),
          createdAt: gameData.created_at,
        };
      });

      res.status(200).json({
        success: true,
        data: formattedGames,
      });
    } catch (error) {
      console.error("Error in getAvailableGames:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch available games",
        error: error.message,
      });
    }
  }

  /**
   * Generate a Sudoku puzzle
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateSudokuPuzzle(req, res) {
    try {
      const { difficulty = "medium", level_number = 1 } = req.query;

      // Validate difficulty
      const validDifficulties = ["easy", "medium", "hard"];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid difficulty level. Must be one of: ${validDifficulties.join(
            ", "
          )}`,
        });
      }

      // Find or create Sudoku game
      let game = await Game.findByName("Sudoku");
      if (!game) {
        game = await Game.create({
          name: "Sudoku",
          description: "Classic number puzzle game",
        });
      }

      // Find or create game level
      let gameLevel = await GameLevel.findByGameAndLevel(
        game.id,
        parseInt(level_number)
      );
      if (!gameLevel) {
        gameLevel = await GameLevel.create({
          game_id: game.id,
          level_number: parseInt(level_number),
          difficulty: difficulty.toLowerCase(),
        });
      }

      // Generate puzzle
      const result = sudokuService.generatePuzzle(difficulty.toLowerCase());

      res.status(200).json({
        success: true,
        data: {
          gameId: game.id,
          gameName: game.name,
          levelId: gameLevel.id,
          levelNumber: gameLevel.level_number,
          difficulty: result.difficulty,
          puzzle: result.puzzle,
          solution: result.solution,
          givenCells: result.givenCells,
          totalCells: 81,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in generateSudokuPuzzle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate Sudoku puzzle",
        error: error.message,
      });
    }
  }

  /**
   * Get Sudoku puzzle by game and difficulty
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getGamePuzzle(req, res) {
    try {
      const { game } = req.params;
      const { difficulty = "medium", level_number = 1 } = req.query;

      // Find game by name (case-insensitive)
      // Try exact match first, then case-insensitive match
      let gameRecord = await Game.findOne({
        where: {
          name: game,
        },
      });

      if (!gameRecord) {
        // Try case-insensitive search
        const { sequelize } = require("../config/sequelize");
        gameRecord = await Game.findOne({
          where: sequelize.where(
            sequelize.fn("LOWER", sequelize.col("name")),
            sequelize.fn("LOWER", game)
          ),
        });
      }

      if (!gameRecord) {
        return res.status(404).json({
          success: false,
          message: `Game '${game}' not found`,
        });
      }

      // Validate difficulty
      const validDifficulties = ["easy", "medium", "hard"];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid difficulty level. Must be one of: ${validDifficulties.join(
            ", "
          )}`,
        });
      }

      // Find or create game level
      let gameLevel = await GameLevel.findByGameAndLevel(
        gameRecord.id,
        parseInt(level_number)
      );
      if (!gameLevel) {
        gameLevel = await GameLevel.create({
          game_id: gameRecord.id,
          level_number: parseInt(level_number),
          difficulty: difficulty.toLowerCase(),
        });
      }

      // Generate puzzle
      const result = sudokuService.generatePuzzle(difficulty.toLowerCase());

      res.status(200).json({
        success: true,
        data: {
          gameId: gameRecord.id,
          gameName: gameRecord.name,
          levelId: gameLevel.id,
          levelNumber: gameLevel.level_number,
          difficulty: result.difficulty,
          puzzle: result.puzzle,
          solution: result.solution,
          givenCells: result.givenCells,
          totalCells: 81,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in getGamePuzzle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate game puzzle",
        error: error.message,
      });
    }
  }

  /**
   * Validate a Sudoku solution
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async validateSudokuSolution(req, res) {
    try {
      const { solution, gameId, levelId, timeSpent } = req.body;

      if (!solution || !Array.isArray(solution)) {
        return res.status(400).json({
          success: false,
          message: "Solution must be a 9x9 array",
        });
      }

      // Validate dimensions
      if (solution.length !== 9) {
        return res.status(400).json({
          success: false,
          message: "Solution must be a 9x9 array",
        });
      }

      for (let i = 0; i < 9; i++) {
        if (!Array.isArray(solution[i]) || solution[i].length !== 9) {
          return res.status(400).json({
            success: false,
            message: "Solution must be a 9x9 array",
          });
        }
      }

      // Validate solution
      const isValid = sudokuService.validateSolution(solution);

      // If user is authenticated and solution is valid, save progress as new record
      if (isValid && req.user && gameId && levelId) {
        try {
          const userId = req.user.id;
          const timeSpentSeconds = timeSpent || 0;

          // Calculate score based on time and difficulty
          let score = 1000; // Base score
          if (timeSpentSeconds > 0) {
            // Reduce score based on time (more time = lower score)
            score = Math.max(100, score - Math.floor(timeSpentSeconds / 10));
          }

          // Always create a new record for each completion
          await UserGameProcess.create({
            user_id: userId,
            game_id: gameId,
            level_id: levelId,
            status: "completed",
            score: score,
            time_spent: timeSpentSeconds,
            completed_at: new Date(),
          });

          // Get game level to determine difficulty
          const gameLevel = await GameLevel.findByPk(levelId);
          if (gameLevel) {
            // Award reward points for completing Sudoku
            try {
              const rewardResult = await rewardService.rewardSudokuCompleted(
                userId,
                gameId,
                levelId,
                gameLevel.difficulty,
                timeSpentSeconds
              );
              
              if (rewardResult) {
                console.log(`Awarded ${rewardResult.transaction.points} points to user ${userId} for completing Sudoku`);
              }
            } catch (rewardError) {
              console.error("Error awarding reward points:", rewardError);
              // Don't fail the request if reward fails
            }
          }
        } catch (progressError) {
          console.error("Error saving game progress:", progressError);
          // Don't fail the request if progress saving fails
        }
      }

      res.status(200).json({
        success: true,
        data: {
          isValid,
          message: isValid ? "Solution is valid" : "Solution is invalid",
        },
      });
    } catch (error) {
      console.error("Error in validateSudokuSolution:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate solution",
        error: error.message,
      });
    }
  }

  /**
   * Get user's game progress
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserProgress(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userId = req.user.id;
      const { gameId } = req.query;

      let whereClause = { user_id: userId };
      if (gameId) {
        whereClause.game_id = gameId;
      }

      const progress = await UserGameProcess.findAll({
        where: whereClause,
        include: [
          {
            model: Game,
            as: "Game",
            attributes: ["id", "name", "description"],
          },
          {
            model: GameLevel,
            as: "Level",
            attributes: ["id", "level_number", "difficulty"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: progress.map((p) => {
          const processData = p.toJSON();
          return {
            id: processData.id,
            game: processData.Game,
            level: processData.Level,
            status: processData.status,
            score: processData.score,
            timeSpent: processData.time_spent,
            completedAt: processData.completed_at,
            createdAt: processData.created_at,
          };
        }),
      });
    } catch (error) {
      console.error("Error in getUserProgress:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user progress",
        error: error.message,
      });
    }
  }

  /**
   * Start or update a game session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async startGameSession(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { gameId, levelId } = req.body;
      const userId = req.user.id;

      if (!gameId || !levelId) {
        return res.status(400).json({
          success: false,
          message: "gameId and levelId are required",
        });
      }

      // Verify game and level exist
      const game = await Game.findByPk(gameId);
      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      const level = await GameLevel.findByPk(levelId);
      if (!level || level.game_id !== gameId) {
        return res.status(404).json({
          success: false,
          message: "Level not found for this game",
        });
      }

      // Always create a new session for each game attempt
      const userProcess = await UserGameProcess.create({
        user_id: userId,
        game_id: gameId,
        level_id: levelId,
        status: "playing",
        score: 0,
        time_spent: 0,
      });

      res.status(200).json({
        success: true,
        data: {
          id: userProcess.id,
          status: userProcess.status,
          score: userProcess.score,
          timeSpent: userProcess.time_spent,
        },
      });
    } catch (error) {
      console.error("Error in startGameSession:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start game session",
        error: error.message,
      });
    }
  }
}

module.exports = new GameController();
