const Course = require('../models/Course');
const CourseCategory = require('../models/CourseCategory');
const User = require('../models/User');
const { Op } = require('sequelize');

class CourseService {
  /**
   * Create a new course with validation
   * @param {Object} courseData - Course data
   * @param {number} instructorId - ID of the instructor creating the course
   * @returns {Object} Created course with associations
   */
  async createCourse(courseData, instructorId) {
    // Validate instructor exists and has appropriate role
    const instructor = await User.findByPk(instructorId);
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    if (!['creator', 'admin'].includes(instructor.role)) {
      throw new Error('Only creators and admins can create courses');
    }

    // Validate category exists if provided
    if (courseData.category_id) {
      const category = await CourseCategory.findByPk(courseData.category_id);
      if (!category || !category.is_active) {
        throw new Error('Invalid or inactive course category');
      }
    }

    // Validate price logic
    if (courseData.is_premium && !courseData.price && !courseData.original_price) {
      throw new Error('Premium courses must have a price set');
    }

    if (courseData.discount && !courseData.original_price) {
      throw new Error('Discount requires original price to be set');
    }

    if (courseData.discount && courseData.original_price) {
      const discountedPrice = courseData.original_price * (1 - courseData.discount / 100);
      if (!courseData.price) {
        courseData.price = Math.round(discountedPrice);
      }
    }

    // Set instructor_id
    courseData.instructor_id = instructorId;

    // Create the course
    const course = await Course.create(courseData);

    // Return course with instructor and category information
    return this.getCourseWithAssociations(course.id);
  }

