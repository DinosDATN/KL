const express = require('express');
const { body } = require('express-validator');
const ForumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createPostValidation = [
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID phải là số nguyên dương'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Tiêu đề phải có từ 5-500 ký tự'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Nội dung phải có ít nhất 10 ký tự'),
  body('isQuestion')
    .optional()
    .isBoolean()
    .withMessage('isQuestion phải là boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags phải là mảng')
];

const createReplyValidation = [
  body('content')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Nội dung phản hồi phải có ít nhất 5 ký tự'),
  body('parentReplyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent reply ID phải là số nguyên dương')
];

const voteValidation = [
  body('type')
    .isIn(['post', 'reply'])
    .withMessage('Type phải là post hoặc reply'),
  body('targetId')
    .isInt({ min: 1 })
    .withMessage('Target ID phải là số nguyên dương'),
  body('voteType')
    .isIn(['up', 'down'])
    .withMessage('Vote type phải là up hoặc down')
];

// Public routes
router.get('/categories', ForumController.getCategories);
router.get('/posts', ForumController.getPosts);
router.get('/posts/:id', ForumController.getPost);
router.get('/posts/:id/replies', ForumController.getReplies);
router.get('/statistics', ForumController.getStatistics);
router.get('/tags/trending', ForumController.getTrendingTags);
router.get('/search', ForumController.searchPosts);

// Protected routes (require authentication)
router.post('/posts', authMiddleware, createPostValidation, ForumController.createPost);
router.post('/posts/:id/replies', authMiddleware, createReplyValidation, ForumController.createReply);
router.post('/vote', authMiddleware, voteValidation, ForumController.vote);

module.exports = router;