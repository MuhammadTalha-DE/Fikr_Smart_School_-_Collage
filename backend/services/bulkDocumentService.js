/**
 * Bulk Document Service
 * 
 * Handles generation of documents for multiple students/teachers at once.
 * Supports class-wide, section-wide, and custom selection generation.
 */

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const GeneratedDocument = require('../models/GeneratedDocument');
const { resolveAllDocumentData } = require('./documentDataResolver');
const { generatePDF } = require('./pdfGeneratorService');
const { generateVerificationCode, generateQRCode } = require('./qrVerificationService');
const auditService = require('./auditService');
const { resolveGenerationTemplate } = require('./documentTemplateDefaults');
const { normalizeCustomDocumentFields } = require('../utils/customDocumentFields');
const { assertDocumentRecipient } = require('../utils/assertDocumentRecipient');

/**
 * Bulk generate documents for multiple owners
 */
async function bulkGenerateDocuments({
  templateId,
  ownerType,       // 'student', 'teacher', 'staff'
  ownerIds,        // Array of owner IDs
  documentType,
  examId,
  classId,
  generatedBy,
  reason = '',
  customFields = {},
  options = {},
}) {
  const template = await resolveGenerationTemplate({
    templateId,
    documentType,
    roleTarget: ownerType === 'staff' ? 'staff' : ownerType,
    createdBy: generatedBy,
  });
  if (!template.isActive) {
    const error = new Error('The selected template is inactive. Choose an active template.');
    error.statusCode = 422;
    throw error;
  }
  const normalizedCustomFields = normalizeCustomDocumentFields(template, customFields);

  const results = {
    total: ownerIds.length,
    success: 0,
    failed: 0,
    documents: [],
    errors: [],
  };

  for (const ownerId of ownerIds) {
    try {
      // Resolve data
      const data = await resolveAllDocumentData({
        ownerType,
        ownerId,
        documentType: documentType || template.type,
        examId,
        classId,
      });
      assertDocumentRecipient(template, ownerType, data);

      data.document = {
        ...(data.document || {}),
        reason,
        purpose: reason,
        customFields: normalizedCustomFields,
      };

      // Generate verification code
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
        : 'User';

      // Save to database
      const docRecord = await GeneratedDocument.create({
        templateId: template._id,
        documentType: documentType || template.type,
        title: `${template.name} - ${data.student?.name || data.teacher?.name || data.user?.name || ownerId}`,
        ownerType,
        ownerId,
        ownerModel,
        generatedBy,
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
        },
        tags: [template.type, ownerType],
      });

      results.success++;
      results.documents.push({
        _id: docRecord._id,
        ownerId,
        ownerName: data.student?.name || data.teacher?.name || '',
        verificationCode,
        status: 'generated',
      });
    } catch (err) {
      results.failed++;
      results.errors.push({
        ownerId,
        error: err.message,
      });
      console.error(`Bulk generation failed for ${ownerId}:`, err.message);
    }
  }

  // Audit log
  try {
    await auditService.log({
      action: 'BULK_GENERATE',
      entity: 'GeneratedDocument',
      description: `Bulk generated ${results.success} ${documentType} documents (${results.failed} failed)`,
      performedBy: { userId: generatedBy },
      req: options.req,
    });
  } catch (e) { /* ignore audit errors */ }

  return results;
}

/**
 * Generate documents for an entire class
 */
async function generateForClass({
  templateId,
  classId,
  documentType,
  examId,
  generatedBy,
  reason = '',
  customFields = {},
  options = {},
}) {
  const students = await Student.find({ classId })
    .populate('userId', 'name email')
    .select('_id');

  const ownerIds = students.map(s => s._id);

  return await bulkGenerateDocuments({
    templateId,
    ownerType: 'student',
    ownerIds,
    documentType,
    examId,
    classId,
    generatedBy,
    reason,
    customFields,
    options,
  });
}

/**
 * Generate documents for a section within a class
 */
async function generateForSection({
  templateId,
  classId,
  section,
  documentType,
  examId,
  generatedBy,
  reason = '',
  options = {},
}) {
  const students = await Student.find({ classId })
    .populate({
      path: 'classId',
      match: { section },
      select: 'section',
    })
    .populate('userId', 'name email');

  const ownerIds = students
    .filter(s => s.classId && s.classId.section === section)
    .map(s => s._id);

  return await bulkGenerateDocuments({
    templateId,
    ownerType: 'student',
    ownerIds,
    documentType,
    examId,
    classId,
    generatedBy,
    reason,
    options,
  });
}

/**
 * Generate documents for all teachers
 */
async function generateForAllTeachers({
  templateId,
  documentType,
  generatedBy,
  reason = '',
  options = {},
}) {
  const teachers = await Teacher.find().populate('userId', 'name email').select('_id');
  const ownerIds = teachers.map(t => t._id);

  return await bulkGenerateDocuments({
    templateId,
    ownerType: 'teacher',
    ownerIds,
    documentType,
    generatedBy,
    reason,
    options,
  });
}

/**
 * Generate documents for selected students by criteria
 */
async function generateByCriteria({
  templateId,
  documentType,
  criteria,        // { classIds, section, gender, bloodGroup, admissionYear }
  generatedBy,
  reason = '',
  options = {},
}) {
  const query = {};
  if (criteria.classIds) query.classId = { $in: criteria.classIds };
  if (criteria.gender) query.gender = criteria.gender;
  if (criteria.bloodGroup) query.bloodGroup = criteria.bloodGroup;
  if (criteria.admissionYear) {
    const year = parseInt(criteria.admissionYear);
    query.admissionDate = {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31),
    };
  }

  const students = await Student.find(query).populate('userId', 'name email').select('_id');

  // If section specified, filter by section
  let ownerIds = students.map(s => s._id);
  if (criteria.section) {
    const filtered = await Student.find({
      _id: { $in: ownerIds },
    }).populate({
      path: 'classId',
      match: { section: criteria.section },
      select: 'section',
    });
    ownerIds = filtered.filter(s => s.classId).map(s => s._id);
  }

  return await bulkGenerateDocuments({
    templateId,
    ownerType: 'student',
    ownerIds,
    documentType,
    generatedBy,
    reason,
    options,
  });
}

module.exports = {
  bulkGenerateDocuments,
  generateForClass,
  generateForSection,
  generateForAllTeachers,
  generateByCriteria,
};
