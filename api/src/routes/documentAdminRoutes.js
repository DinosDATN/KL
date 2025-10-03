const express = require('express');
const documentAdminController = require('../controllers/documentAdminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin role requirement to all routes except basic CRUD operations (which check permissions internally)
router.use(requireRole(['admin', 'creator']));

/**
 * Document CRUD Operations (Admin/Creator)
 */

// POST /api/admin/documents - Create a new document
router.post('/', documentAdminController.createDocument);

// GET /api/admin/documents - Get all documents with admin filters
router.get('/', documentAdminController.getAllDocumentsForAdmin);

// GET /api/admin/documents/statistics - Get document statistics
router.get('/statistics', requireRole(['admin']), documentAdminController.getDocumentStatistics);

// GET /api/admin/documents/deleted - Get soft-deleted documents
router.get('/deleted', requireRole(['admin']), documentAdminController.getDeletedDocuments);

// GET /api/admin/documents/export - Export documents data
router.get('/export', requireRole(['admin']), documentAdminController.exportDocuments);

// GET /api/admin/documents/:id - Get single document by ID (admin view)
router.get('/:id', documentAdminController.getDocumentByIdForAdmin);

// PUT /api/admin/documents/:id - Update a document
router.put('/:id', documentAdminController.updateDocument);

// DELETE /api/admin/documents/:id - Soft delete a document
router.delete('/:id', documentAdminController.deleteDocument);

/**
 * Advanced Document Management Operations (Admin Only)
 */

// POST /api/admin/documents/:id/restore - Restore a soft-deleted document
router.post('/:id/restore', requireRole(['admin']), documentAdminController.restoreDocument);

// DELETE /api/admin/documents/:id/permanent - Permanently delete a document
router.delete('/:id/permanent', requireRole(['admin']), documentAdminController.permanentlyDeleteDocument);

/**
 * Bulk Operations (Admin Only)
 */

// PATCH /api/admin/documents/bulk/update - Bulk update documents
router.patch('/bulk/update', requireRole(['admin']), documentAdminController.bulkUpdateDocuments);

// POST /api/admin/documents/bulk/delete - Bulk delete documents
router.post('/bulk/delete', requireRole(['admin']), documentAdminController.bulkDeleteDocuments);

// POST /api/admin/documents/bulk/restore - Bulk restore documents
router.post('/bulk/restore', requireRole(['admin']), documentAdminController.bulkRestoreDocuments);

/**
 * Topic Management (Admin Only)
 */

// POST /api/admin/documents/topics - Create a new topic
router.post('/topics', requireRole(['admin']), documentAdminController.createTopic);

// PUT /api/admin/documents/topics/:id - Update a topic
router.put('/topics/:id', requireRole(['admin']), documentAdminController.updateTopic);

// DELETE /api/admin/documents/topics/:id - Delete a topic
router.delete('/topics/:id', requireRole(['admin']), documentAdminController.deleteTopic);

module.exports = router;