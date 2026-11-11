const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicRecord = require('../models/AcademicRecord');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');

/**
 * Evaluate and promote/detain all students of a given class for an academic year.
 * @param {ObjectId} classId
 * @param {String} academicYear  e.g., "2025-2026"
 * @param {Object} options  { minAttendance: 75, minMarks: 40 }
 * @returns {Object} summary { promoted, detained, errors }
 */
exports.evaluateAndPromote = async (classId, academicYear, options = {}) => {
  const minAttendance = options.minAttendance || 75;
  const minMarks = options.minMarks || 40;

  const students = await Student.find({ classId }).populate('userId', 'name');
  if (!students.length) throw new Error('No students found in this class');

  // Find the next class (assuming classes are ordered by name, but you can adjust logic)
  const currentClass = await Class.findById(classId);
  const nextClass = await Class.findOne({ name: { $gt: currentClass.name } }).sort({ name: 1 });
  // If no next class, students will be marked as 'completed'

  let promoted = 0;
  let detained = 0;
  const errors = [];

  for (const student of students) {
    try {
      // 1. Calculate average marks for the academic year
      const marksAgg = await Marks.aggregate([
        { $match: { student: student._id, academicYear } },
        { $group: { _id: null, avgPercent: { $avg: { $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100] } } } }
      ]);
      const avgMarks = marksAgg.length > 0 ? marksAgg[0].avgPercent : 0;

      // 2. Calculate attendance percentage
      const attendanceAgg = await Attendance.aggregate([
        { $match: { student: student._id, academicYear } },
        { $group: { _id: null, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, total: { $sum: 1 } } }
      ]);
      let attendancePct = 0;
      if (attendanceAgg.length > 0) {
        const { present = 0, total = 0 } = attendanceAgg[0];
        attendancePct = total > 0 ? (present / total) * 100 : 0;
      }

      // 3. Decide promotion
      const pass = attendancePct >= minAttendance && avgMarks >= minMarks;
      const status = pass ? 'promoted' : 'detained';

      // 4. Create Academic Record
      await AcademicRecord.create({
        student: student._id,
        academicYear,
        class: classId,
        finalGrade: avgMarks,
        attendancePercentage: attendancePct,
        status,
      });

      // 5. Update student class if promoted and next class exists
      if (status === 'promoted' && nextClass) {
        // Remove from old class
        await Class.findByIdAndUpdate(classId, { $pull: { students: student._id } });
        // Add to new class
        await Class.findByIdAndUpdate(nextClass._id, { $addToSet: { students: student._id } });
        student.classId = nextClass._id;
        await student.save();
        promoted++;
      } else if (status === 'promoted' && !nextClass) {
        // Student completed highest class – mark as completed
        await AcademicRecord.findOneAndUpdate(
          { student: student._id, academicYear },
          { status: 'completed' }
        );
        promoted++;
      } else {
        detained++;
      }
    } catch (err) {
      errors.push({ student: student._id, error: err.message });
    }
  }

  return { promoted, detained, errors };
};