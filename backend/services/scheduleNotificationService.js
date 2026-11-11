const notificationCenterService = require('./notificationCenterService');

const notifyScheduleChange = async ({
  title,
  message,
  entity = 'Timetable',
  entityId = null,
  roles = ['admin', 'teacher', 'student', 'parent'],
  actor = null,
  req = null,
  context = {},
}) => {
  try {
    return await notificationCenterService.createAndDispatch({
      title,
      message,
      type: 'academic',
      severity: 'medium',
      sourceModule: 'scheduling',
      channels: ['in_app'],
      roles,
      metadata: {
        link: '/admin/timetable-viewer',
        entity,
        entityId,
        tags: ['schedule', 'timetable'],
        context,
      },
      status: 'queued',
    }, actor, req);
  } catch (error) {
    console.error('Schedule notification failed:', error.message);
    return null;
  }
};

const notifySubstitutionChange = async ({
  substitution,
  actor = null,
  req = null,
}) => notifyScheduleChange({
  title: 'Substitution assigned',
  message: `${substitution.substituteTeacherId?.userId?.name || 'A substitute teacher'} assigned for ${substitution.classId?.name || 'a class'} P${substitution.period}.`,
  entity: 'Substitution',
  entityId: substitution._id,
  roles: ['admin', 'teacher'],
  actor,
  req,
  context: {
    classId: substitution.classId?._id || substitution.classId,
    period: substitution.period,
    date: substitution.date,
  },
});

module.exports = {
  notifyScheduleChange,
  notifySubstitutionChange,
};
