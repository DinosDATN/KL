const express = require('express');
const documentController = require('../controllers/documentController');

const router = express.Router();

// Document CRUD operations
router.get('/', documentController.getAllDocuments);
router.get('/featured', documentController.getFeaturedDocuments);

// Topics and Categories
router.get('/topics', documentController.getTopics);
router.get('/categories', documentController.getDocumentCategories);
router.get('/category-links', documentController.getDocumentCategoryLinks);

// Document details and structure
router.get('/:id', documentController.getDocumentById);
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

module.exports = router;
