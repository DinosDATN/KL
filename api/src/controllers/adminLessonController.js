const CourseLesson = require('../models/CourseLesson');
const CourseModule = require('../models/CourseModule');
const Course = require('../models/Course');
const User = require('../models/User');
const { Op } = require('sequelize');

class AdminLessonController {
  // Get all lessons for admin with filters and pagination
  async getAllLessonsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const {
        module_id,
        course_id,
        type,
        search,
        sortBy,
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      if (module_id) {
        where.module_id = module_id;
      }

      if (type) {
        where.type = type;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } }
        ];
      }

      // Build include clause
      const include = [{
        model: CourseModule,
        as: 'Module',
        attributes: ['id', 'title', 'position'],
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'instructor_id'],
          include: [{
            model: User,
            as: 'Instructor',
            attributes: ['id', 'name', 'email']
          }]
        }]
      }];

      // Add course filter if provided
      if (course_id) {
        include[0].where = { course_id: course_id };
      }

      // Build order clause
      let order = [['created_at', 'DESC']];
      if (sortBy) {
        // Handle sortBy format like "created_at_desc" or "title_asc"
        // Split from the end to get direction (last part) and field (everything before)
        const parts = sortBy.split('_');
        if (parts.length >= 2) {
          const direction = parts[parts.length - 1].toUpperCase(); // Last part is direction
          const field = parts.slice(0, -1).join('_'); // Everything before last part is field
          order = [[field, direction === 'ASC' || direction === 'DESC' ? direction : 'DESC']];
        } else {
          // Fallback if format is unexpected
          order = [[sortBy, 'DESC']];
        }
      }

      const { count, rows: lessons } = await CourseLesson.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: lessons,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllLessonsForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lessons',
        error: error.message
      });
    }
  }

  // Get a single lesson by ID (admin view)
  async getLessonByIdForAdmin(req, res) {
    try {
      const { id } = req.params;

      const lesson = await CourseLesson.findOne({
        where: { id },
        include: [{
          model: CourseModule,
          as: 'Module',
          attributes: ['id', 'title', 'position', 'course_id'],
          include: [{
            model: Course,
            as: 'Course',
            attributes: ['id', 'title', 'instructor_id', 'status'],
            include: [{
              model: require('../models/User'),
              as: 'Instructor',
              attributes: ['id', 'name', 'email', 'avatar_url']
            }]
          }]
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      res.status(200).json({
        success: true,
        data: lesson
      });
    } catch (error) {
      console.error('Error in getLessonByIdForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }

  // Create a new lesson (admin can create for any course)
  async createLesson(req, res) {
    try {
      const { module_id, title, content, duration, position, type } = req.body;

      // Validate required fields
      if (!module_id) {
        return res.status(400).json({
          success: false,
          message: 'Module ID is required'
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Lesson title is required'
        });
      }

      // Verify module exists
      const module = await CourseModule.findOne({
        where: { id: module_id },
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id', 'title']
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // If no position provided, set it as the next position
      let lessonPosition = position;
      if (!lessonPosition) {
        const lastLesson = await CourseLesson.findOne({
          where: { module_id },
          order: [['position', 'DESC']]
        });
        lessonPosition = lastLesson ? lastLesson.position + 1 : 1;
      }

      const lessonData = {
        module_id,
        title,
        content: content || null,
        duration: duration || null,
        position: lessonPosition,
        type: type || 'document'
      };

      const lesson = await CourseLesson.create(lessonData);

      // Fetch the created lesson with associations
      const createdLesson = await CourseLesson.findOne({
        where: { id: lesson.id },
        include: [{
          model: CourseModule,
          as: 'Module',
          attributes: ['id', 'title', 'position'],
          include: [{
            model: Course,
            as: 'Course',
            attributes: ['id', 'title']
          }]
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: createdLesson
      });
    } catch (error) {
      console.error('Error in createLesson:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create lesson'
      });
    }
  }

  // Update a lesson
  async updateLesson(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      const lesson = await CourseLesson.findOne({
        where: { id },
        include: [{
          model: CourseModule,
          as: 'Module',
          attributes: ['id', 'title', 'course_id']
        }]
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // If module_id is being updated, verify the new module exists
      if (updateData.module_id && updateData.module_id !== lesson.module_id) {
        const newModule = await CourseModule.findByPk(updateData.module_id);
        if (!newModule) {
          return res.status(404).json({
            success: false,
            message: 'Target module not found'
          });
        }
      }

      await lesson.update(updateData);

      // Fetch updated lesson with associations
      const updatedLesson = await CourseLesson.findOne({
        where: { id },
        include: [{
          model: CourseModule,
          as: 'Module',
          attributes: ['id', 'title', 'position'],
          include: [{
            model: Course,
            as: 'Course',
            attributes: ['id', 'title']
          }]
        }]
      });

      res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        data: updatedLesson
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
      const { id } = req.params;

      const lesson = await CourseLesson.findByPk(id);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      await lesson.destroy();

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

  // Get lesson statistics
  async getLessonStatistics(req, res) {
    try {
      const { course_id, module_id } = req.query;

      const where = {};
      if (course_id) {
        // Get all module IDs for this course
        const modules = await CourseModule.findAll({
          where: { course_id },
          attributes: ['id']
        });
        where.module_id = { [Op.in]: modules.map(m => m.id) };
      } else if (module_id) {
        where.module_id = module_id;
      }

      const totalLessons = await CourseLesson.count({ where });

      const lessonsByType = await CourseLesson.findAll({
        where,
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      });

      const typeStats = {};
      lessonsByType.forEach(item => {
        typeStats[item.type] = parseInt(item.count);
      });

      // Get average duration
      const avgDurationResult = await CourseLesson.findAll({
        where: {
          ...where,
          duration: { [Op.ne]: null }
        },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('duration')), 'avg_duration']
        ],
        raw: true
      });

      const avgDuration = avgDurationResult[0]?.avg_duration 
        ? Math.round(parseFloat(avgDurationResult[0].avg_duration))
        : 0;

      res.status(200).json({
        success: true,
        data: {
          totalLessons,
          lessonsByType: typeStats,
          averageDuration: avgDuration,
          documentLessons: typeStats.document || 0,
          videoLessons: typeStats.video || 0,
          exerciseLessons: typeStats.exercise || 0,
          quizLessons: typeStats.quiz || 0
        }
      });
    } catch (error) {
      console.error('Error in getLessonStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson statistics',
        error: error.message
      });
    }
  }

  // Bulk delete lessons
  async bulkDeleteLessons(req, res) {
    try {
      const { lesson_ids } = req.body;

      if (!Array.isArray(lesson_ids) || lesson_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'lesson_ids array is required'
        });
      }

      const deletedCount = await CourseLesson.destroy({
        where: {
          id: { [Op.in]: lesson_ids }
        }
      });

      res.status(200).json({
        success: true,
        message: `${deletedCount} lesson(s) deleted successfully`,
        data: { deletedCount }
      });
    } catch (error) {
      console.error('Error in bulkDeleteLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lessons',
        error: error.message
      });
    }
  }
}

module.exports = new AdminLessonController();

