const CreatorApplication = require("../models/CreatorApplication");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const { Op } = require("sequelize");

class CreatorApplicationController {
  // Submit creator application
  async submitApplication(req, res) {
    try {
      const userId = req.user.id;
      const {
        specialization,
        work_experience,
        skills,
        certificates,
        portfolio,
        bio,
        teaching_experience,
      } = req.body;

      // Check if user is already a creator or admin
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "creator" || user.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "You are already a creator",
        });
      }

      // Check if user has a pending application
      const existingApplication = await CreatorApplication.findOne({
        where: {
          user_id: userId,
          status: "pending",
        },
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: "You already have a pending application",
        });
      }

      // Validate that user profile is complete
      const profile = await UserProfile.findOne({ where: { user_id: userId } });
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "Please complete your profile before applying",
          errors: {
            profile: "Profile must be completed",
          },
        });
      }

      // Check required profile fields
      const requiredFields = ["bio", "phone", "address"];
      const missingFields = requiredFields.filter((field) => !profile[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Please complete your profile information",
          errors: {
            profile: `Missing required fields: ${missingFields.join(", ")}`,
          },
        });
      }

      // Validate input
      if (!specialization || !work_experience || !skills || !bio) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          errors: {
            specialization: !specialization ? "Specialization is required" : undefined,
            work_experience: !work_experience ? "Work experience is required" : undefined,
            skills: !skills ? "Skills are required" : undefined,
            bio: !bio ? "Bio is required" : undefined,
          },
        });
      }

      // Validate bio length (2-5 lines, approximately 50-1000 characters)
      if (bio.length < 50 || bio.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Bio must be between 50 and 1000 characters (2-5 lines)",
          errors: {
            bio: "Bio must be between 50 and 1000 characters",
          },
        });
      }

      // Validate work_experience format
      let workExpArray;
      try {
        workExpArray = Array.isArray(work_experience)
          ? work_experience
          : JSON.parse(work_experience);
        if (!Array.isArray(workExpArray)) {
          throw new Error("Work experience must be an array");
        }
        workExpArray.forEach((exp) => {
          if (!exp.years || !exp.position || !exp.company) {
            throw new Error(
              "Each work experience must have years, position, and company"
            );
          }
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid work experience format",
          errors: {
            work_experience: error.message,
          },
        });
      }

      // Validate skills (should be array or comma-separated string)
      let skillsArray;
      if (Array.isArray(skills)) {
        skillsArray = skills;
      } else if (typeof skills === "string") {
        skillsArray = skills.split(",").map((s) => s.trim()).filter((s) => s);
      } else {
        return res.status(400).json({
          success: false,
          message: "Skills must be an array or comma-separated string",
          errors: {
            skills: "Invalid skills format",
          },
        });
      }

      if (skillsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one skill is required",
          errors: {
            skills: "Skills cannot be empty",
          },
        });
      }

      // Validate certificates if provided
      let certificatesArray = null;
      if (certificates) {
        try {
          certificatesArray = Array.isArray(certificates)
            ? certificates
            : JSON.parse(certificates);
          if (!Array.isArray(certificatesArray)) {
            throw new Error("Certificates must be an array");
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Invalid certificates format",
            errors: {
              certificates: error.message,
            },
          });
        }
      }

      // Validate portfolio if provided
      let portfolioArray = null;
      if (portfolio) {
        try {
          portfolioArray = Array.isArray(portfolio)
            ? portfolio
            : JSON.parse(portfolio);
          if (!Array.isArray(portfolioArray)) {
            throw new Error("Portfolio must be an array");
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Invalid portfolio format",
            errors: {
              portfolio: error.message,
            },
          });
        }
      }

      // Create application
      const application = await CreatorApplication.create({
        user_id: userId,
        specialization,
        work_experience: workExpArray,
        skills: skillsArray.join(","),
        certificates: certificatesArray,
        portfolio: portfolioArray,
        bio,
        teaching_experience: teaching_experience || null,
        status: "pending",
      });

      // Reload with associations
      const applicationWithUser = await CreatorApplication.findByPk(
        application.id,
        {
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "name", "email", "avatar_url"],
            },
          ],
        }
      );

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: applicationWithUser,
      });
    } catch (error) {
      console.error("Error submitting creator application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit application",
        error: error.message,
      });
    }
  }

  // Get current user's application status
  async getMyApplication(req, res) {
    try {
      const userId = req.user.id;

      const application = await CreatorApplication.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "No application found",
        });
      }

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error("Error getting application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get application",
        error: error.message,
      });
    }
  }

  // Get all applications (Admin only)
  async getAllApplications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { status, search } = req.query;

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { specialization: { [Op.like]: `%${search}%` } },
          { bio: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await CreatorApplication.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar_url", "role"],
            include: [
              {
                model: UserProfile,
                as: "Profile",
                attributes: ["bio", "phone", "address"],
                required: false,
              },
            ],
          },
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit,
        },
      });
    } catch (error) {
      console.error("Error getting applications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get applications",
        error: error.message,
      });
    }
  }

  // Get single application by ID (Admin only)
  async getApplicationById(req, res) {
    try {
      const { id } = req.params;

      const application = await CreatorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar_url", "role"],
            include: [
              {
                model: UserProfile,
                as: "Profile",
                attributes: ["bio", "phone", "address", "website_url", "github_url", "linkedin_url", "birthday", "gender"],
                required: false,
              },
            ],
          },
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error("Error getting application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get application",
        error: error.message,
      });
    }
  }

  // Approve application (Admin only)
  async approveApplication(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const application = await CreatorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: "User",
          },
        ],
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Application is already ${application.status}`,
        });
      }

      // Update application status
      await application.update({
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: new Date(),
      });

      // Update user role to creator
      await application.User.update({
        role: "creator",
      });

      // Reload with associations
      const updatedApplication = await CreatorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar_url", "role"],
          },
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Application approved successfully",
        data: updatedApplication,
      });
    } catch (error) {
      console.error("Error approving application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve application",
        error: error.message,
      });
    }
  }

  // Reject application (Admin only)
  async rejectApplication(req, res) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const adminId = req.user.id;

      const application = await CreatorApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Application is already ${application.status}`,
        });
      }

      // Update application status
      await application.update({
        status: "rejected",
        reviewed_by: adminId,
        reviewed_at: new Date(),
        rejection_reason: rejection_reason || null,
      });

      // Reload with associations
      const updatedApplication = await CreatorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar_url", "role"],
          },
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Application rejected",
        data: updatedApplication,
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject application",
        error: error.message,
      });
    }
  }
}

module.exports = new CreatorApplicationController();

