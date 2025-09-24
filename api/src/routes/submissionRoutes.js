const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getSubmissions,
  getSubmissionById,
  getUserSubmissions,
  getSubmissionStats
} = require('../controllers/submissionController');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.get("/", getSubmissions);

router.get("/stats", getSubmissionStats);

router.get("/:id", getSubmissionById);

router.get("/user/:user_id", getUserSubmissions);

module.exports = router;
