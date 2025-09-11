const express = require('express');
const Document = require('../models/Document');

const router = express.Router();

// Document controller functions
const documentController = {
  // Get all documents with pagination and filtering
  async getAllDocuments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { level, topic_id, created_by } = req.query;

      // Build where clause
      const whereClause = {
        is_deleted: false
      };

      if (level) whereClause.level = level;
      if (topic_id) whereClause.topic_id = topic_id;
      if (created_by) whereClause.created_by = created_by;

      const { count, rows: documents } = await Document.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['rating', 'DESC'], ['students', 'DESC'], ['created_at', 'DESC']]
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
  },

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
  },

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
  },

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
};

// Document CRUD operations
router.get('/', documentController.getAllDocuments);
router.get('/featured', documentController.getFeaturedDocuments);
router.get('/:id', documentController.getDocumentById);

// Document filtering and grouping
router.get('/topic/:topic_id', documentController.getDocumentsByTopic);

module.exports = router;
