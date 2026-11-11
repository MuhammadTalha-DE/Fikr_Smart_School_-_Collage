/**
 * PDF Generator Service
 * 
 * Generates PDF documents using Puppeteer (HTML-to-PDF) with Handlebars.
 * Falls back to PDFKit-based generation if Puppeteer is not available.
 *
 * The system generates beautiful, professional documents from HTML templates
 * with full CSS support for responsive layouts.
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { generateDocumentHtml, renderTemplate, resolveNestedPath } = require('./templateRenderService');
const { fetchImageBuffer } = require('./documentDataResolver');

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

const LETTER_TYPES = new Set([
  'official_letter',
  'circular',
  'notice',
  'discipline_notice',
  'parent_meeting',
  'appointment',
  'joining_letter',
  'relieving',
  'enrollment_confirmation',
]);

function cleanText(value = '') {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function valueOrDash(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

// ──────────────────────────────────────────────
function cleanDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function dataUrlToBuffer(value) {
  if (!value || typeof value !== 'string' || !value.startsWith('data:')) return null;
  const base64 = value.split(',')[1];
  if (!base64) return null;
  return Buffer.from(base64, 'base64');
}

function resolveFieldValue(field, data) {
  if (field.placeholder) return renderTemplate(field.placeholder, data);
  if (field.key) {
    const direct = resolveNestedPath(data, field.key);
    if (direct !== null && direct !== undefined && direct !== '') return direct;
    const documentScoped = resolveNestedPath(data, `document.${field.key}`);
    if (documentScoped !== null && documentScoped !== undefined && documentScoped !== '') return documentScoped;
  }
  return field.defaultValue || '';
}

function drawLabelValue(doc, label, value, x, y, labelWidth, valueWidth, fontSize = 8) {
  doc.fontSize(fontSize)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text(label, x, y, { width: labelWidth });
  doc.font('Helvetica')
    .fillColor('#0f172a')
    .text(cleanDisplayValue(value), x + labelWidth + 8, y, { width: valueWidth, ellipsis: true });
}

async function drawTemplateFieldsPDFKit(doc, fields = [], data = {}) {
  if (!Array.isArray(fields) || fields.length === 0) return;

  for (const field of fields) {
    const x = Number.isFinite(Number(field.x)) ? Number(field.x) : 0;
    const y = Number.isFinite(Number(field.y)) ? Number(field.y) : 0;
    const width = Number.isFinite(Number(field.width)) ? Number(field.width) : 180;
    const height = Number.isFinite(Number(field.height)) ? Number(field.height) : 28;
    const fontSize = Number.isFinite(Number(field.fontSize)) ? Number(field.fontSize) : 12;
    const color = field.fontColor || '#0f172a';
    const align = field.textAlign || 'left';
    const rawValue = resolveFieldValue(field, data);

    if (['image', 'signature', 'stamp'].includes(field.type)) {
      const fallbackPath = field.type === 'image'
        ? 'student.photoDataUrl'
        : field.type === 'signature'
          ? 'school.signatureDataUrl'
          : 'school.stampDataUrl';
      const imageBuffer = dataUrlToBuffer(rawValue || resolveNestedPath(data, fallbackPath));
      if (imageBuffer) {
        try {
          doc.image(imageBuffer, x, y, { width, height, fit: [width, height], align: 'center', valign: 'center' });
        } catch (e) { /* ignore invalid image */ }
      }
      continue;
    }

    if (field.type === 'qr') {
      let qrBuffer = dataUrlToBuffer(rawValue || resolveNestedPath(data, 'document.qrCodeDataUrl'));
      if (!qrBuffer) {
        const qrText = resolveNestedPath(data, 'document.verificationUrl') || resolveNestedPath(data, 'document.verificationCode');
        if (qrText) {
          try {
            qrBuffer = dataUrlToBuffer(await QRCode.toDataURL(qrText, { width, margin: 1 }));
          } catch (e) { /* ignore */ }
        }
      }
      if (qrBuffer) {
        try {
          doc.image(qrBuffer, x, y, { width, height, fit: [width, height] });
        } catch (e) { /* ignore invalid qr */ }
      }
      continue;
    }

    if (field.type === 'barcode') {
      const text = cleanText(rawValue || resolveNestedPath(data, 'document.verificationCode') || '');
      doc.fontSize(Math.max(8, fontSize))
        .font('Courier')
        .fillColor(color)
        .text(`|||| ${text} ||||`, x, y + Math.max(0, height / 2 - fontSize / 2), { width, align, ellipsis: true });
      continue;
    }

    const text = field.type === 'date'
      ? (rawValue || new Date().toLocaleDateString('en-IN'))
      : cleanText(rawValue);

    doc.fontSize(fontSize)
      .font(String(field.fontWeight || '').includes('bold') || Number(field.fontWeight) >= 600 ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(color)
      .text(text, x, y, {
        width,
        height,
        align,
        lineGap: 2,
        ellipsis: true,
      });
  }
}

