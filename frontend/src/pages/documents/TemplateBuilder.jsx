import { useMemo, useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiSave, FiPlus, FiTrash2, FiEye, FiCopy, FiGrid, FiCode,
  FiFileText, FiSliders, FiLayers, FiMonitor,
} from 'react-icons/fi';

const DOCUMENT_TYPES = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'bonafide', label: 'Bonafide Certificate' },
  { value: 'character', label: 'Character Certificate' },
  { value: 'leaving', label: 'Leaving Certificate' },
  { value: 'transfer', label: 'Transfer Certificate' },
  { value: 'migration', label: 'Migration Certificate' },
  { value: 'fee_voucher', label: 'Fee Voucher' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'result_card', label: 'Result Card' },
  { value: 'admit_card', label: 'Admit Card' },
  { value: 'official_letter', label: 'Official Letter' },
  { value: 'experience', label: 'Experience Certificate' },
  { value: 'appointment', label: 'Appointment Letter' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'scholarship', label: 'Scholarship Letter' },
  { value: 'sports', label: 'Sports Certificate' },
  { value: 'fee_clearance', label: 'Fee Clearance' },
  { value: 'attendance_certificate', label: 'Attendance Certificate' },
  { value: 'no_objection', label: 'No Objection Certificate' },
];

const ROLE_TARGETS = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'admin', label: 'Admin' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'warden', label: 'Warden' },
  { value: 'transport', label: 'Transport' },
  { value: 'staff', label: 'Staff' },
  { value: 'user', label: 'Any user' },
];

const INPUT_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'qr', label: 'QR Code' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'date', label: 'Date' },
  { value: 'signature', label: 'Signature' },
  { value: 'stamp', label: 'Stamp' },
];

const PAGE_PRESETS = [
  { label: 'A4 Landscape', width: 842, height: 595, orientation: 'landscape' },
  { label: 'A4 Portrait', width: 595, height: 842, orientation: 'portrait' },
  { label: 'ID Card', width: 540, height: 340, orientation: 'landscape' },
  { label: 'Half Page', width: 595, height: 421, orientation: 'landscape' },
];

const DEFAULT_PLACEHOLDERS = {
  student: [
    '{{student.name}}', '{{student.rollNumber}}', '{{student.className}}',
    '{{student.section}}', '{{student.admissionNumber}}', '{{student.dobFormatted}}',
    '{{student.bloodGroup}}', '{{student.parentName}}', '{{student.parentPhone}}',
    '{{student.photoDataUrl}}', '{{student.gender}}', '{{student.address}}',
    '{{student.email}}', '{{student.phone}}', '{{student.mobile}}',
    '{{student.cnic}}', '{{student.formBNumber}}', '{{student.passport}}',
  ],
  teacher: [
    '{{teacher.name}}', '{{teacher.email}}', '{{teacher.phone}}', '{{teacher.mobile}}',
    '{{teacher.employeeId}}', '{{teacher.subjectsList}}', '{{teacher.photoDataUrl}}',
    '{{teacher.classNames}}', '{{teacher.address}}', '{{teacher.cnic}}', '{{teacher.passport}}',
  ],
  user: ['{{user.name}}', '{{user.username}}', '{{user.email}}', '{{user.role}}', '{{user.phone}}', '{{user.address}}'],
  school: [
    '{{school.name}}', '{{school.logoDataUrl}}', '{{school.address}}',
    '{{school.phone}}', '{{school.email}}', '{{school.website}}',
    '{{school.principalName}}', '{{school.signatureDataUrl}}', '{{school.stampDataUrl}}',
    '{{school.motto}}', '{{school.affiliationNumber}}', '{{school.boardName}}',
    '{{school.currentDate}}', '{{school.currentYear}}', '{{school.academicYear}}',
  ],
  fee: [
    '{{fee.totalFeesFormatted}}', '{{fee.paidAmountFormatted}}', '{{fee.dueAmountFormatted}}',
    '{{fee.status}}', '{{fee.dueDate}}', '{{fee.feePlanName}}',
  ],
  result: [
    '{{result.percentageFormatted}}', '{{result.grade}}', '{{result.totalMarks}}',
    '{{result.obtainedMarks}}', '{{result.examName}}', '{{result.rank}}',
  ],
  document: [
    '{{document.verificationCode}}', '{{document.verificationUrl}}',
    '{{document.generatedDate}}', '{{document.generatedDateTime}}',
    '{{document.reason}}', '{{document.purpose}}', '{{document.type}}',
  ],
  attendance: [
    '{{attendance.totalDays}}', '{{attendance.presentDays}}', '{{attendance.absentDays}}',
    '{{attendance.leaveDays}}', '{{attendance.attendancePercentageFormatted}}',
  ],
  hostel: [
    '{{hostel.hostelName}}', '{{hostel.roomNumber}}', '{{hostel.bedNumber}}',
    '{{hostel.floor}}', '{{hostel.checkInDate}}',
  ],
  transport: [
    '{{transport.routeName}}', '{{transport.vehicleNumber}}', '{{transport.driverName}}',
    '{{transport.driverPhone}}', '{{transport.stopName}}', '{{transport.pickupTime}}',
  ],
};

