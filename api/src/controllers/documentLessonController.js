const DocumentLesson = require('../models/DocumentLesson');
const DocumentModule = require('../models/DocumentModule');
const DocumentLessonCompletion = require('../models/DocumentLessonCompletion');
const Document = require('../models/Document');
const Animation = require('../models/Animation');
const { Op, sequelize } = require('sequelize');

class DocumentLessonController {
  // Create a new lesson
  async createLesson(req, res) {
    try {
      const { module_id } = req.params;
      const { title, content, code_example, position } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Find the module and verify permissions
      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create lessons in your own documents'
        });
      }

      // If no position provided, set it as the next position
      let lessonPosition = position;
      if (!lessonPosition) {
        const lastLesson = await DocumentLesson.findOne({
          where: { module_id },
          order: [['position', 'DESC']]
        });
        lessonPosition = lastLesson ? lastLesson.position + 1 : 1;
      }

      // Validate position doesn't conflict
      const existingLesson = await DocumentLesson.findOne({
        where: { 
          module_id,
          position: lessonPosition
        }
      });

      if (existingLesson) {
        // Shift existing lessons down
        await DocumentLesson.update(
          { position: sequelize.literal('position + 1') },
          {
            where: {
              module_id,
              position: { [Op.gte]: lessonPosition }
            }
          }
        );
      }

      const lessonData = {
        module_id,
        title,
        content,
        code_example,
        position: lessonPosition
      };

      const lesson = await DocumentLesson.create(lessonData);

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Error in createLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create lesson'
      });
    }
  }

  // Get all lessons for a module
  async getModuleLessons(req, res) {
    try {
      const { module_id } = req.params;
      const includeProgress = req.query.include_progress === 'true';
      const userId = req.user?.id;

      // Verify module exists
      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      const includeOptions = [];

      // Include user progress if requested and user is authenticated
      if (includeProgress && userId) {
        includeOptions.push({
          model: DocumentLessonCompletion,
          as: 'Completions',
          where: { user_id: userId },
          required: false
        });
      }

      const lessons = await DocumentLesson.findAll({
        where: { module_id },
        include: includeOptions,
        order: [['position', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error in getModuleLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module lessons',
        error: error.message
      });
    }
  }

  // Get all lessons for a document
  async getDocumentLessons(req, res) {
    try {
      const { document_id } = req.params;
      const includeProgress = req.query.include_progress === 'true';
      const userId = req.user?.id;

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

      const includeOptions = [{
        model: DocumentModule,
        as: 'Module',
        where: { document_id },
        attributes: ['id', 'title', 'position']
      }];

      // Include user progress if requested and user is authenticated
      if (includeProgress && userId) {
        includeOptions.push({
          model: DocumentLessonCompletion,
          as: 'Completions',
          where: { user_id: userId },
          required: false
        });
      }

      const lessons = await DocumentLesson.findAll({
        include: includeOptions,
        order: [
          [{ model: DocumentModule, as: 'Module' }, 'position', 'ASC'],
          ['position', 'ASC']
        ]
      });

      res.status(200).json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error in getDocumentLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document lessons',
        error: error.message
      });
    }
  }

  // Get a single lesson by ID
  async getLessonById(req, res) {
    try {
      const { lesson_id } = req.params;
      const includeProgress = req.query.include_progress === 'true';
      const includeModule = req.query.include_module === 'true';
      const includeAnimations = req.query.include_animations === 'true';
      const userId = req.user?.id;

      const includeOptions = [];

      if (includeModule) {
        includeOptions.push({
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            attributes: ['id', 'title', 'created_by'],
            where: { is_deleted: false }
          }]
        });
      }

      if (includeProgress && userId) {
        includeOptions.push({
          model: DocumentLessonCompletion,
          as: 'Completions',
          where: { user_id: userId },
          required: false
        });
      }

      const lesson = await DocumentLesson.findByPk(lesson_id, {
        include: includeOptions
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      let animations = [];
      if (includeAnimations) {
        animations = await Animation.findByLesson(lesson_id);
      }

      const responseData = {
        ...lesson.toJSON(),
        ...(includeAnimations && { animations })
      };

      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error in getLessonById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }

  // Update a lesson
  async updateLesson(req, res) {
    try {
      const { lesson_id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.module_id;

      const lesson = await DocumentLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            where: { is_deleted: false }
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && lesson.Module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update lessons in your own documents'
        });
      }

      // Handle position update if provided
      if (updateData.position && updateData.position !== lesson.position) {
        const moduleId = lesson.module_id;
        const newPosition = updateData.position;
        const oldPosition = lesson.position;

        if (newPosition > oldPosition) {
          // Moving down - shift up lessons between old and new position
          await DocumentLesson.update(
            { position: sequelize.literal('position - 1') },
            {
              where: {
                module_id: moduleId,
                position: {
                  [Op.gt]: oldPosition,
                  [Op.lte]: newPosition
                }
              }
            }
          );
        } else {
          // Moving up - shift down lessons between new and old position
          await DocumentLesson.update(
            { position: sequelize.literal('position + 1') },
            {
              where: {
                module_id: moduleId,
                position: {
                  [Op.gte]: newPosition,
                  [Op.lt]: oldPosition
                }
              }
            }
          );
        }
      }

      await lesson.update(updateData);
      await lesson.reload();

      res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Error in updateLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update lesson'
      });
    }
  }

  // Delete a lesson
  async deleteLesson(req, res) {
    try {
      const { lesson_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const lesson = await DocumentLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            where: { is_deleted: false }
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && lesson.Module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete lessons from your own documents'
        });
      }

      const moduleId = lesson.module_id;
      const lessonPosition = lesson.position;

      // Delete the lesson
      await lesson.destroy();

      // Shift up remaining lessons
      await DocumentLesson.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            module_id: moduleId,
            position: { [Op.gt]: lessonPosition }
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteLesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lesson',
        error: error.message
      });
    }
  }

  // Reorder lessons within a module
  async reorderLessons(req, res) {
    try {
      const { module_id } = req.params;
      const { lessons } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!lessons || !Array.isArray(lessons)) {
        return res.status(400).json({
          success: false,
          message: 'Lessons array is required'
        });
      }

      // Verify module exists and user has permission
      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reorder lessons in your own documents'
        });
      }

      // Verify all lessons belong to this module
      const lessonIds = lessons.map(l => l.id);
      const existingLessons = await DocumentLesson.findAll({
        where: {
          id: { [Op.in]: lessonIds },
          module_id: module_id
        }
      });

      if (existingLessons.length !== lessons.length) {
        return res.status(400).json({
          success: false,
          message: 'Some lessons do not belong to this module'
        });
      }

      // Update positions using transaction
      const transaction = await sequelize.transaction();
      try {
        for (const lessonData of lessons) {
          await DocumentLesson.update(
            { position: lessonData.position },
            {
              where: { id: lessonData.id },
              transaction
            }
          );
        }

        await transaction.commit();

        // Fetch updated lessons
        const updatedLessons = await DocumentLesson.findAll({
          where: { module_id },
          order: [['position', 'ASC']]
        });

        res.status(200).json({
          success: true,
          message: 'Lessons reordered successfully',
          data: updatedLessons
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in reorderLessons:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reorder lessons'
      });
    }
  }

  // Mark lesson as completed/incomplete
  async toggleLessonCompletion(req, res) {
    try {
      const { lesson_id } = req.params;
      const { completed } = req.body;
      const userId = req.user.id;

      // Verify lesson exists
      const lesson = await DocumentLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            where: { is_deleted: false }
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      if (completed) {
        // Mark as completed
        const [completion, created] = await DocumentLessonCompletion.findOrCreate({
          where: {
            user_id: userId,
            lesson_id: lesson_id
          },
          defaults: {
            user_id: userId,
            lesson_id: lesson_id,
            completed_at: new Date()
          }
        });

        if (!created) {
          // Update completion date if already exists
          await completion.update({ completed_at: new Date() });
        }

        res.status(200).json({
          success: true,
          message: 'Lesson marked as completed',
          data: completion
        });
      } else {
        // Mark as incomplete (remove completion record)
        const deletedCount = await DocumentLessonCompletion.destroy({
          where: {
            user_id: userId,
            lesson_id: lesson_id
          }
        });

        res.status(200).json({
          success: true,
          message: deletedCount > 0 ? 'Lesson marked as incomplete' : 'Lesson was not completed',
          data: { deleted: deletedCount > 0 }
        });
      }
    } catch (error) {
      console.error('Error in toggleLessonCompletion:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update lesson completion'
      });
    }
  }

  // Get user's lesson completion status
  async getUserLessonCompletions(req, res) {
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

      const completions = await DocumentLessonCompletion.findAll({
        where: { user_id: userId },
        include: [{
          model: DocumentLesson,
          as: 'Lesson',
          include: [{
            model: DocumentModule,
            as: 'Module',
            where: { document_id },
            attributes: ['id', 'title']
          }],
          attributes: ['id', 'title', 'module_id']
        }],
        order: [['completed_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: completions
      });
    } catch (error) {
      console.error('Error in getUserLessonCompletions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson completions',
        error: error.message
      });
    }
  }

  // Duplicate a lesson
  async duplicateLesson(req, res) {
    try {
      const { lesson_id } = req.params;
      const { title, target_module_id } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const originalLesson = await DocumentLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            where: { is_deleted: false }
          }]
        }]
      });

      if (!originalLesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && originalLesson.Module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only duplicate lessons from your own documents'
        });
      }

      // Determine target module
      const targetModuleId = target_module_id || originalLesson.module_id;
      
      // Verify target module exists and user has access
      const targetModule = await DocumentModule.findOne({
        where: { id: targetModuleId },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!targetModule) {
        return res.status(404).json({
          success: false,
          message: 'Target module not found'
        });
      }

      if (userRole !== 'admin' && targetModule.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only duplicate lessons to your own documents'
        });
      }

      // Find the next position in target module
      const lastLesson = await DocumentLesson.findOne({
        where: { module_id: targetModuleId },
        order: [['position', 'DESC']]
      });
      const newPosition = lastLesson ? lastLesson.position + 1 : 1;

      // Create duplicated lesson
      const duplicatedLesson = await DocumentLesson.create({
        module_id: targetModuleId,
        title: title || `${originalLesson.title} (Copy)`,
        content: originalLesson.content,
        code_example: originalLesson.code_example,
        position: newPosition
      });

      res.status(201).json({
        success: true,
        message: 'Lesson duplicated successfully',
        data: duplicatedLesson
      });
    } catch (error) {
      console.error('Error in duplicateLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to duplicate lesson'
      });
    }
  }

  // Get lesson navigation info (previous/next lessons)
  async getLessonNavigation(req, res) {
    try {
      const { lesson_id } = req.params;

      const currentLesson = await DocumentLesson.findOne({
        where: { id: lesson_id },
        include: [{
          model: DocumentModule,
          as: 'Module',
          include: [{
            model: Document,
            as: 'Document',
            where: { is_deleted: false },
            attributes: ['id', 'title']
          }],
          attributes: ['id', 'title', 'document_id']
        }],
        attributes: ['id', 'title', 'position', 'module_id']
      });

      if (!currentLesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Get all lessons in the document ordered by module position and lesson position
      const allLessons = await DocumentLesson.findAll({
        include: [{
          model: DocumentModule,
          as: 'Module',
          where: { document_id: currentLesson.Module.document_id },
          attributes: ['id', 'position']
        }],
        attributes: ['id', 'title', 'position', 'module_id'],
        order: [
          [{ model: DocumentModule, as: 'Module' }, 'position', 'ASC'],
          ['position', 'ASC']
        ]
      });

      // Find current lesson index
      const currentIndex = allLessons.findIndex(lesson => lesson.id === parseInt(lesson_id));
      
      const navigation = {
        current: currentLesson,
        previous: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
        next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
        totalLessons: allLessons.length,
        currentPosition: currentIndex + 1
      };

      res.status(200).json({
        success: true,
        data: navigation
      });
    } catch (error) {
      console.error('Error in getLessonNavigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson navigation',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentLessonController();