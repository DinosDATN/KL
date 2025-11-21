const express = require('express');
const courseReportController = require('../controllers/courseReportController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply admin role requirement to all routes
router.use(requireRole(['admin']));

/**
 * Course Report Routes (Admin Only)
 */

// GET /api/admin/courses/reports/types - Get available report types
router.get('/types', (req, res) => courseReportController.getReportTypes(req, res));

// GET /api/admin/courses/reports/generate - Generate course report
router.get('/generate', (req, res) => courseReportController.generateReport(req, res));

module.exports = router;

