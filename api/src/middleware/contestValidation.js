const { body, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Contest creation validation
const validateContestCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid date')
    .custom((value, { req }) => {
      const startTime = new Date(req.body.start_time);
      const endTime = new Date(value);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('problem_ids')
    .optional()
    .isArray()
    .withMessage('Problem IDs must be an array'),
  
  body('problem_ids.*')
    .optional()
    .custom((value) => {
      if (typeof value === 'object') {
        if (!value.id || !Number.isInteger(parseInt(value.id))) {
          throw new Error('Each problem must have a valid ID');
        }
        if (value.score !== undefined && (!Number.isInteger(value.score) || value.score < 0 || value.score > 1000)) {
          throw new Error('Problem score must be between 0 and 1000');
        }
      } else if (!Number.isInteger(parseInt(value))) {
        throw new Error('Problem IDs must be valid integers');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Contest update validation
const validateContestUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty if provided')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  
  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid date'),
  
  handleValidationErrors
];

// Contest ID validation
const validateContestId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Contest ID must be a positive integer'),
  
  handleValidationErrors
];

// Problem ID validation
const validateProblemId = [
  param('problem_id')
    .isInt({ min: 1 })
    .withMessage('Problem ID must be a positive integer'),
  
  handleValidationErrors
];

// Add problem to contest validation
const validateAddProblem = [
  body('problem_id')
    .notEmpty()
    .withMessage('Problem ID is required')
    .isInt({ min: 1 })
    .withMessage('Problem ID must be a positive integer'),
  
  body('score')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Score must be between 0 and 1000'),
  
  handleValidationErrors
];

// Submit to contest validation
const validateContestSubmission = [
  body('sourceCode')
    .notEmpty()
    .withMessage('Source code is required')
    .isLength({ min: 1, max: 100000 })
    .withMessage('Source code must be between 1 and 100000 characters'),
  
  body('language')
    .notEmpty()
    .withMessage('Programming language is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Language must be between 1 and 50 characters'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  validateContestCreation,
  validateContestUpdate,
  validateContestId,
  validateProblemId,
  validateAddProblem,
  validateContestSubmission,
  validatePagination,
  handleValidationErrors
};
