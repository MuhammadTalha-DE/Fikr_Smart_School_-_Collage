const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Config = require('../models/Config');
const SchoolPeriod = require('../models/SchoolPeriod');
  // for school info

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fallbackPeriods = [1, 2, 3, 4, 5, 6, 7, 8];

const getClassPeriods = async () => {
  const configured = await SchoolPeriod.find({ type: 'class' }).sort('periodNumber').lean();
  const periods = configured
    .map((period) => Number(period.periodNumber))
    .filter(Boolean);
  return periods.length > 0 ? [...new Set(periods)] : fallbackPeriods;
};

// Helper: get school info
const getSchoolInfo = async () => {
  const info = {};
  const keys = ['school_name', 'school_logo', 'school_address', 'school_phone', 'school_email'];
  for (const key of keys) {
    const config = await Config.findOne({ key });
    if (config) info[key.replace('school_', '')] = config.value;
  }
  return info;
};

// Simple colour map for Excel/PDF cells
const subjectColors = {
  'mathematics': '#e3f2fd', 'math': '#e3f2fd', 'english': '#fce4ec', 'urdu': '#fff3e0',
  'science': '#e8f5e9', 'islamiat': '#f3e5f5', 'computer': '#e0f7fa', 'history': '#efebe9',
  'geography': '#e8eaf6',
};
const getColorForSubject = (sub) => subjectColors[sub?.toLowerCase()] || '#f8fafc';

// ========== CLASS TIMETABLE PDF ==========
const generateClassTimetablePDF = async (classId, term, academicYear) => {
  const school = await getSchoolInfo();
  const classData = await Class.findById(classId);
  const timetable = await Timetable.findOne({ classId, term, academicYear }).populate('slots.teacherId', 'userId').populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } });
  if (!timetable) throw new Error('Timetable not found');
  const periods = await getClassPeriods();

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  // School Header
  // School Header – logo (safe loading)
if (school.logo) {
  try {
    const logoPath = path.join(__dirname, '..', school.logo);  // resolve from /backend
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 40 });
    }
  } catch (err) {
    // ignore missing/invalid logo – continue without it
    console.warn('Could not load school logo for PDF:', err.message);
  }
}
  // Class & Term
  doc.fontSize(14).font('Helvetica-Bold').text(`Class Timetable: ${classData.name}`, 40, doc.y);
  doc.fontSize(11).font('Helvetica').text(`Term: ${term}  |  Academic Year: ${academicYear}`, 40, doc.y + 5);
  doc.moveDown(1);

  // Draw Table
  const startX = 40, rowH = 40;
  const colW = (doc.page.width - 80) / (periods.length + 1);
  const tableTop = doc.y;
  // Header row
  doc.font('Helvetica-Bold').fontSize(8);
  for (let i = 0; i <= periods.length; i++) {
    const x = startX + i * colW;
    if (i === 0) doc.text('Day/Period', x + 5, tableTop + 5, { width: colW - 10, align: 'center' });
    else doc.text(`Period ${periods[i - 1]}`, x + 5, tableTop + 5, { width: colW - 10, align: 'center' });
  }
  // Day rows
  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    const y = tableTop + rowH + d * rowH;
    // day name
    doc.font('Helvetica-Bold').fontSize(8).text(day, startX + 5, y + 5, { width: colW - 10, align: 'center' });
    // periods
    for (let p = 0; p < periods.length; p++) {
      const slot = timetable.slots?.find(s => s.day === day && s.period === periods[p]);
      const x = startX + (p + 1) * colW;
      if (slot) {
        doc.rect(x, y, colW, rowH).fill(getColorForSubject(slot.subject));
        doc.fillColor('black').font('Helvetica').fontSize(8).text(slot.subject, x + 5, y + 5, { width: colW - 10, align: 'center' });
        doc.fontSize(7).text(slot.teacherId?.userId?.name || '', x + 5, y + 18, { width: colW - 10, align: 'center' });
      } else {
        doc.rect(x, y, colW, rowH).fill('#ffffff');
        doc.fillColor('#cccccc').font('Helvetica').fontSize(8).text('—', x + 5, y + 5, { width: colW - 10, align: 'center' });
      }
      doc.fillColor('black');
    }
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

