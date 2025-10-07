const Problem = require('../models/Problem');
const ProblemCategory = require('../models/ProblemCategory');
const ProblemExample = require('../models/ProblemExample');
const ProblemConstraint = require('../models/ProblemConstraint');
const StarterCode = require('../models/StarterCode');
const TestCase = require('../models/TestCase');
const Tag = require('../models/Tag');
const ProblemTag = require('../models/ProblemTag');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { Op } = require('sequelize');

class ProblemAdminController {
  // Create a new problem (Admin/Creator only)
  async createProblem(req, res) {
    try {
      const {
        title,
        description,
        difficulty,
        estimated_time,
        category_id,
        is_premium,
        created_by,
        examples,
        constraints,
        starter_codes,
        test_cases,
        tags
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Problem title is required'
        });
      }

      if (!difficulty) {
        return res.status(400).json({
          success: false,
          message: 'Problem difficulty is required'
        });
      }

      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: 'Problem category is required'
        });
      }

      // Use provided created_by or current user's id
      const targetCreatorId = created_by || req.user.id;

      const problemData = {
        title,
        description,
        difficulty,
        estimated_time,
        category_id,
        is_premium: is_premium || false,
        created_by: targetCreatorId,
        is_deleted: false
      };

      const problem = await Problem.create(problemData);

      // Create related data
      if (examples && Array.isArray(examples)) {
        const exampleData = examples.map(example => ({
          problem_id: problem.id,
          input: example.input,
          output: example.output,
          explanation: example.explanation
        }));
        await ProblemExample.bulkCreate(exampleData);
      }

      if (constraints && Array.isArray(constraints)) {
        const constraintData = constraints.map(constraint => ({
          problem_id: problem.id,
          constraint: constraint.constraint
        }));
        await ProblemConstraint.bulkCreate(constraintData);
      }

      if (starter_codes && Array.isArray(starter_codes)) {
        const starterCodeData = starter_codes.map(code => ({
          problem_id: problem.id,
          language: code.language,
          code: code.code
        }));
        await StarterCode.bulkCreate(starterCodeData);
      }

      if (test_cases && Array.isArray(test_cases)) {
        const testCaseData = test_cases.map(testCase => ({
          problem_id: problem.id,
          input: testCase.input,
          output: testCase.output,
          is_hidden: testCase.is_hidden || false
        }));
        await TestCase.bulkCreate(testCaseData);
      }

      if (tags && Array.isArray(tags)) {
        const tagData = tags.map(tagId => ({
          problem_id: problem.id,
          tag_id: tagId
        }));
        await ProblemTag.bulkCreate(tagData);
      }

      res.status(201).json({
        success: true,
        message: 'Problem created successfully',
        data: problem
      });
    } catch (error) {
      console.error('Error in createProblem:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create problem'
      });
    }
  }

  // Get all problems for admin (including deleted)
  async getAllProblemsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const {
        category_id,
        created_by,
        difficulty,
        is_deleted,
        is_premium,
        is_popular,
        is_new,
        search,
        sortBy,
        acceptance_range
      } = req.query;

      // Build where clause
      const whereClause = {};

      if (category_id) whereClause.category_id = category_id;
      if (created_by) whereClause.created_by = created_by;
      if (difficulty) whereClause.difficulty = difficulty;
      if (is_deleted !== undefined) whereClause.is_deleted = is_deleted === 'true';
      if (is_premium !== undefined) whereClause.is_premium = is_premium === 'true';
      if (is_popular !== undefined) whereClause.is_popular = is_popular === 'true';
      if (is_new !== undefined) whereClause.is_new = is_new === 'true';

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } }
        ];
      }

      // Acceptance range filtering
      if (acceptance_range) {
        switch (acceptance_range) {
          case 'low':
            whereClause.acceptance = { [Op.lt]: 30 };
            break;
          case 'medium':
            whereClause.acceptance = { [Op.and]: [{ [Op.gte]: 30 }, { [Op.lt]: 70 }] };
            break;
          case 'high':
            whereClause.acceptance = { [Op.gte]: 70 };
            break;
        }
      }

      // Define sorting
      let orderClause;
      switch (sortBy) {
        case 'title':
          orderClause = [['title', 'ASC']];
          break;
        case 'difficulty':
          orderClause = [['difficulty', 'ASC']];
          break;
        case 'likes':
          orderClause = [['likes', 'DESC']];
          break;
        case 'acceptance':
          orderClause = [['acceptance', 'DESC']];
          break;
        case 'created_at':
          orderClause = [['created_at', 'DESC']];
          break;
        default:
          orderClause = [['created_at', 'DESC']];
      }

      const { count, rows: problems } = await Problem.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          }
        ],
        limit,
        offset,
        order: orderClause
      });

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllProblemsForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problems',
        error: error.message
      });
    }
  }

  // Get a single problem by ID (including deleted for admin)
  async getProblemByIdForAdmin(req, res) {
    try {
      const { id } = req.params;
      const includeDeleted = req.query.include_deleted === 'true';

      const whereClause = { id };
      if (!includeDeleted) {
        whereClause.is_deleted = false;
      }

      const problem = await Problem.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email', 'avatar_url']
          },
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          },
          {
            model: ProblemExample,
            as: 'Examples'
          },
          {
            model: ProblemConstraint,
            as: 'Constraints'
          },
          {
            model: StarterCode,
            as: 'StarterCodes'
          },
          {
            model: TestCase,
            as: 'TestCases'
          },
          {
            model: Tag,
            as: 'Tags',
            through: { attributes: [] }
          }
        ]
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      res.status(200).json({
        success: true,
        data: problem
      });
    } catch (error) {
      console.error('Error in getProblemByIdForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem',
        error: error.message
      });
    }
  }

  // Update a problem
  async updateProblem(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      // Find the problem
      const problem = await Problem.findByPk(id);
      
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && problem.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own problems unless you are an admin'
        });
      }

      // Update the problem
      await problem.update(updateData);

      // Fetch updated problem with associations
      const updatedProblem = await Problem.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ProblemCategory,
            as: 'Category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Problem updated successfully',
        data: updatedProblem
      });
    } catch (error) {
      console.error('Error in updateProblem:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update problem'
      });
    }
  }

  // Delete a problem (soft delete)
  async deleteProblem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const problem = await Problem.findByPk(id);
      
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      if (problem.is_deleted) {
        return res.status(400).json({
          success: false,
          message: 'Problem is already deleted'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && problem.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own problems unless you are an admin'
        });
      }

      // Soft delete
      await problem.update({ is_deleted: true });

      res.status(200).json({
        success: true,
        message: 'Problem deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteProblem:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete problem',
        error: error.message
      });
    }
  }

  // Permanently delete a problem (Admin only)
  async permanentlyDeleteProblem(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can permanently delete problems'
        });
      }

      const problem = await Problem.findByPk(id);
      
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      // Delete related records first
      await ProblemExample.destroy({ where: { problem_id: id } });
      await ProblemConstraint.destroy({ where: { problem_id: id } });
      await StarterCode.destroy({ where: { problem_id: id } });
      await TestCase.destroy({ where: { problem_id: id } });
      await ProblemTag.destroy({ where: { problem_id: id } });
      await Submission.destroy({ where: { problem_id: id } });
      
      await problem.destroy();

      res.status(200).json({
        success: true,
        message: 'Problem permanently deleted successfully'
      });
    } catch (error) {
      console.error('Error in permanentlyDeleteProblem:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to permanently delete problem',
        error: error.message
      });
    }
  }

  // Restore a soft-deleted problem (Admin only)
  async restoreProblem(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can restore problems'
        });
      }

      const problem = await Problem.findByPk(id);
      
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      if (!problem.is_deleted) {
        return res.status(400).json({
          success: false,
          message: 'Problem is not deleted'
        });
      }

      await problem.update({ is_deleted: false });

      res.status(200).json({
        success: true,
        message: 'Problem restored successfully',
        data: problem
      });
    } catch (error) {
      console.error('Error in restoreProblem:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore problem',
        error: error.message
      });
    }
  }

  // Get problem statistics (Admin only)
  async getProblemStatistics(req, res) {
    try {
      const totalProblems = await Problem.count();
      const publishedProblems = await Problem.count({ where: { is_deleted: false } });
      const deletedProblems = await Problem.count({ where: { is_deleted: true } });
      
      // Calculate growth rate based on monthly data
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const lastMonthProblems = await Problem.count({
        where: {
          created_at: {
            [Op.gte]: lastMonth,
            [Op.lt]: thisMonth
          },
          is_deleted: false
        }
      });
      
      const currentMonthProblems = await Problem.count({
        where: {
          created_at: { [Op.gte]: thisMonth },
          is_deleted: false
        }
      });
      
      const growthRate = lastMonthProblems > 0 
        ? ((currentMonthProblems - lastMonthProblems) / lastMonthProblems) * 100 
        : currentMonthProblems > 0 ? 100 : 0;
      
      const problemsByDifficulty = await Problem.findAll({
        where: { is_deleted: false },
        attributes: ['difficulty', [Problem.sequelize.fn('COUNT', '*'), 'count']],
        group: ['difficulty']
      });

      const problemsByCategory = await Problem.findAll({
        where: { is_deleted: false },
        include: [{
          model: ProblemCategory,
          as: 'Category',
          attributes: ['id', 'name']
        }],
        attributes: ['category_id', [Problem.sequelize.fn('COUNT', '*'), 'count']],
        group: ['category_id'],
        order: [[Problem.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10
      });

      const totalSubmissions = await Problem.sum('total_submissions', { where: { is_deleted: false } }) || 0;
      const totalSolved = await Problem.sum('solved_count', { where: { is_deleted: false } }) || 0;
      const avgAcceptance = await Problem.findOne({
        where: { is_deleted: false },
        attributes: [[Problem.sequelize.fn('AVG', Problem.sequelize.col('acceptance')), 'avg_acceptance']]
      });

      const popularProblems = await Problem.count({ where: { is_popular: true, is_deleted: false } });
      const newProblems = await Problem.count({ where: { is_new: true, is_deleted: false } });
      const premiumProblems = await Problem.count({ where: { is_premium: true, is_deleted: false } });

      res.status(200).json({
        success: true,
        data: {
          totalProblems,
          publishedProblems,
          deletedProblems,
          problemsByDifficulty: problemsByDifficulty.map(item => ({
            difficulty: item.difficulty,
            count: parseInt(item.dataValues.count)
          })),
          problemsByCategory: problemsByCategory.map(item => ({
            category: item.Category,
            count: parseInt(item.dataValues.count)
          })),
          totalSubmissions,
          totalSolved,
          averageAcceptance: parseFloat(avgAcceptance.dataValues.avg_acceptance || 0).toFixed(2),
          popularProblems,
          newProblems,
          premiumProblems,
          growthRate: Math.round(growthRate * 100) / 100
        }
      });
    } catch (error) {
      console.error('Error in getProblemStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch problem statistics',
        error: error.message
      });
    }
  }

  // Bulk update problems (Admin only)
  async bulkUpdateProblems(req, res) {
    try {
      const { problem_ids, update_data } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can bulk update problems'
        });
      }

      if (!problem_ids || !Array.isArray(problem_ids) || problem_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'problem_ids array is required'
        });
      }

      if (!update_data || Object.keys(update_data).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'update_data is required'
        });
      }

      // Remove sensitive fields
      delete update_data.id;
      delete update_data.created_at;
      delete update_data.updated_at;
      delete update_data.created_by;

      const [updatedCount] = await Problem.update(update_data, {
        where: {
          id: { [Op.in]: problem_ids }
        }
      });

      res.status(200).json({
        success: true,
        message: `${updatedCount} problems updated successfully`,
        data: {
          updatedCount,
          totalRequested: problem_ids.length
        }
      });
    } catch (error) {
      console.error('Error in bulkUpdateProblems:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to bulk update problems'
      });
    }
  }

  // Create problem category (Admin only)
  async createProblemCategory(req, res) {
    try {
      const { name, description } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can create problem categories'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      const category = await ProblemCategory.create({ name, description });

      res.status(201).json({
        success: true,
        message: 'Problem category created successfully',
        data: category
      });
    } catch (error) {
      console.error('Error in createProblemCategory:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to create category'
        });
      }
    }
  }

  // Update problem category (Admin only)
  async updateProblemCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update problem categories'
        });
      }

      const category = await ProblemCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      await category.update({ name, description });

      res.status(200).json({
        success: true,
        message: 'Problem category updated successfully',
        data: category
      });
    } catch (error) {
      console.error('Error in updateProblemCategory:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update category'
        });
      }
    }
  }

  // Delete problem category (Admin only)
  async deleteProblemCategory(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete problem categories'
        });
      }

      const category = await ProblemCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category is being used by any problems
      const problemCount = await Problem.count({ where: { category_id: id } });
      if (problemCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It is being used by ${problemCount} problems.`
        });
      }

      await category.destroy();

      res.status(200).json({
        success: true,
        message: 'Problem category deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteProblemCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }

  // Create tag (Admin only)
  async createTag(req, res) {
    try {
      const { name } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can create tags'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Tag name is required'
        });
      }

      const tag = await Tag.create({ name });

      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: tag
      });
    } catch (error) {
      console.error('Error in createTag:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Tag name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to create tag'
        });
      }
    }
  }

  // Update tag (Admin only)
  async updateTag(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update tags'
        });
      }

      const tag = await Tag.findByPk(id);
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: 'Tag not found'
        });
      }

      await tag.update({ name });

      res.status(200).json({
        success: true,
        message: 'Tag updated successfully',
        data: tag
      });
    } catch (error) {
      console.error('Error in updateTag:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Tag name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update tag'
        });
      }
    }
  }

  // Delete tag (Admin only)
  async deleteTag(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete tags'
        });
      }

      const tag = await Tag.findByPk(id);
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: 'Tag not found'
        });
      }

      // Delete tag associations first
      await ProblemTag.destroy({ where: { tag_id: id } });
      await tag.destroy();

      res.status(200).json({
        success: true,
        message: 'Tag deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteTag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete tag',
        error: error.message
      });
    }
  }
}

module.exports = new ProblemAdminController();