  /**
   * Update an existing course
   * @param {number} courseId - Course ID
   * @param {Object} updateData - Data to update
   * @param {number} userId - ID of user making the update
   * @returns {Object} Updated course with associations
   */
  async updateCourse(courseId, updateData, userId) {
    const course = await Course.findByPk(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if the course is soft deleted
    if (course.is_deleted) {
      throw new Error('Cannot update deleted course');
    }

    const user = await User.findByPk(userId);
    
    // Only admin or course instructor can update
    if (user.role !== 'admin' && course.instructor_id !== userId) {
      throw new Error('You can only update your own courses');
    }

    // Validate category if being updated
    if (updateData.category_id && updateData.category_id !== course.category_id) {
      const category = await CourseCategory.findByPk(updateData.category_id);
      if (!category || !category.is_active) {
        throw new Error('Invalid or inactive course category');
      }
    }

    // Handle pricing updates
    if (updateData.hasOwnProperty('is_premium') && updateData.is_premium && 
        !updateData.price && !updateData.original_price && !course.price && !course.original_price) {
      throw new Error('Premium courses must have a price set');
    }

    if (updateData.discount !== undefined && updateData.discount > 0) {
      const originalPrice = updateData.original_price || course.original_price;
      if (!originalPrice) {
        throw new Error('Discount requires original price to be set');
      }
      
      if (!updateData.price) {
        updateData.price = Math.round(originalPrice * (1 - updateData.discount / 100));
      }
    }

    // Don't allow instructor_id to be changed unless by admin
    if (updateData.instructor_id && updateData.instructor_id !== course.instructor_id) {
      if (user.role !== 'admin') {
        throw new Error('Only admins can change course instructor');
      }
      
      // Validate new instructor
      const newInstructor = await User.findByPk(updateData.instructor_id);
      if (!newInstructor || !['creator', 'admin'].includes(newInstructor.role)) {
        throw new Error('Invalid instructor');
      }
    }

    // Update the course
    await course.update(updateData);

    return this.getCourseWithAssociations(courseId);
  }

  /**
   * Soft delete a course
   * @param {number} courseId - Course ID
   * @param {number} userId - ID of user making the deletion
   * @returns {Object} Success status
   */
  async deleteCourse(courseId, userId) {
    const course = await Course.findByPk(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.is_deleted) {
      throw new Error('Course is already deleted');
    }

    const user = await User.findByPk(userId);
    
    // Only admin or course instructor can delete
    if (user.role !== 'admin' && course.instructor_id !== userId) {
      throw new Error('You can only delete your own courses');
    }

    // Soft delete by setting is_deleted flag
    await course.update({ is_deleted: true });

    return { success: true };
  }

  /**
   * Permanently delete a course (admin only)
   * @param {number} courseId - Course ID
   * @param {number} userId - ID of admin user
   * @returns {Object} Success status
   */
  async permanentlyDeleteCourse(courseId, userId) {
    const user = await User.findByPk(userId);
    
    if (user.role !== 'admin') {
      throw new Error('Only admins can permanently delete courses');
    }

    const course = await Course.findByPk(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Permanently delete
    await course.destroy();

    return { success: true };
  }

  /**
   * Get course with all associations
   * @param {number} courseId - Course ID
   * @param {boolean} includeDeleted - Whether to include deleted courses
   * @returns {Object} Course with associations
   */
  async getCourseWithAssociations(courseId, includeDeleted = false) {
    const whereClause = { id: courseId };
    if (!includeDeleted) {
      whereClause.is_deleted = false;
    }

    const course = await Course.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Instructor',
          attributes: ['id', 'name', 'email', 'avatar_url'],
          foreignKey: 'instructor_id'
        },
        {
          model: CourseCategory,
          as: 'Category',
          foreignKey: 'category_id'
        }
      ]
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  /**
   * Get paginated and filtered courses for admin
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Object} Courses with pagination info
   */
  async getCoursesForAdmin(filters = {}, pagination = {}) {
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
    } = filters;

    const {
      page = 1,
      limit = 10
    } = pagination;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (status) whereClause.status = status;
    if (category_id) whereClause.category_id = category_id;
    if (instructor_id) whereClause.instructor_id = instructor_id;
    if (level) whereClause.level = level;
    if (is_premium !== undefined) whereClause.is_premium = is_premium === 'true';
    if (is_deleted !== undefined) whereClause.is_deleted = is_deleted === 'true';

    // Search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
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
      case 'created_at':
        orderClause = [['created_at', 'DESC']];
        break;
      case 'updated_at':
        orderClause = [['updated_at', 'DESC']];
        break;
      case 'rating':
        orderClause = [['rating', 'DESC']];
        break;
      case 'students':
        orderClause = [['students', 'DESC']];
        break;
      case 'price':
        orderClause = [['price', 'ASC']];
        break;
      default:
        orderClause = [['created_at', 'DESC']];
    }

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Instructor',
          attributes: ['id', 'name', 'email', 'avatar_url'],
          foreignKey: 'instructor_id'
        },
        {
          model: CourseCategory,
          as: 'Category',
          attributes: ['id', 'name', 'description'],
          foreignKey: 'category_id'
        }
      ],
      limit: parseInt(limit),
      offset,
      order: orderClause,
      distinct: true
    });

    return {
      courses,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    };
  }

  /**
   * Restore a soft-deleted course
   * @param {number} courseId - Course ID
   * @param {number} userId - ID of admin user
   * @returns {Object} Restored course
   */
  async restoreCourse(courseId, userId) {
    const user = await User.findByPk(userId);
    
    if (user.role !== 'admin') {
      throw new Error('Only admins can restore courses');
    }

    const course = await Course.findOne({
      where: { id: courseId, is_deleted: true }
    });
    
    if (!course) {
      throw new Error('Deleted course not found');
    }

    await course.update({ is_deleted: false });

    return this.getCourseWithAssociations(courseId);
  }

  /**
   * Update course status (admin only)
   * @param {number} courseId - Course ID
   * @param {string} status - New status (draft, published, archived)
   * @param {number} userId - ID of admin user
   * @returns {Object} Updated course
   */
  async updateCourseStatus(courseId, status, userId) {
    const user = await User.findByPk(userId);
    
    if (user.role !== 'admin') {
      throw new Error('Only admins can change course status');
    }

    const course = await Course.findByPk(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.is_deleted) {
      throw new Error('Cannot update status of deleted course');
    }

    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    await course.update({ status });

    return this.getCourseWithAssociations(courseId);
  }

  /**
   * Get course statistics for admin dashboard
   * @returns {Object} Course statistics
   */
  async getCourseStatistics() {
    const totalCourses = await Course.count({ where: { is_deleted: false } });
    const publishedCourses = await Course.count({ 
      where: { status: 'published', is_deleted: false } 
    });
    const draftCourses = await Course.count({ 
      where: { status: 'draft', is_deleted: false } 
    });
    const archivedCourses = await Course.count({ 
      where: { status: 'archived', is_deleted: false } 
    });
    const deletedCourses = await Course.count({ where: { is_deleted: true } });

    const premiumCourses = await Course.count({ 
      where: { is_premium: true, is_deleted: false } 
    });
    const freeCourses = await Course.count({ 
      where: { is_premium: false, is_deleted: false } 
    });

    const totalRevenue = await Course.sum('revenue', { 
      where: { is_deleted: false } 
    });
    const totalStudents = await Course.sum('students', { 
      where: { is_deleted: false } 
    });

    const averageRating = await Course.findOne({
      attributes: [
        [Course.sequelize.fn('AVG', Course.sequelize.col('rating')), 'avgRating']
      ],
      where: { is_deleted: false, rating: { [Op.gt]: 0 } },
      raw: true
    });

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      deletedCourses,
      premiumCourses,
      freeCourses,
      totalRevenue: totalRevenue || 0,
      totalStudents: totalStudents || 0,
      averageRating: parseFloat(averageRating?.avgRating || 0).toFixed(2)
    };
  }

  /**
   * Bulk update courses
   * @param {Array} courseIds - Array of course IDs
   * @param {Object} updateData - Data to update
   * @param {number} userId - ID of admin user
   * @returns {Object} Update results
   */
  async bulkUpdateCourses(courseIds, updateData, userId) {
    const user = await User.findByPk(userId);
    
    if (user.role !== 'admin') {
      throw new Error('Only admins can perform bulk updates');
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new Error('Course IDs array is required');
    }

    // Validate courses exist and are not deleted
    const courses = await Course.findAll({
      where: {
        id: { [Op.in]: courseIds },
        is_deleted: false
      }
    });

    if (courses.length !== courseIds.length) {
      throw new Error('Some courses were not found or are deleted');
    }

    // Perform bulk update
    const [affectedRows] = await Course.update(updateData, {
      where: {
        id: { [Op.in]: courseIds },
        is_deleted: false
      }
    });

    return {
      success: true,
      updatedCount: affectedRows,
      message: `Successfully updated ${affectedRows} courses`
    };
  }
}

module.exports = new CourseService();