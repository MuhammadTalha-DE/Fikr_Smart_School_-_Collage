const DocumentTemplate = require('../models/DocumentTemplate');

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

const DEFAULT_LAYOUTS = {
  landscape: {
    width: 842,
    height: 595,
    orientation: 'landscape',
    margins: { top: 28, bottom: 28, left: 32, right: 32 },
    backgroundColor: '#ffffff',
    borderColor: '#1e3a8a',
    borderWidth: 2,
    headerHeight: 90,
    footerHeight: 58,
  },
  portrait: {
    width: 595,
    height: 842,
    orientation: 'portrait',
    margins: { top: 30, bottom: 30, left: 32, right: 32 },
    backgroundColor: '#ffffff',
    borderColor: '#1e3a8a',
    borderWidth: 2,
    headerHeight: 90,
    footerHeight: 58,
  },
};

const humanizeType = (type = 'document') =>
  type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const defaultHeader = `
<div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #1e3a8a;padding-bottom:12px;">
  {{#if school.logoDataUrl}}<img src="{{school.logoDataUrl}}" style="width:64px;height:64px;object-fit:contain;" />{{/if}}
  <div style="flex:1;text-align:center;">
    <h1 style="font-size:26px;color:#1e3a8a;margin:0;font-weight:800;">{{school.name}}</h1>
    <p style="font-size:12px;color:#475569;margin:4px 0 0;">{{school.address}}</p>
    <p style="font-size:11px;color:#64748b;margin:3px 0 0;">{{school.phone}} {{school.email}}</p>
  </div>
</div>`;

const defaultFooter = `
<div style="display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:10px;font-size:11px;color:#475569;">
  <div>
    <div>Date: {{school.currentDate}}</div>
    <div>Verification: {{document.verificationCode}}</div>
  </div>
  <div style="text-align:center;min-width:160px;">
    {{#if school.signatureDataUrl}}<img src="{{school.signatureDataUrl}}" style="height:40px;object-fit:contain;" />{{/if}}
    <div style="border-top:1px solid #334155;padding-top:4px;">{{school.principalName}}</div>
    <div>Principal</div>
  </div>
  {{#if school.stampDataUrl}}<img src="{{school.stampDataUrl}}" style="height:46px;width:64px;object-fit:contain;" />{{/if}}
</div>`;

const certificateContent = (type) => `
<div class="border-frame" style="min-height:340px;padding:34px 42px;text-align:center;">
  <h2 style="font-size:28px;letter-spacing:2px;color:#1e3a8a;margin:8px 0 26px;text-transform:uppercase;">${humanizeType(type)}</h2>
  <p style="font-size:17px;line-height:1.9;text-align:justify;margin:0 auto;max-width:680px;">
    This is to certify that <strong>{{student.name}}</strong>, admission number
    <strong>{{student.admissionNumber}}</strong>, student of
    <strong>{{student.className}} {{student.section}}</strong>, is associated with
    <strong>{{school.name}}</strong>.
  </p>
  <p style="font-size:16px;line-height:1.8;text-align:justify;margin:22px auto 0;max-width:680px;">
    This certificate is issued for <strong>{{document.reason}}</strong> on
    <strong>{{school.currentDate}}</strong>.
  </p>
  <div style="margin-top:42px;text-align:left;color:#475569;font-size:13px;">
    <div>Roll No: {{student.rollNumber}}</div>
    <div>Parent/Guardian: {{student.parentName}}</div>
  </div>
</div>`;

const idCardContent = `
<div class="id-card" style="max-width:520px;margin:0 auto;border-radius:12px;overflow:hidden;border:2px solid #1e3a8a;">
  <div class="id-card-header">
    {{#if school.logoDataUrl}}<img src="{{school.logoDataUrl}}" style="width:46px;height:46px;object-fit:contain;" />{{/if}}
    <div>
      <div style="font-size:18px;font-weight:800;">{{school.name}}</div>
      <div style="font-size:11px;opacity:.9;">Official Identity Card</div>
    </div>
  </div>
  <div class="id-card-body" style="display:flex;gap:18px;align-items:flex-start;">
    {{#if student.photoDataUrl}}<img src="{{student.photoDataUrl}}" class="student-photo" />{{/if}}
    <div style="font-size:13px;line-height:1.8;">
      <h2 style="font-size:20px;color:#1e3a8a;margin:0 0 8px;">{{student.name}}{{teacher.name}}</h2>
      <div><strong>Class:</strong> {{student.className}} {{student.section}}</div>
      <div><strong>Roll No:</strong> {{student.rollNumber}}</div>
      <div><strong>Admission No:</strong> {{student.admissionNumber}}</div>
      <div><strong>Employee ID:</strong> {{teacher.employeeId}}</div>
      <div><strong>Mobile:</strong> {{student.mobile}}{{teacher.mobile}}</div>
      <div><strong>Email:</strong> {{student.email}}{{teacher.email}}</div>
      <div><strong>CNIC:</strong> {{student.cnic}}{{teacher.cnic}}</div>
      <div><strong>Form-B:</strong> {{student.formBNumber}}</div>
      <div><strong>Passport:</strong> {{student.passport}}{{teacher.passport}}</div>
    </div>
  </div>
  <div class="id-card-footer">Verify using code: {{document.verificationCode}}</div>
</div>`;