const SAMPLE_DATA = {
  school: {
    name: 'Fikr Smart School',
    address: 'Main Campus Road, Lahore',
    phone: '+92 300 0000000',
    email: 'office@fikrsmart.edu',
    website: 'www.fikrsmart.edu',
    principalName: 'Dr. Ayesha Khan',
    motto: 'Learn. Lead. Serve.',
    affiliationNumber: 'AFF-2026-1042',
    boardName: 'Board of Intermediate and Secondary Education',
    currentDate: new Date().toLocaleDateString('en-IN'),
    currentDateTime: new Date().toLocaleString('en-IN'),
    currentYear: new Date().getFullYear().toString(),
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    logoDataUrl: '',
    signatureDataUrl: '',
    stampDataUrl: '',
  },
  student: {
    name: 'Rahul Sharma',
    rollNumber: '1024',
    className: 'Class 10',
    section: 'A',
    admissionNumber: 'ADM-2026-011',
    dobFormatted: '14/08/2011',
    bloodGroup: 'B+',
    parentName: 'Mr. Amit Sharma',
    parentPhone: '+92 300 1234567',
    photoDataUrl: '',
    gender: 'Male',
    address: 'House 21, Model Town',
    email: 'rahul@example.com',
    phone: '+92 301 7654321',
    mobile: '+92 301 7654321',
    cnic: '35202-1234567-1',
    passport: 'AB1234567',
  },
  teacher: {
    name: 'Ms. Sana Ali',
    email: 'sana.ali@fikrsmart.edu',
    phone: '+92 300 2222222',
    mobile: '+92 300 2222222',
    cnic: '35202-7654321-8',
    passport: 'PK7654321',
    employeeId: 'EMP-018',
    subjectsList: 'Mathematics, Physics',
    photoDataUrl: '',
    classNames: 'Class 9, Class 10',
    address: 'Lahore',
  },
  fee: {
    totalFeesFormatted: 'Rs. 45,000',
    paidAmountFormatted: 'Rs. 35,000',
    dueAmountFormatted: 'Rs. 10,000',
    status: 'Partially Paid',
    dueDate: '15/07/2026',
    feePlanName: 'Annual Plan',
  },
  result: {
    percentageFormatted: '91.50%',
    grade: 'A+',
    totalMarks: '600',
    obtainedMarks: '549',
    examName: 'Final Term',
    rank: '2',
    results: [
      { subject: 'Mathematics', marksObtained: 96, maxMarks: 100, grade: 'A+', status: 'Pass' },
      { subject: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', status: 'Pass' },
    ],
  },
  attendance: {
    totalDays: 180,
    presentDays: 169,
    absentDays: 8,
    leaveDays: 3,
    attendancePercentageFormatted: '93.89%',
  },
  hostel: {
    hostelName: 'Iqbal Hostel',
    roomNumber: 'B-204',
    bedNumber: 'B2',
    floor: '2',
    checkInDate: '01/04/2026',
  },
  transport: {
    routeName: 'Route A',
    vehicleNumber: 'BUS-17',
    driverName: 'Imran Ahmed',
    driverPhone: '+92 300 3333333',
    stopName: 'Model Town Stop',
    pickupTime: '07:10 AM',
  },
  document: {
    verificationCode: 'FS-26-8K42',
    verificationUrl: 'https://school.example.com/verify/FS-26-8K42',
    generatedDate: new Date().toLocaleDateString('en-IN'),
    generatedDateTime: new Date().toLocaleString('en-IN'),
    reason: 'Higher education admission',
    purpose: 'Higher education admission',
    type: 'Certificate',
  },
};

const DEFAULT_LAYOUT = {
  width: 842,
  height: 595,
  orientation: 'landscape',
  margins: { top: 28, bottom: 28, left: 32, right: 32 },
  backgroundColor: '#ffffff',
  borderColor: '#1e3a8a',
  borderWidth: 2,
  headerHeight: 90,
  footerHeight: 58,
};

const DEFAULT_HEADER = '<div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #1e3a8a;padding-bottom:12px;">\n  {{#if school.logoDataUrl}}<img src="{{school.logoDataUrl}}" style="width:58px;height:58px;border-radius:10px;object-fit:contain;" />{{else}}<div style="width:58px;height:58px;border-radius:12px;background:#dbeafe;display:flex;align-items:center;justify-content:center;color:#1e3a8a;font-weight:800;">LOGO</div>{{/if}}\n  <div style="flex:1;text-align:center;">\n    <h1 style="font-size:26px;color:#1e3a8a;margin:0;font-weight:800;">{{school.name}}</h1>\n    <p style="font-size:12px;color:#475569;margin:4px 0 0;">{{school.address}}</p>\n    <p style="font-size:11px;color:#64748b;margin:3px 0 0;">{{school.phone}} | {{school.email}}</p>\n  </div>\n</div>';

const DEFAULT_FOOTER = '<div style="display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:10px;font-size:11px;color:#475569;">\n  <div>\n    <div>Date: {{school.currentDate}}</div>\n    <div>Verification: {{document.verificationCode}}</div>\n  </div>\n  <div style="display:flex;align-items:flex-end;gap:18px;">\n    {{#if school.stampDataUrl}}<img src="{{school.stampDataUrl}}" style="height:46px;width:64px;object-fit:contain;" />{{/if}}\n    <div style="text-align:center;min-width:160px;">\n      {{#if school.signatureDataUrl}}<img src="{{school.signatureDataUrl}}" style="height:38px;max-width:150px;object-fit:contain;" />{{else}}<div style="height:38px;"></div>{{/if}}\n      <div style="border-top:1px solid #334155;padding-top:4px;">{{school.principalName}}</div>\n      <div>Principal</div>\n    </div>\n  </div>\n</div>';

const TEMPLATE_PRESETS = {
  certificate: {
    type: 'bonafide',
    roleTarget: 'student',
    name: 'Professional Bonafide Certificate',
    layout: DEFAULT_LAYOUT,
    content: '<div class="border-frame" style="min-height:340px;padding:34px 42px;text-align:center;">\n  <h2 style="font-size:28px;letter-spacing:2px;color:#1e3a8a;margin:8px 0 26px;text-transform:uppercase;">BONAFIDE CERTIFICATE</h2>\n  <p style="font-size:17px;line-height:1.9;text-align:justify;margin:0 auto;max-width:680px;">\n    This is to certify that <strong>{{student.name}}</strong>, admission number <strong>{{student.admissionNumber}}</strong>, student of <strong>{{student.className}} {{student.section}}</strong>, is a bonafide student of <strong>{{school.name}}</strong> for the academic year <strong>{{school.academicYear}}</strong>.\n  </p>\n  <p style="font-size:16px;line-height:1.8;text-align:justify;margin:22px auto 0;max-width:680px;">\n    This certificate is issued for <strong>{{document.reason}}</strong> on <strong>{{school.currentDate}}</strong>.\n  </p>\n</div>',
  },
  id_card: {
    type: 'id_card',
    roleTarget: 'student',
    name: 'Student Smart ID Card',
    layout: { ...DEFAULT_LAYOUT, width: 540, height: 340, margins: { top: 18, bottom: 18, left: 18, right: 18 } },
    content: '<div class="id-card" style="width:100%;height:100%;border:2px solid #173b70;border-radius:18px;overflow:hidden;background:#fff;font-family:Arial,sans-serif;">\n  <div style="height:78px;background:#173b70;color:white;padding:12px 18px;display:flex;align-items:center;gap:14px;">\n    {{#if school.logoDataUrl}}<img src="{{school.logoDataUrl}}" style="width:52px;height:52px;border-radius:10px;background:white;object-fit:contain;padding:3px;" />{{/if}}\n    <div><div style="font-size:20px;font-weight:800;">{{school.name}}</div><div style="font-size:11px;opacity:.85;">SCHOOL IDENTITY CARD</div></div>\n  </div>\n  <div style="display:flex;gap:20px;padding:20px 22px 12px;">\n    {{#if student.photoDataUrl}}<img src="{{student.photoDataUrl}}" style="width:105px;height:132px;border-radius:9px;border:2px solid #dbeafe;object-fit:cover;" />{{else}}<div style="width:105px;height:132px;border-radius:9px;background:#eaf0f7;display:flex;align-items:center;justify-content:center;color:#64748b;">PHOTO</div>{{/if}}\n    <div style="flex:1;font-size:12px;line-height:1.55;color:#1e293b;">\n      <div style="font-size:21px;font-weight:800;color:#173b70;margin-bottom:5px;">{{student.name}}{{teacher.name}}{{user.name}}</div>\n      <div style="display:inline-block;background:#dbeafe;color:#173b70;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;margin-bottom:7px;">{{student.role}}{{teacher.role}}{{user.role}}</div>\n      <div><b>Class / Section:</b> {{student.className}} {{student.section}}</div>\n      <div><b>Roll No:</b> {{student.rollNumber}}</div><div><b>Admission No:</b> {{student.admissionNumber}}</div>\n      <div><b>Employee ID:</b> {{teacher.employeeId}}</div><div><b>Phone:</b> {{student.mobile}}{{teacher.mobile}}</div>\n      <div><b>CNIC:</b> {{student.cnic}}{{teacher.cnic}}</div><div><b>Form-B:</b> {{student.formBNumber}}</div>\n    </div>\n  </div>\n  <div style="border-top:1px solid #dbe3ee;background:#f5f8fc;padding:9px 16px;font-size:10px;color:#52627a;display:flex;justify-content:space-between;"><span>{{school.address}}</span><span>Verify: {{document.verificationCode}}</span></div>\n</div>',
  },
  result_card: {
    type: 'result_card',
    roleTarget: 'student',
    name: 'Result Card Template',
    layout: DEFAULT_LAYOUT,
    content: '<div class="border-frame" style="padding:26px;">\n  <h2 class="document-title">RESULT CARD</h2>\n  <p><strong>Student:</strong> {{student.name}} | <strong>Class:</strong> {{student.className}} {{student.section}} | <strong>Exam:</strong> {{result.examName}}</p>\n  <table>\n    <thead><tr><th>Subject</th><th>Obtained</th><th>Max</th><th>Grade</th><th>Status</th></tr></thead>\n    <tbody>\n      {{#each result.results}}\n        <tr><td>{{this.subject}}</td><td>{{this.marksObtained}}</td><td>{{this.maxMarks}}</td><td>{{this.grade}}</td><td>{{this.status}}</td></tr>\n      {{/each}}\n    </tbody>\n  </table>\n  <p><strong>Total:</strong> {{result.obtainedMarks}} / {{result.totalMarks}} | <strong>Percentage:</strong> {{result.percentageFormatted}} | <strong>Grade:</strong> {{result.grade}}</p>\n</div>',
  },
  fee_voucher: {
    type: 'fee_voucher',
    roleTarget: 'student',
    name: 'Fee Voucher Template',
    layout: DEFAULT_LAYOUT,
    content: '<div class="border-frame" style="padding:26px;">\n  <h2 class="document-title">FEE VOUCHER</h2>\n  <table>\n    <tr><th>Student</th><td>{{student.name}}</td><th>Class</th><td>{{student.className}} {{student.section}}</td></tr>\n    <tr><th>Admission No</th><td>{{student.admissionNumber}}</td><th>Status</th><td>{{fee.status}}</td></tr>\n    <tr><th>Total Fees</th><td>{{fee.totalFeesFormatted}}</td><th>Paid</th><td>{{fee.paidAmountFormatted}}</td></tr>\n    <tr><th>Due Amount</th><td>{{fee.dueAmountFormatted}}</td><th>Due Date</th><td>{{fee.dueDate}}</td></tr>\n  </table>\n</div>',
  },
};

const buildInitialFormData = (presetKey = 'certificate') => {
  const preset = TEMPLATE_PRESETS[presetKey] || TEMPLATE_PRESETS.certificate;

  return {
    name: preset.name,
    type: preset.type,
    roleTarget: preset.roleTarget,
    layout: {
      ...DEFAULT_LAYOUT,
      ...preset.layout,
      margins: { ...DEFAULT_LAYOUT.margins, ...(preset.layout?.margins || {}) },
    },
    content: preset.content,
    fields: [],
    watermark: { text: '{{school.name}}', opacity: 0.06, fontSize: 54, color: '#1e3a8a' },
    headerTemplate: DEFAULT_HEADER,
    footerTemplate: DEFAULT_FOOTER,
    isActive: true,
    isDefault: false,
  };
};

const resolvePreviewValue = (path, data) => {
  return path.trim().split('.').reduce((current, part) => {
    if (current === null || current === undefined) return '';
    return current[part];
  }, data);
};

const renderPreviewTemplate = (template, data) => {
  if (!template) return '';

  let output = template.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, path, block) => {
    const value = resolvePreviewValue(path, data);
    if (!Array.isArray(value)) return '';
    return value.map(item =>
      block
        .replace(/\{\{this\.([^}]+)\}\}/g, (match, itemPath) => resolvePreviewValue(itemPath, item) ?? '')
        .replace(/\{\{this\}\}/g, String(item ?? ''))
    ).join('');
  });

  output = output.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, path, truthy, falsy = '') => {
    const value = resolvePreviewValue(path, data);
    return value ? truthy : falsy;
  });

  return output.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = resolvePreviewValue(path, data);
    return value === null || value === undefined || value === '' ? `[${path.trim()}]` : String(value);
  });
};