async function drawProfessionalIdCard(doc, data, template, context) {
  const { pageWidth, pageHeight, margin, borderColor, borderWidth, verificationCode } = context;
  const school = data.school || {};
  const student = data.student || {};
  const teacher = data.teacher || {};
  const person = student.name ? student : teacher;
  const innerX = margin;
  const innerY = margin;
  const innerW = pageWidth - margin * 2;
  const innerH = pageHeight - margin * 2;
  const bandH = Math.min(68, Math.max(58, innerH * 0.21));

  doc.roundedRect(innerX, innerY, innerW, innerH, 10)
    .lineWidth(borderWidth || 2)
    .stroke(borderColor);
  doc.rect(innerX, innerY, innerW, bandH).fill(borderColor);

  const logoBuffer = school.logoBuffer || dataUrlToBuffer(school.logoDataUrl);
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, innerX + 12, innerY + 9, { fit: [bandH - 18, bandH - 18] });
    } catch (e) { /* ignore */ }
  }

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text(school.name || 'Fikr Smart School', innerX + bandH + 4, innerY + 8, {
      width: innerW - bandH - 22,
      ellipsis: true,
    });
  doc.fontSize(7)
    .font('Helvetica')
    .fillColor('#dbeafe')
    .text(school.address || 'Official School Identity Card', innerX + bandH + 4, innerY + 29, {
      width: innerW - bandH - 22,
      ellipsis: true,
    });
  doc.fontSize(7).font('Helvetica').fillColor('#dbeafe')
    .text([school.phone, school.email].filter(Boolean).join('  |  '), innerX + bandH + 4, innerY + 43, {
      width: innerW - bandH - 22,
      ellipsis: true,
    });

  const contentY = innerY + bandH + 10;
  const photoW = Math.min(82, innerW * 0.19);
  const photoH = Math.min(104, innerH - bandH - 74);
  const photoX = innerX + 16;
  const photoY = contentY;
  const photoBuffer = person.photoBuffer || dataUrlToBuffer(person.photoDataUrl);

  doc.roundedRect(photoX, photoY, photoW, photoH, 8).lineWidth(1).stroke('#cbd5e1');
  if (photoBuffer) {
    try {
      doc.image(photoBuffer, photoX + 2, photoY + 2, { width: photoW - 4, height: photoH - 4, fit: [photoW - 4, photoH - 4] });
    } catch (e) { /* ignore */ }
  } else {
    doc.fontSize(8).fillColor('#94a3b8').text('Photo', photoX, photoY + photoH / 2 - 5, { width: photoW, align: 'center' });
  }

  const detailX = photoX + photoW + 18;
  const detailW = innerW - photoW - 50;
  doc.fontSize(15)
    .font('Helvetica-Bold')
    .fillColor(borderColor)
    .text(person.name || 'N/A', detailX, contentY, { width: detailW, ellipsis: true });

  doc.roundedRect(detailX, contentY + 22, 58, 16, 4).fill('#d97706');
  doc.fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text(student.name ? 'Student' : (teacher.role || 'Staff'), detailX, contentY + 26, { width: 58, align: 'center' });

  let rowY = contentY + 43;
  const detailRows = student.name ? [
    ['Class', student.classSection || `${student.className || ''} ${student.section || ''}`],
    ['Roll No.', student.rollNumber],
    ['Admission', student.admissionNumber],
    ['Date of Birth', student.dobFormatted || student.dateOfBirth],
    ['Parent / Phone', [student.parentName, student.parentPhone].filter(Boolean).join(' / ')],
    ['Student Phone', student.mobile || student.phone],
    ['Blood Group', student.bloodGroup],
    ['CNIC / Form-B', [student.cnic, student.formBNumber].filter(Boolean).join(' / ')],
  ] : [
    ['Employee ID', teacher.employeeId],
    ['Phone', teacher.mobile || teacher.phone],
    ['Email', teacher.email],
    ['Subjects', teacher.subjectsList],
    ['CNIC', teacher.cnic],
  ];

  for (const [label, value] of detailRows) {
    if (rowY > innerY + innerH - 57) break;
    drawLabelValue(doc, label, value, detailX, rowY, 72, detailW - 80, 7.5);
    rowY += 15;
  }

  const footerY = innerY + innerH - 43;
  doc.moveTo(innerX + 12, footerY - 5).lineTo(innerX + innerW - 12, footerY - 5).lineWidth(0.6).stroke('#cbd5e1');
  if (verificationCode) {
    try {
      const qrImage = await QRCode.toDataURL(`${process.env.CLIENT_URL || ''}/verify/${verificationCode}`, { width: 62, margin: 1 });
      const qrBuffer = dataUrlToBuffer(qrImage);
      if (qrBuffer) doc.image(qrBuffer, innerX + 12, footerY, { width: 34, height: 34 });
    } catch (e) { /* ignore */ }
  }

  const today = new Date();
  const expiryYear = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
  const validUntil = school.validUntil || new Date(expiryYear, 2, 31).toLocaleDateString('en-GB');
  doc.fontSize(6.5)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Issued: ${today.toLocaleDateString('en-GB')}`, innerX + 54, footerY + 2, { width: 110 });
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#334155')
    .text(`Valid until: ${validUntil}`, innerX + 54, footerY + 16, { width: 115 });
  const authX = innerX + innerW - 142;
  if (school.signatureBuffer) {
    try { doc.image(school.signatureBuffer, authX + 24, footerY - 2, { fit: [78, 27] }); } catch (e) { /* ignore */ }
  }
  if (school.stampBuffer) {
    try { doc.image(school.stampBuffer, authX - 4, footerY + 1, { fit: [30, 30] }); } catch (e) { /* ignore */ }
  }
  doc.font('Helvetica-Bold').fontSize(6).fillColor('#475569')
    .text(school.principalName || 'School Administration', authX + 23, footerY + 20, { width: 86, align: 'center', ellipsis: true });
  doc.font('Helvetica').fontSize(5.5).fillColor('#64748b')
    .text('Authorized by Administration', authX + 16, footerY + 29, { width: 100, align: 'center' });
}

// PDF GENERATION METHODS
// ──────────────────────────────────────────────

/**
 * Generate PDF using PDFKit (built-in, always available)
 * Produces professional, visually rich documents
 */
async function generatePDFWithPDFKit(template, data, options = {}) {
  const { layout } = template;
  const orientation = layout?.orientation || 'landscape';
  const pageWidth = layout?.width || (orientation === 'landscape' ? 842 : 595);
  const pageHeight = layout?.height || (orientation === 'landscape' ? 595 : 842);
  
  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    layout: orientation,
    margin: 0,
    info: {
      Title: template.name || 'Document',
      Author: 'Fikr Smart School',
      Subject: `${template.type} Document`,
    },
  });

  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  const margin = layout?.margins?.left || 20;
  const contentWidth = pageWidth - 2 * margin;
  const borderColor = layout?.borderColor || '#1e3a8a';
  const borderWidth = layout?.borderWidth || 2;

  // ── Background ──
  doc.rect(0, 0, pageWidth, pageHeight).fill(layout?.backgroundColor || '#ffffff');

  if (template.type === 'id_card') {
    await drawProfessionalIdCard(doc, data, template, {
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      borderColor,
      borderWidth,
      verificationCode: options.verificationCode,
    });
    await drawTemplateFieldsPDFKit(doc, template.fields, data);
    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  // ── Border Frame ──
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - 2 * margin + 10)
    .lineWidth(borderWidth)
    .stroke(borderColor);

  // ── Header Section ──
  const school = data.school || {};
  const student = data.student || {};
  const teacher = data.teacher || {};

  // School Logo
  if (school.logoBuffer) {
    try {
      doc.image(school.logoBuffer, margin + 10, margin + 10, { width: 60, height: 60 });
    } catch (e) { /* ignore */ }
  }

  // School Name
  doc.fontSize(22)
    .font('Helvetica-Bold')
    .fillColor(borderColor)
    .text(school.name || 'Fikr Smart School', margin + 80, margin + 15, {
      width: contentWidth - 90,
      align: 'center',
    });

  // School Address
  doc.fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(school.address || '', margin + 80, margin + 42, {
      width: contentWidth - 90,
      align: 'center',
    });

  // ── Document Title Ribbon ──
  const titleY = margin + 75;
  doc.rect(margin, titleY, contentWidth, 35).fill(borderColor);
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text(template.name || 'Document', margin, titleY + 8, {
      width: contentWidth,
      align: 'center',
    });

  // ── Content Area ──
  let yPos = titleY + 50;
  const lineHeight = 18;
  const col1X = margin + 15;
  const col2X = margin + contentWidth / 2 + 10;

  // Draw content based on template type
  if (template.type === 'id_card') {
    yPos = await drawIdCardContent(doc, data, margin, contentWidth, yPos, pageHeight);
  } else if (['result_card', 'marks_sheet', 'transcript'].includes(template.type)) {
    yPos = await drawResultCardContent(doc, data, margin, contentWidth, yPos);
  } else if (['fee_voucher', 'receipt', 'fee_clearance', 'outstanding_notice'].includes(template.type)) {
    yPos = await drawFeeDocumentContent(doc, data, margin, contentWidth, yPos);
  } else if (['admit_card', 'roll_number_slip'].includes(template.type)) {
    yPos = await drawAdmitCardContent(doc, data, margin, contentWidth, yPos);
  } else {
    // Generic certificate/letter content
    yPos = await drawGenericContent(doc, data, template, margin, contentWidth, yPos);
  }

  await drawTemplateFieldsPDFKit(doc, template.fields, data);

  // ── Footer ──
  const footerY = pageHeight - margin - 40;

  // Date
  doc.fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, margin + 10, footerY);

  // QR Code
  if (options.verificationCode) {
    try {
      const qrData = `${process.env.CLIENT_URL || ''}/verify/${options.verificationCode}`;
      const qrImage = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
      const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
      doc.image(qrBuffer, margin + contentWidth - 90, footerY - 20, { width: 70, height: 70 });
    } catch (e) { /* ignore */ }
  }

  // Principal Signature
  if (school.signatureBuffer) {
    try {
      doc.image(school.signatureBuffer, pageWidth - margin - 150, footerY - 15, { width: 100, height: 40 });
    } catch (e) { /* ignore */ }
  }
  doc.fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(school.principalName || 'Principal', pageWidth - margin - 150, footerY + 30, {
      width: 120,
      align: 'center',
    });

  // School Stamp
  if (school.stampBuffer) {
    try {
      doc.image(school.stampBuffer, margin + 10, footerY - 25, { width: 60, height: 60 });
    } catch (e) { /* ignore */ }
  }

  // Bottom line
  doc.rect(margin, pageHeight - margin + 5, contentWidth, 2).fill(borderColor);

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

/**
 * Draw ID Card content
 */
async function drawIdCardContent(doc, data, margin, contentWidth, yPos, pageHeight) {
  const student = data.student || {};
  const teacher = data.teacher || {};
  const person = student.name ? student : teacher;

  // Photo
  if (person.photoBuffer) {
    try {
      doc.image(person.photoBuffer, margin + contentWidth - 90, yPos, { width: 70, height: 85 });
    } catch (e) { /* ignore */ }
  }

  // Name
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#1e3a8a')
    .text(person.name || 'N/A', margin + 15, yPos, { width: contentWidth - 120 });

  // Role Badge
  const role = student.name ? 'Student' : 'Teacher';
  doc.rect(margin + 15, yPos + 20, 50, 16).fill('#d97706');
  doc.fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text(role, margin + 18, yPos + 22, { width: 45, align: 'center' });

  yPos += 42;

  // Details
  const fields = student.name ? [
    ['Class', person.className],
    ['Section', person.section],
    ['Roll No.', person.rollNumber],
    ['Admission No.', person.admissionNumber],
    ['DOB', person.dobFormatted],
    ['Blood Group', person.bloodGroup],
    ['Parent', person.parentName],
    ['Parent Phone', person.parentPhone],
  ] : [
    ['Employee ID', person.employeeId],
    ['Email', person.email],
    ['Subjects', person.subjectsList],
  ];

  for (const [label, value] of fields) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text(label, margin + 15, yPos, { width: 65 });
    doc.fontSize(9).font('Helvetica').fillColor('#0f172a').text(value || '—', margin + 82, yPos, { width: contentWidth - 100 });
    yPos += 16;
  }

  // Verification text at bottom
  doc.fontSize(6)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('This is a computer-generated document. Verify at school website.', margin + 15, pageHeight - margin - 50, {
      width: contentWidth - 30,
      align: 'center',
    });

  return yPos;
}

/**
 * Draw Result Card / Marks Sheet content
 */
async function drawResultCardContent(doc, data, margin, contentWidth, yPos) {
  const student = data.student || {};
  const result = data.result || {};
  const exam = data.exam || {};

  // Student Info
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a')
    .text(`Student Name: `, margin + 15, yPos, { continued: true })
    .font('Helvetica').text(student.name || 'N/A');
  yPos += 16;

  doc.font('Helvetica-Bold').text(`Class: `, { continued: true })
    .font('Helvetica').text(`${student.className || ''} ${student.section || ''}`);
  yPos += 16;

  doc.font('Helvetica-Bold').text(`Exam: `, { continued: true })
    .font('Helvetica').text(exam.name || result.examName || '');
  yPos += 16;

  doc.font('Helvetica-Bold').text(`Roll No: `, { continued: true })
    .font('Helvetica').text(student.rollNumber || '');
  yPos += 25;

  // Results Table
  if (result.hasResults && result.results.length > 0) {
    const tableTop = yPos;
    const colWidths = [contentWidth - 330, 70, 70, 70, 70];
    const headers = ['Subject', 'Obtained', 'Max Marks', 'Grade', 'Status'];
    let xPos = margin + 15;

    // Table Header
    doc.rect(xPos, tableTop, contentWidth - 30, 22).fill('#1e3a8a');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    headers.forEach((h, i) => {
      doc.text(h, xPos + 4, tableTop + 5, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });

    // Table Rows
    yPos = tableTop + 25;
    for (const row of result.results) {
      xPos = margin + 15;
      const rowData = [row.subject, String(row.marksObtained || 0), String(row.maxMarks || 0), row.grade || '-', row.status || '-'];
      
      // Alternate row colors
      if ((result.results.indexOf(row) % 2) === 0) {
        doc.rect(xPos, yPos - 2, contentWidth - 30, 18).fill('#f8fafc');
      }

      doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
      rowData.forEach((val, i) => {
        doc.text(val, xPos + 4, yPos, { width: colWidths[i], align: 'center' });
        xPos += colWidths[i];
      });
      yPos += 20;
    }

    yPos += 15;

    // Summary
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a')
      .text(`Total Marks: ${result.totalMarks || 0}`, margin + 15, yPos);
    yPos += 16;
    doc.text(`Marks Obtained: ${result.obtainedMarks || 0}`, margin + 15, yPos);
    yPos += 16;
    doc.text(`Percentage: ${result.percentageFormatted || '0%'}`, margin + 15, yPos);
    yPos += 16;
    doc.text(`Grade: ${result.grade || '-'}`, margin + 15, yPos);
  } else {
    doc.fontSize(11).font('Helvetica').fillColor('#64748b')
      .text('No results available.', margin + 15, yPos);
  }

  return yPos + 30;
}

/**
 * Draw Fee Document content
 */
async function drawFeeDocumentContent(doc, data, margin, contentWidth, yPos) {
  const student = data.student || {};
  const fee = data.fee || {};

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a')
    .text(`Student: `, margin + 15, yPos, { continued: true })
    .font('Helvetica').text(student.name || 'N/A');
  yPos += 16;

  doc.font('Helvetica-Bold').text(`Class: `, { continued: true })
    .font('Helvetica').text(student.className || '');
  yPos += 16;

  doc.font('Helvetica-Bold').text(`Admission No: `, { continued: true })
    .font('Helvetica').text(student.admissionNumber || '');
  yPos += 25;

  // Fee Details
  const feeFields = [
    ['Total Fees', fee.totalFeesFormatted || '₹0'],
    ['Paid Amount', fee.paidAmountFormatted || '₹0'],
    ['Due Amount', fee.dueAmountFormatted || '₹0'],
    ['Status', fee.status || 'N/A'],
    ['Due Date', fee.dueDate || 'N/A'],
  ];

  for (const [label, value] of feeFields) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
      .text(label + ': ', margin + 15, yPos, { width: contentWidth / 3, continued: true })
      .font('Helvetica').fillColor('#0f172a').text(value);
    yPos += 20;
  }

  return yPos + 20;
}

/**
 * Draw Admit Card / Roll Number Slip content
 */
async function drawAdmitCardContent(doc, data, margin, contentWidth, yPos) {
  const student = data.student || {};
  const exam = data.exam || {};

  // Student Photo
  if (student.photoBuffer) {
    try {
      doc.image(student.photoBuffer, margin + contentWidth - 80, yPos, { width: 65, height: 75 });
    } catch (e) { /* ignore */ }
  }

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text(student.name || 'N/A', margin + 15, yPos, { width: contentWidth - 100 });
  yPos += 22;

  const fields = [
    ['Roll Number', student.rollNumber],
    ['Class', student.className],
    ['Section', student.section],
    ['Admission No', student.admissionNumber],
    ['Exam Name', exam.name || ''],
    ['Exam Date', exam.startDate || ''],
    ['Subjects', exam.subjectNames || ''],
  ];

  for (const [label, value] of fields) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
      .text(label + ': ', margin + 15, yPos, { width: 100, continued: true })
      .font('Helvetica').fillColor('#0f172a').text(value || '—');
    yPos += 18;
  }

  // Instructions
  yPos += 15;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#dc2626')
    .text('Important Instructions:', margin + 15, yPos);
  yPos += 16;
  doc.fontSize(8).font('Helvetica').fillColor('#475569');
  const instructions = [
    '1. Bring this admit card to the examination hall.',
    '2. Report 15 minutes before the exam starts.',
    '3. Carry your own stationery items.',
    '4. Electronic devices are strictly prohibited.',
  ];
  for (const inst of instructions) {
    doc.text(inst, margin + 25, yPos);
    yPos += 14;
  }

  return yPos + 10;
}

/**
 * Draw generic certificate/letter content
 */
async function drawGenericContent(doc, data, template, margin, contentWidth, yPos) {
  const student = data.student || {};
  const school = data.school || {};

  // Student Photo (if available)
  if (student.photoBuffer && template.type !== 'official_letter') {
    try {
      doc.image(student.photoBuffer, margin + 15, yPos, { width: 70, height: 85 });
    } catch (e) { /* ignore */ }
    yPos += 5;
  }

  // Student Details
  if (student.name) {
    const detailFields = [
      ['Name', student.name],
      ['Class', student.className],
      ['Section', student.section],
      ['Roll No', student.rollNumber],
      ['Admission No', student.admissionNumber],
      ['DOB', student.dobFormatted],
      ['Parent', student.parentName],
    ];

    const detailX = student.photoBuffer ? margin + 100 : margin + 15;
    for (const [label, value] of detailFields) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
        .text(`${label}: `, detailX, yPos, { width: 80, continued: true })
        .font('Helvetica').fillColor('#0f172a').text(value || '—');
      yPos += 16;
    }
    yPos += 10;
  }

  // Body Text
  const bodyText = generateBodyText(data, template);
  doc.fontSize(11).font('Helvetica').fillColor('#0f172a')
    .text(bodyText, margin + 15, yPos, {
      width: contentWidth - 30,
      align: 'center',
      lineGap: 6,
    });

  return doc.y + 20;
}

/**
 * Generate body text for certificates
 */
function generateBodyText(data, template) {
  const student = data.student || {};
  const teacher = data.teacher || {};
  const school = data.school || {};
  const name = student.name || teacher.name || '';
  const className = student.className || '';
  const renderedContent = cleanText(renderTemplate(template.content || '', data));

  if (renderedContent && (LETTER_TYPES.has(template.type) || CERTIFICATE_TYPES.has(template.type) || template.content)) {
    return renderedContent;
  }

  const bodyTemplates = {
    bonafide: `This is to certify that ${name}, student of class ${className}, is a bonafide student of ${school.name || 'this school'}. This certificate is issued for educational purposes.`,
    character: `This is to certify that ${name}, student of class ${className}, bears a good moral character and has been of good conduct during his/her stay in the school.`,
    leaving: `This is to certify that ${name}, student of class ${className}, was a student of this school and is leaving the institution. We wish them the best in future endeavors.`,
    transfer: `This Transfer Certificate certifies that ${name}, student of class ${className}, is transferred to another institution. All dues have been cleared.`,
    migration: `This is to certify that ${name} has completed the course of studies from ${school.name || 'this school'}. The student is hereby granted migration to pursue further studies.`,
    experience: `This is to certify that ${teacher.name || name} has worked with ${school.name || 'this school'} as a dedicated professional. We appreciate their contributions.`,
    no_objection: `This is to certify that there is no objection from ${school.name || 'this school'} for ${name} to pursue further opportunities.`,
    scholarship: `This is to certify that ${name}, student of class ${className}, has been awarded a scholarship for academic excellence.`,
    sports: `This is to certify that ${name}, student of class ${className}, has actively participated in sports and represented the school.`,
    achievement: `This Certificate of Achievement is presented to ${name} for outstanding performance and dedication.`,
    internship: `This is to certify that ${name} has successfully completed an internship program at ${school.name || 'this school'}.`,
  };

  return bodyTemplates[template.type] || template.content || `Certificate issued to ${name}`;
}

// ──────────────────────────────────────────────
// MAIN PDF GENERATOR
// ──────────────────────────────────────────────

/**
 * Generate a PDF document using the best available method
 */
async function generatePDF(template, data, options = {}) {
  const { verificationCode, documentId, qrCodeDataUrl } = options;

  // Enhance data with document info
  const enhancedData = {
    ...data,
    document: {
      ...(data.document || {}),
      type: template.type,
      name: template.name,
      verificationCode: verificationCode || '',
      documentId: documentId || '',
      qrCodeDataUrl: qrCodeDataUrl || '',
      verificationUrl: verificationCode
        ? `${process.env.CLIENT_URL || ''}/verify/${verificationCode}`
        : '',
    },
  };

  // ID cards use a fixed card-sized PDF layout for both profile downloads and
  // the document generator. Avoid A4 browser printing for this document type.
  if (template.type === 'id_card') {
    return generatePDFWithPDFKit(template, enhancedData, options);
  }

  // Try Puppeteer first (best quality), fall back to PDFKit
  try {
    // Attempt Puppeteer generation
    const puppeteer = require('puppeteer');
    const html = generateDocumentHtml(template, enhancedData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: template.layout?.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: `${template.layout?.margins?.top || 20}px`,
        bottom: `${template.layout?.margins?.bottom || 20}px`,
        left: `${template.layout?.margins?.left || 20}px`,
        right: `${template.layout?.margins?.right || 20}px`,
      },
    });
    
    await browser.close();
    return pdf;
  } catch (puppeteerErr) {
    // Fall back to PDFKit
    console.warn('Puppeteer not available, using PDFKit fallback:', puppeteerErr.message);
    return generatePDFWithPDFKit(template, enhancedData, options);
  }
}

/**
 * Generate multiple PDFs for bulk generation
 */
async function generateBulkPDFs(template, dataArray, options = {}) {
  const results = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    const data = dataArray[i];
    const pdfBuffer = await generatePDF(template, data, {
      ...options,
      verificationCode: data.verificationCode || options.verificationCode,
    });
    results.push({
      buffer: pdfBuffer,
      data: data,
      index: i,
    });
  }
  
  return results;
}

module.exports = {
  generatePDF,
  generatePDFWithPDFKit,
  generateBulkPDFs,
};
