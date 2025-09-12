const Course = require('../models/Course');
const CourseCategory = require('../models/CourseCategory');
const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseReview = require('../models/CourseReview');
const InstructorQualification = require('../models/InstructorQualification');
const User = require('../models/User');
const { Op } = require('sequelize');

class CourseController {
  // Get all courses with pagination and filtering
  async getAllCourses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { level, category_id, is_premium, instructor_id, search, sortBy, priceRange } = req.query;

      // Build where clause
      const whereClause = {
        status: 'published',
        is_deleted: false
      };

      if (level) whereClause.level = level;
      if (category_id) whereClause.category_id = category_id;
      if (is_premium !== undefined) whereClause.is_premium = is_premium === 'true';
      if (instructor_id) whereClause.instructor_id = instructor_id;
      
      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { level: { [Op.like]: `%${searchTerm}%` } }
        ];
      }
      
      // Price range filtering
      if (priceRange) {
        switch (priceRange) {
          case 'free':
            whereClause[Op.or] = [
              { price: 0 },
              { price: { [Op.is]: null } }
            ];
            break;
          case 'paid':
            whereClause.price = { [Op.gt]: 0 };
            break;
          case 'discounted':
            whereClause.discount = { [Op.gt]: 0 };
            break;
          case 'under-500k':
            whereClause.price = { [Op.and]: [{ [Op.gt]: 0 }, { [Op.lt]: 500000 }] };
            break;
          case '500k-1m':
            whereClause.price = { [Op.and]: [{ [Op.gte]: 500000 }, { [Op.lt]: 1000000 }] };
            break;
          case 'over-1m':
            whereClause.price = { [Op.gte]: 1000000 };
            break;
        }
      }

      // Define sorting
      let orderClause;
      switch (sortBy) {
        case 'title':
          orderClause = [['title', 'ASC']];
          break;
        case 'rating':
          orderClause = [['rating', 'DESC']];
          break;
        case 'students':
          orderClause = [['students', 'DESC']];
          break;
        case 'duration':
          orderClause = [['duration', 'ASC']];
          break;
        case 'price':
          orderClause = [['price', 'ASC']];
          break;
        default:
          orderClause = [['rating', 'DESC'], ['students', 'DESC'], ['created_at', 'DESC']];
      }

      const { count, rows: courses } = await Course.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: orderClause
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
  
  // Get all course categories
  async getCourseCategories(req, res) {
    try {
      const categories = await CourseCategory.findActive();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getCourseCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course categories',
        error: error.message
      });
    }
  }
  
  // Get course details with modules and lessons
  async getCourseDetails(req, res) {
    try {
      const { id } = req.params;
      
      // Get course with instructor and category info
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
      
      // Get instructor details
      const instructor = await User.findByPk(course.instructor_id, {
        attributes: ['id', 'name', 'email', 'avatar_url', 'created_at']
      });
      
      // Get category details
      const category = await CourseCategory.findByPk(course.category_id);
      
      // Get course modules
      const modules = await CourseModule.findByCourse(id);
      
      // Get course lessons
      const lessons = [];
      for (const module of modules) {
        const moduleLessons = await CourseLesson.findByModule(module.id);
        lessons.push(...moduleLessons);
      }
      
      // Get instructor qualifications
      const qualifications = await InstructorQualification.findByInstructor(course.instructor_id);
      
      // Get related courses (same category)
      const relatedCourses = await Course.findAll({
        where: {
          category_id: course.category_id,
          id: { [Op.ne]: id },
          status: 'published',
          is_deleted: false
        },
        limit: 3,
        order: [['rating', 'DESC']]
      });
      
      // Get course reviews
      const reviews = await CourseReview.findByCourse(id);
      
      res.status(200).json({
        success: true,
        data: {
          course,
          instructor: {
            ...instructor?.toJSON(),
            qualifications
          },
          category,
          modules,
          lessons,
          relatedCourses,
          reviews
        }
      });
    } catch (error) {
      console.error('Error in getCourseDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course details',
        error: error.message
      });
    }
  }
  
  // Get course modules
  async getCourseModules(req, res) {
    try {
      const { id } = req.params;
      
      // Verify course exists
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
      
      const modules = await CourseModule.findByCourse(id);
      
      res.status(200).json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error in getCourseModules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course modules',
        error: error.message
      });
    }
  }
  
  // Get course lessons
  async getCourseLessons(req, res) {
    try {
      const { id } = req.params;
      
      // Verify course exists
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
      
      // Get modules first
      const modules = await CourseModule.findByCourse(id);
      const moduleIds = modules.map(m => m.id);
      
      // Get lessons for all modules
      const lessons = await CourseLesson.findAll({
        where: { module_id: { [Op.in]: moduleIds } },
        order: [
          ['module_id', 'ASC'],
          ['position', 'ASC']
        ]
      });
      
      res.status(200).json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error in getCourseLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course lessons',
        error: error.message
      });
    }
  }
  
  // Get single lesson
  async getLessonById(req, res) {
    try {
      const { lessonId } = req.params;
      
      const lesson = await CourseLesson.findByPk(lessonId);
      
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
      console.error('Error in getLessonById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }
  
  // Get course reviews
  async getCourseReviews(req, res) {
    try {
      const { id } = req.params;
      
      // Verify course exists
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
      
      const reviews = await CourseReview.findByCourse(id);
      const rating = await CourseReview.getAverageRating(id);
      
      res.status(200).json({
        success: true,
        data: {
          reviews,
          ...rating
        }
      });
    } catch (error) {
      console.error('Error in getCourseReviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course reviews',
        error: error.message
      });
    }
  }
  
  // Get instructors list
  async getInstructors(req, res) {
    try {
      const instructors = await User.findAll({
        where: {
          role: 'creator',
          is_active: true
        },
        attributes: ['id', 'name', 'email', 'avatar_url', 'created_at'],
        order: [['name', 'ASC']]
      });
      
      res.status(200).json({
        success: true,
        data: instructors
      });
    } catch (error) {
      console.error('Error in getInstructors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instructors',
        error: error.message
      });
    }
  }
}

module.exports = new CourseController();
