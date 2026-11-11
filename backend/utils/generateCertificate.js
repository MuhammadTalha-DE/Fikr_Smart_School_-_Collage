const PDFDocument = require('pdfkit');

/**
 * Helper: fetch image as buffer from URL.
 * (Optional – you can move this to a shared helper)
 */
async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn('Image fetch failed:', url);
    return null;
  }
}

/**
 * Generate a colourful, professional certificate PDF.
 * @param {Object} data – must contain all student & school info + optional buffers
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDF = async (data) => {
  // ─── Landscape A4 ────────────────────────
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  const width = doc.page.width;   // 842 pt
  const height = doc.page.height; // 595 pt

  // ─── Background Gradient ─────────────────
  const gradient = doc.linearGradient(0, 0, width, height);
  gradient.stop(0, '#e0f2fe');  // light blue
  gradient.stop(1, '#ffffff');
  doc.rect(0, 0, width, height).fill(gradient);

  // ─── Decorative Double Border ────────────
  doc.rect(20, 20, width - 40, height - 40).lineWidth(2).stroke('#0ea5e9');
  doc.rect(25, 25, width - 50, height - 50).lineWidth(1).stroke('#0284c7');

  // ─── Header: Logo + School Name ──────────
  // School logo (top left)
  if (data.schoolLogoBuffer) {
    doc.image(data.schoolLogoBuffer, 40, 35, { width: 65, height: 65 });
  } else {
    // Placeholder rectangle
    doc.rect(40, 35, 65, 65).fill('#e2e8f0');
    doc.fontSize(10).fillColor('#64748b').text('LOGO', 50, 55, { width: 45, align: 'center' });
  }

  // School name
  doc.fontSize(28).fillColor('#0369a1').font('Helvetica-Bold')
     .text(data.schoolName || 'Fikr Smart School', 120, 45, { width: 500, align: 'center' });
  // School address
  doc.fontSize(12).fillColor('#334155').font('Helvetica')
     .text(data.schoolAddress || '', 120, 80, { width: 500, align: 'center' });

  // ─── Certificate Title Ribbon ────────────
  doc.rect(0, 110, width, 40).fill('#0284c7');
  doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
     .text('Certificate of Achievement', 0, 116, { width, align: 'center' });

  // ─── Student Photo (left of details) ─────
  if (data.photoBuffer) {
    doc.image(data.photoBuffer, 60, 180, { width: 100, height: 120 });
  } else {
    doc.rect(60, 180, 100, 120).fill('#e2e8f0');
    doc.fontSize(10).fillColor('#64748b').text('PHOTO', 85, 230, { width: 50, align: 'center' });
  }

  // ─── Student Details Box (right of photo) ─
  const detailX = 190;
  const detailY = 180;
  const drawDetail = (label, value, yOffset) => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b')
       .text(`${label}:`, detailX, yOffset, { width: 120, continued: true })
       .font('Helvetica').text(` ${value || '—'}`, { width: 250 });
  };

  drawDetail('Student Name', data.studentName, detailY);
  drawDetail('Class', data.className, detailY + 22);
  drawDetail('Section', data.section, detailY + 44);
  drawDetail('Admission No', data.admissionNo, detailY + 66);
  drawDetail('Date of Birth', data.dob, detailY + 88);
  drawDetail('Parent/Guardian', data.parentName, detailY + 110);

  // ─── Body Text ───────────────────────────
  const bodyY = 330;
  doc.fontSize(14).fillColor('#0f172a').font('Helvetica')
     .text(data.bodyText || '', 80, bodyY, { width: width - 160, align: 'center', lineGap: 6 });

  // ─── Footer: Date, Signature, Stamp ──────
  const footerY = 440;

  // Issue date (bottom left)
  doc.fontSize(10).fillColor('#475569').font('Helvetica')
     .text(`Date: ${data.issueDate || ''}`, 80, footerY);

  // School Stamp (bottom left corner, if available)
  if (data.stampBuffer) {
    doc.image(data.stampBuffer, 80, footerY - 10, { width: 80, height: 80 });
  }

  // Principal signature (bottom right)
  if (data.signatureBuffer) {
    doc.image(data.signatureBuffer, width - 180, footerY - 5, { width: 100, height: 40 });
  }

  // Printed signatory line
  doc.fontSize(10).fillColor('#475569').text(data.principalName || 'Principal', width - 200, footerY, { width: 120, align: 'center' });
  doc.moveTo(width - 200, footerY + 40).lineTo(width - 80, footerY + 40).stroke('#0284c7');
  doc.fontSize(8).fillColor('#64748b').text('Principal / Authorised Signatory', width - 200, footerY + 45, { width: 120, align: 'center' });

  // ─── Bottom Decorative Line ──────────────
  doc.rect(20, height - 50, width - 40, 3).fill('#0284c7');

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

module.exports = { generateCertificatePDF };