// ========== CLASS TIMETABLE EXCEL ==========
const generateClassTimetableExcel = async (classId, term, academicYear) => {
  const classData = await Class.findById(classId);
  const timetable = await Timetable.findOne({ classId, term, academicYear }).populate('slots.teacherId', 'userId').populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } });
  if (!timetable) throw new Error('Timetable not found');
  const periods = await getClassPeriods();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(classData.name);
  // Columns
  sheet.columns = [
    { header: 'Day', key: 'day', width: 14 },
    ...periods.map(p => ({ header: `Period ${p}`, key: `p${p}`, width: 18 })),
  ];
  sheet.getRow(1).font = { bold: true };
  // Day rows
  days.forEach(day => {
    const rowData = {};
    rowData.day = day;
    periods.forEach(p => {
      const slot = timetable.slots?.find(s => s.day === day && s.period === p);
      rowData[`p${p}`] = slot ? `${slot.subject}\n${slot.teacherId?.userId?.name || ''}` : '';
    });
    sheet.addRow(rowData);
    const rowIndex = sheet.rowCount;
    sheet.getCell(`A${rowIndex}`).font = { bold: true };
    // Colour cells
    periods.forEach((p, idx) => {
      const slot = timetable.slots?.find(s => s.day === day && s.period === p);
      if (slot) {
        const cell = sheet.getCell(rowIndex, idx + 2);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: getColorForSubject(slot.subject).replace('#', '') } };
      }
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ========== TEACHER SCHEDULE PDF ==========
const generateTeacherSchedulePDF = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).populate('userId', 'name');
  const school = await getSchoolInfo();
  const schedules = await Timetable.find({ 'slots.teacherId': teacherId }).populate('classId', 'name').populate('slots.teacherId', 'userId').populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } });

  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  doc.fontSize(16).font('Helvetica-Bold').text(`Teacher Schedule: ${teacher.userId?.name}`, { align: 'center' });
  doc.moveDown();

  const allSlots = [];
  schedules.forEach(tt => {
    tt.slots.forEach(slot => {
      if (slot.teacherId?._id?.equals(teacherId)) {
        allSlots.push({ ...slot.toObject(), className: tt.classId?.name });
      }
    });
  });
  allSlots.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.period - b.period);

  // Simple table
  const tableTop = doc.y;
  const colWidths = [80, 60, 130, 100];
  const headers = ['Day', 'Period', 'Subject', 'Class'];
  doc.font('Helvetica-Bold').fontSize(10);
  headers.forEach((h, i) => doc.text(h, 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop));
  let y = tableTop + 20;
  doc.font('Helvetica').fontSize(10);
  allSlots.forEach(slot => {
    doc.text(slot.day, 40, y);
    doc.text(slot.period.toString(), 40 + colWidths[0], y);
    doc.text(slot.subject, 40 + colWidths[0] + colWidths[1], y);
    doc.text(slot.className || '', 40 + colWidths[0] + colWidths[1] + colWidths[2], y);
    y += 18;
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = 40;
    }
  });

  doc.end();
  return Buffer.concat(buffers);
};

// ========== TEACHER SCHEDULE EXCEL ==========
const generateTeacherScheduleExcel = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).populate('userId', 'name');
  const schedules = await Timetable.find({ 'slots.teacherId': teacherId }).populate('classId', 'name');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Schedule');
  sheet.columns = [
    { header: 'Day', key: 'day', width: 12 },
    { header: 'Period', key: 'period', width: 10 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Class', key: 'class', width: 20 },
  ];
  const allSlots = [];
  schedules.forEach(tt => {
    tt.slots.forEach(slot => {
      if (slot.teacherId?.equals(teacherId)) {
        allSlots.push({ day: slot.day, period: slot.period, subject: slot.subject, class: tt.classId?.name });
      }
    });
  });
  allSlots.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.period - b.period);
  allSlots.forEach(s => sheet.addRow(s));
  sheet.getRow(1).font = { bold: true };
  return await workbook.xlsx.writeBuffer();
};

module.exports = { generateClassTimetablePDF, generateClassTimetableExcel, generateTeacherSchedulePDF, generateTeacherScheduleExcel };
