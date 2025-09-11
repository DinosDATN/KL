const Problem = require('../models/Problem');

class ProblemController {
  // Get all problems with pagination and filtering
  async getAllProblems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { difficulty, category_id, is_premium, is_new, is_popular } = req.query;

      // Build where clause
      const whereClause = {
        is_deleted: false
      };

      if (difficulty) whereClause.difficulty = difficulty;
      if (category_id) whereClause.category_id = category_id;
      if (is_premium !== undefined) whereClause.is_premium = is_premium === 'true';
      if (is_new !== undefined) whereClause.is_new = is_new === 'true';
      if (is_popular !== undefined) whereClause.is_popular = is_popular === 'true';

      const { count, rows: problems } = await Problem.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['likes', 'DESC'], ['acceptance', 'DESC'], ['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problems',
        error: error.message
      });
    }
  }

  // Get a single problem by ID
  async getProblemById(req, res) {
    try {
      const { id } = req.params;
      
      const problem = await Problem.findOne({
        where: { 
          id,
          is_deleted: false 
        }
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      res.status(200).json({
        success: true,
        data: problem
      });
    } catch (error) {
      console.error('Error in getProblemById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem',
        error: error.message
      });
    }
  }

  // Get featured problems
  async getFeaturedProblems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      
      const featuredProblems = await Problem.scope('featured').findAll({
        limit
      });

      res.status(200).json({
        success: true,
        data: featuredProblems
      });
    } catch (error) {
      console.error('Error in getFeaturedProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured problems',
        error: error.message
      });
    }
  }

  // Get problems by difficulty
  async getProblemsByDifficulty(req, res) {
    try {
      const { difficulty } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid difficulty level'
        });
      }

      const { count, rows: problems } = await Problem.findAndCountAll({
        where: {
          difficulty,
          is_deleted: false
        },
        limit,
        offset,
        order: [['likes', 'DESC'], ['acceptance', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getProblemsByDifficulty:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problems by difficulty',
        error: error.message
      });
    }
  }

  // Get popular problems
  async getPopularProblems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const popularProblems = await Problem.findPopular();

      res.status(200).json({
        success: true,
        data: popularProblems.slice(0, limit)
      });
    } catch (error) {
      console.error('Error in getPopularProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular problems',
        error: error.message
      });
    }
  }

  // Get new problems
  async getNewProblems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const newProblems = await Problem.findNew();

      res.status(200).json({
        success: true,
        data: newProblems.slice(0, limit)
      });
    } catch (error) {
      console.error('Error in getNewProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch new problems',
        error: error.message
      });
    }
  }

  // Get problems by category
  async getProblemsByCategory(req, res) {
    try {
      const { category_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: problems } = await Problem.findAndCountAll({
        where: {
          category_id,
          is_deleted: false
        },
        limit,
        offset,
        order: [['likes', 'DESC'], ['acceptance', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getProblemsByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problems by category',
        error: error.message
      });
    }
  }
}

module.exports = new ProblemController();
