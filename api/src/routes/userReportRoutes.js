const express = require('express');
const userReportController = require('../controllers/userReportController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * User Report Routes (Admin Only)
 */

// GET /api/admin/users/reports/types - Get available report types
router.get('/types', (req, res) => userReportController.getReportTypes(req, res));

// GET /api/admin/users/reports/generate - Generate user report
router.get('/generate', (req, res) => userReportController.generateReport(req, res));

module.exports = router;

