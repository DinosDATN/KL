const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const UserStats = require("../models/UserStats");
const Level = require("../models/Level");
const {
  UserGoal,
  Achievement,
  UserAchievement,
  UserActivityLog,
  CourseEnrollment,
  Course,
  Submission,
  Problem,
} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/avatars");
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

const userController = {
  // Get all users with optional filtering and pagination
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          users: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
        error: error.message,
      });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { first_name, last_name, email, phone, date_of_birth, status } =
        req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      const user = await User.create({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        status: status || "active",
      });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error creating user:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create user",
        error: error.message,
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, email, phone, date_of_birth, status } =
        req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "User with this email already exists",
          });
        }
      }

      const updatedUser = await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone,
        date_of_birth:
          date_of_birth !== undefined ? date_of_birth : user.date_of_birth,
        status: status || user.status,
      });

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update user",
        error: error.message,
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: error.message,
      });
    }
  },

  // Get current user's profile with full details
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserProfile,
            as: "Profile",
          },
          {
            model: UserStats,
            as: "Stats",
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user's last seen and online status when accessing profile
      // This ensures the user is marked as online if they're actively using the app
      try {
        await user.update(
          {
            last_seen_at: new Date(),
            is_online: true,
          },
          { silent: true }
        ); // Silent update to avoid triggering hooks
      } catch (updateError) {
        // Non-critical error - log but don't fail the request
        console.warn(
          "Failed to update user online status in getProfile:",
          updateError.message
        );
      }

      // Create profile if it doesn't exist
      if (!user.Profile) {
        const newProfile = await UserProfile.create({
          user_id: userId,
          preferred_language: "vi",
          theme_mode: "system",
          layout: "expanded",
          notifications: true,
          visibility_profile: true,
          visibility_achievements: true,
          visibility_progress: true,
          visibility_activity: true,
        });
        user.Profile = newProfile;
      }

      // Create stats if it doesn't exist
      if (!user.Stats) {
        const newStats = await UserStats.create({
          user_id: userId,
          xp: 0,
          level: 1,
          rank: 0,
          reward_points: 0,
          courses_completed: 0,
          hours_learned: 0,
          problems_solved: 0,
          current_streak: 0,
          longest_streak: 0,
          average_score: 0,
        });
        user.Stats = newStats;
      }

      // Fetch additional data
      const [
        goals,
        userAchievements,
        activityLogs,
        enrollments,
        recentSubmissions,
      ] = await Promise.all([
        // User Goals
        UserGoal.findAll({
          where: { user_id: userId },
          order: [["created_at", "DESC"]],
          limit: 10,
        }),
        // User Achievements with Achievement details
        UserAchievement.findAll({
          where: { user_id: userId },
          include: [
            {
              model: Achievement,
              as: "Achievement",
            },
          ],
          order: [["date_earned", "DESC"]],
          limit: 20,
        }),
        // Activity Logs
        UserActivityLog.findAll({
          where: { user_id: userId },
          order: [
            ["date", "DESC"],
            ["created_at", "DESC"],
          ],
          limit: 20,
        }),
        // Course Enrollments with Course details
        CourseEnrollment.findAll({
          where: { user_id: userId },
          include: [
            {
              model: Course,
              as: "Course",
              attributes: [
                "id",
                "title",
                "thumbnail",
                "level",
                "is_premium",
                "status",
              ],
            },
          ],
          order: [["created_at", "DESC"]],
          limit: 10,
        }),
        // Recent Submissions with Problem details
        Submission.findAll({
          where: { user_id: userId },
          include: [
            {
              model: Problem,
              attributes: ["id", "title", "difficulty"],
            },
          ],
          order: [["submitted_at", "DESC"]],
          limit: 5,
        }),
      ]);

      // Get level information from levels table
      let levelInfo = null;
      if (user.Stats) {
        // First try to find level by user's current level in database
        if (user.Stats.level) {
          levelInfo = await Level.findByLevel(user.Stats.level);
        }

        // If level not found in table (e.g., level > 10), find level based on XP
        // This gives us the level that matches the user's XP
        if (!levelInfo && user.Stats.xp !== undefined) {
          levelInfo = await Level.findLevelForXp(user.Stats.xp);
        }

        // If still not found, get the max level as fallback
        if (!levelInfo) {
          levelInfo = await Level.findOne({
            order: [["level", "DESC"]],
          });
        }

        // If user's level in database is higher than the level_info level,
        // we need to calculate progress differently
        // For now, we'll use the level_info but the frontend will handle the progress calculation
      }

      // Prepare stats with level information
      const statsData = user.Stats
        ? {
            ...user.Stats.toJSON(),
            level_info: levelInfo
              ? {
                  level: levelInfo.level,
                  name: levelInfo.name,
                  xp_required: levelInfo.xp_required,
                  xp_to_next: levelInfo.xp_to_next,
                  color: levelInfo.color,
                  icon: levelInfo.icon,
                }
              : null,
          }
        : null;

      res.status(200).json({
        success: true,
        data: {
          user: user.toAuthJSON(),
          profile: user.Profile,
          stats: statsData,
          goals: goals,
          achievements: userAchievements.map((ua) => ({
            id: ua.id,
            user_id: ua.user_id,
            achievement_id: ua.achievement_id,
            date_earned: ua.date_earned,
            achievement: ua.Achievement,
          })),
          activity_logs: activityLogs,
          enrollments: enrollments.map((enrollment) => ({
            id: enrollment.id,
            user_id: enrollment.user_id,
            course_id: enrollment.course_id,
            progress: enrollment.progress,
            status: enrollment.status,
            start_date: enrollment.start_date,
            completion_date: enrollment.completion_date,
            created_at: enrollment.created_at,
            course: enrollment.Course,
          })),
          recent_submissions: recentSubmissions.map((submission) => ({
            id: submission.id,
            user_id: submission.user_id,
            problem_id: submission.problem_id,
            code_id: submission.code_id,
            language: submission.language,
            status: submission.status,
            score: submission.score,
            submitted_at: submission.submitted_at,
            problem: submission.Problem,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user profile",
        error: error.message,
      });
    }
  },

  // Update user basic information
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Validate email uniqueness if email is being changed
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: email.toLowerCase().trim(),
            id: { [Op.ne]: userId }, // Exclude current user
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
            errors: {
              email: "This email is already registered to another user",
            },
          });
        }
      }

      // Update user fields
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();

      await user.update(updateData);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: user.toAuthJSON(),
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {}),
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  },

  // Update user extended profile information
  updateProfileDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        bio,
        birthday,
        gender,
        phone,
        address,
        website_url,
        github_url,
        linkedin_url,
      } = req.body;

      // Find or create profile
      let profile = await UserProfile.findOne({ where: { user_id: userId } });

      if (!profile) {
        profile = await UserProfile.create({ user_id: userId });
      }

      // Validate URLs if provided (only if not empty after trim)
      // Updated pattern to support localhost, IP addresses, and domain names
      const urlPattern =
        /^https?:\/\/(localhost(:\d+)?|[\w\-]+(\.[\w\-]+)+|(\d{1,3}\.){3}\d{1,3}(:\d+)?)(\/[\w\-\.,@?^=%&:/~\+#]*)?$/;

      // Helper function to check if value is not empty
      const isNotEmpty = (value) => {
        return (
          value !== undefined && value !== null && String(value).trim() !== ""
        );
      };

      if (isNotEmpty(website_url)) {
        const trimmedUrl = String(website_url).trim();
        if (!urlPattern.test(trimmedUrl)) {
          return res.status(400).json({
            success: false,
            message: "Invalid website URL format",
            errors: {
              website_url:
                "Please provide a valid URL (must start with http:// or https://)",
            },
          });
        }
      }

      if (isNotEmpty(github_url)) {
        const trimmedUrl = String(github_url).trim();
        if (
          !urlPattern.test(trimmedUrl) ||
          !trimmedUrl.includes("github.com")
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid GitHub URL format",
            errors: {
              github_url:
                "Please provide a valid GitHub URL (must include github.com)",
            },
          });
        }
      }

      if (isNotEmpty(linkedin_url)) {
        const trimmedUrl = String(linkedin_url).trim();
        if (
          !urlPattern.test(trimmedUrl) ||
          !trimmedUrl.includes("linkedin.com")
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid LinkedIn URL format",
            errors: {
              linkedin_url:
                "Please provide a valid LinkedIn URL (must include linkedin.com)",
            },
          });
        }
      }

      // Validate birthday (only if provided and not empty)
      if (birthday && birthday.trim()) {
        const birthDate = new Date(birthday.trim());
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid birthday format",
            errors: { birthday: "Please provide a valid date" },
          });
        }
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (birthDate > today || age > 150) {
          return res.status(400).json({
            success: false,
            message: "Invalid birthday",
            errors: { birthday: "Please provide a valid birthday" },
          });
        }
      }

      // Validate phone number (only if provided and not empty)
      if (phone && phone.trim()) {
        const phoneCleaned = phone.replace(/\s/g, "");
        if (!/^[+]?[1-9]\d{1,14}$/.test(phoneCleaned)) {
          return res.status(400).json({
            success: false,
            message: "Invalid phone number format",
            errors: { phone: "Please provide a valid phone number" },
          });
        }
      }

      // Validate gender (only if provided and not empty)
      if (isNotEmpty(gender)) {
        const genderValue = String(gender).trim();
        if (!["male", "female", "other"].includes(genderValue)) {
          return res.status(400).json({
            success: false,
            message: "Invalid gender value",
            errors: { gender: "Gender must be one of: male, female, other" },
          });
        }
      }

      // Update profile (only set fields that are provided and not empty strings)
      const updateData = {};
      if (isNotEmpty(bio)) updateData.bio = String(bio).trim();
      if (isNotEmpty(birthday)) updateData.birthday = String(birthday).trim();
      if (isNotEmpty(gender)) {
        const genderValue = String(gender).trim();
        if (["male", "female", "other"].includes(genderValue)) {
          updateData.gender = genderValue;
        }
      }
      if (isNotEmpty(phone)) updateData.phone = String(phone).trim();
      if (isNotEmpty(address)) updateData.address = String(address).trim();
      if (isNotEmpty(website_url))
        updateData.website_url = String(website_url).trim();
      if (isNotEmpty(github_url))
        updateData.github_url = String(github_url).trim();
      if (isNotEmpty(linkedin_url))
        updateData.linkedin_url = String(linkedin_url).trim();

      await profile.update(updateData);

      res.status(200).json({
        success: true,
        message: "Profile details updated successfully",
        data: { profile },
      });
    } catch (error) {
      console.error("Error updating profile details:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {}),
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile details",
        error: error.message,
      });
    }
  },

  // Update user settings
  updateSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        preferred_language,
        theme_mode,
        layout,
        notifications,
        visibility_profile,
        visibility_achievements,
        visibility_progress,
        visibility_activity,
      } = req.body;

      // Find or create profile
      let profile = await UserProfile.findOne({ where: { user_id: userId } });

      if (!profile) {
        profile = await UserProfile.create({ user_id: userId });
      }

      // Validate enum values
      const validLanguages = ["vi", "en"];
      const validThemeModes = ["light", "dark", "system"];
      const validLayouts = ["compact", "expanded"];

      if (preferred_language && !validLanguages.includes(preferred_language)) {
        return res.status(400).json({
          success: false,
          message: "Invalid preferred language",
          errors: {
            preferred_language: `Must be one of: ${validLanguages.join(", ")}`,
          },
        });
      }

      if (theme_mode && !validThemeModes.includes(theme_mode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid theme mode",
          errors: {
            theme_mode: `Must be one of: ${validThemeModes.join(", ")}`,
          },
        });
      }

      if (layout && !validLayouts.includes(layout)) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout",
          errors: { layout: `Must be one of: ${validLayouts.join(", ")}` },
        });
      }

      // Update settings
      const updateData = {};
      if (preferred_language !== undefined)
        updateData.preferred_language = preferred_language;
      if (theme_mode !== undefined) updateData.theme_mode = theme_mode;
      if (layout !== undefined) updateData.layout = layout;
      if (notifications !== undefined)
        updateData.notifications = Boolean(notifications);
      if (visibility_profile !== undefined)
        updateData.visibility_profile = Boolean(visibility_profile);
      if (visibility_achievements !== undefined)
        updateData.visibility_achievements = Boolean(visibility_achievements);
      if (visibility_progress !== undefined)
        updateData.visibility_progress = Boolean(visibility_progress);
      if (visibility_activity !== undefined)
        updateData.visibility_activity = Boolean(visibility_activity);

      await profile.update(updateData);

      res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: { profile },
      });
    } catch (error) {
      console.error("Error updating settings:", error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {}),
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update settings",
        error: error.message,
      });
    }
  },

  // Upload avatar
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
          errors: { file: "Please select an image file to upload" },
        });
      }

      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Delete old avatar file if exists
      if (user.avatar_url) {
        const oldAvatarPath = user.avatar_url.replace("/uploads/", "");
        const fullOldPath = path.join(
          __dirname,
          "../../uploads/",
          oldAvatarPath
        );
        try {
          await fs.unlink(fullOldPath);
        } catch (error) {
          // Ignore error if file doesn't exist
        }
      }

      // Update user avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.update({ avatar_url: avatarUrl });

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatar_url: avatarUrl,
          user: user.toAuthJSON(),
        },
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);

      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to upload avatar",
        error: error.message,
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password, confirm_password } = req.body;

      // Validation
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: "All password fields are required",
          errors: {
            current_password: !current_password
              ? "Current password is required"
              : null,
            new_password: !new_password ? "New password is required" : null,
            confirm_password: !confirm_password
              ? "Password confirmation is required"
              : null,
          },
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Password confirmation does not match",
          errors: { confirm_password: "Passwords do not match" },
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
          errors: {
            new_password: "Password must be at least 6 characters long",
          },
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user has a password (not OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Cannot change password for social login accounts",
          errors: { auth_method: "This account uses social login" },
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(current_password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
          errors: { current_password: "Current password is incorrect" },
        });
      }

      // Update password
      await user.update({ password: new_password });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Error changing password:", error);

      res.status(500).json({
        success: false,
        message: "Failed to change password",
        error: error.message,
      });
    }
  },

  // Request to become a creator
  becomeCreator: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is already a creator or admin
      if (user.role === "creator" || user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "You are already a creator",
        });
      }

      // Update user role to creator
      await user.update({
        role: "creator",
      });

      res.status(200).json({
        success: true,
        message: "Successfully registered as a content creator",
        data: {
          user: user.toAuthJSON(),
        },
      });
    } catch (error) {
      console.error("Error in becomeCreator:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register as creator",
        error: error.message,
      });
    }
  },

  // Multer middleware for avatar upload
  uploadMiddleware: upload.single("avatar"),
};

module.exports = userController;
