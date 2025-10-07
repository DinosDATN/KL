const courseService = require('../services/courseService');
const Course = require('../models/Course');
const { Op } = require('sequelize');

class CourseAdminController {
  // Create a new course (Admin/Creator only)
  async createCourse(req, res) {
    try {
      const {
        title,
        description,
        category_id,
        level,
        duration,
        price,
        original_price,
        discount,
        is_premium,
        thumbnail,
        instructor_id, // Admin can assign courses to other instructors
        status = 'draft'
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Course title is required'
        });
      }

      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: 'Course category is required'
        });
      }

      // Use provided instructor_id or current user's id
      const targetInstructorId = instructor_id || req.user.id;

      const courseData = {
        title,
        description,
        category_id,
        level,
        duration,
        price,
        original_price,
        discount,
        is_premium: is_premium || false,
        thumbnail,
        status
      };

      const course = await courseService.createCourse(courseData, targetInstructorId);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      console.error('Error in createCourse:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create course'
      });
    }
  }

  // Get all courses for admin (including deleted, drafts, etc.)
  async getAllCoursesForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const {
        status,
        category_id,
        instructor_id,
        level,
        is_premium,
        is_deleted,
        search,
        sortBy,
        priceRange
      } = req.query;

      const filters = {
        status,
        category_id,
        instructor_id,
        level,
        is_premium,
        is_deleted,
        search,
        sortBy,
        priceRange
      };

      const pagination = { page, limit };

      const result = await courseService.getCoursesForAdmin(filters, pagination);

      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getAllCoursesForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
        error: error.message
      });
    }
  }

  // Get a single course by ID (including deleted for admin)
  async getCourseByIdForAdmin(req, res) {
    try {
      const { id } = req.params;
      const includeDeleted = req.query.include_deleted === 'true';

      const course = await courseService.getCourseWithAssociations(parseInt(id), includeDeleted);

      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error('Error in getCourseByIdForAdmin:', error);
      if (error.message === 'Course not found') {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch course',
          error: error.message
        });
      }
    }
  }

  // Update a course
  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Remove fields that shouldn't be updated directly via this endpoint
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      const course = await courseService.updateCourse(parseInt(id), updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      console.error('Error in updateCourse:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('only update your own') || error.message.includes('only admins')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update course'
        });
      }
    }
  }

  // Delete a course (soft delete)
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await courseService.deleteCourse(parseInt(id), userId);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteCourse:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('only delete your own') || error.message.includes('already deleted')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete course',
          error: error.message
        });
      }
    }
  }

  // Permanently delete a course (Admin only)
  async permanentlyDeleteCourse(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await courseService.permanentlyDeleteCourse(parseInt(id), userId);

      res.status(200).json({
        success: true,
        message: 'Course permanently deleted successfully'
      });
    } catch (error) {
      console.error('Error in permanentlyDeleteCourse:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to permanently delete course',
          error: error.message
        });
      }
    }
  }

  // Restore a soft-deleted course (Admin only)
  async restoreCourse(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const course = await courseService.restoreCourse(parseInt(id), userId);

      res.status(200).json({
        success: true,
        message: 'Course restored successfully',
        data: course
      });
    } catch (error) {
      console.error('Error in restoreCourse:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to restore course',
          error: error.message
        });
      }
    }
  }

  // Update course status (Admin only)
  async updateCourseStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const course = await courseService.updateCourseStatus(parseInt(id), status, userId);

      res.status(200).json({
        success: true,
        message: `Course status updated to ${status}`,
        data: course
      });
    } catch (error) {
      console.error('Error in updateCourseStatus:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update course status'
        });
      }
    }
  }

  // Get course statistics (Admin only)
  async getCourseStatistics(req, res) {
    try {
      const stats = await courseService.getCourseStatistics();
      
      // Calculate growth rate based on monthly data
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const lastMonthCourses = await Course.count({
        where: {
          created_at: {
            [Op.gte]: lastMonth,
            [Op.lt]: thisMonth
          },
          is_deleted: false
        }
      });
      
      const currentMonthCourses = await Course.count({
        where: {
          created_at: { [Op.gte]: thisMonth },
          is_deleted: false
        }
      });
      
      const growthRate = lastMonthCourses > 0 
        ? ((currentMonthCourses - lastMonthCourses) / lastMonthCourses) * 100 
        : currentMonthCourses > 0 ? 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          growthRate: Math.round(growthRate * 100) / 100
        }
      });
    } catch (error) {
      console.error('Error in getCourseStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course statistics',
        error: error.message
      });
    }
  }

  // Bulk update courses (Admin only)
  async bulkUpdateCourses(req, res) {
    try {
      const { course_ids, update_data } = req.body;
      const userId = req.user.id;

      if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'course_ids array is required'
        });
      }

      if (!update_data || Object.keys(update_data).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'update_data is required'
        });
      }

      // Remove sensitive fields that shouldn't be bulk updated
      delete update_data.id;
      delete update_data.created_at;
      delete update_data.updated_at;
      delete update_data.instructor_id; // Prevent changing instructors via bulk update

      const result = await courseService.bulkUpdateCourses(course_ids, update_data, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          updatedCount: result.updatedCount,
          totalRequested: course_ids.length
        }
      });
    } catch (error) {
      console.error('Error in bulkUpdateCourses:', error);
      if (error.message.includes('Only admins')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to bulk update courses'
        });
      }
    }
  }

  // Bulk delete courses (Admin only)
  async bulkDeleteCourses(req, res) {
    try {
      const { course_ids, permanent = false } = req.body;
      const userId = req.user.id;

      if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'course_ids array is required'
        });
      }

      let deletedCount = 0;
      const errors = [];

      for (const courseId of course_ids) {
        try {
          if (permanent) {
            await courseService.permanentlyDeleteCourse(parseInt(courseId), userId);
          } else {
            await courseService.deleteCourse(parseInt(courseId), userId);
          }
          deletedCount++;
        } catch (error) {
          errors.push({
            courseId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `${deletedCount} courses ${permanent ? 'permanently ' : ''}deleted successfully`,
        data: {
          deletedCount,
          totalRequested: course_ids.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error in bulkDeleteCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete courses',
        error: error.message
      });
    }
  }

  // Get deleted courses (Admin only)
  async getDeletedCourses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const { search, sortBy, instructor_id } = req.query;

      const filters = {
        is_deleted: 'true',
        search,
        sortBy,
        instructor_id
      };

      const pagination = { page, limit };

      const result = await courseService.getCoursesForAdmin(filters, pagination);

      res.status(200).json({
        success: true,
        data: result.courses,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getDeletedCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deleted courses',
        error: error.message
      });
    }
  }

  // Bulk restore courses (Admin only)
  async bulkRestoreCourses(req, res) {
    try {
      const { course_ids } = req.body;
      const userId = req.user.id;

      if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'course_ids array is required'
        });
      }

      let restoredCount = 0;
      const errors = [];

      for (const courseId of course_ids) {
        try {
          await courseService.restoreCourse(parseInt(courseId), userId);
          restoredCount++;
        } catch (error) {
          errors.push({
            courseId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `${restoredCount} courses restored successfully`,
        data: {
          restoredCount,
          totalRequested: course_ids.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error in bulkRestoreCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk restore courses',
        error: error.message
      });
    }
  }

  // Export courses data (Admin only)
  async exportCourses(req, res) {
    try {
      const { format = 'json', include_deleted = false } = req.query;

      const filters = include_deleted === 'true' ? {} : { is_deleted: 'false' };
      const pagination = { page: 1, limit: 10000 }; // Large limit to get all courses

      const result = await courseService.getCoursesForAdmin(filters, pagination);

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(result.courses);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=courses.csv');
        res.status(200).send(csv);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=courses.json');
        res.status(200).json({
          success: true,
          exportDate: new Date().toISOString(),
          totalCourses: result.courses.length,
          data: result.courses
        });
      }
    } catch (error) {
      console.error('Error in exportCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export courses',
        error: error.message
      });
    }
  }

  // Helper method to convert courses to CSV
  convertToCSV(courses) {
    if (!courses || courses.length === 0) {
      return 'No courses to export';
    }

    const headers = [
      'ID', 'Title', 'Status', 'Level', 'Category', 'Instructor', 
      'Price', 'Students', 'Rating', 'Created At', 'Is Premium', 'Is Deleted'
    ];

    const csvRows = [headers.join(',')];

    courses.forEach(course => {
      const row = [
        course.id,
        `"${course.title?.replace(/"/g, '""') || ''}"`,
        course.status,
        course.level,
        `"${course.Category?.name?.replace(/"/g, '""') || ''}"`,
        `"${course.Instructor?.name?.replace(/"/g, '""') || ''}"`,
        course.price || 0,
        course.students || 0,
        course.rating || 0,
        course.created_at,
        course.is_premium,
        course.is_deleted
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new CourseAdminController();