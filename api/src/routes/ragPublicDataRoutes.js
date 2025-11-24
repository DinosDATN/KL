/**
 * Routes for RAG Public Data API
 * These endpoints return public data in nested JSON format for AI RAG integration
 */

const express = require("express");
const ragPublicDataController = require("../controllers/ragPublicDataController");

const router = express.Router();

// Main endpoint - get all public data
router.get("/public-data", ragPublicDataController.getAllPublicData);

// Get public data by category
router.get(
  "/public-data/:category",
  ragPublicDataController.getPublicDataByCategory
);

// Individual category endpoints
router.get("/courses", ragPublicDataController.getCourses);
router.get("/documents", ragPublicDataController.getDocuments);
router.get("/problems", ragPublicDataController.getProblems);
router.get("/contests", ragPublicDataController.getContests);

module.exports = router;
