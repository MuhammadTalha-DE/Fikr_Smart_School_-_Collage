const Student = require('../models/Student');
const Parent = require('../models/Parent');
const notificationCenterService = require('./notificationCenterService');

const uniqueIds = (items = []) => [...new Set(items.filter(Boolean).map((item) => String(item)))];

class NotificationAutomationService {
  async getAudienceForStudents(studentIds = [], { includeStudents = true, includeParents = true } = {}) {
    const normalizedStudentIds = uniqueIds(studentIds);
    if (!normalizedStudentIds.length) {
      return [];
    }

    const [students, parents] = await Promise.all([
      includeStudents
        ? Student.find({ _id: { $in: normalizedStudentIds } }).select('userId').lean()
        : Promise.resolve([]),
      includeParents
        ? Parent.find({ children: { $in: normalizedStudentIds } }).select('userId').lean()
        : Promise.resolve([]),
    ]);

    return uniqueIds([
      ...students.map((student) => student.userId),
      ...parents.map((parent) => parent.userId),
    ]);
  }

  async getAudienceForClasses(classIds = [], roleHints = []) {
    const normalizedClassIds = uniqueIds(classIds);
    if (!normalizedClassIds.length) {
      return { roles: roleHints || [], userIds: [] };
    }

    const students = await Student.find({ classId: { $in: normalizedClassIds } })
      .select('_id userId')
      .lean();

    const studentIds = students.map((student) => student._id);
    const studentUserIds = roleHints.includes('student') || roleHints.includes('all')
      ? students.map((student) => student.userId)
      : [];
    const parentUserIds = roleHints.includes('parent') || roleHints.includes('all')
      ? await this.getAudienceForStudents(studentIds, { includeStudents: false, includeParents: true })
      : [];

    return {
      roles: roleHints || [],
      userIds: uniqueIds([...studentUserIds, ...parentUserIds]),
    };
  }

  async dispatch(payload, actor = null, req = null) {
    return notificationCenterService.createAndDispatch(payload, actor, req);
  }
}

module.exports = new NotificationAutomationService();
