const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const Document = require('../models/Document');
const { Op, sequelize } = require('sequelize');

class DocumentModuleController {
  // Create a new document module
  async createModule(req, res) {
    try {
      const { document_id } = req.params;
      const { title, position } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Find the document and check permissions
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        }
      });

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
          message: 'You can only create modules for your own documents'
        });
      }

      // If no position provided, set it as the next position
      let modulePosition = position;
      if (!modulePosition) {
        const lastModule = await DocumentModule.findOne({
          where: { document_id },
          order: [['position', 'DESC']]
        });
        modulePosition = lastModule ? lastModule.position + 1 : 1;
      }

      // Validate position doesn't conflict
      const existingModule = await DocumentModule.findOne({
        where: { 
          document_id,
          position: modulePosition
        }
      });

      if (existingModule) {
        // Shift existing modules down
        await DocumentModule.update(
          { position: sequelize.literal('position + 1') },
          {
            where: {
              document_id,
              position: { [Op.gte]: modulePosition }
            }
          }
        );
      }

      const moduleData = {
        document_id,
        title,
        position: modulePosition
      };

      const module = await DocumentModule.create(moduleData);

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module
      });
    } catch (error) {
      console.error('Error in createModule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create module'
      });
    }
  }

  // Get all modules for a document
  async getDocumentModules(req, res) {
    try {
      const { document_id } = req.params;
      const includeStats = req.query.include_stats === 'true';
      const includeLessons = req.query.include_lessons === 'true';

      // Verify document exists
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const includeOptions = [];
      if (includeLessons) {
        includeOptions.push({
          model: DocumentLesson,
          as: 'Lessons',
          required: false,
          order: [['position', 'ASC']]
        });
      }

      const modules = await DocumentModule.findAll({
        where: { document_id },
        include: includeOptions,
        order: [['position', 'ASC']]
      });

      // Add statistics if requested
      if (includeStats) {
        for (let module of modules) {
          const lessonCount = await DocumentLesson.count({
            where: { module_id: module.id }
          });
          
          const lessonsWithContent = await DocumentLesson.count({
            where: { 
              module_id: module.id,
              content: { [Op.not]: null }
            }
          });

          module.dataValues.lessonCount = lessonCount;
          module.dataValues.lessonsWithContent = lessonsWithContent;
          module.dataValues.completionRate = lessonCount > 0 ? 
            Math.round((lessonsWithContent / lessonCount) * 100) : 0;
        }
      }

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

  // Get a single module by ID
  async getModuleById(req, res) {
    try {
      const { module_id } = req.params;
      const includeLessons = req.query.include_lessons === 'true';
      const includeDocument = req.query.include_document === 'true';

      const includeOptions = [];
      if (includeLessons) {
        includeOptions.push({
          model: DocumentLesson,
          as: 'Lessons',
          order: [['position', 'ASC']]
        });
      }

      if (includeDocument) {
        includeOptions.push({
          model: Document,
          as: 'Document',
          attributes: ['id', 'title', 'created_by'],
          where: { is_deleted: false }
        });
      }

      const module = await DocumentModule.findByPk(module_id, {
        include: includeOptions
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      res.status(200).json({
        success: true,
        data: module
      });
    } catch (error) {
      console.error('Error in getModuleById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module',
        error: error.message
      });
    }
  }

  // Update a module
  async updateModule(req, res) {
    try {
      const { module_id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.document_id;

      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update modules in your own documents'
        });
      }

      // Handle position update if provided
      if (updateData.position && updateData.position !== module.position) {
        const documentId = module.document_id;
        const newPosition = updateData.position;
        const oldPosition = module.position;

        if (newPosition > oldPosition) {
          // Moving down - shift up modules between old and new position
          await DocumentModule.update(
            { position: sequelize.literal('position - 1') },
            {
              where: {
                document_id: documentId,
                position: {
                  [Op.gt]: oldPosition,
                  [Op.lte]: newPosition
                }
              }
            }
          );
        } else {
          // Moving up - shift down modules between new and old position
          await DocumentModule.update(
            { position: sequelize.literal('position + 1') },
            {
              where: {
                document_id: documentId,
                position: {
                  [Op.gte]: newPosition,
                  [Op.lt]: oldPosition
                }
              }
            }
          );
        }
      }

      await module.update(updateData);
      await module.reload();

      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: module
      });
    } catch (error) {
      console.error('Error in updateModule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update module'
      });
    }
  }

  // Delete a module
  async deleteModule(req, res) {
    try {
      const { module_id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false }
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && module.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete modules from your own documents'
        });
      }

      const documentId = module.document_id;
      const modulePosition = module.position;

      // Delete the module (this will cascade to lessons)
      await module.destroy();

      // Shift up remaining modules
      await DocumentModule.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            document_id: documentId,
            position: { [Op.gt]: modulePosition }
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteModule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete module',
        error: error.message
      });
    }
  }

  // Reorder modules within a document
  async reorderModules(req, res) {
    try {
      const { document_id } = req.params;
      const { modules } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!modules || !Array.isArray(modules)) {
        return res.status(400).json({
          success: false,
          message: 'Modules array is required'
        });
      }

      // Verify document exists and user has permission
      const document = await Document.findOne({
        where: { 
          id: document_id,
          is_deleted: false
        }
      });

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
          message: 'You can only reorder modules in your own documents'
        });
      }

      // Verify all modules belong to this document
      const moduleIds = modules.map(m => m.id);
      const existingModules = await DocumentModule.findAll({
        where: {
          id: { [Op.in]: moduleIds },
          document_id: document_id
        }
      });

      if (existingModules.length !== modules.length) {
        return res.status(400).json({
          success: false,
          message: 'Some modules do not belong to this document'
        });
      }

      // Update positions using transaction
      const transaction = await sequelize.transaction();
      try {
        for (const moduleData of modules) {
          await DocumentModule.update(
            { position: moduleData.position },
            {
              where: { id: moduleData.id },
              transaction
            }
          );
        }

        await transaction.commit();

        // Fetch updated modules
        const updatedModules = await DocumentModule.findAll({
          where: { document_id },
          order: [['position', 'ASC']]
        });

        res.status(200).json({
          success: true,
          message: 'Modules reordered successfully',
          data: updatedModules
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in reorderModules:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reorder modules'
      });
    }
  }

  // Get module statistics
  async getModuleStats(req, res) {
    try {
      const { module_id } = req.params;

      const module = await DocumentModule.findOne({
        where: { id: module_id },
        include: [{
          model: Document,
          as: 'Document',
          where: { is_deleted: false },
          attributes: ['id', 'title']
        }]
      });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Get lesson statistics
      const totalLessons = await DocumentLesson.count({
        where: { module_id }
      });

      const lessonsWithContent = await DocumentLesson.count({
        where: { 
          module_id,
          content: { [Op.not]: null }
        }
      });

      const lessonsWithCodeExamples = await DocumentLesson.count({
        where: { 
          module_id,
          code_example: { [Op.not]: null }
        }
      });

      const avgContentLength = await DocumentLesson.aggregate('content', 'avg', {
        where: { 
          module_id,
          content: { [Op.not]: null }
        }
      }) || 0;

      const stats = {
        totalLessons,
        lessonsWithContent,
        lessonsWithCodeExamples,
        lessonsWithoutContent: totalLessons - lessonsWithContent,
        completionRate: totalLessons > 0 ? Math.round((lessonsWithContent / totalLessons) * 100) : 0,
        avgContentLength: Math.round(avgContentLength),
        codeExampleRate: totalLessons > 0 ? Math.round((lessonsWithCodeExamples / totalLessons) * 100) : 0
      };

      res.status(200).json({
        success: true,
        data: {
          module,
          stats
        }
      });
    } catch (error) {
      console.error('Error in getModuleStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch module statistics',
        error: error.message
      });
    }
  }

  // Duplicate a module
  async duplicateModule(req, res) {
    try {
      const { module_id } = req.params;
      const { title } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const originalModule = await DocumentModule.findOne({
        where: { id: module_id },
        include: [
          {
            model: Document,
            as: 'Document',
            where: { is_deleted: false }
          },
          {
            model: DocumentLesson,
            as: 'Lessons',
            order: [['position', 'ASC']]
          }
        ]
      });

      if (!originalModule) {
        return res.status(404).json({
          success: false,
          message: 'Module not found'
        });
      }

      // Authorization check
      if (userRole !== 'admin' && originalModule.Document.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only duplicate modules from your own documents'
        });
      }

      // Find the next position
      const lastModule = await DocumentModule.findOne({
        where: { document_id: originalModule.document_id },
        order: [['position', 'DESC']]
      });
      const newPosition = lastModule ? lastModule.position + 1 : 1;

      // Create new module
      const newModule = await DocumentModule.create({
        document_id: originalModule.document_id,
        title: title || `${originalModule.title} (Copy)`,
        position: newPosition
      });

      // Duplicate lessons if any
      if (originalModule.Lessons && originalModule.Lessons.length > 0) {
        const lessonPromises = originalModule.Lessons.map((lesson, index) => 
          DocumentLesson.create({
            module_id: newModule.id,
            title: lesson.title,
            content: lesson.content,
            code_example: lesson.code_example,
            position: index + 1
          })
        );
        
        await Promise.all(lessonPromises);
      }

      // Fetch complete duplicated module
      const duplicatedModule = await DocumentModule.findByPk(newModule.id, {
        include: [{
          model: DocumentLesson,
          as: 'Lessons',
          order: [['position', 'ASC']]
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Module duplicated successfully',
        data: duplicatedModule
      });
    } catch (error) {
      console.error('Error in duplicateModule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to duplicate module'
      });
    }
  }
}

module.exports = new DocumentModuleController();