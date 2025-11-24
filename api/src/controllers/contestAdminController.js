const Contest = require("../models/Contest");
const ContestProblem = require("../models/ContestProblem");
const UserContest = require("../models/UserContest");
const ContestSubmission = require("../models/ContestSubmission");
const User = require("../models/User");
const Problem = require("../models/Problem");
const { Op } = require("sequelize");

class ContestAdminController {
  // Create a new contest (Admin only)
  async createContest(req, res) {
    try {
      console.log('=== CREATE CONTEST REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
      
      const {
        title,
        description,
        start_time,
        end_time,
        created_by,
        problem_ids,
      } = req.body;

      // Validate required fields
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Contest title is required",
        });
      }

      if (!start_time) {
        return res.status(400).json({
          success: false,
          message: "Contest start time is required",
        });
      }

      if (!end_time) {
        return res.status(400).json({
          success: false,
          message: "Contest end time is required",
        });
      }

      // Validate and parse datetime
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);

      if (isNaN(startTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start time format. Please use ISO 8601 format (e.g., 2024-01-15T10:00:00.000Z)",
        });
      }

      if (isNaN(endTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end time format. Please use ISO 8601 format (e.g., 2024-01-15T12:00:00.000Z)",
        });
      }

      // Validate time logic
      const now = new Date();
      if (startTime <= now) {
        return res.status(400).json({
          success: false,
          message: "Start time must be in the future",
        });
      }

      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }

      // Use provided created_by or current user's id
      const targetCreatorId = created_by || req.user.id;

      const contestData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        start_time: startTime,
        end_time: endTime,
        created_by: targetCreatorId,
      };

      const contest = await Contest.create(contestData);

      // Add problems to contest if provided
      if (problem_ids && Array.isArray(problem_ids) && problem_ids.length > 0) {
        console.log('Processing problem_ids:', JSON.stringify(problem_ids, null, 2));
        
        const contestProblems = problem_ids.map((item, index) => {
          let problemId, score;
          
          try {
            if (typeof item === "object" && item !== null) {
              // Support both {id, points} and {problem_id, score} formats
              const idValue = item.id || item.problem_id;
              const scoreValue = item.points !== undefined ? item.points : (item.score !== undefined ? item.score : 100);
              
              problemId = typeof idValue === 'number' ? idValue : parseInt(String(idValue));
              score = typeof scoreValue === 'number' ? scoreValue : parseInt(String(scoreValue));
            } else if (typeof item === "number") {
              problemId = item;
              score = 100;
            } else if (typeof item === "string") {
              problemId = parseInt(item);
              score = 100;
            } else {
              throw new Error(`Invalid problem item format at index ${index}: ${JSON.stringify(item)}`);
            }

            if (isNaN(problemId) || problemId <= 0) {
              throw new Error(`Invalid problem ID at index ${index}: ${problemId}`);
            }

            if (isNaN(score) || score < 0 || score > 1000) {
              throw new Error(`Invalid problem score at index ${index}: ${score}. Score must be between 0 and 1000`);
            }

            console.log(`Problem ${index}: id=${problemId}, score=${score}`);
            
            return {
              contest_id: contest.id,
              problem_id: problemId,
              score: score,
            };
          } catch (err) {
            console.error(`Error processing problem at index ${index}:`, err);
            throw err;
          }
        });

        console.log('Contest problems to create:', JSON.stringify(contestProblems, null, 2));
        await ContestProblem.bulkCreate(contestProblems);
        console.log('Contest problems created successfully');
      } else {
        console.log('No problem_ids provided or empty array');
      }

      // Fetch contest with associations
      const createdContest = await Contest.findByPk(contest.id, {
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
          {
            model: Problem,
            as: "Problems",
            through: {
              model: ContestProblem,
              attributes: ["score", "id"],
              as: "ContestProblem",
            },
            attributes: ["id", "title", "difficulty"],
          },
        ],
      });

      console.log('Contest created successfully:', createdContest.id);
      res.status(201).json({
        success: true,
        message: "Contest created successfully",
        data: createdContest,
      });
    } catch (error) {
      console.error("Error in createContest:", error);
      console.error("Request body:", req.body);
      console.error("Error stack:", error.stack);
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message).join(', ');
        return res.status(400).json({
          success: false,
          message: `Validation error: ${validationErrors}`,
          errors: error.errors
        });
      }

      // Handle Sequelize database errors
      if (error.name === 'SequelizeDatabaseError') {
        return res.status(400).json({
          success: false,
          message: `Database error: ${error.message}`,
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || "Failed to create contest",
      });
    }
  }

  // Get all contests for admin (including future/past/deleted)
  async getAllContestsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { created_by, status, search, sortBy, date_range, is_deleted } =
        req.query;

      // Build where clause
      const whereClause = {};

      // Filter by is_deleted (default to false if not specified)
      if (is_deleted !== undefined) {
        whereClause.is_deleted = is_deleted === "true" || is_deleted === true;
      } else {
        whereClause.is_deleted = false;
      }

      if (created_by) whereClause.created_by = created_by;

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
        ];
      }

      // Status filtering
      const now = new Date();
      if (status) {
        switch (status) {
          case "upcoming":
            whereClause.start_time = { [Op.gt]: now };
            break;
          case "active":
            whereClause[Op.and] = [
              { start_time: { [Op.lte]: now } },
              { end_time: { [Op.gt]: now } },
            ];
            break;
          case "completed":
            whereClause.end_time = { [Op.lt]: now };
            break;
        }
      }

      // Date range filtering
      if (date_range) {
        const today = new Date();
        switch (date_range) {
          case "today":
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            whereClause[Op.or] = [
              {
                start_time: {
                  [Op.between]: [startOfDay, endOfDay],
                },
              },
              {
                end_time: {
                  [Op.between]: [startOfDay, endOfDay],
                },
              },
            ];
            break;
          case "this_week":
            const weekStart = new Date(
              today.setDate(today.getDate() - today.getDay())
            );
            const weekEnd = new Date(
              today.setDate(today.getDate() - today.getDay() + 6)
            );
            whereClause.start_time = {
              [Op.between]: [weekStart, weekEnd],
            };
            break;
          case "this_month":
            const monthStart = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            const monthEnd = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              0
            );
            whereClause.start_time = {
              [Op.between]: [monthStart, monthEnd],
            };
            break;
        }
      }

      // Define sorting
      let orderClause;
      switch (sortBy) {
        case "title":
          orderClause = [["title", "ASC"]];
          break;
        case "start_time":
          orderClause = [["start_time", "ASC"]];
          break;
        case "end_time":
          orderClause = [["end_time", "DESC"]];
          break;
        case "created_at":
          orderClause = [["created_at", "DESC"]];
          break;
        default:
          orderClause = [["start_time", "DESC"]];
      }

      const { count, rows: contests } = await Contest.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
        ],
        limit,
        offset,
        order: orderClause,
      });

      // Add status and participant count to each contest
      const contestsWithData = await Promise.all(
        contests.map(async (contest) => {
          const participantCount = await UserContest.count({
            where: { contest_id: contest.id },
          });

          const problemCount = await ContestProblem.count({
            where: { contest_id: contest.id },
          });

          return {
            ...contest.toJSON(),
            status: contest.getStatus(),
            participantCount,
            problemCount,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: contestsWithData,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit,
        },
      });
    } catch (error) {
      console.error("Error in getAllContestsForAdmin:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contests",
        error: error.message,
      });
    }
  }

  // Get a single contest by ID for admin
  async getContestByIdForAdmin(req, res) {
    try {
      const { id } = req.params;

      const contest = await Contest.findByPk(id, {
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email", "avatar_url"],
          },
          {
            model: Problem,
            as: "Problems",
            through: {
              model: ContestProblem,
              attributes: ["score", "id"],
              as: "ContestProblem",
            },
            attributes: ["id", "title", "difficulty"],
          },
        ],
      });

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      // Get additional statistics
      const participantCount = await UserContest.count({
        where: { contest_id: id },
      });

      const submissionCount = await ContestSubmission.count({
        include: [
          {
            model: ContestProblem,
            as: "ContestProblem",
            where: { contest_id: id },
          },
        ],
      });

      const contestData = {
        ...contest.toJSON(),
        status: contest.getStatus(),
        timeRemaining: contest.getTimeRemaining(),
        duration: contest.getDuration(),
        participantCount,
        submissionCount,
      };

      res.status(200).json({
        success: true,
        data: contestData,
      });
    } catch (error) {
      console.error("Error in getContestByIdForAdmin:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contest",
        error: error.message,
      });
    }
  }

  // Update a contest
  async updateContest(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      // Find the contest
      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      // Authorization check
      if (userRole !== "admin" && contest.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update your own contests unless you are an admin",
        });
      }

      // Validate time constraints if updating times
      if (updateData.start_time || updateData.end_time) {
        const startTime = new Date(updateData.start_time || contest.start_time);
        const endTime = new Date(updateData.end_time || contest.end_time);

        if (endTime <= startTime) {
          return res.status(400).json({
            success: false,
            message: "End time must be after start time",
          });
        }
      }

      // Update the contest
      await contest.update(updateData);

      // Fetch updated contest with associations
      const updatedContest = await Contest.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Contest updated successfully",
        data: updatedContest,
      });
    } catch (error) {
      console.error("Error in updateContest:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update contest",
      });
    }
  }

  // Delete a contest (Soft delete - Admin only)
  async deleteContest(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can delete contests",
        });
      }

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      if (contest.is_deleted) {
        return res.status(400).json({
          success: false,
          message: "Contest is already deleted",
        });
      }

      // Soft delete
      await contest.update({
        is_deleted: true,
        deleted_at: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Contest deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteContest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete contest",
        error: error.message,
      });
    }
  }

  // Restore a soft-deleted contest (Admin only)
  async restoreContest(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can restore contests",
        });
      }

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      if (!contest.is_deleted) {
        return res.status(400).json({
          success: false,
          message: "Contest is not deleted",
        });
      }

      // Restore
      await contest.update({
        is_deleted: false,
        deleted_at: null,
      });

      // Fetch updated contest with associations
      const restoredContest = await Contest.findByPk(id, {
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Contest restored successfully",
        data: restoredContest,
      });
    } catch (error) {
      console.error("Error in restoreContest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to restore contest",
        error: error.message,
      });
    }
  }

  // Permanently delete a contest (Admin only)
  async permanentlyDeleteContest(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can permanently delete contests",
        });
      }

      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      if (!contest.is_deleted) {
        return res.status(400).json({
          success: false,
          message: "Contest must be soft-deleted before permanent deletion",
        });
      }

      // Get all contest problems for this contest
      const contestProblems = await ContestProblem.findAll({
        where: { contest_id: id },
        attributes: ['id']
      });

      const contestProblemIds = contestProblems.map(cp => cp.id);

      // Delete related records first (in correct order to avoid foreign key constraints)
      // 1. Delete ContestSubmissions (references contest_problem_id)
      if (contestProblemIds.length > 0) {
        await ContestSubmission.destroy({
          where: {
            contest_problem_id: {
              [Op.in]: contestProblemIds
            }
          }
        });
      }

      // 2. Delete ContestProblems (references contest_id)
      await ContestProblem.destroy({ where: { contest_id: id } });

      // 3. Delete UserContest (references contest_id)
      await UserContest.destroy({ where: { contest_id: id } });

      // 4. Finally delete the contest itself
      await contest.destroy();

      res.status(200).json({
        success: true,
        message: "Contest permanently deleted successfully",
      });
    } catch (error) {
      console.error("Error in permanentlyDeleteContest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to permanently delete contest",
        error: error.message,
      });
    }
  }

  // Get contest statistics (Admin only)
  async getContestStatistics(req, res) {
    try {
      const { range = '30d' } = req.query;
      
      let startDate;
      const now = new Date();
      
      switch (range) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = null;
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const whereClause = startDate ? { created_at: { [Op.gte]: startDate } } : {};
      const whereClauseNotDeleted = { ...whereClause, is_deleted: false };

      const totalContests = await Contest.count({
        where: whereClauseNotDeleted,
      });

      const deletedContests = await Contest.count({
        where: { ...whereClause, is_deleted: true },
      });

      const upcomingContests = await Contest.count({
        where: {
          ...whereClauseNotDeleted,
          start_time: { [Op.gt]: now },
        },
      });

      const activeContests = await Contest.count({
        where: {
          ...whereClauseNotDeleted,
          start_time: { [Op.lte]: now },
          end_time: { [Op.gt]: now },
        },
      });

      const completedContests = await Contest.count({
        where: {
          ...whereClauseNotDeleted,
          end_time: { [Op.lt]: now },
        },
      });

      const totalParticipants = await UserContest.count({
        include: [{
          model: Contest,
          as: 'Contest',
          where: whereClauseNotDeleted,
          required: true
        }]
      });

      const avgParticipantsPerContest =
        totalContests > 0 ? (totalParticipants / totalContests).toFixed(2) : 0;

      // Submission statistics
      const totalSubmissions = await ContestSubmission.count({
        include: [{
          model: ContestProblem,
          as: 'ContestProblem',
          include: [{
            model: Contest,
            as: 'Contest',
            where: whereClauseNotDeleted,
            required: true
          }],
          required: true
        }]
      });

      // Submissions by status
      const submissionsByStatusRaw = await ContestSubmission.sequelize.query(`
        SELECT cs.status, COUNT(*) as count
        FROM contest_submissions cs
        INNER JOIN contest_problems cp ON cs.contest_problem_id = cp.id
        INNER JOIN contests c ON cp.contest_id = c.id
        WHERE c.is_deleted = false
        ${startDate ? `AND c.created_at >= '${startDate.toISOString()}'` : ''}
        GROUP BY cs.status
      `, { type: ContestSubmission.sequelize.QueryTypes.SELECT });

      // Submissions by language
      const submissionsByLanguageRaw = await ContestSubmission.sequelize.query(`
        SELECT cs.language, COUNT(*) as count
        FROM contest_submissions cs
        INNER JOIN contest_problems cp ON cs.contest_problem_id = cp.id
        INNER JOIN contests c ON cp.contest_id = c.id
        WHERE c.is_deleted = false
        ${startDate ? `AND c.created_at >= '${startDate.toISOString()}'` : ''}
        GROUP BY cs.language
        ORDER BY count DESC
        LIMIT 5
      `, { type: ContestSubmission.sequelize.QueryTypes.SELECT });

      // Contest creation trend
      const contestCreationTrend = await Contest.findAll({
        where: whereClauseNotDeleted,
        attributes: [
          [Contest.sequelize.fn('DATE', Contest.sequelize.col('created_at')), 'date'],
          [Contest.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Contest.sequelize.fn('DATE', Contest.sequelize.col('created_at'))],
        order: [[Contest.sequelize.fn('DATE', Contest.sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // Participation trend
      const participationTrendRaw = await UserContest.sequelize.query(`
        SELECT DATE(uc.joined_at) as date, COUNT(*) as count
        FROM user_contests uc
        INNER JOIN contests c ON uc.contest_id = c.id
        WHERE c.is_deleted = false
        ${startDate ? `AND c.created_at >= '${startDate.toISOString()}'` : ''}
        GROUP BY DATE(uc.joined_at)
        ORDER BY date ASC
      `, { type: UserContest.sequelize.QueryTypes.SELECT });

      // Top creators
      const topCreators = await Contest.findAll({
        where: whereClauseNotDeleted,
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
        ],
        attributes: [
          "created_by",
          [Contest.sequelize.fn("COUNT", "*"), "contest_count"],
        ],
        group: ["created_by"],
        order: [[Contest.sequelize.fn("COUNT", "*"), "DESC"]],
        limit: 5,
      });

      // Top contests by participants
      const topContestsByParticipants = await Contest.findAll({
        where: whereClauseNotDeleted,
        attributes: [
          'id',
          'title',
          'start_time',
          'end_time',
          [Contest.sequelize.literal('(SELECT COUNT(*) FROM user_contests WHERE user_contests.contest_id = Contest.id)'), 'participant_count']
        ],
        order: [[Contest.sequelize.literal('participant_count'), 'DESC']],
        limit: 5,
        raw: true
      });

      // Contest duration statistics
      const contests = await Contest.findAll({
        where: whereClauseNotDeleted,
        attributes: ["start_time", "end_time"],
      });

      const durations = contests.map((contest) =>
        Math.floor(
          (new Date(contest.end_time) - new Date(contest.start_time)) /
            (1000 * 60)
        )
      );

      const avgDuration =
        durations.length > 0
          ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

      // Submission trend
      const submissionTrendRaw = await ContestSubmission.sequelize.query(`
        SELECT DATE(cs.submitted_at) as date, COUNT(*) as count
        FROM contest_submissions cs
        INNER JOIN contest_problems cp ON cs.contest_problem_id = cp.id
        INNER JOIN contests c ON cp.contest_id = c.id
        WHERE c.is_deleted = false
        ${startDate ? `AND c.created_at >= '${startDate.toISOString()}'` : ''}
        GROUP BY DATE(cs.submitted_at)
        ORDER BY date ASC
      `, { type: ContestSubmission.sequelize.QueryTypes.SELECT });

      // Average submissions per contest
      const avgSubmissionsPerContest = totalContests > 0 
        ? (totalSubmissions / totalContests).toFixed(2) 
        : 0;

      // Acceptance rate
      const acceptedSubmissionsResult = await ContestSubmission.sequelize.query(`
        SELECT COUNT(*) as count
        FROM contest_submissions cs
        INNER JOIN contest_problems cp ON cs.contest_problem_id = cp.id
        INNER JOIN contests c ON cp.contest_id = c.id
        WHERE cs.status = 'accepted' AND c.is_deleted = false
        ${startDate ? `AND c.created_at >= '${startDate.toISOString()}'` : ''}
      `, { type: ContestSubmission.sequelize.QueryTypes.SELECT });
      const acceptedSubmissions = parseInt(acceptedSubmissionsResult[0]?.count || 0);

      const acceptanceRate = totalSubmissions > 0 
        ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2) 
        : 0;

      res.status(200).json({
        success: true,
        data: {
          totalContests,
          deletedContests,
          upcomingContests,
          activeContests,
          completedContests,
          totalParticipants,
          avgParticipantsPerContest: parseFloat(avgParticipantsPerContest),
          totalSubmissions,
          avgSubmissionsPerContest: parseFloat(avgSubmissionsPerContest),
          acceptanceRate: parseFloat(acceptanceRate),
          avgDurationMinutes: avgDuration,
          minDurationMinutes: minDuration,
          maxDurationMinutes: maxDuration,
          submissionsByStatus: submissionsByStatusRaw.map(item => ({
            status: item.status,
            count: parseInt(item.count)
          })),
          submissionsByLanguage: submissionsByLanguageRaw.map(item => ({
            language: item.language,
            count: parseInt(item.count)
          })),
          contestCreationTrend: contestCreationTrend.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          })),
          participationTrend: participationTrendRaw.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          })),
          submissionTrend: submissionTrendRaw.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          })),
          topCreators: topCreators.map((item) => ({
            creator: item.Creator,
            contestCount: parseInt(item.dataValues.contest_count),
          })),
          topContestsByParticipants: topContestsByParticipants.map(item => ({
            id: item.id,
            title: item.title,
            start_time: item.start_time,
            end_time: item.end_time,
            participantCount: parseInt(item.participant_count) || 0
          })),
          dateRange: range
        },
      });
    } catch (error) {
      console.error("Error in getContestStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contest statistics",
        error: error.message,
      });
    }
  }

  // Add problem to contest
  async addProblemToContest(req, res) {
    try {
      const { id } = req.params;
      const { problem_id, points } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Find the contest
      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      // Authorization check
      if (userRole !== "admin" && contest.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "You can only modify your own contests unless you are an admin",
        });
      }

      // Check if problem exists
      const problem = await Problem.findByPk(problem_id);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: "Problem not found",
        });
      }

      // Check if problem is already in contest
      const existingContestProblem = await ContestProblem.findOne({
        where: { contest_id: id, problem_id },
      });

      if (existingContestProblem) {
        return res.status(400).json({
          success: false,
          message: "Problem is already in this contest",
        });
      }

      // Add problem to contest
      const contestProblem = await ContestProblem.create({
        contest_id: id,
        problem_id,
        score: points || 100,
      });

      res.status(201).json({
        success: true,
        message: "Problem added to contest successfully",
        data: contestProblem,
      });
    } catch (error) {
      console.error("Error in addProblemToContest:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to add problem to contest",
      });
    }
  }

  // Remove problem from contest
  async removeProblemFromContest(req, res) {
    try {
      const { id, problem_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Find the contest
      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      // Authorization check
      if (userRole !== "admin" && contest.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "You can only modify your own contests unless you are an admin",
        });
      }

      // Find contest problem
      const contestProblem = await ContestProblem.findOne({
        where: { contest_id: id, problem_id },
      });

      if (!contestProblem) {
        return res.status(404).json({
          success: false,
          message: "Problem not found in this contest",
        });
      }

      // Delete related submissions first
      await ContestSubmission.destroy({
        where: { contest_problem_id: contestProblem.id },
      });

      // Remove problem from contest
      await contestProblem.destroy();

      res.status(200).json({
        success: true,
        message: "Problem removed from contest successfully",
      });
    } catch (error) {
      console.error("Error in removeProblemFromContest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove problem from contest",
        error: error.message,
      });
    }
  }

  // Get contest participants (Admin only)
  async getContestParticipants(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: participants } = await UserContest.findAndCountAll({
        where: { contest_id: id },
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar_url"],
          },
        ],
        limit,
        offset,
        order: [["joined_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: participants,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit,
        },
      });
    } catch (error) {
      console.error("Error in getContestParticipants:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contest participants",
        error: error.message,
      });
    }
  }

  // Remove participant from contest (Admin/Creator only)
  async removeParticipantFromContest(req, res) {
    try {
      const { id, user_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Find the contest
      const contest = await Contest.findByPk(id);

      if (!contest) {
        return res.status(404).json({
          success: false,
          message: "Contest not found",
        });
      }

      // Authorization check - Admin or contest creator can remove participants
      if (userRole !== "admin" && contest.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message:
            "You can only remove participants from your own contests unless you are an admin",
        });
      }

      // Find the participant registration
      const participant = await UserContest.findOne({
        where: { contest_id: id, user_id: user_id },
      });

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: "Participant not found in this contest",
        });
      }

      // Check contest status - allow removal from upcoming contests, but warn for active/completed
      const status = contest.getStatus();
      if (status === "active") {
        return res.status(400).json({
          success: false,
          message:
            "Cannot remove participants from active contests. Consider waiting until the contest ends.",
        });
      }

      // Remove participant
      await participant.destroy();

      res.status(200).json({
        success: true,
        message: "Participant removed from contest successfully",
      });
    } catch (error) {
      console.error("Error in removeParticipantFromContest:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove participant from contest",
        error: error.message,
      });
    }
  }

  // Bulk update contests (Admin only)
  async bulkUpdateContests(req, res) {
    try {
      const { contest_ids, update_data } = req.body;
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can bulk update contests",
        });
      }

      if (
        !contest_ids ||
        !Array.isArray(contest_ids) ||
        contest_ids.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "contest_ids array is required",
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
      delete update_data.created_at;
      delete update_data.updated_at;
      delete update_data.created_by;

      const [updatedCount] = await Contest.update(update_data, {
        where: {
          id: { [Op.in]: contest_ids },
        },
      });

      res.status(200).json({
        success: true,
        message: `${updatedCount} contests updated successfully`,
        data: {
          updatedCount,
          totalRequested: contest_ids.length,
        },
      });
    } catch (error) {
      console.error("Error in bulkUpdateContests:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to bulk update contests",
      });
    }
  }

  // Export contests data (Admin only)
  async exportContests(req, res) {
    try {
      const userRole = req.user.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can export contests",
        });
      }

      const { format = "json", include_participants = false } = req.query;

      const contests = await Contest.findAll({
        include: [
          {
            model: User,
            as: "Creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Add additional data if requested
      const contestsWithData = await Promise.all(
        contests.map(async (contest) => {
          const participantCount = await UserContest.count({
            where: { contest_id: contest.id },
          });

          const contestData = {
            ...contest.toJSON(),
            status: contest.getStatus(),
            participantCount,
          };

          if (include_participants === "true") {
            const participants = await UserContest.findAll({
              where: { contest_id: contest.id },
              include: [
                {
                  model: User,
                  as: "User",
                  attributes: ["id", "name", "email"],
                },
              ],
            });
            contestData.participants = participants;
          }

          return contestData;
        })
      );

      if (format === "csv") {
        const csv = this.convertToCSV(contestsWithData);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=contests.csv"
        );
        res.status(200).send(csv);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=contests.json"
        );
        res.status(200).json({
          success: true,
          exportDate: new Date().toISOString(),
          totalContests: contests.length,
          data: contestsWithData,
        });
      }
    } catch (error) {
      console.error("Error in exportContests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export contests",
        error: error.message,
      });
    }
  }

  // Helper method to convert contests to CSV
  convertToCSV(contests) {
    if (!contests || contests.length === 0) {
      return "No contests to export";
    }

    const headers = [
      "ID",
      "Title",
      "Status",
      "Creator",
      "Start Time",
      "End Time",
      "Participants",
      "Created At",
    ];

    const csvRows = [headers.join(",")];

    contests.forEach((contest) => {
      const row = [
        contest.id,
        `"${contest.title?.replace(/"/g, '""') || ""}"`,
        contest.status,
        `"${contest.Creator?.name?.replace(/"/g, '""') || ""}"`,
        contest.start_time,
        contest.end_time,
        contest.participantCount || 0,
        contest.created_at,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}

module.exports = new ContestAdminController();
