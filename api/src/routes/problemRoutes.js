const express = require('express');
const problemController = require('../controllers/problemController');
const judgeMiddleware = require('../middleware/judgeMiddleware');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Problem CRUD operations - add optional auth for better data
router.get('/', optionalAuth, problemController.getAllProblems);
router.get('/featured', problemController.getFeaturedProblems);
router.get('/popular', problemController.getPopularProblems);
router.get('/new', problemController.getNewProblems);
router.get('/:id', optionalAuth, problemController.getProblemById);

// Problem filtering and grouping
router.get('/difficulty/:difficulty', optionalAuth, problemController.getProblemsByDifficulty);
router.get('/category/:category_id', optionalAuth, problemController.getProblemsByCategory);

// Categories and Tags
router.get('/data/categories', problemController.getCategories);
router.get('/data/tags', problemController.getTags);
router.get('/:id/tags', problemController.getProblemTags);

// Problem details
router.get('/:id/examples', problemController.getProblemExamples);
router.get('/:id/constraints', problemController.getProblemConstraints);
router.get('/:id/starter-codes', problemController.getStarterCodes);
router.get('/:id/test-cases', problemController.getTestCases);

// Code execution and submission with middleware
router.post('/execute', 
  judgeMiddleware.rateLimit(5, 60000), // 5 requests per minute
  judgeMiddleware.securityHeaders,
  judgeMiddleware.validateSourceCode,
  judgeMiddleware.validateInput,
  judgeMiddleware.logJudgeOperation,
  judgeMiddleware.sanitizeOutput,
  problemController.executeCode
);

router.post('/:id/execute-examples', 
  judgeMiddleware.rateLimit(5, 60000), // 5 requests per minute
  judgeMiddleware.securityHeaders,
  judgeMiddleware.validateSourceCode,
  judgeMiddleware.logJudgeOperation,
  judgeMiddleware.sanitizeOutput,
  problemController.executeCodeWithExamples
);

router.post('/:id/submit', 
  judgeMiddleware.rateLimit(10, 60000), // 10 submissions per minute
  judgeMiddleware.securityHeaders,
  judgeMiddleware.validateSourceCode,
  judgeMiddleware.logJudgeOperation,
  judgeMiddleware.sanitizeOutput,
  problemController.submitCode
);

router.post('/:id/batch-submit', 
  judgeMiddleware.rateLimit(3, 60000), // 3 batch submissions per minute
  judgeMiddleware.securityHeaders,
  judgeMiddleware.validateSourceCode,
  judgeMiddleware.logJudgeOperation,
  judgeMiddleware.sanitizeOutput,
  problemController.batchSubmitCode
);

router.get('/:id/submissions', authenticateToken, problemController.getProblemSubmissions);

// Assignment dashboard endpoints - require authentication
router.get('/dashboard/submissions', authenticateToken, problemController.getAllSubmissions);
router.get('/dashboard/stats', authenticateToken, problemController.getSubmissionStats);

// Async submission handling with middleware
router.post('/async-submit', 
  judgeMiddleware.rateLimit(10, 60000),
  judgeMiddleware.securityHeaders,
  judgeMiddleware.validateSourceCode,
  judgeMiddleware.validateInput,
  judgeMiddleware.logJudgeOperation,
  problemController.createAsyncSubmission
);

router.get('/submission/:token', 
  judgeMiddleware.securityHeaders,
  judgeMiddleware.sanitizeOutput,
  problemController.getSubmission
);

// Supported languages and health check
router.get('/data/languages', problemController.getSupportedLanguages);
router.get('/judge/health', problemController.checkJudgeHealth);

// Problem comments
router.get('/:id/comments', problemController.getProblemComments);
router.post('/:id/comments', authenticateToken, problemController.createProblemComment);
router.put('/:id/comments/:comment_id', authenticateToken, problemController.updateProblemComment);
router.delete('/:id/comments/:comment_id', authenticateToken, problemController.deleteProblemComment);

module.exports = router;
