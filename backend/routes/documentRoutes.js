/**
 * Document Routes
 * 
 * API routes for the Smart Document & Certificate Generation System.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getDashboard,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  generateBulkDocuments,
  getGeneratedDocuments,
  getGeneratedDocumentById,
  downloadGeneratedDocument,
  deleteGeneratedDocument,
  createDocumentRequest,
  getDocumentRequests,
  approveDocumentRequest,
  rejectDocumentRequest,
  verifyDocumentByCode,
  submitPrintJob,
  getPrintJobs,
  getDocumentReports,
  getMyDocuments,
} = require('../controllers/documentController');

// ── Public Routes ──
// Document verification (public)
router.get('/verify/:code', verifyDocumentByCode);

// ── All authenticated users ──
router.use(protect);

// My documents (student/teacher)
router.get('/my-documents', getMyDocuments);

// Document requests
router.post('/requests', createDocumentRequest);
router.get('/requests', getDocumentRequests);

// ── Admin only routes ──
// Dashboard
router.get('/dashboard', authorize('admin'), getDashboard);

// Templates
router.get('/templates', authorize('admin', 'teacher'), getTemplates);
router.get('/templates/:id', authorize('admin', 'teacher'), getTemplateById);
router.post('/templates', authorize('admin'), createTemplate);
router.put('/templates/:id', authorize('admin'), updateTemplate);
router.delete('/templates/:id', authorize('admin'), deleteTemplate);

// Document Generation
router.post('/generate', authorize('admin', 'teacher', 'accountant'), generateDocument);
router.post('/generate-bulk', authorize('admin'), generateBulkDocuments);

// Generated Documents
router.get('/generated', authorize('admin', 'teacher', 'accountant'), getGeneratedDocuments);
router.get('/generated/:id', authorize('admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'), getGeneratedDocumentById);
router.get('/generated/:id/download', authorize('admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'), downloadGeneratedDocument);
router.delete('/generated/:id', authorize('admin'), deleteGeneratedDocument);

// Request Approvals
router.put('/requests/:id/approve', authorize('admin'), approveDocumentRequest);
router.put('/requests/:id/reject', authorize('admin'), rejectDocumentRequest);

// Print
router.post('/print', authorize('admin'), submitPrintJob);
router.get('/print-jobs', authorize('admin'), getPrintJobs);

// Reports
router.get('/reports', authorize('admin'), getDocumentReports);

module.exports = router;
