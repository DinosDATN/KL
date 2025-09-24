const { Submission, SubmissionCode, User, Problem, ProblemCategory } = require('../models');
const { Op } = require('sequelize');

// Get all submissions with filtering and pagination for grading board
const getSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      language,
      problem_id,
      user_id,
      sort_by = 'submitted_at',
      sort_order = 'DESC',
      include_code = 'false'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Apply filters
    if (status) {
      whereClause.status = status;
    }
    if (language) {
      whereClause.language = language;
    }
    if (problem_id) {
      whereClause.problem_id = problem_id;
    }
    if (user_id) {
      whereClause.user_id = user_id;
    }

    // Build include array
    const includeArray = [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email', 'avatar_url']
      },
      {
        model: Problem,
        attributes: ['id', 'title', 'difficulty'],
        include: [
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          }
        ]
      }
    ];

    // Include submission code only if requested and user has permission
    if (include_code === 'true') {
      includeArray.push({
        model: SubmissionCode,
        as: 'Code',
        attributes: ['id', 'source_code']
      });
    }

    const submissions = await Submission.findAndCountAll({
      where: whereClause,
      include: includeArray,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    // Filter out submission code if user doesn't have permission to view it
    const filteredSubmissions = submissions.rows.map(submission => {
      const submissionData = submission.toJSON();
      
      // Only show code if the current user is the submitter or an admin
      if (submissionData.Code && req.user) {
        const isOwner = submissionData.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
          delete submissionData.Code;
        }
      }
      
      return submissionData;
    });

    const totalPages = Math.ceil(submissions.count / parseInt(limit));

    res.json({
      success: true,
      data: {
        submissions: filteredSubmissions,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: submissions.count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};

// Get a single submission by ID
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_code = 'false' } = req.query;

    const includeArray = [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email', 'avatar_url']
      },
      {
        model: Problem,
        attributes: ['id', 'title', 'difficulty', 'description'],
        include: [
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          }
        ]
      }
    ];

    // Include submission code if requested
    if (include_code === 'true') {
      includeArray.push({
        model: SubmissionCode,
        as: 'Code',
        attributes: ['id', 'source_code']
      });
    }

    const submission = await Submission.findByPk(id, {
      include: includeArray
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submissionData = submission.toJSON();

    // Check code visibility permissions
    if (submissionData.Code && req.user) {
      const isOwner = submissionData.user_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        delete submissionData.Code;
      }
    }

    res.json({
      success: true,
      data: submissionData
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission',
      error: error.message
    });
  }
};

// Get submissions by user (for personal view)
const getUserSubmissions = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      page = 1,
      limit = 20,
      status,
      language,
      problem_id,
      sort_by = 'submitted_at',
      sort_order = 'DESC'
    } = req.query;

    // Check if user can access these submissions
    if (req.user.id !== parseInt(user_id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own submissions.'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {
      user_id: user_id
    };

    // Apply filters
    if (status) {
      whereClause.status = status;
    }
    if (language) {
      whereClause.language = language;
    }
    if (problem_id) {
      whereClause.problem_id = problem_id;
    }

    const submissions = await Submission.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'avatar_url']
        },
        {
          model: Problem,
          attributes: ['id', 'title', 'difficulty'],
          include: [
            {
              model: ProblemCategory,
              as: 'Category',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: SubmissionCode,
          as: 'Code',
          attributes: ['id', 'source_code']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(submissions.count / parseInt(limit));

    res.json({
      success: true,
      data: {
        submissions: submissions.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: submissions.count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user submissions',
      error: error.message
    });
  }
};

// Get submission statistics
const getSubmissionStats = async (req, res) => {
  try {
    const { user_id, problem_id, time_range = '30' } = req.query;
    const whereClause = {};

    // Time range filter
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(time_range));
    whereClause.submitted_at = {
      [Op.gte]: daysAgo
    };

    // Apply filters
    if (user_id) {
      whereClause.user_id = user_id;
    }
    if (problem_id) {
      whereClause.problem_id = problem_id;
    }

    // Get submission counts by status
    const statusStats = await Submission.findAll({
      attributes: [
        'status',
        [Submission.sequelize.fn('COUNT', Submission.sequelize.col('status')), 'count']
      ],
      where: whereClause,
      group: ['status']
    });

    // Get submission counts by language
    const languageStats = await Submission.findAll({
      attributes: [
        'language',
        [Submission.sequelize.fn('COUNT', Submission.sequelize.col('language')), 'count']
      ],
      where: whereClause,
      group: ['language']
    });

    // Get total submissions
    const totalSubmissions = await Submission.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        total_submissions: totalSubmissions,
        status_breakdown: statusStats.map(item => ({
          status: item.status,
          count: parseInt(item.getDataValue('count'))
        })),
        language_breakdown: languageStats.map(item => ({
          language: item.language,
          count: parseInt(item.getDataValue('count'))
        })),
        time_range_days: parseInt(time_range)
      }
    });
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission statistics',
      error: error.message
    });
  }
};

module.exports = {
  getSubmissions,
  getSubmissionById,
  getUserSubmissions,
  getSubmissionStats
};
