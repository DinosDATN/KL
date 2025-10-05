const express = require('express');
const documentController = require('../controllers/documentController');
const documentModuleController = require('../controllers/documentModuleController');
const documentLessonController = require('../controllers/documentLessonController');
const documentProgressController = require('../controllers/documentProgressController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const {
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
  checkDocumentOwnership,
  checkModuleOwnership,
  checkLessonOwnership
} = require('../middleware/documentValidation');

const router = express.Router();

/**
 * ==================== DOCUMENT ROUTES ====================
 */

// Create a new document
router.post('/', authenticateToken, validateDocument, documentController.createDocument);

// Document CRUD operations
router.get('/', validatePagination, documentController.getAllDocuments);
router.get('/featured', documentController.getFeaturedDocuments);

// Topics and Categories
router.get('/topics', documentController.getTopics);
router.get('/categories', documentController.getDocumentCategories);
router.get('/category-links', documentController.getDocumentCategoryLinks);

// Update and delete documents
router.put('/:id', authenticateToken, validateDocumentId, checkDocumentOwnership, validateDocumentUpdate, documentController.updateDocument);
router.delete('/:id', authenticateToken, validateDocumentId, checkDocumentOwnership, documentController.deleteDocument);

// Document details and structure
router.get('/:id', validateDocumentId, documentController.getDocumentById);
router.get('/:id/details', documentController.getDocumentDetails);
router.get('/:id/modules', documentController.getDocumentModules);
router.get('/:id/lessons', documentController.getDocumentLessons);
router.get('/:id/animations', documentController.getDocumentAnimations);

// Lessons
router.get('/lessons/:lessonId', documentController.getLessonById);
router.get('/lessons/:lessonId/animations', documentController.getLessonAnimations);

// Document filtering and grouping
router.get('/topic/:topic_id', documentController.getDocumentsByTopic);

// User progress tracking
router.get('/users/:userId/completions', documentController.getUserDocumentCompletions);
router.get('/users/:userId/lesson-completions', documentController.getUserLessonCompletions);

/**
 * ==================== MODULE ROUTES ====================
 */

// Create a new module
router.post('/:id/modules', authenticateToken, validateDocumentId, checkDocumentOwnership, validateDocumentModule, documentModuleController.createModule);

// Get all modules for a document
router.get('/:document_id/modules', validateDocumentId, documentModuleController.getDocumentModules);

// Get a single module by ID
router.get('/modules/:module_id', validateModuleId, documentModuleController.getModuleById);

// Update a module
router.put('/modules/:module_id', authenticateToken, validateModuleId, checkModuleOwnership, validateDocumentModuleUpdate, documentModuleController.updateModule);

// Delete a module
router.delete('/modules/:module_id', authenticateToken, validateModuleId, checkModuleOwnership, documentModuleController.deleteModule);

// Reorder modules within a document
router.post('/:document_id/modules/reorder', authenticateToken, validateDocumentId, checkDocumentOwnership, validateReorder, documentModuleController.reorderModules);

// Get module statistics
router.get('/modules/:module_id/stats', validateModuleId, documentModuleController.getModuleStats);

// Duplicate a module
router.post('/modules/:module_id/duplicate', authenticateToken, validateModuleId, checkModuleOwnership, documentModuleController.duplicateModule);

/**
 * ==================== LESSON ROUTES ====================
 */

// Create a new lesson
router.post('/modules/:module_id/lessons', authenticateToken, validateModuleId, checkModuleOwnership, validateDocumentLesson, documentLessonController.createLesson);

// Get all lessons for a module
router.get('/modules/:module_id/lessons', validateModuleId, optionalAuth, documentLessonController.getModuleLessons);

// Get all lessons for a document
router.get('/:document_id/lessons-all', validateDocumentId, optionalAuth, documentLessonController.getDocumentLessons);

// Get a single lesson by ID
router.get('/lessons/:lesson_id', validateLessonId, optionalAuth, documentLessonController.getLessonById);

// Update a lesson
router.put('/lessons/:lesson_id', authenticateToken, validateLessonId, checkLessonOwnership, validateDocumentLessonUpdate, documentLessonController.updateLesson);

// Delete a lesson
router.delete('/lessons/:lesson_id', authenticateToken, validateLessonId, checkLessonOwnership, documentLessonController.deleteLesson);

// Reorder lessons within a module
router.post('/modules/:module_id/lessons/reorder', authenticateToken, validateModuleId, checkModuleOwnership, validateReorder, documentLessonController.reorderLessons);

// Toggle lesson completion
router.post('/lessons/:lesson_id/completion', authenticateToken, validateLessonId, validateCompletion, documentLessonController.toggleLessonCompletion);

// Get user's lesson completions for a document
router.get('/:document_id/my-completions', authenticateToken, validateDocumentId, documentLessonController.getUserLessonCompletions);

// Duplicate a lesson
router.post('/lessons/:lesson_id/duplicate', authenticateToken, validateLessonId, checkLessonOwnership, documentLessonController.duplicateLesson);

// Get lesson navigation
router.get('/lessons/:lesson_id/navigation', validateLessonId, documentLessonController.getLessonNavigation);

/**
 * ==================== PROGRESS & ANALYTICS ROUTES ====================
 */

// Get user's learning dashboard
router.get('/dashboard', authenticateToken, documentProgressController.getLearningDashboard);

// Get detailed progress for a specific document
router.get('/:document_id/progress', authenticateToken, validateDocumentId, documentProgressController.getDocumentProgress);

// Get analytics for document creators/instructors
router.get('/:document_id/analytics', authenticateToken, validateDocumentId, documentProgressController.getDocumentAnalytics);

// Mark entire document as completed
router.post('/:document_id/complete', authenticateToken, validateDocumentId, documentProgressController.markDocumentCompleted);

// Get leaderboard for a document
router.get('/:document_id/leaderboard', validateDocumentId, documentProgressController.getDocumentLeaderboard);

module.exports = router;
