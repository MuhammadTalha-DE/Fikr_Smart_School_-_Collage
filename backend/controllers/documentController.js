/**
 * Document Controller
 * 
 * Main controller for the Smart Document & Certificate Generation System.
 * Handles all CRUD operations for templates, document generation, verification, etc.
 */

const asyncHandler = require('express-async-handler');
const DocumentTemplate = require('../models/DocumentTemplate');
const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentRequest = require('../models/DocumentRequest');
const DocumentVerification = require('../models/DocumentVerification');
const PrintJob = require('../models/PrintJob');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const auditService = require('../services/auditService');

const { resolveAllDocumentData, resolveStudentData, resolveTeacherData } = require('../services/documentDataResolver');
const { generatePDF, generateBulkPDFs } = require('../services/pdfGeneratorService');
const { generateVerificationCode, generateQRCode, verifyDocument } = require('../services/qrVerificationService');
const { bulkGenerateDocuments, generateForClass } = require('../services/bulkDocumentService');
const { resolveGenerationTemplate } = require('../services/documentTemplateDefaults');
const { normalizeCustomDocumentFields } = require('../utils/customDocumentFields');
const { assertDocumentRecipient } = require('../utils/assertDocumentRecipient');

const CERTIFICATE_TYPES = new Set([
  'certificate',
  'bonafide',
  'character',
  'leaving',
  'transfer',
  'migration',
  'experience',
  'no_objection',
  'appreciation',
  'attendance_certificate',
  'fee_clearance',
  'scholarship',
  'sports',
  'achievement',
  'hostel_certificate',
  'merit_certificate',
  'event_certificate',
]);

const isCertificateType = (type) => CERTIFICATE_TYPES.has(type);

const formatIssueDate = (value) => new Date(value).toLocaleDateString('en-IN');

const buildValidationError = (message, errors) => {
  const error = new Error(message);
  error.statusCode = 422;
  error.errors = errors;
  return error;
};

const validateCertificateGeneration = ({ reqBody, template, data }) => {
  const errors = [];
  const {
    templateId,
    ownerType,
    ownerId,
    documentType,
    issueDate,
    academicSession,
  } = reqBody;

  if (!documentType) errors.push('Certificate type is required');
  if (!templateId) errors.push('Certificate template is required');
  if (!ownerType || !ownerId) errors.push('Student or teacher selection is required');
  if (!['student', 'teacher', 'staff', 'user'].includes(ownerType)) {
    errors.push('Select a supported document recipient');
  }
  if (!issueDate || Number.isNaN(new Date(issueDate).getTime())) {
    errors.push('Valid issue date is required');
  }
  if (!String(academicSession || '').trim()) {
    errors.push('Academic session is required');
  }
  if (template && !template.isActive) {
    errors.push('Selected certificate template is inactive');
  }
  if (template && documentType && ![documentType, 'certificate'].includes(template.type)) {
    errors.push('Selected template does not match the certificate type');
  }
  if (template && ownerType === 'student' && template.roleTarget !== 'student') {
    errors.push('Selected template is not configured for students');
  }
  if (template && ['teacher', 'staff'].includes(ownerType) && !['teacher', 'staff'].includes(template.roleTarget)) {
    errors.push('Selected template is not configured for teachers');
  }

  if (ownerType === 'student' && (!data.student || data.student.name === 'N/A')) {
    errors.push('Selected student could not be resolved');
  }
  if (['teacher', 'staff'].includes(ownerType) && (!data.teacher || data.teacher.name === 'N/A')) {
    errors.push('Selected teacher could not be resolved');
  }
  if (ownerType === 'user' && !data.user?.name) errors.push('Selected user could not be resolved');

  if (errors.length) {
    throw buildValidationError('Certificate cannot be generated until required fields are complete', errors);
  }
};

// =====================================================
// DASHBOARD
// =====================================================

// @desc    Get document system dashboard data
// @route   GET /api/documents/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalTemplates,
    activeTemplates,
    totalGenerated,
    totalRequests,
    pendingRequests,
    recentDocuments,
    recentRequests,
  ] = await Promise.all([
    DocumentTemplate.countDocuments(),
    DocumentTemplate.countDocuments({ isActive: true }),
    GeneratedDocument.countDocuments(),
    DocumentRequest.countDocuments(),
    DocumentRequest.countDocuments({ status: 'pending' }),
    GeneratedDocument.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('templateId', 'name type')
      .select('documentType title status createdAt'),
    DocumentRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requestedBy', 'name')
      .select('documentType reason status createdAt'),
  ]);

  // Stats by document type
  const statsByType = await GeneratedDocument.aggregate([
    {
      $group: {
        _id: '$documentType',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    totalTemplates,
    activeTemplates,
    totalGenerated,
    totalRequests,
    pendingRequests,
    statsByType,
    recentDocuments,
    recentRequests,
  });
});

