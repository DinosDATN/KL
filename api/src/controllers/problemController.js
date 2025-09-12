const {
  Problem,
  ProblemCategory,
  Tag,
  ProblemTag,
  ProblemExample,
  ProblemConstraint,
  StarterCode,
  TestCase,
  SubmissionCode,
  Submission,
  ProblemComment
} = require('../models');
const judgeService = require('../services/judgeService');

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

  // Get problem categories
  async getCategories(req, res) {
    try {
      const categories = await ProblemCategory.findAll({
        order: [['name', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get tags
  async getTags(req, res) {
    try {
      const tags = await Tag.findAll({
        order: [['name', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Error in getTags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tags',
        error: error.message
      });
    }
  }

  // Get problem tags
  async getProblemTags(req, res) {
    try {
      const { id } = req.params;
      
      const problemTags = await ProblemTag.findAll({
        where: { problem_id: id },
        include: [{
          model: Tag,
          attributes: ['id', 'name']
        }]
      });

      const tags = problemTags.map(pt => pt.Tag);

      res.status(200).json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Error in getProblemTags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem tags',
        error: error.message
      });
    }
  }

  // Get problem examples
  async getProblemExamples(req, res) {
    try {
      const { id } = req.params;
      
      const examples = await ProblemExample.findAll({
        where: { problem_id: id },
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: examples
      });
    } catch (error) {
      console.error('Error in getProblemExamples:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem examples',
        error: error.message
      });
    }
  }

  // Get problem constraints
  async getProblemConstraints(req, res) {
    try {
      const { id } = req.params;
      
      const constraints = await ProblemConstraint.findAll({
        where: { problem_id: id },
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: constraints
      });
    } catch (error) {
      console.error('Error in getProblemConstraints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem constraints',
        error: error.message
      });
    }
  }

  // Get starter codes
  async getStarterCodes(req, res) {
    try {
      const { id } = req.params;
      
      const starterCodes = await StarterCode.findAll({
        where: { problem_id: id },
        order: [['language', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: starterCodes
      });
    } catch (error) {
      console.error('Error in getStarterCodes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch starter codes',
        error: error.message
      });
    }
  }

  // Get test cases
  async getTestCases(req, res) {
    try {
      const { id } = req.params;
      const { sample_only } = req.query;
      
      const whereClause = { problem_id: id };
      if (sample_only === 'true') {
        whereClause.is_sample = true;
      }

      const testCases = await TestCase.findAll({
        where: whereClause,
        order: [['is_sample', 'DESC'], ['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: testCases
      });
    } catch (error) {
      console.error('Error in getTestCases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch test cases',
        error: error.message
      });
    }
  }

  // Execute code (Run button)
  async executeCode(req, res) {
    try {
      const { sourceCode, language, input = '' } = req.body;
      
      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      const result = await judgeService.executeCode(sourceCode, language, input);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in executeCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute code',
        error: error.message
      });
    }
  }

  // Submit code (Submit button)
  async submitCode(req, res) {
    try {
      const { id } = req.params; // problem id
      const { sourceCode, language, userId } = req.body;
      
      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      // Get test cases for the problem
      const testCases = await TestCase.findAll({
        where: { problem_id: id },
        attributes: ['input', 'expected_output']
      });

      if (testCases.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No test cases found for this problem'
        });
      }

      // Execute code with Judge0
      const result = await judgeService.submitCode(sourceCode, language, testCases);

      // Save submission if userId is provided
      if (userId) {
        try {
          // Save submission code
          const submissionCode = await SubmissionCode.create({
            source_code: sourceCode
          });

          // Map result status to database enum
          let dbStatus = 'pending';
          switch (result.status) {
            case 'accepted':
              dbStatus = 'accepted';
              break;
            case 'wrong':
              dbStatus = 'wrong';
              break;
            case 'error':
              dbStatus = 'error';
              break;
            case 'timeout':
              dbStatus = 'timeout';
              break;
          }

          // Save submission
          await Submission.create({
            user_id: userId,
            problem_id: id,
            code_id: submissionCode.id,
            language: language,
            status: dbStatus,
            score: result.score || 0,
            exec_time: result.executionTime || null,
            memory_used: result.memoryUsed || null,
            submitted_at: new Date()
          });
        } catch (saveError) {
          console.error('Failed to save submission:', saveError);
          // Continue with response even if save fails
        }
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in submitCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit code',
        error: error.message
      });
    }
  }

  // Get submissions for a problem
  async getProblemSubmissions(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const whereClause = { problem_id: id };
      if (userId) {
        whereClause.user_id = userId;
      }

      const { count, rows: submissions } = await Submission.findAndCountAll({
        where: whereClause,
        include: [{
          model: SubmissionCode,
          attributes: ['source_code']
        }],
        limit,
        offset,
        order: [['submitted_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: submissions,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getProblemSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
        error: error.message
      });
    }
  }

  // Get supported languages
  async getSupportedLanguages(req, res) {
    try {
      const languages = judgeService.getSupportedLanguages();
      
      res.status(200).json({
        success: true,
        data: languages
      });
    } catch (error) {
      console.error('Error in getSupportedLanguages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported languages',
        error: error.message
      });
    }
  }
}

module.exports = new ProblemController();
