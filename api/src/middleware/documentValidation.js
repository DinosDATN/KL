const { body, param, query, validationResult } = require('express-validator');
const Document = require('../models/Document');
const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const Topic = require('../models/Topic');

// Helper function to handle validation results
const handleValidationResult = (req, res, next) => {
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

// Document validation rules
const validateDocument = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Content cannot exceed 100000 characters'),
  
  body('topic_id')
    .isInt({ min: 1 })
    .withMessage('Valid topic ID is required')
    .custom(async (value) => {
      const topic = await Topic.findByPk(value);
      if (!topic) {
        throw new Error('Topic not found');
      }
      return true;
    }),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  
  body('thumbnail_url')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Thumbnail URL cannot exceed 1000 characters'),
  
  handleValidationResult
];

const validateDocumentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Content cannot exceed 100000 characters'),
  
  body('topic_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid topic ID is required')
    .custom(async (value) => {
      if (value) {
        const topic = await Topic.findByPk(value);
        if (!topic) {
          throw new Error('Topic not found');
        }
      }
      return true;
    }),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  
  body('thumbnail_url')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Thumbnail URL cannot exceed 1000 characters'),
  
  handleValidationResult
];

// Document Module validation rules
const validateDocumentModule = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Module title must be between 1 and 255 characters'),
  
  body('position')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Position must be a positive integer'),
  
  handleValidationResult
];

const validateDocumentModuleUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Module title must be between 1 and 255 characters'),
  
  body('position')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Position must be a positive integer'),
  
  handleValidationResult
];

// Document Lesson validation rules
const validateDocumentLesson = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Lesson title must be between 1 and 255 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Content cannot exceed 100000 characters'),
  
  body('code_example')
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Code example cannot exceed 50000 characters'),
  
  body('position')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Position must be a positive integer'),
  
  handleValidationResult
];

const validateDocumentLessonUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Lesson title must be between 1 and 255 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Content cannot exceed 100000 characters'),
  
  body('code_example')
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Code example cannot exceed 50000 characters'),
  
  body('position')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Position must be a positive integer'),
  
  handleValidationResult
];

// Parameter validation
const validateDocumentId = [
  param('id').isInt({ min: 1 }).withMessage('Valid document ID is required'),
  handleValidationResult
];

const validateModuleId = [
  param('module_id').isInt({ min: 1 }).withMessage('Valid module ID is required'),
  handleValidationResult
];

const validateLessonId = [
  param('lesson_id').isInt({ min: 1 }).withMessage('Valid lesson ID is required'),
  handleValidationResult
];

// Query validation for pagination and filtering
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'rating', 'students', 'duration', 'created_at'])
    .withMessage('Invalid sort field'),
  
  query('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced'),
  
  query('topic_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Topic ID must be a positive integer'),
  
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  query('created_by')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Creator ID must be a positive integer'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search term cannot exceed 200 characters'),
  
  handleValidationResult
];

// Reorder validation
const validateReorder = [
  body('modules')
    .optional()
    .isArray()
    .withMessage('Modules must be an array')
    .custom((modules) => {
      if (modules && modules.length > 0) {
        for (const module of modules) {
          if (!module.id || !Number.isInteger(module.id) || module.id < 1) {
            throw new Error('Each module must have a valid ID');
          }
          if (!module.position || !Number.isInteger(module.position) || module.position < 1) {
            throw new Error('Each module must have a valid position');
          }
        }
      }
      return true;
    }),
  
  body('lessons')
    .optional()
    .isArray()
    .withMessage('Lessons must be an array')
    .custom((lessons) => {
      if (lessons && lessons.length > 0) {
        for (const lesson of lessons) {
          if (!lesson.id || !Number.isInteger(lesson.id) || lesson.id < 1) {
            throw new Error('Each lesson must have a valid ID');
          }
          if (!lesson.position || !Number.isInteger(lesson.position) || lesson.position < 1) {
            throw new Error('Each lesson must have a valid position');
          }
        }
      }
      return true;
    }),
  
  handleValidationResult
];

// Completion validation
const validateCompletion = [
  body('completed')
    .isBoolean()
    .withMessage('Completed status must be true or false'),
  
  body('completion_date')
    .optional()
    .isISO8601()
    .withMessage('Completion date must be a valid ISO 8601 date'),
  
  handleValidationResult
];

// Rating validation
const validateRating = [
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review cannot exceed 2000 characters'),
  
  handleValidationResult
];

// Middleware to check document ownership or admin role
const checkDocumentOwnership = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.document_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Admins can access any document
    if (userRole === 'admin') {
      return next();
    }
    
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user owns the document
    if (document.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own documents'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkDocumentOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document ownership',
      error: error.message
    });
  }
};

// Middleware to check module ownership through document
const checkModuleOwnership = async (req, res, next) => {
  try {
    const moduleId = req.params.module_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Admins can access any module
    if (userRole === 'admin') {
      return next();
    }
    
    const module = await DocumentModule.findOne({
      where: { id: moduleId },
      include: [{
        model: Document,
        as: 'Document',
        attributes: ['id', 'created_by']
      }]
    });
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    // Check if user owns the document that contains this module
    if (module.Document.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify modules in your own documents'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkModuleOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify module ownership',
      error: error.message
    });
  }
};

// Middleware to check lesson ownership through module and document
const checkLessonOwnership = async (req, res, next) => {
  try {
    const lessonId = req.params.lesson_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Admins can access any lesson
    if (userRole === 'admin') {
      return next();
    }
    
    const lesson = await DocumentLesson.findOne({
      where: { id: lessonId },
      include: [{
        model: DocumentModule,
        as: 'Module',
        include: [{
          model: Document,
          as: 'Document',
          attributes: ['id', 'created_by']
        }]
      }]
    });
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    // Check if user owns the document that contains this lesson
    if (lesson.Module.Document.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify lessons in your own documents'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkLessonOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify lesson ownership',
      error: error.message
    });
  }
};

module.exports = {
  validateDocument,
  validateDocumentUpdate,
  validateDocumentModule,
  validateDocumentModuleUpdate,
  validateDocumentLesson,
  validateDocumentLessonUpdate,
  validateDocumentId,
  validateModuleId,
  validateLessonId,
  validatePagination,
  validateReorder,
  validateCompletion,
  validateRating,
  checkDocumentOwnership,
  checkModuleOwnership,
  checkLessonOwnership,
  handleValidationResult
};