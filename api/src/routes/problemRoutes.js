const express = require('express');
const problemController = require('../controllers/problemController');

const router = express.Router();

// Problem CRUD operations
router.get('/', problemController.getAllProblems);
router.get('/featured', problemController.getFeaturedProblems);
router.get('/popular', problemController.getPopularProblems);
router.get('/new', problemController.getNewProblems);
router.get('/:id', problemController.getProblemById);

// Problem filtering and grouping
router.get('/difficulty/:difficulty', problemController.getProblemsByDifficulty);
router.get('/category/:category_id', problemController.getProblemsByCategory);

// Categories and Tags
router.get('/data/categories', problemController.getCategories);
router.get('/data/tags', problemController.getTags);
router.get('/:id/tags', problemController.getProblemTags);

// Problem details
router.get('/:id/examples', problemController.getProblemExamples);
router.get('/:id/constraints', problemController.getProblemConstraints);
router.get('/:id/starter-codes', problemController.getStarterCodes);
router.get('/:id/test-cases', problemController.getTestCases);

// Code execution and submission
router.post('/execute', problemController.executeCode);
router.post('/:id/submit', problemController.submitCode);
router.get('/:id/submissions', problemController.getProblemSubmissions);

// Supported languages
router.get('/data/languages', problemController.getSupportedLanguages);

module.exports = router;
