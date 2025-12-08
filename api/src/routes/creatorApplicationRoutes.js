const express = require("express");
const creatorApplicationController = require("../controllers/creatorApplicationController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// User routes (authenticated users)
router.post(
  "/",
  authenticateToken,
  creatorApplicationController.submitApplication
); // POST /api/v1/creator-applications

router.get(
  "/me",
  authenticateToken,
  creatorApplicationController.getMyApplication
); // GET /api/v1/creator-applications/me

// Admin routes
router.get(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  creatorApplicationController.getAllApplications
); // GET /api/v1/creator-applications (admin)

router.get(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  creatorApplicationController.getApplicationById
); // GET /api/v1/creator-applications/:id (admin)

router.patch(
  "/:id/approve",
  authenticateToken,
  requireRole(["admin"]),
  creatorApplicationController.approveApplication
); // PATCH /api/v1/creator-applications/:id/approve (admin)

router.patch(
  "/:id/reject",
  authenticateToken,
  requireRole(["admin"]),
  creatorApplicationController.rejectApplication
); // PATCH /api/v1/creator-applications/:id/reject (admin)

module.exports = router;








