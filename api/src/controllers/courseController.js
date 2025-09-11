const Course = require('../models/Course');
const User = require('../models/User');

class CourseController {
  // Get all courses with pagination and filtering
  async getAllCourses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { level, category_id, is_premium, instructor_id } = req.query;

      // Build where clause
      const whereClause = {
        status: 'published',
        is_deleted: false
      };

      if (level) whereClause.level = level;
      if (category_id) whereClause.category_id = category_id;
      if (is_premium !== undefined) whereClause.is_premium = is_premium === 'true';
      if (instructor_id) whereClause.instructor_id = instructor_id;

      const { count, rows: courses } = await Course.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['rating', 'DESC'], ['students', 'DESC'], ['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: courses,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
        error: error.message
      });
    }
  }

  // Get a single course by ID
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      
      const course = await Course.findOne({
        where: { 
          id,
          status: 'published',
          is_deleted: false 
        }
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error('Error in getCourseById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course',
        error: error.message
      });
    }
  }

  // Get featured courses
  async getFeaturedCourses(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      
      const featuredCourses = await Course.scope('featured').findAll({
        limit
      });

      res.status(200).json({
        success: true,
        data: featuredCourses
      });
    } catch (error) {
      console.error('Error in getFeaturedCourses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured courses',
        error: error.message
      });
    }
  }

  // Get courses by instructor
  async getCoursesByInstructor(req, res) {
    try {
      const { instructor_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: courses } = await Course.findAndCountAll({
        where: {
          instructor_id,
          status: 'published',
          is_deleted: false
        },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: courses,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getCoursesByInstructor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instructor courses',
        error: error.message
      });
    }
  }

  // Get courses by category
  async getCoursesByCategory(req, res) {
    try {
      const { category_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: courses } = await Course.findAndCountAll({
        where: {
          category_id,
          status: 'published',
          is_deleted: false
        },
        limit,
        offset,
        order: [['rating', 'DESC'], ['students', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: courses,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getCoursesByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category courses',
        error: error.message
      });
    }
  }
}

module.exports = new CourseController();
