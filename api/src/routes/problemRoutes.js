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

module.exports = router;
