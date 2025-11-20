const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const UserStats = require("../models/UserStats");
const Course = require("../models/Course");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");
const CourseEnrollment = require("../models/CourseEnrollment");
const Submission = require("../models/Submission");
const ContestSubmission = require("../models/ContestSubmission");
const { Op } = require("sequelize");

class UserAdminController {
  // Get all users for admin with comprehensive filtering
  async getAllUsersForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const {
        role,
        is_active,
        is_online,
        subscription_status,
        search,
        sortBy,
        registration_date,
        last_activity,
      } = req.query;

      // Build where clause
      const whereClause = {};

      if (role) whereClause.role = role;
      if (is_active !== undefined) whereClause.is_active = is_active === "true";
      if (is_online !== undefined) whereClause.is_online = is_online === "true";
      if (subscription_status)
        whereClause.subscription_status = subscription_status;

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } },
        ];
      }

      // Registration date filtering
      if (registration_date) {
        const now = new Date();
        switch (registration_date) {
          case "today":
            const today = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            whereClause.created_at = { [Op.between]: [today, endOfDay] };
            break;
          case "this_week":
            const weekStart = new Date(
              now.setDate(now.getDate() - now.getDay())
            );
            whereClause.created_at = { [Op.gte]: weekStart };
            break;
          case "this_month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            whereClause.created_at = { [Op.gte]: monthStart };
            break;
          case "this_year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            whereClause.created_at = { [Op.gte]: yearStart };
            break;
        }
      }

      // Last activity filtering
      if (last_activity) {
        const now = new Date();
        switch (last_activity) {
          case "online":
            whereClause.is_online = true;
            break;
          case "recent":
            const recent = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
            whereClause.last_seen_at = { [Op.gte]: recent };
            break;
          case "inactive":
            const inactive = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            whereClause[Op.or] = [
              { last_seen_at: { [Op.lt]: inactive } },
              { last_seen_at: { [Op.is]: null } },
            ];
            break;
        }
      }

      // Define sorting
      let orderClause;
      switch (sortBy) {
        case "name":
          orderClause = [["name", "ASC"]];
          break;
        case "email":
          orderClause = [["email", "ASC"]];
          break;
        case "role":
          orderClause = [["role", "ASC"]];
          break;
        case "created_at":
          orderClause = [["created_at", "DESC"]];
          break;
        case "last_seen":
          orderClause = [["last_seen_at", "DESC"]];
          break;
        default:
          orderClause = [["created_at", "DESC"]];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: UserProfile,
            as: "Profile",
            required: false,
          },
          {
            model: UserStats,
            as: "Stats",
            required: false,
          },
        ],
        limit,
        offset,
        order: orderClause,
      });

      // Add additional statistics for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const courseCount = await Course.count({
            where: { instructor_id: user.id },
          });
          const enrollmentCount = await CourseEnrollment.count({
            where: { user_id: user.id },
          });
          const submissionCount = await Submission.count({
            where: { user_id: user.id },
          });

          return {
            ...user.toJSON(),
            courseCount,
            enrollmentCount,
            submissionCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          users: usersWithStats,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error in getAllUsersForAdmin:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }

  // Get a single user by ID for admin
  async getUserByIdForAdmin(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
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

      // Get additional user statistics
      const createdCourses = await Course.count({
        where: { instructor_id: id },
      });
      const enrolledCourses = await CourseEnrollment.count({
        where: { user_id: id },
      });
      const totalSubmissions = await Submission.count({
        where: { user_id: id },
      });
      const contestParticipations = await ContestSubmission.count({
        distinct: true,
        col: "contest_problem_id",
        where: { user_id: id },
      });

      // Get recent activity
      const recentSubmissions = await Submission.findAll({
        where: { user_id: id },
        include: [
          {
            model: Problem,
            attributes: ["id", "title"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 5,
      });

      const recentEnrollments = await CourseEnrollment.findAll({
        where: { user_id: id },
        include: [
          {
            model: Course,
            attributes: ["id", "title"],
          },
        ],
        order: [["enrolled_at", "DESC"]],
        limit: 5,
      });

      const userData = {
        ...user.toJSON(),
        statistics: {
          createdCourses,
          enrolledCourses,
          totalSubmissions,
          contestParticipations,
        },
        recentActivity: {
          recentSubmissions,
          recentEnrollments,
        },
      };

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      console.error("Error in getUserByIdForAdmin:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
        error: error.message,
      });
    }
  }

  // Update user information (Admin only)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can update user information",
        });
      }

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.password; // Use separate endpoint for password changes
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      // Find the user
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update the user
      await user.update(updateData);

      // Fetch updated user with associations
      const updatedUser = await User.findOne({
        where: { id },
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

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error in updateUser:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  }

  // Update user role (Admin only)
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can update user roles",
        });
      }

      if (!role || !["user", "creator", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be user, creator, or admin",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await user.update({ role });

      // Reload user with associations to return complete data
      const updatedUser = await User.findByPk(id, {
        include: [
          {
            model: UserProfile,
            as: "Profile",
            required: false,
          },
          {
            model: UserStats,
            as: "Stats",
            required: false,
          },
        ],
      });

      // Add additional statistics like getAllUsersForAdmin does
      const courseCount = await Course.count({
        where: { instructor_id: id },
      });
      const enrollmentCount = await CourseEnrollment.count({
        where: { user_id: id },
      });
      const submissionCount = await Submission.count({
        where: { user_id: id },
      });

      const userData = {
        ...updatedUser.toJSON(),
        courseCount,
        enrollmentCount,
        submissionCount,
      };

      res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: userData,
      });
    } catch (error) {
      console.error("Error in updateUserRole:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user role",
      });
    }
  }

  // Activate/Deactivate user (Admin only)
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can activate/deactivate users",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await user.update({ is_active });

      // Reload user with associations to return complete data
      const updatedUser = await User.findByPk(id, {
        include: [
          {
            model: UserProfile,
            as: "Profile",
            required: false,
          },
          {
            model: UserStats,
            as: "Stats",
            required: false,
          },
        ],
      });

      // Add additional statistics like getAllUsersForAdmin does
      const courseCount = await Course.count({
        where: { instructor_id: id },
      });
      const enrollmentCount = await CourseEnrollment.count({
        where: { user_id: id },
      });
      const submissionCount = await Submission.count({
        where: { user_id: id },
      });

      const userData = {
        ...updatedUser.toJSON(),
        courseCount,
        enrollmentCount,
        submissionCount,
      };

      res.status(200).json({
        success: true,
        message: `User ${is_active ? "activated" : "deactivated"} successfully`,
        data: userData,
      });
    } catch (error) {
      console.error("Error in toggleUserStatus:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user status",
      });
    }
  }

  // Get user deletion info (Admin only) - Check what data will be affected
  async getUserDeletionInfo(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can view user deletion info",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Count all related data
      const courseCount = await Course.count({ where: { instructor_id: id } });
      const problemCount = await Problem.count({ where: { created_by: id } });
      const enrollmentCount = await CourseEnrollment.count({ where: { user_id: id } });
      const submissionCount = await Submission.count({ where: { user_id: id } });
      
      // Check for other related data
      const contestSubmissionCount = await ContestSubmission.count({ 
        where: { user_id: id } 
      });
      
      // Check for reviews, comments, etc. if models exist
      let reviewCount = 0;
      let commentCount = 0;
      try {
        const CourseReview = require("../models/CourseReview");
        reviewCount = await CourseReview.count({ where: { user_id: id } });
      } catch (e) {
        // Model might not exist
      }
      
      try {
        const ProblemComment = require("../models/ProblemComment");
        commentCount = await ProblemComment.count({ where: { user_id: id } });
      } catch (e) {
        // Model might not exist
      }

      const canDelete = courseCount === 0 && problemCount === 0;
      const hasRelatedData = courseCount > 0 || problemCount > 0 || enrollmentCount > 0 || 
                            submissionCount > 0 || contestSubmissionCount > 0 || 
                            reviewCount > 0 || commentCount > 0;

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          relatedData: {
            courses: courseCount,
            problems: problemCount,
            enrollments: enrollmentCount,
            submissions: submissionCount,
            contestSubmissions: contestSubmissionCount,
            reviews: reviewCount,
            comments: commentCount,
          },
          canDelete,
          hasRelatedData,
          warning: hasRelatedData 
            ? `User has ${courseCount} courses, ${problemCount} problems, ${enrollmentCount} enrollments, ${submissionCount} submissions, and other related data. Deleting will remove all of this.`
            : null,
        },
      });
    } catch (error) {
      console.error("Error in getUserDeletionInfo:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user deletion info",
        error: error.message,
      });
    }
  }

  // Delete user (Admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query; // Optional force parameter
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can delete users",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user has created content
      const courseCount = await Course.count({ where: { instructor_id: id } });
      const problemCount = await Problem.count({ where: { created_by: id } });

      // If user has created content and force is not set, prevent deletion
      if ((courseCount > 0 || problemCount > 0) && force !== "true") {
        return res.status(400).json({
          success: false,
          message: `Cannot delete user. They have created ${courseCount} courses and ${problemCount} problems. Use force=true to delete anyway, or consider deactivating instead.`,
          requiresForce: true,
          courseCount,
          problemCount,
        });
      }

      // Delete related data
      // Note: If force=true, we still delete user data but courses/problems remain
      // (they might be reassigned or handled separately)
      
      // Delete user's personal data
      await UserProfile.destroy({ where: { user_id: id } });
      await UserStats.destroy({ where: { user_id: id } });
      await CourseEnrollment.destroy({ where: { user_id: id } });
      await Submission.destroy({ where: { user_id: id } });
      
      // Delete contest submissions
      try {
        await ContestSubmission.destroy({ where: { user_id: id } });
      } catch (e) {
        // Ignore if model doesn't exist
      }
      
      // Delete reviews and comments
      try {
        const CourseReview = require("../models/CourseReview");
        await CourseReview.destroy({ where: { user_id: id } });
      } catch (e) {
        // Ignore if model doesn't exist
      }
      
      try {
        const ProblemComment = require("../models/ProblemComment");
        await ProblemComment.destroy({ where: { user_id: id } });
      } catch (e) {
        // Ignore if model doesn't exist
      }

      // Delete chat messages and related data
      try {
        const ChatMessage = require("../models/ChatMessage");
        await ChatMessage.destroy({ where: { user_id: id } });
      } catch (e) {
        // Ignore if model doesn't exist
      }
      
      try {
        const PrivateMessage = require("../models/PrivateMessage");
        await PrivateMessage.destroy({ 
          where: { 
            [Op.or]: [
              { sender_id: id },
              { receiver_id: id }
            ]
          } 
        });
      } catch (e) {
        // Ignore if model doesn't exist
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: {
          deletedUserId: id,
          deletedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in deleteUser:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: error.message,
      });
    }
  }

  // Get user statistics (Admin only)
  async getUserStatistics(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { is_active: true } });
      const inactiveUsers = await User.count({ where: { is_active: false } });
      const onlineUsers = await User.count({ where: { is_online: true } });

      // Users by role
      const usersByRole = await User.findAll({
        attributes: ["role", [User.sequelize.fn("COUNT", "*"), "count"]],
        group: ["role"],
      });

      // Users by subscription
      const usersBySubscription = await User.findAll({
        attributes: [
          "subscription_status",
          [User.sequelize.fn("COUNT", "*"), "count"],
        ],
        group: ["subscription_status"],
      });

      // Registration trends (last 12 months)
      const registrationTrends = await User.findAll({
        attributes: [
          [
            User.sequelize.fn(
              "DATE_FORMAT",
              User.sequelize.col("created_at"),
              "%Y-%m"
            ),
            "month",
          ],
          [User.sequelize.fn("COUNT", "*"), "count"],
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
        group: [
          User.sequelize.fn(
            "DATE_FORMAT",
            User.sequelize.col("created_at"),
            "%Y-%m"
          ),
        ],
        order: [
          [
            User.sequelize.fn(
              "DATE_FORMAT",
              User.sequelize.col("created_at"),
              "%Y-%m"
            ),
            "ASC",
          ],
        ],
      });

      // Top creators - simplified approach using separate queries
      const allCreators = await User.findAll({
        where: { role: "creator" },
        attributes: ["id", "name", "email"],
      });

      // Get course counts for each creator
      const creatorsWithCounts = await Promise.all(
        allCreators.map(async (creator) => {
          const courseCount = await Course.count({
            where: {
              instructor_id: creator.id,
              is_deleted: false,
            },
          });
          return {
            id: creator.id,
            name: creator.name,
            email: creator.email,
            courseCount,
          };
        })
      );

      // Filter and sort creators by course count
      const topCreators = creatorsWithCounts
        .filter((creator) => creator.courseCount > 0)
        .sort((a, b) => b.courseCount - a.courseCount)
        .slice(0, 10);

      // Activity statistics
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentActivity = {
        last24h: await User.count({
          where: { last_seen_at: { [Op.gte]: last24h } },
        }),
        last7days: await User.count({
          where: { last_seen_at: { [Op.gte]: last7days } },
        }),
        last30days: await User.count({
          where: { last_seen_at: { [Op.gte]: last30days } },
        }),
      };

      // Calculate growth rate
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const lastMonthUsers = await User.count({
        where: {
          created_at: {
            [Op.gte]: lastMonth,
            [Op.lt]: thisMonth,
          },
        },
      });

      const currentMonthUsers = await User.count({
        where: {
          created_at: { [Op.gte]: thisMonth },
        },
      });

      const growthRate =
        lastMonthUsers > 0
          ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
          : currentMonthUsers > 0
          ? 100
          : 0;

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          onlineUsers,
          usersByRole: usersByRole.map((item) => ({
            role: item.role,
            count: parseInt(item.dataValues.count),
          })),
          usersBySubscription: usersBySubscription.map((item) => ({
            subscription: item.subscription_status,
            count: parseInt(item.dataValues.count),
          })),
          registrationTrends: registrationTrends.map((item) => ({
            month: item.dataValues.month,
            count: parseInt(item.dataValues.count),
          })),
          topCreators,
          recentActivity,
          growthRate: Math.round(growthRate * 100) / 100,
        },
      });
    } catch (error) {
      console.error("Error in getUserStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user statistics",
        error: error.message,
      });
    }
  }

  // Bulk update users (Admin only)
  async bulkUpdateUsers(req, res) {
    try {
      const { user_ids, update_data } = req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can bulk update users",
        });
      }

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "user_ids array is required",
        });
      }

      if (!update_data || Object.keys(update_data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "update_data is required",
        });
      }

      // Remove sensitive fields
      delete update_data.id;
      delete update_data.password;
      delete update_data.created_at;
      delete update_data.updated_at;

      const [updatedCount] = await User.update(update_data, {
        where: {
          id: { [Op.in]: user_ids },
        },
      });

      res.status(200).json({
        success: true,
        message: `${updatedCount} users updated successfully`,
        data: {
          updatedCount,
          totalRequested: user_ids.length,
        },
      });
    } catch (error) {
      console.error("Error in bulkUpdateUsers:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to bulk update users",
      });
    }
  }

  // Export users data (Admin only)
  async exportUsers(req, res) {
    try {
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can export users",
        });
      }

      const {
        format = "json",
        include_profiles = false,
        include_stats = false,
      } = req.query;

      const includeOptions = [
        {
          model: UserProfile,
          as: "Profile",
          required: false,
        },
        {
          model: UserStats,
          as: "Stats",
          required: false,
        },
      ];

      const users = await User.findAll({
        include:
          include_profiles === "true" || include_stats === "true"
            ? includeOptions
            : [],
        order: [["created_at", "DESC"]],
      });

      if (format === "csv") {
        const csv = this.convertToCSV(users);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=users.csv");
        res.status(200).send(csv);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", "attachment; filename=users.json");
        res.status(200).json({
          success: true,
          exportDate: new Date().toISOString(),
          totalUsers: users.length,
          data: users,
        });
      }
    } catch (error) {
      console.error("Error in exportUsers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export users",
        error: error.message,
      });
    }
  }

  // Helper method to convert users to CSV
  convertToCSV(users) {
    if (!users || users.length === 0) {
      return "No users to export";
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Role",
      "Subscription Status",
      "Is Active",
      "Is Online",
      "Last Seen",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    users.forEach((user) => {
      const row = [
        user.id,
        `"${user.name?.replace(/"/g, '""') || ""}"`,
        user.email,
        user.role,
        user.subscription_status,
        user.is_active,
        user.is_online,
        user.last_seen_at || "",
        user.created_at,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  // Create user (Admin only)
  async createUser(req, res) {
    try {
      const { name, email, password, role, is_active, subscription_status } =
        req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can create users",
        });
      }

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "User name is required",
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "User email is required",
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        });
      }

      const userData = {
        name,
        email,
        password,
        role: role || "user",
        is_active: is_active !== undefined ? is_active : true,
        subscription_status: subscription_status || "free",
      };

      const user = await User.create(userData);

      // Create associated profile and stats
      await UserProfile.create({ user_id: user.id });
      await UserStats.create({ user_id: user.id });

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user.toAuthJSON(),
      });
    } catch (error) {
      console.error("Error in createUser:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || "Failed to create user",
        });
      }
    }
  }

  // Get user activity log (Admin only)
  async getUserActivityLog(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can view user activity logs",
        });
      }

      // Get various types of user activities
      const submissions = await Submission.findAll({
        where: { user_id: id },
        include: [
          {
            model: Problem,
            attributes: ["id", "title"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: limit / 2,
      });

      const enrollments = await CourseEnrollment.findAll({
        where: { user_id: id },
        include: [
          {
            model: Course,
            attributes: ["id", "title"],
          },
        ],
        order: [["enrolled_at", "DESC"]],
        limit: limit / 2,
      });

      // Format activities with type and timestamp
      const activities = [
        ...submissions.map((sub) => ({
          type: "submission",
          action: "Submitted solution",
          details: `Problem: ${sub.Problem.title}`,
          timestamp: sub.created_at,
          status: sub.status,
        })),
        ...enrollments.map((enr) => ({
          type: "enrollment",
          action: "Enrolled in course",
          details: `Course: ${enr.Course.title}`,
          timestamp: enr.enrolled_at,
          status: "enrolled",
        })),
      ];

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const paginatedActivities = activities.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data: {
          activities: paginatedActivities,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(activities.length / limit),
            total_items: activities.length,
            items_per_page: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error in getUserActivityLog:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user activity log",
        error: error.message,
      });
    }
  }
}

module.exports = new UserAdminController();