const feeContent = `
<div class="border-frame" style="padding:26px;">
  <h2 class="document-title">Fee Voucher</h2>
  <table>
    <tr><th>Student</th><td>{{student.name}}</td><th>Class</th><td>{{student.className}} {{student.section}}</td></tr>
    <tr><th>Admission No</th><td>{{student.admissionNumber}}</td><th>Status</th><td>{{fee.status}}</td></tr>
    <tr><th>Total Fees</th><td>{{fee.totalFeesFormatted}}</td><th>Paid</th><td>{{fee.paidAmountFormatted}}</td></tr>
    <tr><th>Due Amount</th><td>{{fee.dueAmountFormatted}}</td><th>Due Date</th><td>{{fee.dueDate}}</td></tr>
  </table>
</div>`;

const resultContent = `
<div class="border-frame" style="padding:26px;">
  <h2 class="document-title">Result Card</h2>
  <p><strong>Student:</strong> {{student.name}} | <strong>Class:</strong> {{student.className}} {{student.section}}</p>
  <table>
    <thead><tr><th>Subject</th><th>Obtained</th><th>Max</th><th>Grade</th><th>Status</th></tr></thead>
    <tbody>
      {{#each result.results}}
        <tr><td>{{this.subject}}</td><td>{{this.marksObtained}}</td><td>{{this.maxMarks}}</td><td>{{this.grade}}</td><td>{{this.status}}</td></tr>
      {{/each}}
    </tbody>
  </table>
  <p><strong>Total:</strong> {{result.obtainedMarks}} / {{result.totalMarks}} | <strong>Percentage:</strong> {{result.percentageFormatted}} | <strong>Grade:</strong> {{result.grade}}</p>
</div>`;

const admitCardContent = `
<div class="border-frame" style="padding:26px;">
  <h2 class="document-title">Admit Card</h2>
  <p><strong>Student:</strong> {{student.name}}</p>
  <p><strong>Class:</strong> {{student.className}} {{student.section}} | <strong>Roll No:</strong> {{student.rollNumber}}</p>
  <p><strong>Exam:</strong> {{exam.name}} | <strong>Date:</strong> {{exam.startDate}}</p>
  <ol style="margin:20px 0 0 20px;line-height:1.8;">
    <li>Bring this admit card to the examination hall.</li>
    <li>Report at least 15 minutes before the exam starts.</li>
    <li>Electronic devices are not allowed.</li>
  </ol>
</div>`;

const letterContent = `
<div class="border-frame" style="padding:34px 42px;min-height:340px;">
  <h2 class="document-title">Official Letter</h2>
  <p style="line-height:1.8;"><strong>Subject:</strong> {{document.subject}}</p>
  <p style="line-height:1.8;margin-top:18px;">Dear {{student.name}}{{teacher.name}},</p>
  <p style="line-height:1.8;margin-top:18px;white-space:pre-line;">{{document.body}}</p>
  <p style="line-height:1.8;margin-top:18px;">Purpose: {{document.reason}}</p>
</div>`;

function buildDefaultTemplateData({ documentType = 'certificate', roleTarget = 'student', createdBy }) {
  const type = documentType || 'certificate';
  const isCertificate = CERTIFICATE_TYPES.has(type);
  const layout = type === 'id_card' ? { ...DEFAULT_LAYOUTS.landscape, width: 540, height: 340 } : DEFAULT_LAYOUTS.landscape;

  let content = letterContent;
  if (type === 'id_card') content = idCardContent;
  else if (['fee_voucher', 'receipt', 'fee_clearance', 'outstanding_notice'].includes(type)) content = feeContent;
  else if (['result_card', 'marks_sheet', 'transcript'].includes(type)) content = resultContent;
  else if (['admit_card', 'roll_number_slip'].includes(type)) content = admitCardContent;
  else if (isCertificate) content = certificateContent(type);

  return {
    name: `Default ${humanizeType(type)}`,
    type,
    roleTarget,
    layout,
    content,
    headerTemplate: defaultHeader,
    footerTemplate: defaultFooter,
    fields: [],
    watermark: { text: '{{school.name}}', opacity: 0.06, fontSize: 54, color: '#1e3a8a' },
    isActive: true,
    isDefault: true,
    createdBy,
  };
}

async function resolveGenerationTemplate({ templateId, documentType, roleTarget = 'student', createdBy }) {
  if (templateId) {
    const selected = await DocumentTemplate.findById(templateId);
    if (!selected) {
      const error = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }
    return selected;
  }

  const type = documentType || 'certificate';
  let template = await DocumentTemplate.findOne({
    type,
    roleTarget,
    isActive: true,
  }).sort({ isDefault: -1, updatedAt: -1 });

  if (!template && roleTarget !== 'student') {
    template = await DocumentTemplate.findOne({
      type,
      isActive: true,
    }).sort({ isDefault: -1, updatedAt: -1 });
  }

  if (template) return template;

  return DocumentTemplate.create(buildDefaultTemplateData({
    documentType: type,
    roleTarget,
    createdBy,
  }));
}

module.exports = {
  buildDefaultTemplateData,
  resolveGenerationTemplate,
  humanizeType,
};
