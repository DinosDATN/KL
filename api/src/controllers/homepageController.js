const Course = require('../models/Course');
const Document = require('../models/Document');
const Problem = require('../models/Problem');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const Achievement = require('../models/Achievement');
const Testimonial = require('../models/Testimonial');
const { sequelize } = require('../config/sequelize');

class HomepageController {
  // Get platform overview statistics
  async getOverview(req, res) {
    try {
      console.log('Starting getOverview...');
      
      // Try each query individually to identify which one is causing issues
      let totalUsers = 0;
      let totalCourses = 0;
      let totalDocuments = 0;
      let totalProblems = 0;
      let totalAchievements = 0;

      try {
        console.log('Counting users...');
        totalUsers = await User.count({ where: { is_active: true } });
        console.log('Users count:', totalUsers);
      } catch (error) {
        console.error('Error counting users:', error);
      }

      try {
        console.log('Counting courses...');
        totalCourses = await Course.count({ where: { status: 'published', is_deleted: false } });
        console.log('Courses count:', totalCourses);
      } catch (error) {
        console.error('Error counting courses:', error);
      }

      try {
        console.log('Counting documents...');
        totalDocuments = await Document.count({ where: { is_deleted: false } });
        console.log('Documents count:', totalDocuments);
      } catch (error) {
        console.error('Error counting documents:', error);
      }

      try {
        console.log('Counting problems...');
        totalProblems = await Problem.count({ where: { is_deleted: false } });
        console.log('Problems count:', totalProblems);
      } catch (error) {
        console.error('Error counting problems:', error);
      }

      try {
        console.log('Counting achievements...');
        totalAchievements = await Achievement.count();
        console.log('Achievements count:', totalAchievements);
      } catch (error) {
        console.error('Error counting achievements:', error);
      }

      const overview = {
        totalUsers,
        totalCourses,
        totalDocuments,
        totalProblems,
        totalSubmissions: 12000, // Mock value
        totalBadges: totalAchievements,
        totalAchievements
      };

      console.log('Overview result:', overview);

      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error in getOverview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform overview',
        error: error.message
      });
    }
  }

  // Get featured courses
  async getFeaturedCourses(req, res) {
    try {
      const featuredCourses = await Course.findFeatured();
      
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

  // Get featured documents
  async getFeaturedDocuments(req, res) {
    try {
      const featuredDocuments = await Document.findFeatured();
      
      res.status(200).json({
        success: true,
        data: featuredDocuments
      });
    } catch (error) {
      console.error('Error in getFeaturedDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured documents',
        error: error.message
      });
    }
  }

  // Get featured problems
  async getFeaturedProblems(req, res) {
    try {
      const featuredProblems = await Problem.findFeatured();
      
      res.status(200).json({
        success: true,
        data: featuredProblems
      });
    } catch (error) {
      console.error('Error in getFeaturedProblems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured problems',
        error: error.message
      });
    }
  }

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      
      // Get top users with their stats
      const leaderboardStats = await UserStats.findLeaderboard(limit);
      
      // Get user details for each stat record
      const leaderboard = await Promise.all(
        leaderboardStats.map(async (stat) => {
          const user = await User.findByPk(stat.user_id, {
            attributes: ['id', 'name', 'email', 'avatar_url', 'role', 'is_active', 'is_online', 'subscription_status', 'created_at']
          });
          
          return {
            ...user.toJSON(),
            xp: stat.xp,
            level: stat.level,
            rank: stat.rank
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  }

  // Get featured achievements
  async getFeaturedAchievements(req, res) {
    try {
      const featuredAchievements = await Achievement.findFeatured();
      
      res.status(200).json({
        success: true,
        data: featuredAchievements
      });
    } catch (error) {
      console.error('Error in getFeaturedAchievements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured achievements',
        error: error.message
      });
    }
  }

  // Get testimonials
  async getTestimonials(req, res) {
    try {
      const testimonials = await Testimonial.findFeatured();
      
      res.status(200).json({
        success: true,
        data: testimonials
      });
    } catch (error) {
      console.error('Error in getTestimonials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch testimonials',
        error: error.message
      });
    }
  }
}

module.exports = new HomepageController();