const renderPreviewFields = (fields = []) => {
  if (!Array.isArray(fields) || fields.length === 0) return '';

  return fields.map((field, index) => {
    const textAlign = field.textAlign || 'left';
    const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start';
    const value = field.placeholder
      ? renderPreviewTemplate(field.placeholder, SAMPLE_DATA)
      : field.defaultValue || field.label || field.key || `Field ${index + 1}`;
    const style = `position:absolute;left:${sanitizeNumber(field.x, 0)}px;top:${sanitizeNumber(field.y, 0)}px;width:${sanitizeNumber(field.width, 180)}px;height:${sanitizeNumber(field.height, 28)}px;font-size:${sanitizeNumber(field.fontSize, 12)}px;color:${field.fontColor || '#0f172a'};font-weight:${field.fontWeight || 'normal'};text-align:${textAlign};display:flex;align-items:center;justify-content:${justifyContent};z-index:30;overflow:hidden;border:1px dashed rgba(59,130,246,.45);background:rgba(239,246,255,.62);box-sizing:border-box;padding:2px 4px;`;

    if (['image', 'signature', 'stamp', 'qr'].includes(field.type)) {
      return `<div style="${style}color:#2563eb;font-size:11px;">${field.type.toUpperCase()}</div>`;
    }

    if (field.type === 'barcode') {
      return `<div style="${style}font-family:monospace;letter-spacing:2px;">${value || 'BARCODE'}</div>`;
    }

    return `<div style="${style}">${value}</div>`;
  }).join('');
};

