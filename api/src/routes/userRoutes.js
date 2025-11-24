const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Public user routes (admin only - would need admin middleware in production)
router.get("/", userController.getAllUsers); // GET /api/v1/users
router.get("/:id", userController.getUserById); // GET /api/v1/users/:id
router.post("/", userController.createUser); // POST /api/v1/users
router.put("/:id", userController.updateUser); // PUT /api/v1/users/:id
router.delete("/:id", userController.deleteUser); // DELETE /api/v1/users/:id

// Protected profile routes
router.get("/profile/me", authenticateToken, userController.getProfile); // GET /api/v1/users/profile/me
router.put("/profile/basic", authenticateToken, userController.updateProfile); // PUT /api/v1/users/profile/basic
router.put(
  "/profile/details",
  authenticateToken,
  userController.updateProfileDetails
); // PUT /api/v1/users/profile/details
router.put(
  "/profile/settings",
  authenticateToken,
  userController.updateSettings
); // PUT /api/v1/users/profile/settings
router.post(
  "/profile/avatar",
  authenticateToken,
  userController.uploadMiddleware,
  userController.uploadAvatar
); // POST /api/v1/users/profile/avatar
router.put(
  "/profile/password",
  authenticateToken,
  userController.changePassword
); // PUT /api/v1/users/profile/password
// Note: become-creator endpoint has been moved to /api/v1/creator-applications
// This endpoint is kept for backward compatibility but will redirect
router.post(
  "/profile/become-creator",
  authenticateToken,
  (req, res) => {
    res.status(410).json({
      success: false,
      message: "This endpoint is deprecated. Please use /api/v1/creator-applications instead",
    });
  }
);

module.exports = router;
