const { body, param, query, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Validate course creation
const validateCourseCreation = [
  body('title')
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 255 })
    .withMessage('Course title must be less than 255 characters'),
  
  body('category_id')
    .notEmpty()
    .withMessage('Course category is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  
  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Price must be a non-negative integer'),
  
  body('original_price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Original price must be a non-negative integer'),
  
  body('discount')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  body('is_premium')
    .optional()
    .isBoolean()
    .withMessage('is_premium must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  
  body('instructor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Instructor ID must be a valid integer'),
  
  handleValidationErrors
];

// Validate course update
const validateCourseUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a valid integer'),
  
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Course title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Course title must be less than 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  
  body('price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Price must be a non-negative integer'),
  
  body('original_price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Original price must be a non-negative integer'),
  
  body('discount')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  body('is_premium')
    .optional()
    .isBoolean()
    .withMessage('is_premium must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  
  body('instructor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Instructor ID must be a valid integer'),
  
  handleValidationErrors
];

// Validate course ID parameter
const validateCourseId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a valid integer'),
  
  handleValidationErrors
];

// Validate status update
const validateStatusUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Course ID must be a valid integer'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  
  handleValidationErrors
];

// Validate bulk operations
const validateBulkUpdate = [
  body('course_ids')
    .isArray({ min: 1 })
    .withMessage('course_ids must be a non-empty array')
    .custom((value) => {
      if (value.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
        throw new Error('All course IDs must be valid positive integers');
      }
      return true;
    }),
  
  body('update_data')
    .isObject()
    .withMessage('update_data must be an object')
    .custom((value) => {
      if (Object.keys(value).length === 0) {
        throw new Error('update_data cannot be empty');
      }
      return true;
    }),
  
  body('update_data.level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  body('update_data.status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  
  body('update_data.is_premium')
    .optional()
    .isBoolean()
    .withMessage('is_premium must be a boolean'),
  
  handleValidationErrors
];

// Validate bulk delete
const validateBulkDelete = [
  body('course_ids')
    .isArray({ min: 1 })
    .withMessage('course_ids must be a non-empty array')
    .custom((value) => {
      if (value.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
        throw new Error('All course IDs must be valid positive integers');
      }
      return true;
    }),
  
  body('permanent')
    .optional()
    .isBoolean()
    .withMessage('permanent must be a boolean'),
  
  handleValidationErrors
];

// Validate export parameters
const validateExport = [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be either json or csv'),
  
  query('include_deleted')
    .optional()
    .isBoolean()
    .withMessage('include_deleted must be a boolean'),
  
  handleValidationErrors
];

module.exports = {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseId,
  validateStatusUpdate,
  validateBulkUpdate,
  validateBulkDelete,
  validateExport,
  handleValidationErrors
};