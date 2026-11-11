const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Fetches an image from a URL and returns a Buffer.
 * Falls back to null if the URL is invalid or missing.
 */
async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn('Failed to fetch image:', url);
    return null;
  }
}

/**
 * Generates a realistic ID card PDF (front + optional back).
 * @param {Object} data - student/teacher info
 * @param {Buffer|null} data.signatureBuffer - principal's signature image
 * @param {Buffer|null} data.stampBuffer - school stamp image
 * @returns {Promise<Buffer>}
 */
const generateIdCardPDF = async (data) => {
  const width = 204;
  const height = 324;
  const doc = new PDFDocument({ size: [width, height], margin: 0 });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Refreshed school ID layout: brand header, profile block, and compact records.
  doc.rect(0, 0, width, height).fill('#f8fafc');
  doc.roundedRect(3, 3, width - 6, height - 6, 12).lineWidth(1.5).stroke('#1e3a8a');
  doc.roundedRect(4, 4, width - 8, 66, 10).fill('#163a70');
  if (data.schoolLogoBuffer) doc.image(data.schoolLogoBuffer, 12, 11, { fit: [42, 42] });
  else doc.roundedRect(12, 11, 42, 42, 8).fill('#ffffff');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff').text(data.schoolName || 'School', 62, 14, { width: 130, height: 25, ellipsis: true });
  doc.font('Helvetica').fontSize(6).fillColor('#dbeafe').text(data.schoolAddress || 'STUDENT & STAFF IDENTITY', 62, 37, { width: 130, height: 22, ellipsis: true });

  const photoX = 12, photoY = 82, photoW = 58, photoH = 68;
  if (data.photoBuffer) doc.image(data.photoBuffer, photoX, photoY, { fit: [photoW, photoH], align: 'center', valign: 'center' });
  else { doc.roundedRect(photoX, photoY, photoW, photoH, 5).fill('#e2e8f0'); doc.fontSize(7).fillColor('#64748b').text('PHOTO', photoX, photoY + 29, { width: photoW, align: 'center' }); }
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#163a70').text(data.name || 'Name unavailable', 80, 83, { width: 112, height: 27, ellipsis: true });
  doc.roundedRect(80, 108, 62, 14, 5).fill('#dbeafe');
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#1e3a8a').text(data.role || 'Student', 84, 112, { width: 54, align: 'center' });

  let y = 164;
  const drawRow = (label, value) => {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#64748b').text(label.toUpperCase(), 12, y, { width: 58, height: 10 });
    doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a').text(value || '—', 73, y, { width: 118, height: 11, ellipsis: true });
    y += 17;
  };
  if (data.role === 'Student') {
    drawRow('Class / Sec.', [data.className, data.section].filter(Boolean).join(' / '));
    drawRow('Admission No.', data.admissionNo);
    drawRow('Roll Number', data.rollNo);
    drawRow('Date of Birth', data.dob);
    drawRow('Blood Group', data.bloodGroup);
    drawRow('Parent / Phone', [data.parentName, data.parentPhone].filter(Boolean).join(' · '));
    drawRow('CNIC / Form-B', [data.cnic, data.formBNumber].filter(Boolean).join(' / '));
  } else {
    drawRow('Employee ID', data.admissionNo);
    drawRow('Date of Birth', data.dob);
    drawRow('Blood Group', data.bloodGroup);
    drawRow('Phone', data.phone);
    drawRow('Email', data.email);
    drawRow('CNIC', data.cnic);
    drawRow('Department', data.department);
  }
  doc.moveTo(12, 292).lineTo(width - 12, 292).lineWidth(.6).stroke('#cbd5e1');
  const qrData = data.qrData || `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile/${data.admissionNo}`;
  const qrImage = await QRCode.toDataURL(qrData, { width: 72, margin: 1 });
  doc.image(Buffer.from(qrImage.split(',')[1], 'base64'), 13, 298, { width: 24, height: 24 });
  doc.font('Helvetica').fontSize(5.5).fillColor('#475569').text('Scan to verify identity', 41, 306, { width: 90 });
  if (data.signatureBuffer) doc.image(data.signatureBuffer, width - 75, 295, { fit: [54, 19] });
  doc.fontSize(5).fillColor('#64748b').text('AUTHORISED', width - 76, 316, { width: 56, align: 'center' });

  // ========== BACK SIDE (optional stamp) ==========
  if (data.stampBuffer) {
    doc.addPage({ size: [width, height], margin: 0 }); // same card size
    doc.rect(0, 0, width, height).fill('#ffffff');
    // Centered stamp
    doc.image(data.stampBuffer, width / 2 - 40, height / 2 - 40, { width: 80, height: 80 });
    doc.fontSize(8).fillColor('#475569')
       .text('Official School Stamp', width / 2 - 50, height / 2 + 45, { width: 100, align: 'center' });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

module.exports = { generateIdCardPDF };
