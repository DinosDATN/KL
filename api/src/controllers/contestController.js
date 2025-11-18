const {
  Contest,
  ContestProblem,
  UserContest,
  ContestSubmission,
  User,
  Problem,
  SubmissionCode,
  TestCase
} = require('../models');
const { Op } = require('sequelize');
const judgeService = require('../services/judgeService');

class ContestController {
  // Get all contests with filtering and pagination
  async getAllContests(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { status, created_by } = req.query;

      let whereClause = {};

      // Filter by status
      if (status === 'active') {
        whereClause = {
          start_time: { [Op.lte]: new Date() },
          end_time: { [Op.gt]: new Date() }
        };
      } else if (status === 'upcoming') {
        whereClause = {
          start_time: { [Op.gt]: new Date() }
        };
      } else if (status === 'completed') {
        whereClause = {
          end_time: { [Op.lt]: new Date() }
        };
      }

      // Filter by creator
      if (created_by) {
        whereClause.created_by = created_by;
      }

      const { count, rows: contests } = await Contest.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          },
          {
            model: ContestProblem,
            as: 'ContestProblems',
            attributes: ['id', 'score'],
            separate: true
          },
          {
            model: UserContest,
            as: 'UserContests',
            attributes: ['id'],
            separate: true
          }
        ],
        limit,
        offset,
        order: [['start_time', 'ASC']],
        distinct: true
      });

      // Add computed fields
      const enrichedContests = contests.map(contest => {
        const contestData = contest.toJSON();
        contestData.status = contest.getStatus();
        contestData.duration = contest.getDuration();
        contestData.time_remaining = contest.getTimeRemaining();
        contestData.problem_count = contestData.ContestProblems ? contestData.ContestProblems.length : 0;
        contestData.participant_count = contestData.UserContests ? contestData.UserContests.length : 0;
        return contestData;
      });

      res.status(200).json({
        success: true,
        data: enrichedContests,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllContests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contests',
        error: error.message
      });
    }
  }

  // Get contest by ID with detailed information
  async getContestById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const contest = await Contest.findByPk(id, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          },
          {
            model: ContestProblem,
            as: 'ContestProblems',
            include: [{
              model: Problem,
              as: 'Problem',
              attributes: ['id', 'title', 'difficulty', 'estimated_time']
            }]
          }
        ]
      });

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      const contestData = contest.toJSON();
      contestData.status = contest.getStatus();
      contestData.duration = contest.getDuration();
      contestData.time_remaining = contest.getTimeRemaining();

      // Check if user is registered for this contest
      if (userId) {
        const userContest = await UserContest.findOne({
          where: { contest_id: id, user_id: userId }
        });
        contestData.is_registered = !!userContest;
      }

      // Get participant count
      const participantCount = await UserContest.count({
        where: { contest_id: id }
      });
      contestData.participant_count = participantCount;

      res.status(200).json({
        success: true,
        data: contestData
      });
    } catch (error) {
      console.error('Error in getContestById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contest',
        error: error.message
      });
    }
  }

  // Create a new contest (admin/creator only)
  async createContest(req, res) {
    try {
      const { title, description, start_time, end_time, problem_ids } = req.body;
      const created_by = req.user.id;

      // Validate required fields
      if (!title || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Title, start time, and end time are required'
        });
      }

      // Validate time
      const now = new Date();
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);

      if (startTime <= now) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be in the future'
        });
      }

      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Create contest
      const contest = await Contest.create({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        created_by
      });

      // Add problems to contest if provided
      if (problem_ids && Array.isArray(problem_ids) && problem_ids.length > 0) {
        const contestProblems = problem_ids.map((problem_id, index) => ({
          contest_id: contest.id,
          problem_id: parseInt(problem_id.id || problem_id),
          score: problem_id.score || 100
        }));

        await ContestProblem.bulkCreate(contestProblems);
      }

      // Fetch the created contest with associations
      const createdContest = await Contest.findByPk(contest.id, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          },
          {
            model: ContestProblem,
            as: 'ContestProblems',
            include: [{
              model: Problem,
              as: 'Problem',
              attributes: ['id', 'title', 'difficulty']
            }]
          }
        ]
      });

      const contestData = createdContest.toJSON();
      contestData.status = createdContest.getStatus();
      contestData.duration = createdContest.getDuration();
      contestData.time_remaining = createdContest.getTimeRemaining();

      res.status(201).json({
        success: true,
        message: 'Contest created successfully',
        data: contestData
      });
    } catch (error) {
      console.error('Error in createContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create contest',
        error: error.message
      });
    }
  }

  // Update contest (creator/admin only)
  async updateContest(req, res) {
    try {
      const { id } = req.params;
      const { title, description, start_time, end_time } = req.body;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if user is the creator or admin
      if (contest.created_by !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only update contests you created'
        });
      }

      // Don't allow updates to active or completed contests
      const status = contest.getStatus();
      if (status === 'active' || status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update active or completed contests'
        });
      }

      // Validate time if provided
      if (start_time || end_time) {
        const startTime = start_time ? new Date(start_time) : contest.start_time;
        const endTime = end_time ? new Date(end_time) : contest.end_time;
        const now = new Date();

        if (startTime <= now) {
          return res.status(400).json({
            success: false,
            message: 'Start time must be in the future'
          });
        }

        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            message: 'End time must be after start time'
          });
        }
      }

      // Update contest
      await contest.update({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(start_time && { start_time: new Date(start_time) }),
        ...(end_time && { end_time: new Date(end_time) })
      });

      // Fetch updated contest with associations
      const updatedContest = await Contest.findByPk(id, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          },
          {
            model: ContestProblem,
            as: 'ContestProblems',
            include: [{
              model: Problem,
              as: 'Problem',
              attributes: ['id', 'title', 'difficulty']
            }]
          }
        ]
      });

      const contestData = updatedContest.toJSON();
      contestData.status = updatedContest.getStatus();
      contestData.duration = updatedContest.getDuration();
      contestData.time_remaining = updatedContest.getTimeRemaining();

      res.status(200).json({
        success: true,
        message: 'Contest updated successfully',
        data: contestData
      });
    } catch (error) {
      console.error('Error in updateContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update contest',
        error: error.message
      });
    }
  }

  // Delete contest (creator/admin only)
  async deleteContest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if user is the creator or admin
      if (contest.created_by !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete contests you created'
        });
      }

      // Don't allow deletion of active contests
      const status = contest.getStatus();
      if (status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete active contests'
        });
      }

      await contest.destroy();

      res.status(200).json({
        success: true,
        message: 'Contest deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete contest',
        error: error.message
      });
    }
  }

  // Register user for contest
  async registerForContest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      const status = contest.getStatus();
      if (status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot register for completed contests'
        });
      }

      // Check if already registered
      const existingRegistration = await UserContest.findOne({
        where: { contest_id: id, user_id: userId }
      });

      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: 'Already registered for this contest'
        });
      }

      await UserContest.create({
        contest_id: id,
        user_id: userId
      });

      res.status(201).json({
        success: true,
        message: 'Successfully registered for contest'
      });
    } catch (error) {
      console.error('Error in registerForContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register for contest',
        error: error.message
      });
    }
  }

  // Unregister user from contest
  async unregisterFromContest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      const status = contest.getStatus();
      if (status === 'active' || status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot unregister from active or completed contests'
        });
      }

      const registration = await UserContest.findOne({
        where: { contest_id: id, user_id: userId }
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Not registered for this contest'
        });
      }

      await registration.destroy();

      res.status(200).json({
        success: true,
        message: 'Successfully unregistered from contest'
      });
    } catch (error) {
      console.error('Error in unregisterFromContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unregister from contest',
        error: error.message
      });
    }
  }

  // Get contest problems
  async getContestProblems(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Anyone can view contest problems (no registration check needed)
      // This allows users to see what problems are in the contest before registering
      const contestProblems = await ContestProblem.findAll({
        where: { contest_id: id },
        include: [{
          model: Problem,
          as: 'Problem',
          attributes: ['id', 'title', 'description', 'difficulty', 'estimated_time']
        }],
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: contestProblems
      });
    } catch (error) {
      console.error('Error in getContestProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contest problems',
        error: error.message
      });
    }
  }

  // Add problem to contest (creator/admin only)
  async addProblemToContest(req, res) {
    try {
      const { id } = req.params;
      const { problem_id, score = 100 } = req.body;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if user is the creator or admin
      if (contest.created_by !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only modify contests you created'
        });
      }

      // Don't allow modifications to active or completed contests
      const status = contest.getStatus();
      if (status === 'active' || status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify active or completed contests'
        });
      }

      // Check if problem exists
      const problem = await Problem.findByPk(problem_id);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      // Check if problem is already in contest
      const existingContestProblem = await ContestProblem.findOne({
        where: { contest_id: id, problem_id }
      });

      if (existingContestProblem) {
        return res.status(400).json({
          success: false,
          message: 'Problem is already in this contest'
        });
      }

      const contestProblem = await ContestProblem.create({
        contest_id: id,
        problem_id,
        score
      });

      const createdContestProblem = await ContestProblem.findByPk(contestProblem.id, {
        include: [{
          model: Problem,
          as: 'Problem',
          attributes: ['id', 'title', 'difficulty', 'estimated_time']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Problem added to contest successfully',
        data: createdContestProblem
      });
    } catch (error) {
      console.error('Error in addProblemToContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add problem to contest',
        error: error.message
      });
    }
  }

  // Remove problem from contest (creator/admin only)
  async removeProblemFromContest(req, res) {
    try {
      const { id, problem_id } = req.params;
      const userId = req.user.id;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if user is the creator or admin
      if (contest.created_by !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only modify contests you created'
        });
      }

      // Don't allow modifications to active or completed contests
      const status = contest.getStatus();
      if (status === 'active' || status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify active or completed contests'
        });
      }

      const contestProblem = await ContestProblem.findOne({
        where: { contest_id: id, problem_id }
      });

      if (!contestProblem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found in this contest'
        });
      }

      await contestProblem.destroy();

      res.status(200).json({
        success: true,
        message: 'Problem removed from contest successfully'
      });
    } catch (error) {
      console.error('Error in removeProblemFromContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove problem from contest',
        error: error.message
      });
    }
  }

  // Submit code for contest problem
  async submitToContest(req, res) {
    try {
      const { id, problem_id } = req.params;
      const { sourceCode, language } = req.body;
      const userId = req.user.id;

      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if contest is active
      const status = contest.getStatus();
      if (status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Contest is not currently active'
        });
      }

      // Check if user is registered
      const registration = await UserContest.findOne({
        where: { contest_id: id, user_id: userId }
      });

      if (!registration) {
        return res.status(403).json({
          success: false,
          message: 'You must register for the contest to submit solutions'
        });
      }

      // Find contest problem
      const contestProblem = await ContestProblem.findOne({
        where: { contest_id: id, problem_id },
        include: [{
          model: Problem,
          as: 'Problem'
        }]
      });

      if (!contestProblem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found in this contest'
        });
      }

      // Get test cases for the problem
      const testCases = await TestCase.findAll({
        where: { problem_id },
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

      // Save submission code
      const submissionCode = await SubmissionCode.create({
        source_code: sourceCode
      });

      // Map result status to database enum
      let dbStatus = 'error';
      let score = 0;

      switch (result.status) {
        case 'accepted':
          dbStatus = 'accepted';
          score = contestProblem.score;
          break;
        case 'wrong':
          dbStatus = 'wrong';
          score = 0;
          break;
        case 'error':
        case 'timeout':
        default:
          dbStatus = 'error';
          score = 0;
          break;
      }

      // Save contest submission
      const contestSubmission = await ContestSubmission.create({
        user_id: userId,
        contest_problem_id: contestProblem.id,
        code_id: submissionCode.id,
        language: language,
        status: dbStatus,
        score: score
      });

      const submissionResult = await ContestSubmission.findByPk(contestSubmission.id, {
        include: [
          {
            model: SubmissionCode,
            as: 'Code',
            attributes: ['source_code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Code submitted successfully',
        data: {
          submission: submissionResult,
          execution_result: result
        }
      });
    } catch (error) {
      console.error('Error in submitToContest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit code',
        error: error.message
      });
    }
  }

  // Get contest leaderboard
  async getContestLeaderboard(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Get leaderboard data
      const leaderboard = await ContestSubmission.findAll({
        attributes: [
          'user_id',
          [Contest.sequelize.fn('SUM', Contest.sequelize.col('ContestSubmission.score')), 'total_score'],
          [Contest.sequelize.fn('COUNT', Contest.sequelize.col('ContestSubmission.id')), 'submission_count'],
          [Contest.sequelize.fn('MAX', Contest.sequelize.col('ContestSubmission.submitted_at')), 'last_submission']
        ],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'avatar_url']
          },
          {
            model: ContestProblem,
            as: 'ContestProblem',
            where: { contest_id: id },
            attributes: []
          }
        ],
        where: {
          status: 'accepted'
        },
        group: ['user_id', 'User.id'],
        order: [
          [Contest.sequelize.fn('SUM', Contest.sequelize.col('ContestSubmission.score')), 'DESC'],
          [Contest.sequelize.fn('MAX', Contest.sequelize.col('ContestSubmission.submitted_at')), 'ASC']
        ],
        limit,
        offset
      });

      // Add ranking
      const rankedLeaderboard = leaderboard.map((entry, index) => {
        const entryData = entry.toJSON();
        entryData.rank = offset + index + 1;
        return entryData;
      });

      res.status(200).json({
        success: true,
        data: rankedLeaderboard,
        pagination: {
          current_page: page,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getContestLeaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contest leaderboard',
        error: error.message
      });
    }
  }

  // Get user's contest submissions
  async getUserContestSubmissions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      // Check if user is registered
      const registration = await UserContest.findOne({
        where: { contest_id: id, user_id: userId }
      });

      if (!registration) {
        return res.status(403).json({
          success: false,
          message: 'You must register for the contest to view submissions'
        });
      }

      const { count, rows: submissions } = await ContestSubmission.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: ContestProblem,
            as: 'ContestProblem',
            where: { contest_id: id },
            include: [{
              model: Problem,
              as: 'Problem',
              attributes: ['id', 'title', 'difficulty']
            }]
          },
          {
            model: SubmissionCode,
            as: 'Code',
            attributes: ['source_code']
          }
        ],
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
      console.error('Error in getUserContestSubmissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user contest submissions',
        error: error.message
      });
    }
  }

  // Get contest participants
  async getContestParticipants(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: 'Contest not found'
        });
      }

      const { count, rows: participants } = await UserContest.findAndCountAll({
        where: { contest_id: id },
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'avatar_url']
        }],
        limit,
        offset,
        order: [['joined_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: participants,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getContestParticipants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contest participants',
        error: error.message
      });
    }
  }

  // Get active contests
  async getActiveContests(req, res) {
    try {
      const activeContests = await Contest.findActive();

      const enrichedContests = activeContests.map(contest => {
        const contestData = contest.toJSON();
        contestData.status = contest.getStatus();
        contestData.duration = contest.getDuration();
        contestData.time_remaining = contest.getTimeRemaining();
        return contestData;
      });

      res.status(200).json({
        success: true,
        data: enrichedContests
      });
    } catch (error) {
      console.error('Error in getActiveContests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active contests',
        error: error.message
      });
    }
  }

  // Get upcoming contests
  async getUpcomingContests(req, res) {
    try {
      const upcomingContests = await Contest.findUpcoming();

      const enrichedContests = upcomingContests.map(contest => {
        const contestData = contest.toJSON();
        contestData.status = contest.getStatus();
        contestData.duration = contest.getDuration();
        contestData.time_remaining = contest.getTimeRemaining();
        return contestData;
      });

      res.status(200).json({
        success: true,
        data: enrichedContests
      });
    } catch (error) {
      console.error('Error in getUpcomingContests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming contests',
        error: error.message
      });
    }
  }

  // Get past contests
  async getPastContests(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: pastContests } = await Contest.findAndCountAll({
        where: {
          end_time: { [Op.lt]: new Date() }
        },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          }
        ],
        limit,
        offset,
        order: [['end_time', 'DESC']],
        distinct: true
      });

      const enrichedContests = pastContests.map(contest => {
        const contestData = contest.toJSON();
        contestData.status = contest.getStatus();
        contestData.duration = contest.getDuration();
        contestData.time_remaining = contest.getTimeRemaining();
        return contestData;
      });

      res.status(200).json({
        success: true,
        data: enrichedContests,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getPastContests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch past contests',
        error: error.message
      });
    }
  }
}

module.exports = new ContestController();
