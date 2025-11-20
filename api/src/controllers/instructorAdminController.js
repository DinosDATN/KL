const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const InstructorQualification = require('../models/InstructorQualification');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseReview = require('../models/CourseReview');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class InstructorAdminController {
  /**
   * Get all instructors with comprehensive filtering and pagination
   * GET /api/v1/admin/instructors
   */
  async getAllInstructors(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const {
        search,
        is_active,
        has_courses,
        min_courses,
        min_students,
        min_rating,
        sortBy,
        registration_date
      } = req.query;

      // Build where clause
      const whereClause = {
        role: 'creator'
      };

      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } }
        ];
      }

      // Registration date filtering
      if (registration_date) {
        const now = new Date();
        switch (registration_date) {
          case 'today':
            const today = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            whereClause.created_at = { [Op.between]: [today, endOfDay] };
            break;
          case 'this_week':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            whereClause.created_at = { [Op.gte]: weekStart };
            break;
          case 'this_month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            whereClause.created_at = { [Op.gte]: monthStart };
            break;
          case 'this_year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            whereClause.created_at = { [Op.gte]: yearStart };
            break;
        }
      }

      // Define sorting
      let orderClause;
      switch (sortBy) {
        case 'name':
          orderClause = [['name', 'ASC']];
          break;
        case 'email':
          orderClause = [['email', 'ASC']];
          break;
        case 'created_at':
          orderClause = [['created_at', 'DESC']];
          break;
        case 'courses_count':
          orderClause = [[sequelize.literal('courses_count'), 'DESC']];
          break;
        case 'students_count':
          orderClause = [[sequelize.literal('students_count'), 'DESC']];
          break;
        case 'avg_rating':
          orderClause = [[sequelize.literal('avg_rating'), 'DESC']];
          break;
        default:
          orderClause = [['created_at', 'DESC']];
      }

      // Get instructors with course statistics
      const instructors = await User.findAndCountAll({
        where: whereClause,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'courses_count'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(SUM(courses.students), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'students_count'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(AVG(courses.rating), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
                AND courses.rating > 0
              )`),
              'avg_rating'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(SUM(courses.revenue), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'total_revenue'
            ]
          ]
        },
        include: [
          {
            model: UserProfile,
            as: 'Profile',
            required: false,
            attributes: ['bio', 'birthday', 'gender', 'phone', 'address', 'website_url', 'github_url', 'linkedin_url']
          }
        ],
        order: orderClause,
        limit,
        offset,
        distinct: true
      });

      // Apply additional filters based on course statistics
      let filteredInstructors = instructors.rows;
      
      if (has_courses === 'true') {
        filteredInstructors = filteredInstructors.filter(
          inst => inst.getDataValue('courses_count') > 0
        );
      }

      if (min_courses) {
        filteredInstructors = filteredInstructors.filter(
          inst => inst.getDataValue('courses_count') >= parseInt(min_courses)
        );
      }

      if (min_students) {
        filteredInstructors = filteredInstructors.filter(
          inst => inst.getDataValue('students_count') >= parseInt(min_students)
        );
      }

      if (min_rating) {
        filteredInstructors = filteredInstructors.filter(
          inst => inst.getDataValue('avg_rating') >= parseFloat(min_rating)
        );
      }

      const totalPages = Math.ceil(instructors.count / limit);

      res.status(200).json({
        success: true,
        data: filteredInstructors,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: instructors.count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllInstructors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instructors',
        error: error.message
      });
    }
  }

  /**
   * Get single instructor by ID with detailed information
   * GET /api/v1/admin/instructors/:id
   */
  async getInstructorById(req, res) {
    try {
      const { id } = req.params;

      const instructor = await User.findOne({
        where: {
          id,
          role: 'creator'
        },
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'courses_count'
            ],
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.status = 'published'
                AND courses.is_deleted = false
              )`),
              'published_courses_count'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(SUM(courses.students), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'students_count'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(AVG(courses.rating), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
                AND courses.rating > 0
              )`),
              'avg_rating'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(SUM(courses.revenue), 0)
                FROM courses
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'total_revenue'
            ],
            [
              sequelize.literal(`(
                SELECT COUNT(DISTINCT course_enrollments.user_id)
                FROM course_enrollments
                INNER JOIN courses ON courses.id = course_enrollments.course_id
                WHERE courses.instructor_id = User.id
                AND courses.is_deleted = false
              )`),
              'unique_students_count'
            ]
          ]
        },
        include: [
          {
            model: UserProfile,
            as: 'Profile',
            required: false
          },
          {
            model: InstructorQualification,
            as: 'Qualifications',
            required: false,
            separate: true,
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
      }

      // Get instructor's courses
      const courses = await Course.findAll({
        where: {
          instructor_id: id,
          is_deleted: false
        },
        attributes: ['id', 'title', 'status', 'students', 'rating', 'revenue', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      // Get recent enrollments count
      const recentEnrollments = await CourseEnrollment.count({
        include: [
          {
            model: Course,
            where: {
              instructor_id: id,
              is_deleted: false
            }
          }
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          instructor,
          courses,
          statistics: {
            total_courses: instructor.getDataValue('courses_count'),
            published_courses: instructor.getDataValue('published_courses_count'),
            total_students: instructor.getDataValue('students_count'),
            unique_students: instructor.getDataValue('unique_students_count'),
            average_rating: parseFloat(instructor.getDataValue('avg_rating')).toFixed(2),
            total_revenue: instructor.getDataValue('total_revenue'),
            recent_enrollments: recentEnrollments
          }
        }
      });
    } catch (error) {
      console.error('Error in getInstructorById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instructor details',
        error: error.message
      });
    }
  }

  /**
   * Update instructor information
   * PUT /api/v1/admin/instructors/:id
   */
  async updateInstructor(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        is_active,
        subscription_status,
        subscription_end_date
      } = req.body;

      const instructor = await User.findOne({
        where: {
          id,
          role: 'creator'
        }
      });

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
      }

      // Check if email is already taken by another user
      if (email && email !== instructor.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: id }
          }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already taken'
          });
        }
      }

      // Update instructor
      if (name !== undefined) instructor.name = name;
      if (email !== undefined) instructor.email = email;
      if (is_active !== undefined) instructor.is_active = is_active;
      if (subscription_status !== undefined) instructor.subscription_status = subscription_status;
      if (subscription_end_date !== undefined) instructor.subscription_end_date = subscription_end_date;

      await instructor.save();

      res.status(200).json({
        success: true,
        message: 'Instructor updated successfully',
        data: instructor
      });
    } catch (error) {
      console.error('Error in updateInstructor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update instructor',
        error: error.message
      });
    }
  }

  /**
   * Create instructor qualification
   * POST /api/v1/admin/instructors/:id/qualifications
   */
  async createQualification(req, res) {
    try {
      const { id } = req.params;
      const { title, institution, date, credential_url } = req.body;

      // Verify instructor exists
      const instructor = await User.findOne({
        where: {
          id,
          role: 'creator'
        }
      });

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
      }

      const qualification = await InstructorQualification.create({
        user_id: id,
        title,
        institution,
        date,
        credential_url
      });

      res.status(201).json({
        success: true,
        message: 'Qualification added successfully',
        data: qualification
      });
    } catch (error) {
      console.error('Error in createQualification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create qualification',
        error: error.message
      });
    }
  }

  /**
   * Update instructor qualification
   * PUT /api/v1/admin/instructors/:id/qualifications/:qualification_id
   */
  async updateQualification(req, res) {
    try {
      const { id, qualification_id } = req.params;
      const { title, institution, date, credential_url } = req.body;

      const qualification = await InstructorQualification.findOne({
        where: {
          id: qualification_id,
          user_id: id
        }
      });

      if (!qualification) {
        return res.status(404).json({
          success: false,
          message: 'Qualification not found'
        });
      }

      if (title !== undefined) qualification.title = title;
      if (institution !== undefined) qualification.institution = institution;
      if (date !== undefined) qualification.date = date;
      if (credential_url !== undefined) qualification.credential_url = credential_url;

      await qualification.save();

      res.status(200).json({
        success: true,
        message: 'Qualification updated successfully',
        data: qualification
      });
    } catch (error) {
      console.error('Error in updateQualification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update qualification',
        error: error.message
      });
    }
  }

  /**
   * Delete instructor qualification
   * DELETE /api/v1/admin/instructors/:id/qualifications/:qualification_id
   */
  async deleteQualification(req, res) {
    try {
      const { id, qualification_id } = req.params;

      const qualification = await InstructorQualification.findOne({
        where: {
          id: qualification_id,
          user_id: id
        }
      });

      if (!qualification) {
        return res.status(404).json({
          success: false,
          message: 'Qualification not found'
        });
      }

      await qualification.destroy();

      res.status(200).json({
        success: true,
        message: 'Qualification deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteQualification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete qualification',
        error: error.message
      });
    }
  }

  /**
   * Get instructor statistics
   * GET /api/v1/admin/instructors/statistics
   */
  async getInstructorStatistics(req, res) {
    try {
      const totalInstructors = await User.count({
        where: { role: 'creator' }
      });

      const activeInstructors = await User.count({
        where: {
          role: 'creator',
          is_active: true
        }
      });

      const instructorsWithCourses = await User.count({
        include: [
          {
            model: Course,
            as: 'CreatedCourses',
            where: {
              is_deleted: false
            },
            required: true
          }
        ],
        where: {
          role: 'creator'
        },
        distinct: true
      });

      const totalCourses = await Course.count({
        where: {
          is_deleted: false,
          instructor_id: {
            [Op.in]: sequelize.literal(`(SELECT id FROM users WHERE role = 'creator')`)
          }
        }
      });

      const totalStudents = await CourseEnrollment.count({
        include: [
          {
            model: Course,
            where: {
              is_deleted: false,
              instructor_id: {
                [Op.in]: sequelize.literal(`(SELECT id FROM users WHERE role = 'creator')`)
              }
            }
          }
        ],
        distinct: true
      });

      const avgRating = await Course.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']
        ],
        where: {
          is_deleted: false,
          rating: { [Op.gt]: 0 },
          instructor_id: {
            [Op.in]: sequelize.literal(`(SELECT id FROM users WHERE role = 'creator')`)
          }
        },
        raw: true
      });

      res.status(200).json({
        success: true,
        data: {
          total_instructors: totalInstructors,
          active_instructors: activeInstructors,
          inactive_instructors: totalInstructors - activeInstructors,
          instructors_with_courses: instructorsWithCourses,
          instructors_without_courses: totalInstructors - instructorsWithCourses,
          total_courses: totalCourses,
          total_students: totalStudents,
          average_rating: parseFloat(avgRating?.avg_rating || 0).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error in getInstructorStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch instructor statistics',
        error: error.message
      });
    }
  }

  /**
   * Toggle instructor status (activate/deactivate)
   * PATCH /api/v1/admin/instructors/:id/status
   */
  async toggleInstructorStatus(req, res) {
    try {
      const { id } = req.params;

      const instructor = await User.findOne({
        where: {
          id,
          role: 'creator'
        }
      });

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found'
        });
      }

      instructor.is_active = !instructor.is_active;
      await instructor.save();

      res.status(200).json({
        success: true,
        message: `Instructor ${instructor.is_active ? 'activated' : 'deactivated'} successfully`,
        data: instructor
      });
    } catch (error) {
      console.error('Error in toggleInstructorStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle instructor status',
        error: error.message
      });
    }
  }
}

module.exports = new InstructorAdminController();