// =====================================================
// TEMPLATES CRUD
// =====================================================

// @desc    Get all templates (with optional filters)
// @route   GET /api/documents/templates
const getTemplates = asyncHandler(async (req, res) => {
  const { type, roleTarget, isActive } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (roleTarget) filter.roleTarget = roleTarget;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const templates = await DocumentTemplate.find(filter)
    .populate('createdBy', 'name')
    .sort({ updatedAt: -1 });

  res.json(templates);
});

// @desc    Get a single template by ID
// @route   GET /api/documents/templates/:id
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id)
    .populate('createdBy', 'name');

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  res.json(template);
});

// @desc    Create a new template
// @route   POST /api/documents/templates
const createTemplate = asyncHandler(async (req, res) => {
  const templateData = {
    ...req.body,
    createdBy: req.user._id,
  };

  const template = await DocumentTemplate.create(templateData);

  await auditService.log({
    action: 'CREATE',
    entity: 'DocumentTemplate',
    entityId: template._id,
    description: `Document template "${template.name}" created`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(template);
});

// @desc    Update a template
// @route   PUT /api/documents/templates/:id
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Increment version on update
  req.body.version = (template.version || 1) + 1;

  template.set(req.body);
  template.version = req.body.version;
  const updated = await template.save();

  await auditService.log({
    action: 'UPDATE',
    entity: 'DocumentTemplate',
    entityId: template._id,
    description: `Document template "${template.name}" updated`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json(updated);
});

// @desc    Delete a template
// @route   DELETE /api/documents/templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Soft delete - just deactivate
  template.isActive = false;
  await template.save();

  await auditService.log({
    action: 'DELETE',
    entity: 'DocumentTemplate',
    entityId: template._id,
    description: `Document template "${template.name}" deactivated`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Template deactivated successfully' });
});

// =====================================================
// DOCUMENT GENERATION
// =====================================================

// @desc    Generate a single document
// @route   POST /api/documents/generate
const generateDocument = asyncHandler(async (req, res) => {
  const {
    templateId,
    ownerType,
    ownerId,
    documentType,
    examId,
    classId,
    reason = '',
    notes = '',
    subject = '',
    body = '',
    issueDate,
    academicSession,
    additionalData = {},
    format = 'pdf',
    sendToParent = false,
  } = req.body;

  if (!ownerType || !ownerId) {
    res.status(400);
    throw new Error('ownerType and ownerId are required');
  }

  if (documentType && isCertificateType(documentType) && !templateId) {
    throw buildValidationError('Certificate template is required', [
      'Select an active certificate template before generating a certificate',
    ]);
  }

  const template = await resolveGenerationTemplate({
    templateId,
    documentType,
    roleTarget: ownerType === 'staff' ? 'staff' : ownerType,
    createdBy: req.user._id,
  });
  const customFields = normalizeCustomDocumentFields(template, req.body.customFields);

  // Resolve data
  const data = await resolveAllDocumentData({
    ownerType,
    ownerId,
    documentType: documentType || template.type,
    examId,
    classId,
  });
  assertDocumentRecipient(template, ownerType, data);

  if (isCertificateType(documentType || template.type)) {
    validateCertificateGeneration({
      reqBody: req.body,
      template,
      data,
    });
  }

  const issuedDateFormatted = issueDate ? formatIssueDate(issueDate) : data.school?.currentDate;

  data.document = {
    ...(data.document || {}),
    ...additionalData,
    customFields,
    reason,
    purpose: reason,
    notes,
    subject,
    body,
    issueDate,
    issueDateFormatted: issuedDateFormatted,
    academicSession,
  };
  if (issuedDateFormatted) {
    data.school.currentDate = issuedDateFormatted;
  }

  // Generate verification
  const verificationCode = generateVerificationCode();
  const qrCodeDataUrl = await generateQRCode(verificationCode);

  // Generate PDF
  const pdfBuffer = await generatePDF(template, data, {
    verificationCode,
    qrCodeDataUrl,
  });

  // Determine ownerModel
  const ownerModel = ownerType === 'student' ? 'Student'
    : ownerType === 'teacher' ? 'Teacher'
    : ownerType === 'staff' ? 'Teacher'
    : ownerType === 'parent' ? 'Parent'
    : 'User';

  // Save to database
  const docRecord = await GeneratedDocument.create({
    templateId: template._id,
    documentType: documentType || template.type,
    title: `${template.name} - ${data.student?.name || data.teacher?.name || data.user?.name || ownerId}`,
    ownerType,
    ownerId,
    ownerModel,
    generatedBy: req.user._id,
    verificationCode,
    qrCodeDataUrl,
    pdfBuffer,
    fileSize: pdfBuffer.length,
    status: 'generated',
    issuedAt: new Date(),
    metadata: {
      studentName: data.student?.name || data.teacher?.name || data.user?.name || '',
      className: data.student?.className || '',
      admissionNumber: data.student?.admissionNumber || '',
      templateVersion: template.version,
      reason,
      issueDate,
      academicSession,
    },
    tags: [template.type, ownerType],
  });

  // Audit log
  await auditService.log({
    action: 'GENERATE',
    entity: 'GeneratedDocument',
    entityId: docRecord._id,
    description: `Document "${template.name}" generated for ${data.student?.name || data.teacher?.name || ownerId}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json({
    _id: docRecord._id,
    title: docRecord.title,
    documentType: docRecord.documentType,
    verificationCode,
    qrCodeDataUrl,
    fileSize: docRecord.fileSize,
    status: docRecord.status,
    issuedAt: docRecord.issuedAt,
    metadata: docRecord.metadata,
    pdfBuffer: pdfBuffer.toString('base64'),
  });
});

// @desc    Bulk generate documents
// @route   POST /api/documents/generate-bulk
const generateBulkDocuments = asyncHandler(async (req, res) => {
  const {
    templateId,
    ownerType,
    ownerIds,
    documentType,
    examId,
    classId,
    generateForClass: isForClass,
    criteria,
    customFields = {},
    reason = '',
  } = req.body;

  let result;

  if (isForClass && classId) {
    result = await generateForClass({
      templateId,
      classId,
      documentType,
      examId,
      generatedBy: req.user._id,
      reason,
      customFields,
      options: { req },
    });
  } else if (criteria) {
    // Use the bulkDocumentService's generateByCriteria
    const { generateByCriteria } = require('../services/bulkDocumentService');
    result = await generateByCriteria({
      templateId,
      documentType,
      criteria,
      generatedBy: req.user._id,
      reason,
      customFields,
      options: { req },
    });
  } else if (ownerIds && ownerIds.length > 0) {
    result = await bulkGenerateDocuments({
      templateId,
      ownerType,
      ownerIds,
      documentType,
      examId,
      classId,
      generatedBy: req.user._id,
      reason,
      customFields,
      options: { req },
    });
  } else {
    res.status(400);
    throw new Error('Provide ownerIds, classId, or criteria for bulk generation');
  }

  res.json(result);
});

// =====================================================
// GENERATED DOCUMENTS
// =====================================================

// @desc    Get all generated documents
// @route   GET /api/documents/generated
const getGeneratedDocuments = asyncHandler(async (req, res) => {
  const {
    ownerType,
    ownerId,
    documentType,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (ownerType) filter.ownerType = ownerType;
  if (ownerId) filter.ownerId = ownerId;
  if (documentType) filter.documentType = documentType;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    GeneratedDocument.find(filter)
      .populate('templateId', 'name type')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-pdfBuffer'), // Exclude binary data from listing
    GeneratedDocument.countDocuments(filter),
  ]);

  res.json({
    documents,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get a single generated document
// @route   GET /api/documents/generated/:id
const getGeneratedDocumentById = asyncHandler(async (req, res) => {
  const document = await GeneratedDocument.findById(req.params.id)
    .populate('templateId', 'name type layout')
    .populate('generatedBy', 'name');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  await assertGeneratedDocumentAccess(req, document);

  res.json(document);
});

const assertGeneratedDocumentAccess = async (req, document) => {
  if (req.user.role === 'admin') return;
  if (document.ownerType === 'user' && document.ownerId.toString() === req.user._id.toString()) return;

  let profile;
  if (document.ownerType === 'student') {
    profile = await Student.findById(document.ownerId).select('userId');
  } else if (['teacher', 'staff'].includes(document.ownerType)) {
    profile = await Teacher.findById(document.ownerId).select('userId');
  } else if (document.ownerType === 'parent') {
    profile = await require('../models/Parent').findById(document.ownerId).select('userId');
  }
  if (profile?.userId?.toString() === req.user._id.toString()) return;

  if (req.user.role === 'parent' && document.ownerType === 'student') {
    const linkedParent = await require('../models/Parent').findOne({
      userId: req.user._id,
      children: document.ownerId,
    }).select('_id');
    if (linkedParent) return;
  }

  const error = new Error('You do not have access to this document');
  error.statusCode = 403;
  throw error;
};

// @desc    Download a generated document as PDF
// @route   GET /api/documents/generated/:id/download
const downloadGeneratedDocument = asyncHandler(async (req, res) => {
  const document = await GeneratedDocument.findById(req.params.id)
    .populate('templateId', 'name type');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  await assertGeneratedDocumentAccess(req, document);

  // If we have a pdfBuffer, send it
  if (document.pdfBuffer) {
    const filename = `${document.title || 'document'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', document.pdfBuffer.length);
    res.send(document.pdfBuffer);
  } else if (document.pdfUrl) {
    // Redirect to external URL
    res.redirect(document.pdfUrl);
  } else {
    res.status(404);
    throw new Error('PDF content not available');
  }
});

// @desc    Delete a generated document
// @route   DELETE /api/documents/generated/:id
const deleteGeneratedDocument = asyncHandler(async (req, res) => {
  const document = await GeneratedDocument.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  document.status = 'revoked';
  await document.save();

  await auditService.log({
    action: 'REVOKE',
    entity: 'GeneratedDocument',
    entityId: document._id,
    description: `Document "${document.title}" revoked`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.json({ message: 'Document revoked successfully' });
});

// =====================================================
// DOCUMENT REQUESTS
// =====================================================

// @desc    Create a document request
// @route   POST /api/documents/requests
const createDocumentRequest = asyncHandler(async (req, res) => {
  const {
    ownerType,
    ownerId,
    documentType,
    templateId,
    reason,
    priority,
    notes,
  } = req.body;

  if (!ownerType || !ownerId || !documentType) {
    res.status(400);
    throw new Error('ownerType, ownerId, and documentType are required');
  }

  // Determine ownerModel
  const ownerModel = ownerType === 'student' ? 'Student'
    : ownerType === 'teacher' ? 'Teacher'
    : 'User';

  const request = await DocumentRequest.create({
    requestedBy: req.user._id,
    ownerType,
    ownerId,
    ownerModel,
    documentType,
    templateId,
    reason: reason || '',
    priority: priority || 'normal',
    notes: notes || '',
    status: 'pending',
  });

  res.status(201).json(request);
});

// @desc    Get document requests
// @route   GET /api/documents/requests
const getDocumentRequests = asyncHandler(async (req, res) => {
  const { status, documentType, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (documentType) filter.documentType = documentType;

  // If user is student, show only their requests
  if (req.user.role === 'student') {
    filter.requestedBy = req.user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requests, total] = await Promise.all([
    DocumentRequest.find(filter)
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    DocumentRequest.countDocuments(filter),
  ]);

  res.json({
    requests,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Approve a document request
// @route   PUT /api/documents/requests/:id/approve
const approveDocumentRequest = asyncHandler(async (req, res) => {
  const request = await DocumentRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error(`Request is already ${request.status}`);
  }

  request.status = 'approved';
  request.approvedBy = req.user._id;
  request.approvedAt = new Date();
  await request.save();

  // Auto-generate the document
  try {
    const template = request.templateId
      ? await DocumentTemplate.findById(request.templateId)
      : await DocumentTemplate.findOne({ type: request.documentType, isActive: true });

    if (template) {
      const data = await resolveAllDocumentData({
        ownerType: request.ownerType,
        ownerId: request.ownerId,
        documentType: request.documentType,
      });

      const verificationCode = generateVerificationCode();
      const qrCodeDataUrl = await generateQRCode(verificationCode);
      const pdfBuffer = await generatePDF(template, data, { verificationCode });

      const docRecord = await GeneratedDocument.create({
        templateId: template._id,
        documentType: request.documentType,
        title: `${template.name} - ${data.student?.name || data.teacher?.name || ''}`,
        ownerType: request.ownerType,
        ownerId: request.ownerId,
        ownerModel: request.ownerModel,
        generatedBy: req.user._id,
        verificationCode,
        qrCodeDataUrl,
        pdfBuffer,
        fileSize: pdfBuffer.length,
        status: 'issued',
        issuedAt: new Date(),
      });

      request.status = 'generated';
      request.generatedDocumentId = docRecord._id;
      await request.save();
    }
  } catch (err) {
    console.error('Auto-generation after approval failed:', err.message);
  }

  res.json(request);
});

// @desc    Reject a document request
// @route   PUT /api/documents/requests/:id/reject
const rejectDocumentRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const request = await DocumentRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Document request not found');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error(`Request is already ${request.status}`);
  }

  request.status = 'rejected';
  request.approvedBy = req.user._id;
  request.approvedAt = new Date();
  request.rejectionReason = rejectionReason || '';
  await request.save();

  res.json(request);
});

// =====================================================
// DOCUMENT VERIFICATION
// =====================================================

// @desc    Verify a document by code
// @route   GET /api/documents/verify/:code
const verifyDocumentByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const result = await verifyDocument(code, {
    method: req.query.method || 'manual_code',
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
  });

  res.json(result);
});

// =====================================================
// PRINT JOBS
// =====================================================

// @desc    Submit a print job
// @route   POST /api/documents/print
const submitPrintJob = asyncHandler(async (req, res) => {
  const { documentIds, copies, duplexPrint, colorPrint, printerName } = req.body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    res.status(400);
    throw new Error('documentIds array is required');
  }

  const printJob = await PrintJob.create({
    documentIds,
    requestedBy: req.user._id,
    jobType: documentIds.length === 1 ? 'single' : 'bulk',
    copies: copies || 1,
    duplexPrint: duplexPrint || false,
    colorPrint: colorPrint !== undefined ? colorPrint : true,
    printerName: printerName || '',
    status: 'pending',
  });

  // Process the print job asynchronously
  processPrintJob(printJob._id).catch(err => {
    console.error('Print job processing failed:', err);
  });

  res.status(201).json(printJob);
});

// @desc    Get print jobs
// @route   GET /api/documents/print-jobs
const getPrintJobs = asyncHandler(async (req, res) => {
  const printJobs = await PrintJob.find()
    .populate('requestedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(printJobs);
});

// Helper to process print jobs (simulated)
async function processPrintJob(printJobId) {
  try {
    await PrintJob.findByIdAndUpdate(printJobId, { status: 'processing' });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    await PrintJob.findByIdAndUpdate(printJobId, {
      status: 'completed',
      completedAt: new Date(),
    });
  } catch (err) {
    await PrintJob.findByIdAndUpdate(printJobId, {
      status: 'failed',
      errorMessage: err.message,
    });
  }
}

// =====================================================
// REPORTS
// =====================================================

// @desc    Get document generation reports
// @route   GET /api/documents/reports
const getDocumentReports = asyncHandler(async (req, res) => {
  const { from, to, groupBy = 'type' } = req.query;

  const dateFilter = {};
  if (from || to) {
    dateFilter.issuedAt = {};
    if (from) dateFilter.issuedAt.$gte = new Date(from);
    if (to) dateFilter.issuedAt.$lte = new Date(to);
  }

  const groupField = groupBy === 'type' ? '$documentType'
    : groupBy === 'status' ? '$status'
    : '$ownerType';

  const reports = await GeneratedDocument.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: groupField,
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        lastGenerated: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Monthly trend
  const monthlyTrend = await GeneratedDocument.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);

  res.json({
    reports,
    monthlyTrend,
    totalDocuments: await GeneratedDocument.countDocuments(dateFilter),
    totalTemplates: await DocumentTemplate.countDocuments({ isActive: true }),
    pendingRequests: await DocumentRequest.countDocuments({ status: 'pending' }),
  });
});

// =====================================================
// OWNER-SPECIFIC HELPERS
// =====================================================

// @desc    Get documents for current user (student/teacher)
// @route   GET /api/documents/my-documents
const getMyDocuments = asyncHandler(async (req, res) => {
  const { role } = req.user;

  let ownerType, ownerId;
  if (role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    ownerType = 'student';
    ownerId = student._id;
  } else if (role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher profile not found');
    }
    ownerType = 'teacher';
    ownerId = teacher._id;
  } else {
    ownerType = 'user';
    ownerId = req.user._id;
  }

  const ownerFilters = [{ ownerType, ownerId }];
  if (ownerType !== 'user') ownerFilters.push({ ownerType: 'user', ownerId: req.user._id });
  const documents = await GeneratedDocument.find({ $or: ownerFilters })
    .populate('templateId', 'name type')
    .sort({ createdAt: -1 })
    .select('-pdfBuffer');

  res.json(documents);
});

// =====================================================
// EXPORT
// =====================================================

module.exports = {
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
};
