/**
 * Controller for RAG Public Data API
 * Returns public data in nested JSON format for AI RAG integration
 */

const ragPublicDataService = require("../services/ragPublicDataService");

/**
 * Get all public data
 * GET /api/v1/rag/public-data
 */
async function getAllPublicData(req, res) {
  try {
    const data = await ragPublicDataService.getAllPublicData();

    res.status(200).json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching all public data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get public data by category
 * GET /api/v1/rag/public-data/:category
 */
async function getPublicDataByCategory(req, res) {
  try {
    const { category } = req.params;

    const validCategories = [
      "courses",
      "documents",
      "problems",
      "contests",
      "gamification",
      "forums",
      "games",
      "system",
      "users",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Valid categories are: ${validCategories.join(
          ", "
        )}`,
      });
    }

    const data = await ragPublicDataService.getPublicDataByCategory(category);

    res.status(200).json({
      success: true,
      data: data,
      category: category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `Error fetching public data for category ${req.params.category}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.category} data`,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get public courses
 * GET /api/v1/rag/courses
 */
async function getCourses(req, res) {
  try {
    const courses = await ragPublicDataService.getPublicCourses();

    res.status(200).json({
      success: true,
      data: {
        items: {
          courses: {
            course: courses,
          },
        },
      },
      count: courses.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get public documents
 * GET /api/v1/rag/documents
 */
async function getDocuments(req, res) {
  try {
    const documents = await ragPublicDataService.getPublicDocuments();

    res.status(200).json({
      success: true,
      data: {
        items: {
          documents: {
            document: documents,
          },
        },
      },
      count: documents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get public problems
 * GET /api/v1/rag/problems
 */
async function getProblems(req, res) {
  try {
    const problems = await ragPublicDataService.getPublicProblems();

    res.status(200).json({
      success: true,
      data: {
        items: {
          problems: {
            problem: problems,
          },
        },
      },
      count: problems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get public contests
 * GET /api/v1/rag/contests
 */
async function getContests(req, res) {
  try {
    const contests = await ragPublicDataService.getPublicContests();

    res.status(200).json({
      success: true,
      data: {
        items: {
          contests: {
            contest: contests,
          },
        },
      },
      count: contests.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  getAllPublicData,
  getPublicDataByCategory,
  getCourses,
  getDocuments,
  getProblems,
  getContests,
};