const buildPreviewHtml = (formData) => {
  const layout = { ...DEFAULT_LAYOUT, ...(formData.layout || {}) };
  const watermark = formData.watermark || {};
  const header = renderPreviewTemplate(formData.headerTemplate, SAMPLE_DATA);
  const content = renderPreviewTemplate(formData.content, SAMPLE_DATA);
  const footer = renderPreviewTemplate(formData.footerTemplate, SAMPLE_DATA);
  const watermarkText = renderPreviewTemplate(watermark.text, SAMPLE_DATA);
  const fields = renderPreviewFields(formData.fields);

  return `
    <div style="width:${layout.width}px;min-height:${layout.height}px;background:${layout.backgroundColor};position:relative;font-family:Arial,Helvetica,sans-serif;padding:${layout.margins?.top || 20}px ${layout.margins?.right || 20}px ${layout.margins?.bottom || 20}px ${layout.margins?.left || 20}px;box-sizing:border-box;color:#0f172a;">
      <style>
        .border-frame { border:${layout.borderWidth || 2}px solid ${layout.borderColor || '#1e3a8a'}; border-radius:6px; }
        .school-name { color:${layout.borderColor || '#1e3a8a'}; }
        .document-title { font-size:20px;font-weight:800;text-align:center;margin:15px 0;text-transform:uppercase;color:${layout.borderColor || '#1e3a8a'}; }
        table { width:100%; border-collapse:collapse; margin:12px 0; }
        th, td { border:1px solid #cbd5e1; padding:8px 10px; font-size:12px; text-align:left; }
        th { background:#f8fafc; font-weight:700; }
      </style>
      ${watermark.text ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:${watermark.fontSize || 60}px;color:${watermark.color || '#cccccc'};opacity:${watermark.opacity || 0.1};white-space:nowrap;pointer-events:none;">${watermarkText}</div>` : ''}
      ${header ? `<div style="margin-bottom:20px;">${header}</div>` : ''}
      <div>${content}</div>
      ${fields}
      ${footer ? `<div style="position:absolute;left:${layout.margins?.left || 20}px;right:${layout.margins?.right || 20}px;bottom:${layout.margins?.bottom || 20}px;">${footer}</div>` : ''}
    </div>
  `;
};

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const TemplateBuilder = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activePanel, setActivePanel] = useState('content');
  const [formData, setFormData] = useState(() => buildInitialFormData('certificate'));

  const previewHtml = useMemo(() => buildPreviewHtml(formData), [formData]);
  const matchingTemplates = useMemo(() => (
    templates.filter(template => template.type === formData.type || (formData.type !== 'id_card' && template.type === 'certificate'))
  ), [templates, formData.type]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/documents/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setFormData(buildInitialFormData('certificate'));
    setIsEditing(true);
    setPreviewMode(false);
    setActivePanel('content');
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    const base = buildInitialFormData(template.type === 'id_card' ? 'id_card' : 'certificate');
    setFormData({
      name: template.name || '',
      type: template.type || 'id_card',
      roleTarget: template.roleTarget || 'student',
      layout: {
        ...DEFAULT_LAYOUT,
        ...(template.layout || base.layout),
        margins: { ...DEFAULT_LAYOUT.margins, ...((template.layout || base.layout)?.margins || {}) },
      },
      content: template.content || '',
      fields: template.fields || [],
      watermark: template.watermark || { text: '', opacity: 0.1, fontSize: 60, color: '#cccccc' },
      headerTemplate: template.headerTemplate || '',
      footerTemplate: template.footerTemplate || '',
      isActive: template.isActive !== false,
      isDefault: !!template.isDefault,
    });
    setIsEditing(true);
    setPreviewMode(false);
    setActivePanel('content');
  };

  const applyPreset = (presetKey) => {
    const preset = buildInitialFormData(presetKey);
    setSelectedTemplate(null);
    setFormData(preset);
    setIsEditing(true);
    setPreviewMode(false);
    setActivePanel('content');
  };

  const applyPagePreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        width: preset.width,
        height: preset.height,
        orientation: preset.orientation,
      },
    }));
  };

  const handleDuplicate = (template) => {
    handleEdit(template);
    setSelectedTemplate(null);
    setFormData(prev => ({
      ...prev,
      name: `${template.name || 'Template'} Copy`,
      isDefault: false,
    }));
    toast.success('Template copied. Review and save it as a new template.');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return toast.error('Template name is required');
    }
    if (!formData.content.trim()) {
      return toast.error('Template content is required');
    }
    const customInputFields = formData.fields.filter(field => field.customInput);
    const customKeys = customInputFields.map(field => field.key.trim());
    if (customInputFields.some(field => !/^[A-Za-z][A-Za-z0-9_]*$/.test(field.key.trim()))) {
      return toast.error('Custom field keys must start with a letter and contain only letters, numbers, and underscores.');
    }
    if (new Set(customKeys).size !== customKeys.length) {
      return toast.error('Each custom input field must have a unique key.');
    }
    if (customInputFields.some(field => field.inputType === 'select' && !(field.options || []).length)) {
      return toast.error('Add at least one choice to each custom dropdown field.');
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        layout: {
          ...formData.layout,
          width: sanitizeNumber(formData.layout.width, DEFAULT_LAYOUT.width),
          height: sanitizeNumber(formData.layout.height, DEFAULT_LAYOUT.height),
          borderWidth: sanitizeNumber(formData.layout.borderWidth, DEFAULT_LAYOUT.borderWidth),
          margins: {
            top: sanitizeNumber(formData.layout.margins?.top, DEFAULT_LAYOUT.margins.top),
            bottom: sanitizeNumber(formData.layout.margins?.bottom, DEFAULT_LAYOUT.margins.bottom),
            left: sanitizeNumber(formData.layout.margins?.left, DEFAULT_LAYOUT.margins.left),
            right: sanitizeNumber(formData.layout.margins?.right, DEFAULT_LAYOUT.margins.right),
          },
        },
        fields: formData.fields.map((field, index) => ({
          ...field,
          key: field.key || `field_${index + 1}`,
          label: field.label || `Field ${index + 1}`,
          x: sanitizeNumber(field.x, 0),
          y: sanitizeNumber(field.y, 0),
          width: sanitizeNumber(field.width, 200),
          height: sanitizeNumber(field.height, 30),
          fontSize: sanitizeNumber(field.fontSize, 12),
        })),
      };

      if (selectedTemplate?._id) {
        await api.put(`/documents/templates/${selectedTemplate._id}`, payload);
        toast.success('Template updated successfully');
      } else {
        await api.post('/documents/templates', payload);
        toast.success('Template created successfully');
      }
      await fetchTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this template?')) return;
    try {
      await api.delete(`/documents/templates/${id}`);
      toast.success('Template deactivated');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { key: `field_${prev.fields.length + 1}`, label: `Field ${prev.fields.length + 1}`, type: 'text', required: false, customInput: false, inputType: 'text', options: [], x: 40, y: 40, width: 200, height: 30, fontSize: 12, fontColor: '#000000', fontWeight: 'normal', textAlign: 'left', placeholder: '' },
      ],
    }));
  };

  const addPresetField = (field) => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          key: field.key,
          label: field.label,
          type: field.type || 'text',
          required: false,
          customInput: false,
          inputType: 'text',
          options: [],
          x: field.x ?? 48,
          y: field.y ?? 120,
          width: field.width ?? 220,
          height: field.height ?? 30,
          fontSize: field.fontSize ?? 13,
          fontColor: field.fontColor || '#0f172a',
          fontWeight: field.fontWeight || 'normal',
          textAlign: field.textAlign || 'left',
          placeholder: field.placeholder,
        },
      ],
    }));
  };

  const updateField = (index, fieldData) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...fieldData };
    setFormData(prev => ({ ...prev, fields: newFields }));
  };

  const removeField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const insertPlaceholder = (placeholder) => {
    const target = activePanel === 'header' ? 'headerTemplate' : activePanel === 'footer' ? 'footerTemplate' : activePanel === 'watermark' ? 'watermark' : 'content';
    if (target === 'watermark') {
      setFormData(prev => ({
        ...prev,
        watermark: { ...prev.watermark, text: `${prev.watermark.text || ''}${placeholder}` },
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [target]: `${prev[target] || ''}${placeholder}`,
    }));
  };

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Template Builder</h1>
            <p className="text-gray-500">Design, preview, and manage production-ready document templates</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('certificate')}
              className="px-3 py-2 bg-white text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-sm"
            >
              <FiFileText /> Certificate
            </button>
            <button
              onClick={() => applyPreset('id_card')}
              className="px-3 py-2 bg-white text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition flex items-center gap-2 text-sm"
            >
              <FiMonitor /> ID Card
            </button>
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FiPlus /> New Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Templates</h2>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse h-10 bg-gray-100 rounded mb-2" />
              ))
            ) : templates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No templates yet</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template._id}
                    className={`p-3 rounded-lg transition border ${
                      selectedTemplate?._id === template._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <button onClick={() => handleEdit(template)} className="w-full text-left">
                      <p className="text-sm font-medium text-gray-800 truncate">{template.name}</p>
                    </button>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                        {template.type?.replace('_', ' ')}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                        v{template.version || 1}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        template.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <button
                        onClick={() => handleEdit(template)}
                        className="flex-1 px-2 py-1.5 text-xs text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="px-2 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                        title="Duplicate template"
                      >
                        <FiCopy />
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
                        className="px-2 py-1.5 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                        title="Deactivate template"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            {isEditing ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">Template Details</h2>
                    <span className="text-xs text-gray-400">
                      {matchingTemplates.length} matching template{matchingTemplates.length === 1 ? '' : 's'} in library
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Bonafide Certificate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-2 border rounded-lg"
                      >
                        {DOCUMENT_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                      <select
                        value={formData.roleTarget}
                        onChange={e => setFormData(prev => ({ ...prev, roleTarget: e.target.value }))}
                        className="w-full p-2 border rounded-lg"
                      >
                        {ROLE_TARGETS.map(rt => (
                          <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {Object.entries(TEMPLATE_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
                      >
                        Use {preset.type.replace(/_/g, ' ')} preset
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">Layout Settings</h2>
                    <div className="flex flex-wrap gap-1">
                      {PAGE_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => applyPagePreset(preset)}
                          className="px-2.5 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                      <select
                        value={formData.layout.orientation}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, orientation: e.target.value },
                        }))}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        min="260"
                        value={formData.layout.width}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, width: sanitizeNumber(e.target.value, prev.layout.width) },
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        min="260"
                        value={formData.layout.height}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, height: sanitizeNumber(e.target.value, prev.layout.height) },
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                      <input
                        type="color"
                        value={formData.layout.borderColor}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, borderColor: e.target.value },
                        }))}
                        className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                      <input
                        type="color"
                        value={formData.layout.backgroundColor}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, backgroundColor: e.target.value },
                        }))}
                        className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.layout.borderWidth}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, borderWidth: sanitizeNumber(e.target.value, 0) },
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {['top', 'right', 'bottom', 'left'].map(side => (
                      <div key={side}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{side} Margin</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.layout.margins?.[side] ?? 0}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            layout: {
                              ...prev.layout,
                              margins: {
                                ...prev.layout.margins,
                                [side]: sanitizeNumber(e.target.value, 0),
                              },
                            },
                          }))}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">Content Studio</h2>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'content', label: 'Body', icon: FiCode },
                        { id: 'header', label: 'Header', icon: FiLayers },
                        { id: 'footer', label: 'Footer', icon: FiLayers },
                        { id: 'watermark', label: 'Watermark', icon: FiSliders },
                      ].map(panel => (
                        <button
                          key={panel.id}
                          onClick={() => setActivePanel(panel.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition flex items-center gap-1 ${
                            activePanel === panel.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <panel.icon /> {panel.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition flex items-center gap-1 ${
                          previewMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <FiEye /> {previewMode ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                  </div>

                  {/* Placeholder Quick Insert */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Click to insert placeholder:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries({
                        ...DEFAULT_PLACEHOLDERS,
                        custom: formData.fields.filter(field => field.customInput && field.key).map(field => `{{document.customFields.${field.key}}}`),
                      }).map(([category, placeholders]) => (
                        <div key={category} className="relative group">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                            {category}
                          </span>
                          <div className="absolute z-10 hidden group-hover:block bg-white border rounded-lg shadow-lg p-2 min-w-[200px] top-full left-0">
                            {placeholders.map(ph => (
                              <button
                                key={ph}
                                onClick={() => insertPlaceholder(ph)}
                                className="block text-xs px-2 py-1 hover:bg-blue-50 w-full text-left rounded"
                              >
                                {ph}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewMode ? (
                    <div className="overflow-auto rounded-xl border bg-slate-100 p-4">
                      <div
                        className="mx-auto origin-top rounded-lg bg-white shadow-xl"
                        style={{
                          width: formData.layout.width,
                          transform: `scale(${Math.min(1, 760 / (formData.layout.width || 760))})`,
                          transformOrigin: 'top center',
                          marginBottom: `${Math.max(0, (formData.layout.height || 600) * (Math.min(1, 760 / (formData.layout.width || 760)) - 1))}px`,
                        }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {activePanel === 'watermark' ? (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Watermark Text</label>
                          <input
                            type="text"
                            value={formData.watermark.text}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              watermark: { ...prev.watermark, text: e.target.value },
                            }))}
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                          />
                          <p className="text-xs text-gray-400">Placeholders can be inserted here too.</p>
                        </div>
                      ) : (
                        <textarea
                          value={activePanel === 'header' ? formData.headerTemplate : activePanel === 'footer' ? formData.footerTemplate : formData.content}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            [activePanel === 'header' ? 'headerTemplate' : activePanel === 'footer' ? 'footerTemplate' : 'content']: e.target.value,
                          }))}
                          className="w-full h-[460px] p-3 border rounded-lg font-mono text-sm"
                          placeholder="Enter HTML content with {{placeholders}}..."
                        />
                      )}
                      <div className="overflow-auto rounded-xl border bg-slate-100 p-4 min-h-[460px]">
                        <div
                          className="mx-auto origin-top rounded-lg bg-white shadow-xl"
                          style={{
                            width: formData.layout.width,
                            transform: `scale(${Math.min(1, 520 / (formData.layout.width || 520))})`,
                            transformOrigin: 'top center',
                            marginBottom: `${Math.max(0, (formData.layout.height || 600) * (Math.min(1, 520 / (formData.layout.width || 520)) - 1))}px`,
                          }}
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Watermark */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-gray-700 mb-4">Watermark</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                      <input
                        type="text"
                        value={formData.watermark.text}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          watermark: { ...prev.watermark, text: e.target.value },
                        }))}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., SAMPLE"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.watermark.opacity}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          watermark: { ...prev.watermark, opacity: sanitizeNumber(e.target.value, 0.1) },
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={formData.watermark.fontSize}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          watermark: { ...prev.watermark, fontSize: sanitizeNumber(e.target.value, 60) },
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={formData.watermark.color}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          watermark: { ...prev.watermark, color: e.target.value },
                        }))}
                        className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">Custom Fields</h2>
                    <button
                      onClick={addField}
                      className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <FiPlus /> Add Field
                    </button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      { label: 'Student Name', key: 'studentName', placeholder: '{{student.name}}', x: 80, y: 180, width: 300, fontSize: 18, fontWeight: 'bold' },
                      { label: 'Class', key: 'className', placeholder: '{{student.className}} {{student.section}}', x: 80, y: 218, width: 220 },
                      { label: 'Admission No', key: 'admissionNumber', placeholder: '{{student.admissionNumber}}', x: 80, y: 252, width: 220 },
                      { label: 'Guardian', key: 'guardianName', placeholder: '{{student.parentName}}', x: 80, y: 286, width: 260 },
                      { label: 'Mobile', key: 'studentMobile', placeholder: '{{student.mobile}}', x: 80, y: 320, width: 220 },
                      { label: 'Email', key: 'studentEmail', placeholder: '{{student.email}}', x: 80, y: 354, width: 260 },
                      { label: 'Address', key: 'studentAddress', placeholder: '{{student.address}}', x: 80, y: 388, width: 320 },
                      { label: 'CNIC', key: 'studentCnic', placeholder: '{{student.cnic}}', x: 420, y: 252, width: 220 },
                      { label: 'Passport', key: 'studentPassport', placeholder: '{{student.passport}}', x: 420, y: 286, width: 220 },
                      { label: 'Logo', key: 'schoolLogo', type: 'image', placeholder: '{{school.logoDataUrl}}', x: 40, y: 32, width: 70, height: 70 },
                      { label: 'Photo', key: 'studentPhoto', type: 'image', placeholder: '{{student.photoDataUrl}}', x: 650, y: 155, width: 96, height: 116 },
                      { label: 'QR Code', key: 'qrCode', type: 'qr', placeholder: '{{document.qrCodeDataUrl}}', x: 680, y: 430, width: 84, height: 84 },
                      { label: 'Signature', key: 'signature', type: 'signature', placeholder: '{{school.signatureDataUrl}}', x: 570, y: 470, width: 150, height: 44 },
                      { label: 'Stamp', key: 'schoolStamp', type: 'stamp', placeholder: '{{school.stampDataUrl}}', x: 720, y: 462, width: 76, height: 58 },
                    ].map(field => (
                      <button
                        key={field.key}
                        onClick={() => addPresetField(field)}
                        className="px-2.5 py-1.5 rounded-md border border-blue-100 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        + {field.label}
                      </button>
                    ))}
                  </div>

                  {formData.fields.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No custom fields added</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.fields.map((field, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <input
                              type="text"
                              placeholder="Key"
                              value={field.key}
                              onChange={e => updateField(index, { key: e.target.value })}
                              className="p-2 border rounded text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Label"
                              value={field.label}
                              onChange={e => updateField(index, { label: e.target.value })}
                              className="p-2 border rounded text-sm"
                            />
                            <select
                              value={field.type}
                              onChange={e => updateField(index, { type: e.target.value })}
                              className="p-2 border rounded text-sm"
                            >
                              {FIELD_TYPES.map(ft => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={e => updateField(index, { required: e.target.checked })}
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1 text-sm text-blue-700">
                                <input
                                  type="checkbox"
                                  checked={!!field.customInput}
                                  onChange={e => updateField(index, { customInput: e.target.checked })}
                                />
                                Ask during generation
                              </label>
                              <button
                                onClick={() => removeField(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                          {field.customInput && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <label className="text-xs text-gray-600">
                                Entry type
                                <select
                                  value={field.inputType || 'text'}
                                  onChange={e => updateField(index, { inputType: e.target.value })}
                                  className="w-full mt-1 p-2 border rounded text-sm"
                                >
                                  {INPUT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                </select>
                              </label>
                              {field.inputType === 'select' && (
                                <label className="text-xs text-gray-600">
                                  Dropdown choices (one per line)
                                  <textarea
                                    value={(field.options || []).join('\n')}
                                    onChange={e => updateField(index, { options: e.target.value.split('\n').map(value => value.trim()).filter(Boolean) })}
                                    className="w-full mt-1 p-2 border rounded text-sm"
                                    rows={2}
                                  />
                                </label>
                              )}
                              <p className="md:col-span-2 text-xs text-gray-500">
                                The value is available in the document body as {'{{document.customFields.'}{field.key || 'field_key'}{'}}'}.
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3">
                            {[
                              ['x', 'X'],
                              ['y', 'Y'],
                              ['width', 'Width'],
                              ['height', 'Height'],
                              ['fontSize', 'Font'],
                            ].map(([key, label]) => (
                              <div key={key}>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
                                <input
                                  type="number"
                                  value={field[key] ?? ''}
                                  onChange={e => updateField(index, { [key]: sanitizeNumber(e.target.value, 0) })}
                                  className="w-full p-2 border rounded text-sm"
                                />
                              </div>
                            ))}
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={field.fontColor || '#000000'}
                                onChange={e => updateField(index, { fontColor: e.target.value })}
                                className="w-full h-9 p-1 border rounded"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <input
                              type="text"
                              placeholder="Placeholder, e.g. {{student.name}}"
                              value={field.placeholder || ''}
                              onChange={e => updateField(index, { placeholder: e.target.value })}
                              className="p-2 border rounded text-sm font-mono"
                            />
                            <select
                              value={field.fontWeight || 'normal'}
                              onChange={e => updateField(index, { fontWeight: e.target.value })}
                              className="p-2 border rounded text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="600">Semi Bold</option>
                              <option value="800">Extra Bold</option>
                            </select>
                            <select
                              value={field.textAlign || 'left'}
                              onChange={e => updateField(index, { textAlign: e.target.value })}
                              className="p-2 border rounded text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={e => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Default for this type</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setIsEditing(false); setSelectedTemplate(null); }}
                      className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <FiSave /> Save Template
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <FiGrid className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select or Create a Template</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Choose a template from the list to edit, or create a new one
                </p>
                <button
                  onClick={handleNew}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <FiPlus /> Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateBuilder;

