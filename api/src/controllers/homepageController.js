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
      // Run queries in parallel for better performance
      const [
        totalUsers,
        totalCourses,
        totalDocuments,
        totalProblems,
        totalSubmissions,
        totalAchievements
      ] = await Promise.all([
        User.count({ where: { is_active: true } }),
        Course.count({ where: { status: 'published', is_deleted: false } }),
        Document.count({ where: { is_deleted: false } }),
        Problem.count({ where: { is_deleted: false } }),
        // This would come from a submissions table, for now use a mock value
        Promise.resolve(12000),
        Achievement.count()
      ]);

      const overview = {
        totalUsers,
        totalCourses,
        totalDocuments,
        totalProblems,
        totalSubmissions,
        totalBadges: totalAchievements,
        totalAchievements
      };

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
