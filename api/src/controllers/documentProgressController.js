const Document = require('../models/Document');
const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const DocumentCompletion = require('../models/DocumentCompletion');
const DocumentLessonCompletion = require('../models/DocumentLessonCompletion');
const User = require('../models/User');
const { Op, sequelize } = require('sequelize');

class DocumentProgressController {
  // Get user's learning dashboard
  async getLearningDashboard(req, res) {
    try {
      const userId = req.user.id;

      // Get enrolled/started documents (documents with at least one lesson completion)
      const startedDocuments = await Document.findAll({
        include: [
          {
            model: DocumentModule,
            as: 'Modules',
            include: [{
              model: DocumentLesson,
              as: 'Lessons',
              include: [{
                model: DocumentLessonCompletion,
                as: 'Completions',
                where: { user_id: userId },
                required: false
              }],
              required: false
            }],
            required: false
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'avatar_url']
          }
        ],
        where: { is_deleted: false },
        order: [['created_at', 'DESC']]
      });

      // Calculate progress for each document
      const documentsWithProgress = await Promise.all(
        startedDocuments.map(async (document) => {
          const stats = await this.calculateDocumentProgress(document.id, userId);
          
          const hasCompletions = document.Modules.some(module => 
            module.Lessons.some(lesson => lesson.Completions.length > 0)
          );

          if (!hasCompletions && document.created_by !== userId) {
            return null; // Filter out documents with no progress and not owned by user
          }

          return {
            ...document.toJSON(),
            progress: stats
          };
        })
      );

      const filteredDocuments = documentsWithProgress.filter(doc => doc !== null);

      // Get recent completions
      const recentCompletions = await DocumentLessonCompletion.findAll({
        where: { user_id: userId },
        include: [{
          model: DocumentLesson,
          as: 'Lesson',
          include: [{
            model: DocumentModule,
            as: 'Module',
            include: [{
              model: Document,
              as: 'Document',
              where: { is_deleted: false },
              attributes: ['id', 'title', 'thumbnail_url']
            }]
          }],
          attributes: ['id', 'title']
        }],
        order: [['completed_at', 'DESC']],
        limit: 10
      });

      // Get overall statistics
      const totalDocumentsStarted = filteredDocuments.length;
      const completedDocuments = filteredDocuments.filter(doc => doc.progress.completionRate === 100).length;
      const totalLessonsCompleted = await DocumentLessonCompletion.count({
        where: { user_id: userId }
      });

      const dashboard = {
        overview: {
          totalDocumentsStarted,
          completedDocuments,
          inProgressDocuments: totalDocumentsStarted - completedDocuments,
          totalLessonsCompleted,
          averageProgress: totalDocumentsStarted > 0 
            ? Math.round(filteredDocuments.reduce((sum, doc) => sum + doc.progress.completionRate, 0) / totalDocumentsStarted)
            : 0
        },
        documentsWithProgress: filteredDocuments.slice(0, 5), // Recent 5
        recentCompletions
      };

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error in getLearningDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learning dashboard',
        error: error.message
      });
    }
  }

  // Calculate comprehensive document progress for a user
  async calculateDocumentProgress(documentId, userId) {
    try {
      // Get all lessons in the document
      const document = await Document.findByPk(documentId, {
        include: [{
          model: DocumentModule,
          as: 'Modules',
          include: [{
            model: DocumentLesson,
            as: 'Lessons',
            include: [{
              model: DocumentLessonCompletion,
              as: 'Completions',
              where: { user_id: userId },
              required: false
            }]
          }]
        }]
      });

      if (!document) {
        throw new Error('Document not found');
      }

      let totalLessons = 0;
      let completedLessons = 0;
      let totalModules = document.Modules.length;
      let completedModules = 0;

      for (const module of document.Modules) {
        let moduleCompletedLessons = 0;
        for (const lesson of module.Lessons) {
          totalLessons++;
          if (lesson.Completions.length > 0) {
            completedLessons++;
            moduleCompletedLessons++;
          }
        }
        
        // A module is considered completed if all its lessons are completed
        if (module.Lessons.length > 0 && moduleCompletedLessons === module.Lessons.length) {
          completedModules++;
        }
      }

      const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const moduleCompletionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

      // Get first and last completion dates
      const completions = await DocumentLessonCompletion.findAll({
        where: { user_id: userId },
        include: [{
          model: DocumentLesson,
          as: 'Lesson',
          include: [{
            model: DocumentModule,
            as: 'Module',
            where: { document_id: documentId }
          }]
        }],
        order: [['completed_at', 'ASC']]
      });

      const startedAt = completions.length > 0 ? completions[0].completed_at : null;
      const lastActivityAt = completions.length > 0 ? completions[completions.length - 1].completed_at : null;

      return {
        totalLessons,
        completedLessons,
        totalModules,
        completedModules,
        completionRate,
        moduleCompletionRate,
        startedAt,
        lastActivityAt,
        isCompleted: completionRate === 100,
        daysActive: startedAt && lastActivityAt 
          ? Math.ceil((new Date(lastActivityAt) - new Date(startedAt)) / (1000 * 60 * 60 * 24)) + 1
          : 0
      };
    } catch (error) {
      console.error('Error calculating document progress:', error);
      return {
        totalLessons: 0,
        completedLessons: 0,
        totalModules: 0,
        completedModules: 0,
        completionRate: 0,
        moduleCompletionRate: 0,
        startedAt: null,
        lastActivityAt: null,
        isCompleted: false,
        daysActive: 0
      };
    }
  }

  // Get detailed progress for a specific document
  async getDocumentProgress(req, res) {
    try {
      const { document_id } = req.params;
      const userId = req.user.id;

      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        },
        include: [{
          model: User,
          as: 'Creator',
          attributes: ['id', 'name', 'avatar_url']
        }]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get detailed progress
      const progress = await this.calculateDocumentProgress(document_id, userId);

      // Get module-wise progress
      const moduleProgress = await DocumentModule.findAll({
        where: { document_id },
        include: [{
          model: DocumentLesson,
          as: 'Lessons',
          include: [{
            model: DocumentLessonCompletion,
            as: 'Completions',
            where: { user_id: userId },
            required: false,
            attributes: ['completed_at']
          }],
          attributes: ['id', 'title', 'position']
        }],
        order: [['position', 'ASC'], [{ model: DocumentLesson, as: 'Lessons' }, 'position', 'ASC']]
      });

      const moduleProgressData = moduleProgress.map(module => {
        const totalLessons = module.Lessons.length;
        const completedLessons = module.Lessons.filter(lesson => lesson.Completions.length > 0).length;
        const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          id: module.id,
          title: module.title,
          position: module.position,
          totalLessons,
          completedLessons,
          completionRate,
          isCompleted: completionRate === 100,
          lessons: module.Lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            position: lesson.position,
            isCompleted: lesson.Completions.length > 0,
            completedAt: lesson.Completions.length > 0 ? lesson.Completions[0].completed_at : null
          }))
        };
      });

      res.status(200).json({
        success: true,
        data: {
          document: {
            id: document.id,
            title: document.title,
            description: document.description,
            level: document.level,
            thumbnail_url: document.thumbnail_url,
            creator: document.Creator
          },
          progress,
          moduleProgress: moduleProgressData
        }
      });
    } catch (error) {
      console.error('Error in getDocumentProgress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document progress',
        error: error.message
      });
    }
  }

  // Get analytics for document creators/instructors
  async getDocumentAnalytics(req, res) {
    try {
      const { document_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Verify document exists and user has access
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view analytics for your own documents'
        });
      }

      // Get total enrolled/started users (users who have completed at least one lesson)
      const startedUsers = await sequelize.query(
        `SELECT DISTINCT dlc.user_id 
         FROM document_lesson_completions dlc
         JOIN document_lessons dl ON dlc.lesson_id = dl.id
         JOIN document_modules dm ON dl.module_id = dm.id
         WHERE dm.document_id = :documentId`,
        {
          replacements: { documentId: document_id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const totalStartedUsers = startedUsers.length;

      // Get completion statistics
      const completionStats = await Promise.all(
        startedUsers.map(async (user) => {
          return this.calculateDocumentProgress(document_id, user.user_id);
        })
      );

      const completedUsers = completionStats.filter(stats => stats.isCompleted).length;
      const averageProgress = completionStats.length > 0 
        ? Math.round(completionStats.reduce((sum, stats) => sum + stats.completionRate, 0) / completionStats.length)
        : 0;

      // Get lesson-wise completion rates
      const lessonAnalytics = await sequelize.query(
        `SELECT 
           dl.id,
           dl.title,
           dm.title as module_title,
           dm.position as module_position,
           dl.position as lesson_position,
           COUNT(dlc.id) as completion_count,
           ROUND((COUNT(dlc.id) / :totalUsers) * 100, 2) as completion_rate
         FROM document_lessons dl
         JOIN document_modules dm ON dl.module_id = dm.id
         LEFT JOIN document_lesson_completions dlc ON dl.id = dlc.lesson_id
         WHERE dm.document_id = :documentId
         GROUP BY dl.id, dl.title, dm.title, dm.position, dl.position
         ORDER BY dm.position, dl.position`,
        {
          replacements: { 
            documentId: document_id, 
            totalUsers: totalStartedUsers || 1 
          },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Get engagement over time (completions by date)
      const engagementData = await sequelize.query(
        `SELECT 
           DATE(dlc.completed_at) as completion_date,
           COUNT(*) as completions
         FROM document_lesson_completions dlc
         JOIN document_lessons dl ON dlc.lesson_id = dl.id
         JOIN document_modules dm ON dl.module_id = dm.id
         WHERE dm.document_id = :documentId
           AND dlc.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(dlc.completed_at)
         ORDER BY completion_date`,
        {
          replacements: { documentId: document_id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Get drop-off analysis
      const dropOffAnalysis = lessonAnalytics.map((lesson, index) => ({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: lesson.module_title,
        position: index + 1,
        completionCount: lesson.completion_count,
        completionRate: lesson.completion_rate,
        dropOffRate: index > 0 ? Math.max(0, lessonAnalytics[index - 1].completion_rate - lesson.completion_rate) : 0
      }));

      const analytics = {
        overview: {
          totalStartedUsers,
          completedUsers,
          completionRate: totalStartedUsers > 0 ? Math.round((completedUsers / totalStartedUsers) * 100) : 0,
          averageProgress,
          dropOffRate: totalStartedUsers > 0 ? Math.round(((totalStartedUsers - completedUsers) / totalStartedUsers) * 100) : 0
        },
        lessonAnalytics,
        dropOffAnalysis,
        engagementData,
        progressDistribution: this.calculateProgressDistribution(completionStats)
      };

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getDocumentAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document analytics',
        error: error.message
      });
    }
  }

  // Helper method to calculate progress distribution
  calculateProgressDistribution(completionStats) {
    const distribution = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-99%': 0,
      '100%': 0
    };

    completionStats.forEach(stats => {
      const rate = stats.completionRate;
      if (rate === 0) {
        // Skip users with 0% progress as they haven't really started
      } else if (rate <= 25) {
        distribution['0-25%']++;
      } else if (rate <= 50) {
        distribution['26-50%']++;
      } else if (rate <= 75) {
        distribution['51-75%']++;
      } else if (rate < 100) {
        distribution['76-99%']++;
      } else {
        distribution['100%']++;
      }
    });

    return distribution;
  }

  // Mark entire document as completed
  async markDocumentCompleted(req, res) {
    try {
      const { document_id } = req.params;
      const userId = req.user.id;

      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get current progress
      const progress = await this.calculateDocumentProgress(document_id, userId);

      if (progress.completionRate === 100) {
        // Create or update document completion record
        const [completion, created] = await DocumentCompletion.findOrCreate({
          where: {
            user_id: userId,
            document_id: document_id
          },
          defaults: {
            user_id: userId,
            document_id: document_id,
            completed_at: new Date()
          }
        });

        if (!created) {
          await completion.update({ completed_at: new Date() });
        }

        res.status(200).json({
          success: true,
          message: 'Document marked as completed',
          data: {
            completion,
            progress: {
              ...progress,
              documentCompletedAt: completion.completed_at
            }
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Cannot mark document as completed. All lessons must be completed first.',
          data: { currentProgress: progress.completionRate }
        });
      }
    } catch (error) {
      console.error('Error in markDocumentCompleted:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark document as completed'
      });
    }
  }

  // Get leaderboard for a document
  async getDocumentLeaderboard(req, res) {
    try {
      const { document_id } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        },
        attributes: ['id', 'title']
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get users with progress on this document
      const leaderboard = await sequelize.query(
        `SELECT 
           u.id as user_id,
           u.name,
           u.avatar_url,
           COUNT(DISTINCT dlc.lesson_id) as completed_lessons,
           (SELECT COUNT(*) 
            FROM document_lessons dl 
            JOIN document_modules dm ON dl.module_id = dm.id 
            WHERE dm.document_id = :documentId) as total_lessons,
           ROUND((COUNT(DISTINCT dlc.lesson_id) / 
             (SELECT COUNT(*) 
              FROM document_lessons dl 
              JOIN document_modules dm ON dl.module_id = dm.id 
              WHERE dm.document_id = :documentId)) * 100, 2) as completion_rate,
           MIN(dlc.completed_at) as started_at,
           MAX(dlc.completed_at) as last_activity,
           dc.completed_at as document_completed_at
         FROM users u
         JOIN document_lesson_completions dlc ON u.id = dlc.user_id
         JOIN document_lessons dl ON dlc.lesson_id = dl.id
         JOIN document_modules dm ON dl.module_id = dm.id
         LEFT JOIN document_completions dc ON u.id = dc.user_id AND dc.document_id = :documentId
         WHERE dm.document_id = :documentId
         GROUP BY u.id, u.name, u.avatar_url, dc.completed_at
         ORDER BY completion_rate DESC, last_activity DESC
         LIMIT :limit`,
        {
          replacements: { documentId: document_id, limit },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const formattedLeaderboard = leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: {
          id: entry.user_id,
          name: entry.name,
          avatar_url: entry.avatar_url
        },
        stats: {
          completedLessons: entry.completed_lessons,
          totalLessons: entry.total_lessons,
          completionRate: parseFloat(entry.completion_rate),
          startedAt: entry.started_at,
          lastActivity: entry.last_activity,
          documentCompletedAt: entry.document_completed_at,
          isCompleted: !!entry.document_completed_at
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          document,
          leaderboard: formattedLeaderboard,
          totalUsers: formattedLeaderboard.length
        }
      });
    } catch (error) {
      console.error('Error in getDocumentLeaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document leaderboard',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentProgressController();