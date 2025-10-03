const Document = require('../models/Document');
const DocumentCategory = require('../models/DocumentCategory');
const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const Topic = require('../models/Topic');
const User = require('../models/User');
const { Op } = require('sequelize');

class DocumentAdminController {
  // Create a new document (Admin/Creator only)
  async createDocument(req, res) {
    try {
      const {
        title,
        description,
        content,
        topic_id,
        level,
        duration,
        thumbnail_url,
        created_by
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Document title is required'
        });
      }

      if (!topic_id) {
        return res.status(400).json({
          success: false,
          message: 'Document topic is required'
        });
      }

      // Use provided created_by or current user's id
      const targetCreatorId = created_by || req.user.id;

      const documentData = {
        title,
        description,
        content,
        topic_id,
        level: level || 'Beginner',
        duration,
        thumbnail_url,
        created_by: targetCreatorId,
        is_deleted: false
      };

      const document = await Document.create(documentData);

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: document
      });
    } catch (error) {
      console.error('Error in createDocument:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create document'
      });
    }
  }

  // Get all documents for admin (including deleted)
  async getAllDocumentsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const {
        topic_id,
        created_by,
        level,
        is_deleted,
        search,
        sortBy,
        students_range
      } = req.query;

      // Build where clause
      const whereClause = {};

      if (topic_id) whereClause.topic_id = topic_id;
      if (created_by) whereClause.created_by = created_by;
      if (level) whereClause.level = level;
      if (is_deleted !== undefined) whereClause.is_deleted = is_deleted === 'true';

      // Search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } }
        ];
      }

      // Students range filtering
      if (students_range) {
        switch (students_range) {
          case 'low':
            whereClause.students = { [Op.lt]: 100 };
            break;
          case 'medium':
            whereClause.students = { [Op.and]: [{ [Op.gte]: 100 }, { [Op.lt]: 500 }] };
            break;
          case 'high':
            whereClause.students = { [Op.gte]: 500 };
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
        case 'created_at':
          orderClause = [['created_at', 'DESC']];
          break;
        default:
          orderClause = [['created_at', 'DESC']];
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Topic,
            as: 'Topic',
            attributes: ['id', 'name']
          }
        ],
        limit,
        offset,
        order: orderClause
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
      console.error('Error in getAllDocumentsForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Get a single document by ID (including deleted for admin)
  async getDocumentByIdForAdmin(req, res) {
    try {
      const { id } = req.params;
      const includeDeleted = req.query.include_deleted === 'true';

      const whereClause = { id };
      if (!includeDeleted) {
        whereClause.is_deleted = false;
      }

      const document = await Document.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email', 'avatar_url']
          },
          {
            model: Topic,
            as: 'Topic',
            attributes: ['id', 'name']
          }
        ]
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
      console.error('Error in getDocumentByIdForAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message
      });
    }
  }

  // Update a document
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.id;

      // Find the document
      const document = await Document.findByPk(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own documents unless you are an admin'
        });
      }

      // Update the document
      await document.update(updateData);

      // Fetch updated document with associations
      const updatedDocument = await Document.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Topic,
            as: 'Topic',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: updatedDocument
      });
    } catch (error) {
      console.error('Error in updateDocument:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update document'
      });
    }
  }

  // Delete a document (soft delete)
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const document = await Document.findByPk(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (document.is_deleted) {
        return res.status(400).json({
          success: false,
          message: 'Document is already deleted'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own documents unless you are an admin'
        });
      }

      // Soft delete
      await document.update({ is_deleted: true });

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  // Permanently delete a document (Admin only)
  async permanentlyDeleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can permanently delete documents'
        });
      }

      const document = await Document.findByPk(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete related records first (if any)
      // This would include DocumentModule, DocumentLesson, etc.
      
      await document.destroy();

      res.status(200).json({
        success: true,
        message: 'Document permanently deleted successfully'
      });
    } catch (error) {
      console.error('Error in permanentlyDeleteDocument:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to permanently delete document',
        error: error.message
      });
    }
  }

  // Restore a soft-deleted document (Admin only)
  async restoreDocument(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can restore documents'
        });
      }

      const document = await Document.findByPk(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (!document.is_deleted) {
        return res.status(400).json({
          success: false,
          message: 'Document is not deleted'
        });
      }

      await document.update({ is_deleted: false });

      res.status(200).json({
        success: true,
        message: 'Document restored successfully',
        data: document
      });
    } catch (error) {
      console.error('Error in restoreDocument:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore document',
        error: error.message
      });
    }
  }

  // Get document statistics (Admin only)
  async getDocumentStatistics(req, res) {
    try {
      const totalDocuments = await Document.count();
      const publishedDocuments = await Document.count({ where: { is_deleted: false } });
      const deletedDocuments = await Document.count({ where: { is_deleted: true } });
      
      const documentsByLevel = await Document.findAll({
        where: { is_deleted: false },
        attributes: ['level', [Document.sequelize.fn('COUNT', '*'), 'count']],
        group: ['level']
      });

      const topTopics = await Document.findAll({
        where: { is_deleted: false },
        include: [{
          model: Topic,
          as: 'Topic',
          attributes: ['id', 'name']
        }],
        attributes: ['topic_id', [Document.sequelize.fn('COUNT', '*'), 'count']],
        group: ['topic_id'],
        order: [[Document.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10
      });

      const totalStudents = await Document.sum('students', { where: { is_deleted: false } }) || 0;
      const avgRating = await Document.findOne({
        where: { is_deleted: false },
        attributes: [[Document.sequelize.fn('AVG', Document.sequelize.col('rating')), 'avg_rating']]
      });

      res.status(200).json({
        success: true,
        data: {
          totalDocuments,
          publishedDocuments,
          deletedDocuments,
          documentsByLevel: documentsByLevel.map(item => ({
            level: item.level,
            count: parseInt(item.dataValues.count)
          })),
          topTopics: topTopics.map(item => ({
            topic: item.Topic,
            count: parseInt(item.dataValues.count)
          })),
          totalStudents,
          averageRating: parseFloat(avgRating.dataValues.avg_rating || 0).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error in getDocumentStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document statistics',
        error: error.message
      });
    }
  }

  // Bulk update documents (Admin only)
  async bulkUpdateDocuments(req, res) {
    try {
      const { document_ids, update_data } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can bulk update documents'
        });
      }

      if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'document_ids array is required'
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

      const [updatedCount] = await Document.update(update_data, {
        where: {
          id: { [Op.in]: document_ids }
        }
      });

      res.status(200).json({
        success: true,
        message: `${updatedCount} documents updated successfully`,
        data: {
          updatedCount,
          totalRequested: document_ids.length
        }
      });
    } catch (error) {
      console.error('Error in bulkUpdateDocuments:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to bulk update documents'
      });
    }
  }

  // Bulk delete documents (Admin only)
  async bulkDeleteDocuments(req, res) {
    try {
      const { document_ids, permanent = false } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can bulk delete documents'
        });
      }

      if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'document_ids array is required'
        });
      }

      let deletedCount = 0;

      if (permanent) {
        deletedCount = await Document.destroy({
          where: {
            id: { [Op.in]: document_ids }
          }
        });
      } else {
        const [updatedCount] = await Document.update({ is_deleted: true }, {
          where: {
            id: { [Op.in]: document_ids },
            is_deleted: false
          }
        });
        deletedCount = updatedCount;
      }

      res.status(200).json({
        success: true,
        message: `${deletedCount} documents ${permanent ? 'permanently ' : ''}deleted successfully`,
        data: {
          deletedCount,
          totalRequested: document_ids.length
        }
      });
    } catch (error) {
      console.error('Error in bulkDeleteDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete documents',
        error: error.message
      });
    }
  }

  // Get deleted documents (Admin only)
  async getDeletedDocuments(req, res) {
    try {
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can view deleted documents'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: documents } = await Document.findAndCountAll({
        where: { is_deleted: true },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Topic,
            as: 'Topic',
            attributes: ['id', 'name']
          }
        ],
        limit,
        offset,
        order: [['updated_at', 'DESC']]
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
      console.error('Error in getDeletedDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch deleted documents',
        error: error.message
      });
    }
  }

  // Bulk restore documents (Admin only)
  async bulkRestoreDocuments(req, res) {
    try {
      const { document_ids } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can bulk restore documents'
        });
      }

      if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'document_ids array is required'
        });
      }

      const [restoredCount] = await Document.update({ is_deleted: false }, {
        where: {
          id: { [Op.in]: document_ids },
          is_deleted: true
        }
      });

      res.status(200).json({
        success: true,
        message: `${restoredCount} documents restored successfully`,
        data: {
          restoredCount,
          totalRequested: document_ids.length
        }
      });
    } catch (error) {
      console.error('Error in bulkRestoreDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk restore documents',
        error: error.message
      });
    }
  }

  // Export documents data (Admin only)
  async exportDocuments(req, res) {
    try {
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can export documents'
        });
      }

      const { format = 'json', include_deleted = false } = req.query;

      const whereClause = include_deleted === 'true' ? {} : { is_deleted: false };

      const documents = await Document.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Topic,
            as: 'Topic',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      if (format === 'csv') {
        const csv = this.convertToCSV(documents);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=documents.csv');
        res.status(200).send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=documents.json');
        res.status(200).json({
          success: true,
          exportDate: new Date().toISOString(),
          totalDocuments: documents.length,
          data: documents
        });
      }
    } catch (error) {
      console.error('Error in exportDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export documents',
        error: error.message
      });
    }
  }

  // Helper method to convert documents to CSV
  convertToCSV(documents) {
    if (!documents || documents.length === 0) {
      return 'No documents to export';
    }

    const headers = [
      'ID', 'Title', 'Level', 'Topic', 'Creator', 
      'Students', 'Rating', 'Duration', 'Created At', 'Is Deleted'
    ];

    const csvRows = [headers.join(',')];

    documents.forEach(document => {
      const row = [
        document.id,
        `"${document.title?.replace(/"/g, '""') || ''}"`,
        document.level,
        `"${document.Topic?.name?.replace(/"/g, '""') || ''}"`,
        `"${document.Creator?.name?.replace(/"/g, '""') || ''}"`,
        document.students || 0,
        document.rating || 0,
        document.duration || 0,
        document.created_at,
        document.is_deleted
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Create topic (Admin only)
  async createTopic(req, res) {
    try {
      const { name } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can create topics'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Topic name is required'
        });
      }

      const topic = await Topic.create({ name });

      res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: topic
      });
    } catch (error) {
      console.error('Error in createTopic:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Topic name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to create topic'
        });
      }
    }
  }

  // Update topic (Admin only)
  async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update topics'
        });
      }

      const topic = await Topic.findByPk(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      await topic.update({ name });

      res.status(200).json({
        success: true,
        message: 'Topic updated successfully',
        data: topic
      });
    } catch (error) {
      console.error('Error in updateTopic:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
          success: false,
          message: 'Topic name already exists'
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to update topic'
        });
      }
    }
  }

  // Delete topic (Admin only)
  async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete topics'
        });
      }

      const topic = await Topic.findByPk(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found'
        });
      }

      // Check if topic is being used by any documents
      const documentCount = await Document.count({ where: { topic_id: id } });
      if (documentCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete topic. It is being used by ${documentCount} documents.`
        });
      }

      await topic.destroy();

      res.status(200).json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteTopic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete topic',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentAdminController();