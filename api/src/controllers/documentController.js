const Document = require('../models/Document');
const Topic = require('../models/Topic');
const DocumentCategory = require('../models/DocumentCategory');
const DocumentCategoryLink = require('../models/DocumentCategoryLink');
const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const DocumentCompletion = require('../models/DocumentCompletion');
const DocumentLessonCompletion = require('../models/DocumentLessonCompletion');
const Animation = require('../models/Animation');
const User = require('../models/User');
const { Op } = require('sequelize');

class DocumentController {
  // Get all documents with pagination and filtering
  async getAllDocuments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { level, topic_id, category_id, created_by, search, sortBy } = req.query;

      // Build where clause
      const whereClause = {
        is_deleted: false
      };

      if (level) whereClause.level = level;
      if (topic_id) whereClause.topic_id = topic_id;
      if (created_by) whereClause.created_by = created_by;

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
          { level: { [Op.like]: `%${searchTerm}%` } },
          { content: { [Op.like]: `%${searchTerm}%` } }
        ];
      }

      // Category filtering (requires join)
      let includeClause = [];
      if (category_id) {
        includeClause.push({
          model: DocumentCategoryLink,
          where: { category_id: category_id },
          attributes: []
        });
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
        case 'created_at':
          orderClause = [['created_at', 'DESC']];
          break;
        default:
          orderClause = [['rating', 'DESC'], ['students', 'DESC'], ['created_at', 'DESC']];
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit,
        offset,
        order: orderClause,
        distinct: true // Important when joining with DocumentCategoryLink
      });

      res.status(200).json({
        success: true,
        data: documents,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Get a single document by ID
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      
      const document = await Document.findOne({
        where: { 
          id,
          is_deleted: false 
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error in getDocumentById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message
      });
    }
  }

  // Get featured documents
  async getFeaturedDocuments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 6;
      
      const featuredDocuments = await Document.scope('featured').findAll({
        limit
      });

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

  // Get documents by topic
  async getDocumentsByTopic(req, res) {
    try {
      const { topic_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: documents } = await Document.findAndCountAll({
        where: {
          topic_id,
          is_deleted: false
        },
        limit,
        offset,
        order: [['rating', 'DESC'], ['students', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: documents,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: limit
        }
      });
    } catch (error) {
      console.error('Error in getDocumentsByTopic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents by topic',
        error: error.message
      });
    }
  }

  // Get all topics
  async getTopics(req, res) {
    try {
      const topics = await Topic.findActive();
      
      res.status(200).json({
        success: true,
        data: topics
      });
    } catch (error) {
      console.error('Error in getTopics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch topics',
        error: error.message
      });
    }
  }

  // Get all document categories
  async getDocumentCategories(req, res) {
    try {
      const categories = await DocumentCategory.findActive();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getDocumentCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document categories',
        error: error.message
      });
    }
  }

  // Get document category links
  async getDocumentCategoryLinks(req, res) {
    try {
      const { document_id, category_id } = req.query;
      const whereClause = {};
      
      if (document_id) whereClause.document_id = document_id;
      if (category_id) whereClause.category_id = category_id;

      const links = await DocumentCategoryLink.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('Error in getDocumentCategoryLinks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document category links',
        error: error.message
      });
    }
  }

  // Get document details with modules and lessons
  async getDocumentDetails(req, res) {
    try {
      const { id } = req.params;
      
      // Get document
      const document = await Document.findOne({
        where: { 
          id,
          is_deleted: false 
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get topic details
      const topic = await Topic.findByPk(document.topic_id);
      
      // Get creator details
      const creator = await User.findByPk(document.created_by, {
        attributes: ['id', 'name', 'email', 'avatar_url', 'created_at']
      });

      // Get document modules
      const modules = await DocumentModule.findByDocument(id);
      
      // Get document lessons
      const lessons = [];
      for (const module of modules) {
        const moduleLessons = await DocumentLesson.findByModule(module.id);
        lessons.push(...moduleLessons);
      }

      // Get category links
      const categoryLinks = await DocumentCategoryLink.findByDocument(id);
      const categoryIds = categoryLinks.map(link => link.category_id);
      const categories = await DocumentCategory.findAll({
        where: { id: { [Op.in]: categoryIds } }
      });

      // Get animations
      const animations = await Animation.findByDocument(id);
      
      res.status(200).json({
        success: true,
        data: {
          document,
          topic,
          creator,
          modules,
          lessons,
          categories,
          categoryLinks,
          animations
        }
      });
    } catch (error) {
      console.error('Error in getDocumentDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document details',
        error: error.message
      });
    }
  }

  // Get document modules
  async getDocumentModules(req, res) {
    try {
      const { id } = req.params;
      
      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id,
          is_deleted: false 
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      const modules = await DocumentModule.findByDocument(id);
      
      res.status(200).json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error in getDocumentModules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document modules',
        error: error.message
      });
    }
  }

  // Get document lessons
  async getDocumentLessons(req, res) {
    try {
      const { id } = req.params;
      
      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id,
          is_deleted: false 
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      // Get modules first
      const modules = await DocumentModule.findByDocument(id);
      const moduleIds = modules.map(m => m.id);
      
      // Get lessons for all modules
      const lessons = await DocumentLesson.findAll({
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
      console.error('Error in getDocumentLessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document lessons',
        error: error.message
      });
    }
  }

  // Get single lesson
  async getLessonById(req, res) {
    try {
      const { lessonId } = req.params;
      
      const lesson = await DocumentLesson.findByPk(lessonId);
      
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

  // Get animations by document
  async getDocumentAnimations(req, res) {
    try {
      const { id } = req.params;
      
      const animations = await Animation.findByDocument(id);
      
      res.status(200).json({
        success: true,
        data: animations
      });
    } catch (error) {
      console.error('Error in getDocumentAnimations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document animations',
        error: error.message
      });
    }
  }

  // Get animations by lesson
  async getLessonAnimations(req, res) {
    try {
      const { lessonId } = req.params;
      
      const animations = await Animation.findByLesson(lessonId);
      
      res.status(200).json({
        success: true,
        data: animations
      });
    } catch (error) {
      console.error('Error in getLessonAnimations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson animations',
        error: error.message
      });
    }
  }

  // Get user document completions
  async getUserDocumentCompletions(req, res) {
    try {
      const { userId } = req.params;
      
      const completions = await DocumentCompletion.findByUser(userId);
      
      res.status(200).json({
        success: true,
        data: completions
      });
    } catch (error) {
      console.error('Error in getUserDocumentCompletions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user document completions',
        error: error.message
      });
    }
  }

  // Get user lesson completions
  async getUserLessonCompletions(req, res) {
    try {
      const { userId } = req.params;
      
      const completions = await DocumentLessonCompletion.findByUser(userId);
      
      res.status(200).json({
        success: true,
        data: completions
      });
    } catch (error) {
      console.error('Error in getUserLessonCompletions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user lesson completions',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentController();
