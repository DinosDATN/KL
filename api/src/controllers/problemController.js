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
  ProblemComment,
  JudgeSubmission
} = require('../models');
const { sequelize } = require('../config/sequelize');
const { Op } = require('sequelize');
const judgeService = require('../services/judgeService');
const rewardService = require('../services/rewardService');

class ProblemController {
  // Get all problems with pagination and filtering
  async getAllProblems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || (req.query.all === 'true' ? null : 10);
      const offset = limit ? (page - 1) * limit : 0;
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

      const queryOptions = {
        where: whereClause,
        order: [['likes', 'DESC'], ['acceptance', 'DESC'], ['created_at', 'DESC']]
      };
      
      // Only add limit and offset if limit is specified
      if (limit) {
        queryOptions.limit = limit;
        queryOptions.offset = offset;
      }
      
      const { count, rows: problems } = await Problem.findAndCountAll(queryOptions);

      const response = {
        success: true,
        data: problems
      };
      
      // Only add pagination info if using pagination
      if (limit) {
        response.pagination = {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        };
      } else {
        response.total_items = count;
      }
      
      res.status(200).json(response);
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
        },
        include: [
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          },
          {
            model: Tag,
            as: 'Tags',
            through: { attributes: [] }, // Exclude join table attributes
            attributes: ['id', 'name']
          },
          {
            model: ProblemConstraint,
            as: 'Constraints',
            attributes: ['id', 'constraint_text']
          }
        ]
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
      const limit = parseInt(req.query.limit) || (req.query.all === 'true' ? null : 10);
      
      const popularProblems = await Problem.findPopular();

      const data = limit ? popularProblems.slice(0, limit) : popularProblems;

      res.status(200).json({
        success: true,
        data: data,
        total_items: popularProblems.length
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
      const limit = parseInt(req.query.limit) || (req.query.all === 'true' ? null : 10);
      
      const newProblems = await Problem.findNew();

      const data = limit ? newProblems.slice(0, limit) : newProblems;

      res.status(200).json({
        success: true,
        data: data,
        total_items: newProblems.length
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

  // Execute code with examples (Run with Example button)
  async executeCodeWithExamples(req, res) {
    try {
      const { id } = req.params; // problem id
      const { sourceCode, language } = req.body;
      
      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      // Get examples for the problem
      const examples = await ProblemExample.findAll({
        where: { problem_id: id },
        order: [['created_at', 'ASC']]
      });

      if (examples.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No examples found for this problem'
        });
      }

      // Execute code with Judge0 against all examples
      const result = await judgeService.executeCodeWithExamples(sourceCode, language, examples);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in executeCodeWithExamples:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute code with examples',
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
          const submission = await Submission.create({
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

          // Award reward points if submission is accepted
          if (dbStatus === 'accepted') {
            try {
              // Get problem to determine difficulty
              const problem = await Problem.findByPk(id);
              if (problem) {
                // Check if user has already received reward for this problem
                const hasReward = await rewardService.hasReceivedReward(
                  userId,
                  'problem',
                  id,
                  'problem_solved'
                );

                if (!hasReward) {
                  const rewardResult = await rewardService.rewardProblemSolved(
                    userId,
                    id,
                    problem.difficulty,
                    {
                      language: language,
                      score: result.score,
                      executionTime: result.executionTime
                    }
                  );

                  if (rewardResult) {
                    console.log(`Awarded ${rewardResult.transaction.points} points to user ${userId} for solving problem ${id}`);
                  }
                }
              }
            } catch (rewardError) {
              console.error('Error awarding reward points:', rewardError);
              // Don't fail the request if reward fails
            }
          }
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
          as: 'Code',
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

  // Get all submissions for assignment dashboard (for instructors/admins)
  async getAllSubmissions(req, res) {
    try {
      const { problemId, userId, status, language } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {};
      if (problemId) whereClause.problem_id = problemId;
      if (userId) whereClause.user_id = userId;
      if (status) whereClause.status = status;
      if (language) whereClause.language = language;

      const { count, rows: submissions } = await Submission.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SubmissionCode,
            as: 'Code',
            attributes: ['source_code']
          },
          {
            model: Problem,
            attributes: ['id', 'title', 'difficulty'],
            required: false
          }
        ],
        limit,
        offset,
        order: [['submitted_at', 'DESC']]
      });

      // Add user information if needed (you might want to include User model in associations)
      const enhancedSubmissions = submissions.map(submission => ({
        id: submission.id,
        user_id: submission.user_id,
        problem_id: submission.problem_id,
        problem: submission.Problem ? {
          id: submission.Problem.id,
          title: submission.Problem.title,
          difficulty: submission.Problem.difficulty
        } : null,
        language: submission.language,
        status: submission.status,
        score: submission.score,
        exec_time: submission.exec_time,
        memory_used: submission.memory_used,
        submitted_at: submission.submitted_at,
        source_code: submission.Code ? submission.Code.source_code : null
      }));

      res.status(200).json({
        success: true,
        data: enhancedSubmissions,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch all submissions',
        error: error.message
      });
    }
  }

  // Get submission statistics for assignment dashboard
  async getSubmissionStats(req, res) {
    try {
      const { problemId, userId } = req.query;

      // Build where clause
      const whereClause = {};
      if (problemId) whereClause.problem_id = problemId;
      if (userId) whereClause.user_id = userId;

      // Get total submissions
      const totalSubmissions = await Submission.count({ where: whereClause });

      // Get submissions by status
      const statusStats = await Submission.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Get submissions by language
      const languageStats = await Submission.findAll({
        where: whereClause,
        attributes: [
          'language',
          [sequelize.fn('COUNT', sequelize.col('language')), 'count']
        ],
        group: ['language'],
        raw: true
      });

      // Get unique users count
      const uniqueUsers = await Submission.count({
        where: whereClause,
        distinct: true,
        col: 'user_id'
      });

      // Get submissions over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const timeSeriesData = await Submission.findAll({
        where: {
          ...whereClause,
          submitted_at: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('submitted_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('submitted_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('submitted_at')), 'ASC']],
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          totalSubmissions,
          statusStats: statusStats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.count);
            return acc;
          }, {}),
          languageStats: languageStats.reduce((acc, stat) => {
            acc[stat.language] = parseInt(stat.count);
            return acc;
          }, {}),
          uniqueUsers,
          submissionsOverTime: timeSeriesData.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          }))
        }
      });
    } catch (error) {
      console.error('Error in getSubmissionStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submission statistics',
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

  // Check Judge0 API health
  async checkJudgeHealth(req, res) {
    try {
      const health = await judgeService.healthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health
      });
    } catch (error) {
      console.error('Error in checkJudgeHealth:', error);
      res.status(503).json({
        success: false,
        message: 'Failed to check Judge0 health',
        error: error.message
      });
    }
  }

  // Get submission by token (for async operations)
  async getSubmission(req, res) {
    try {
      const { token } = req.params;
      const { base64_encoded = 'false' } = req.query;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Submission token is required'
        });
      }
      
      const result = await judgeService.getSubmission(token, base64_encoded === 'true');
      const formattedResult = judgeService.formatExecutionResult(result);
      
      res.status(200).json({
        success: true,
        data: {
          token: token,
          rawResult: result,
          formattedResult: formattedResult
        }
      });
    } catch (error) {
      console.error('Error in getSubmission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get submission result',
        error: error.message
      });
    }
  }

  // Create async submission
  async createAsyncSubmission(req, res) {
    try {
      const { sourceCode, language, input = '', expectedOutput = null, base64Encoded = false } = req.body;
      
      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }
      
      const languageId = judgeService.getLanguageId(language);
      if (!languageId) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`
        });
      }
      
      const submission = await judgeService.createSubmission(
        sourceCode,
        languageId,
        input,
        expectedOutput,
        base64Encoded
      );
      
      res.status(201).json({
        success: true,
        data: {
          token: submission.token,
          message: 'Submission created successfully. Use the token to check status.'
        }
      });
    } catch (error) {
      console.error('Error in createAsyncSubmission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create submission',
        error: error.message
      });
    }
  }

  // Batch submit code with multiple test cases
  async batchSubmitCode(req, res) {
    try {
      const { id } = req.params; // problem id
      const { sourceCode, language, userId } = req.body;
      
      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }
      
      const languageId = judgeService.getLanguageId(language);
      if (!languageId) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`
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
      
      // Use batch submission for better performance
      const batchResults = await judgeService.batchSubmissions(
        sourceCode,
        languageId,
        testCases
      );
      
      // Process results
      const results = [];
      let passedCount = 0;
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;
      
      for (const batchResult of batchResults) {
        if (batchResult.error) {
          results.push({
            input: batchResult.testCase.input,
            expectedOutput: batchResult.testCase.expected_output,
            actualOutput: '',
            passed: false,
            executionTime: 0,
            error: batchResult.error
          });
          continue;
        }
        
        const formatted = judgeService.formatExecutionResult(batchResult.result);
        const passed = formatted.success && 
                      formatted.stdout && 
                      formatted.stdout.trim() === batchResult.testCase.expected_output.trim();
        
        if (passed) passedCount++;
        
        totalExecutionTime += formatted.executionTime || 0;
        maxMemoryUsed = Math.max(maxMemoryUsed, formatted.memoryUsed || 0);
        
        results.push({
          input: batchResult.testCase.input,
          expectedOutput: batchResult.testCase.expected_output,
          actualOutput: formatted.stdout || '',
          passed: passed,
          executionTime: formatted.executionTime || 0,
          error: formatted.error || null
        });
      }
      
      // Calculate final status and score
      const score = Math.floor((passedCount / testCases.length) * 100);
      let status = score === 100 ? 'accepted' : 'wrong';
      
      // Check for runtime errors
      if (results.some(r => r.error && !r.passed)) {
        status = 'error';
      }
      
      const finalResult = {
        submissionId: 'BATCH_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        status: status,
        score: score,
        executionTime: Math.floor(totalExecutionTime / testCases.length),
        memoryUsed: maxMemoryUsed,
        testCasesPassed: passedCount,
        totalTestCases: testCases.length,
        testCaseResults: results
      };
      
      // Save submission if userId is provided
      if (userId) {
        try {
          // Save submission code
          const submissionCode = await SubmissionCode.create({
            source_code: sourceCode
          });
          
          // Save submission
          const submission = await Submission.create({
            user_id: userId,
            problem_id: id,
            code_id: submissionCode.id,
            language: language,
            status: status,
            score: finalResult.score,
            exec_time: finalResult.executionTime,
            memory_used: finalResult.memoryUsed,
            submitted_at: new Date()
          });

          // Award reward points if submission is accepted
          if (status === 'accepted') {
            try {
              // Get problem to determine difficulty
              const problem = await Problem.findByPk(id);
              if (problem) {
                // Check if user has already received reward for this problem
                const hasReward = await rewardService.hasReceivedReward(
                  userId,
                  'problem',
                  id,
                  'problem_solved'
                );

                if (!hasReward) {
                  const rewardResult = await rewardService.rewardProblemSolved(
                    userId,
                    id,
                    problem.difficulty,
                    {
                      language: language,
                      score: finalResult.score,
                      executionTime: finalResult.executionTime
                    }
                  );

                  if (rewardResult) {
                    console.log(`Awarded ${rewardResult.transaction.points} points to user ${userId} for solving problem ${id}`);
                  }
                }
              }
            } catch (rewardError) {
              console.error('Error awarding reward points:', rewardError);
              // Don't fail the request if reward fails
            }
          }
        } catch (saveError) {
          console.error('Failed to save batch submission:', saveError);
          // Continue with response even if save fails
        }
      }
      
      res.status(200).json({
        success: true,
        data: finalResult
      });
    } catch (error) {
      console.error('Error in batchSubmitCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit code with batch processing',
        error: error.message
      });
    }
  }
}

module.exports = new ProblemController();
