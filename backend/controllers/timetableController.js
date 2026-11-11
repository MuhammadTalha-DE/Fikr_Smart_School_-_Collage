const Timetable = require('../models/Timetable');
const auditService = require('../services/auditService');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const TimetableVersion = require('../models/TimetableVersion');
const {
  checkSlotConflicts,
  getSlotConflictSuggestions,
  getTimetableConflicts,
} = require('../services/conflictService');
const { generateMultipleTimetables } = require('../services/generatorService');
const { getActiveTimetableForClass } = require('../services/scheduleService');
const {
  getRoomUtilization,
  getTeacherWorkloadHeatmap,
} = require('../services/schedulingAnalyticsService');
const {
  getVersionsForTimetable,
  compareVersions,
  rollbackToVersion,
  exportTemplate,
  importTemplate,
} = require('../services/timetableVersionService');
const { notifyScheduleChange } = require('../services/scheduleNotificationService');
const asyncHandler = require('express-async-handler');
const realtimeService = require('../services/realtimeService');
const mongoose = require('mongoose');

const hasInvalidObjectId = (ids) => ids.some((id) => !mongoose.Types.ObjectId.isValid(String(id)));

const populateTimetable = async (timetable) => {
  await timetable.populate('slots.teacherId', 'userId');
  await timetable.populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } });
  await timetable.populate('slots.roomId', 'name');
  return timetable;
};

const normalizeOptionalDate = (value) => value || null;

const getTimetable = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { term, academicYear, status, scheduleType, date } = req.query;

  const timetable = await getActiveTimetableForClass(classId, term, academicYear, {
    date,
    status,
    scheduleType,
  });

  res.json(timetable || {
    classId,
    term,
    academicYear,
    scheduleType: scheduleType || 'regular',
    slots: [],
    status: 'draft',
  });
});

const saveTimetable = asyncHandler(async (req, res) => {
  const {
    classId,
    term,
    academicYear,
    slots,
    scheduleType = 'regular',
    validFrom = null,
    validUntil = null,
  } = req.body;
  const normalizedValidFrom = normalizeOptionalDate(validFrom);
  const normalizedValidUntil = normalizeOptionalDate(validUntil);
  const classObj = await Class.findById(classId).select('name').lean();

  let timetable = await Timetable.findOne({ classId, term, academicYear, scheduleType });
  const previous = timetable ? timetable.toObject() : null;

  if (timetable) {
    timetable.slots = slots;
    timetable.scheduleType = scheduleType;
    timetable.validFrom = normalizedValidFrom;
    timetable.validUntil = normalizedValidUntil;
    timetable.createdBy = req.user._id;
    if (timetable.isActive === undefined) timetable.isActive = true;
    await timetable.save();
  } else {
    timetable = await Timetable.create({
      classId,
      term,
      academicYear,
      scheduleType,
      validFrom: normalizedValidFrom,
      validUntil: normalizedValidUntil,
      slots,
      createdBy: req.user._id,
      status: 'draft',
      isActive: true,
    });
  }

  await populateTimetable(timetable);

  auditService.log({
    action: 'UPSERT',
    entity: 'Timetable',
    entityId: timetable._id,
    module: 'scheduling',
    description: `Timetable saved for class ${classObj?.name || 'Unknown'} (${scheduleType})`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: previous, after: timetable.toObject ? timetable.toObject() : timetable },
    req,
  });

  await notifyScheduleChange({
    title: 'Timetable updated',
    message: `Timetable saved for ${classObj?.name || 'a class'} (${scheduleType}).`,
    entityId: timetable._id,
    actor: req.user,
    req,
    context: { classId, term, academicYear, scheduleType },
  });

  realtimeService.emitTimetableUpdated({
    timetableId: timetable._id,
    classId,
    status: timetable.status,
    term,
    academicYear,
    scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });

  res.status(201).json(timetable);
});

const deleteTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id);
  if (!timetable) {
    res.status(404);
    throw new Error('Timetable not found');
  }
  await timetable.deleteOne();
  auditService.log({
    action: 'DELETE',
    entity: 'Timetable',
    entityId: timetable._id,
    module: 'scheduling',
    description: 'Timetable deleted',
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: timetable.toObject ? timetable.toObject() : timetable },
    req,
  });
  await notifyScheduleChange({
    title: 'Timetable deleted',
    message: 'A timetable was deleted.',
    entityId: timetable._id,
    actor: req.user,
    req,
    context: {
      classId: timetable.classId,
      term: timetable.term,
      academicYear: timetable.academicYear,
      scheduleType: timetable.scheduleType,
    },
  });
  realtimeService.emitTimetableUpdated({
    timetableId: timetable._id,
    classId: timetable.classId,
    status: 'deleted',
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });
  res.json({ message: 'Timetable deleted' });
});

const getTeachersForSubject = asyncHandler(async (req, res) => {
  const { classId, subject } = req.query;
  if (!classId || !subject) throw new Error('classId and subject are required');
  const classData = await Class.findById(classId).populate('teacherId');
  const classTeacherId = classData.teacherId?._id;
  const allTeachers = await Teacher.find().populate('userId', 'name');
  const eligible = allTeachers.filter(t =>
    t.subjects.includes(subject) &&
    (t.classes.map(c => c.toString()).includes(classId) || t._id.equals(classTeacherId))
  );

  res.json(eligible);
});

const copyTimetable = asyncHandler(async (req, res) => {
  const { sourceClassId, targetClassId, term, academicYear, scheduleType = 'regular' } = req.body;
  const sourceTimetable = await Timetable.findOne({
    classId: sourceClassId,
    term,
    academicYear,
    scheduleType,
    isActive: true,
  });

  if (!sourceTimetable) throw new Error('Source timetable not found');

  await Timetable.deleteMany({ classId: targetClassId, term, academicYear, scheduleType });
  const newTimetable = await Timetable.create({
    classId: targetClassId,
    term,
    academicYear,
    scheduleType,
    validFrom: sourceTimetable.validFrom,
    validUntil: sourceTimetable.validUntil,
    slots: sourceTimetable.slots,
    createdBy: req.user._id,
    status: 'draft',
  });

  realtimeService.emitTimetableUpdated({
    timetableId: newTimetable._id,
    classId: targetClassId,
    status: newTimetable.status,
    term,
    academicYear,
    scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });
  res.status(201).json(newTimetable);
});

const checkConflict = asyncHandler(async (req, res) => {
  const { day, period, teacherId, classId, roomId, excludeTimetableId, scheduleType, term, academicYear } = req.body;
  const probe = { day, period, teacherId, classId, roomId, scheduleType, term, academicYear };
  const conflicts = await checkSlotConflicts(
    probe,
    excludeTimetableId
  );
  const suggestions = conflicts.length > 0
    ? await getSlotConflictSuggestions(probe, excludeTimetableId)
    : [];

  res.json({
    conflict: conflicts.length > 0,
    detail: conflicts[0] || '',
    conflicts,
    suggestions,
  });
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const timetable = await Timetable.findById(req.params.id);
  if (!timetable) throw new Error('Timetable not found');

  if (status === 'published') {
    const conflicts = await getTimetableConflicts(timetable._id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Resolve timetable conflicts before publishing.',
        conflicts,
      });
    }
  }

  if (status === 'published' && timetable.status !== 'published') {
    const lastVersion = await TimetableVersion.findOne({
      classId: timetable.classId,
      term: timetable.term,
      academicYear: timetable.academicYear,
      scheduleType: timetable.scheduleType,
      term: timetable.term,
      academicYear: timetable.academicYear,
    }).sort('-version');
    const newVersion = (lastVersion?.version || 0) + 1;
    await TimetableVersion.create({
      classId: timetable.classId,
      term: timetable.term,
      academicYear: timetable.academicYear,
      scheduleType: timetable.scheduleType,
      validFrom: timetable.validFrom,
      validUntil: timetable.validUntil,
      slots: timetable.slots,
      createdBy: req.user._id,
      version: newVersion,
    });
  }

  const previousStatus = timetable.status;
  timetable.status = status;
  timetable.isActive = status !== 'archived';
  await timetable.save();
  auditService.log({
    action: status === 'published' ? 'PUBLISH' : 'UPDATE',
    entity: 'Timetable',
    entityId: timetable._id,
    module: 'scheduling',
    description: `Timetable status changed from ${previousStatus} to ${status}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { status: previousStatus }, after: { status } },
    req,
  });
  if (status === 'published') {
    await notifyScheduleChange({
      title: 'Timetable published',
      message: `A ${timetable.scheduleType} timetable has been published.`,
      entityId: timetable._id,
      actor: req.user,
      req,
      context: {
        classId: timetable.classId,
        term: timetable.term,
        academicYear: timetable.academicYear,
        scheduleType: timetable.scheduleType,
      },
    });
  }
  realtimeService.emitTimetableUpdated({
    timetableId: timetable._id,
    classId: timetable.classId,
    status: timetable.status,
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });
  res.json(timetable);
});

const getConflicts = asyncHandler(async (req, res) => {
  const conflicts = await getTimetableConflicts(req.params.id);
  res.json(conflicts);
});

const resolveConflict = asyncHandler(async (req, res) => {
  const {
    timetableId,
    day,
    period,
    action = 'removeSlot',
    targetDay,
    targetPeriod,
    teacherId,
    roomId,
  } = req.body;
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) throw new Error('Timetable not found');

  const slot = timetable.slots.find(s => s.day === day && Number(s.period) === Number(period));
  if (!slot) throw new Error('Slot not found');

  if (action === 'removeSlot') {
    timetable.slots = timetable.slots.filter(s => !(s.day === day && Number(s.period) === Number(period)));
  } else if (action === 'moveSlot') {
    if (!targetDay || !targetPeriod) throw new Error('targetDay and targetPeriod are required');
    slot.day = targetDay;
    slot.period = Number(targetPeriod);
  } else if (action === 'changeTeacher') {
    if (!teacherId) throw new Error('teacherId is required');
    slot.teacherId = teacherId;
  } else if (action === 'changeRoom') {
    if (!roomId) throw new Error('roomId is required');
    slot.roomId = roomId;
  } else {
    throw new Error('Unsupported conflict resolution action');
  }

  if (action !== 'removeSlot') {
    const remainingConflicts = await checkSlotConflicts({
      day: slot.day,
      period: slot.period,
      teacherId: slot.teacherId,
      classId: timetable.classId,
      roomId: slot.roomId,
      scheduleType: timetable.scheduleType,
      term: timetable.term,
      academicYear: timetable.academicYear,
    }, timetable._id);

    const duplicateClassSlot = timetable.slots.some((candidate) => (
      candidate._id.toString() !== slot._id.toString()
      && candidate.day === slot.day
      && Number(candidate.period) === Number(slot.period)
    ));

    if (remainingConflicts.length > 0 || duplicateClassSlot) {
      return res.status(409).json({
        message: 'Suggested action still has conflicts.',
        conflicts: remainingConflicts,
      });
    }
  }

  await timetable.save();
  realtimeService.emitTimetableUpdated({
    timetableId: timetable._id,
    classId: timetable.classId,
    status: 'conflict_resolved',
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });
  res.json({ message: 'Conflict resolved', action });
});

const generate = asyncHandler(async (req, res) => {
  const {
    classIds,
    term,
    academicYear,
    scheduleType = 'regular',
    validFrom = null,
    validUntil = null,
  } = req.body;
  const maxTeacherDailyPeriods = Number(req.body.maxTeacherDailyPeriods) || 6;
  const maxTeacherWeeklyPeriods = Number(req.body.maxTeacherWeeklyPeriods) || 30;
  const workingDays = req.body.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!Array.isArray(classIds) || classIds.length === 0 || classIds.length > 100) {
    res.status(400);
    throw new Error('Select between 1 and 100 classes to generate a timetable.');
  }
  if (!['First Term', 'Second Term', 'Final Term'].includes(term)) {
    res.status(400);
    throw new Error('Select a valid academic term.');
  }
  if (!/^\d{4}-\d{4}$/.test(String(academicYear || ''))) {
    res.status(400);
    throw new Error('Academic year must use the format YYYY-YYYY.');
  }
  const [startYear, endYear] = String(academicYear).split('-').map(Number);
  if (endYear !== startYear + 1) {
    res.status(400);
    throw new Error('Academic year must contain consecutive years, for example 2026-2027.');
  }
  if (!['regular', 'ramadan', 'exam', 'half-day', 'custom'].includes(scheduleType)) {
    res.status(400);
    throw new Error('Select a valid schedule type.');
  }
  if (maxTeacherDailyPeriods < 1 || maxTeacherDailyPeriods > 12
      || maxTeacherWeeklyPeriods < 1 || maxTeacherWeeklyPeriods > 72) {
    res.status(400);
    throw new Error('Teacher workload limits are outside the supported range.');
  }
  const allowedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (!Array.isArray(workingDays) || workingDays.length === 0
      || workingDays.some(day => !allowedDays.includes(day))) {
    res.status(400);
    throw new Error('Choose one or more valid working days.');
  }
  if (hasInvalidObjectId(classIds)) {
    res.status(400);
    throw new Error('One or more selected class IDs are invalid. Refresh the class list and try again.');
  }
  if ((validFrom && Number.isNaN(new Date(validFrom).getTime()))
      || (validUntil && Number.isNaN(new Date(validUntil).getTime()))) {
    res.status(400);
    throw new Error('Enter valid timetable start and end dates.');
  }
  if (validFrom && validUntil && new Date(validUntil) < new Date(validFrom)) {
    res.status(400);
    throw new Error('Valid Until must be the same as or later than Valid From.');
  }
  const uniqueClassIds = [...new Set(classIds.map(String))];
  const classRecords = await Class.find({ _id: { $in: uniqueClassIds } }).select('_id name').lean();
  if (classRecords.length !== uniqueClassIds.length) {
    res.status(400);
    throw new Error('One or more selected classes could not be found. Refresh the class list and try again.');
  }
  const publishedTimetables = await Timetable.find({
    classId: { $in: uniqueClassIds }, term, academicYear, scheduleType, status: 'published',
  }).populate('classId', 'name').select('classId').lean();
  if (publishedTimetables.length) {
    res.status(409);
    throw new Error(`Archive the published timetable(s) first: ${publishedTimetables.map(item => item.classId?.name).join(', ')}.`);
  }
  const normalizedValidFrom = normalizeOptionalDate(validFrom);
  const normalizedValidUntil = normalizeOptionalDate(validUntil);
  const { slotsByClass, reports } = await generateMultipleTimetables(uniqueClassIds, term, academicYear, {
    scheduleType,
    workingDays,
    maxTeacherDailyPeriods,
    maxTeacherWeeklyPeriods,
  });

  const createdTimetables = [];
  for (const classId of Object.keys(slotsByClass)) {
    const slots = slotsByClass[classId];
    let timetable = await Timetable.findOne({ classId, term, academicYear, scheduleType });
    const previous = timetable ? timetable.toObject() : null;
    if (timetable) {
      timetable.slots = slots;
      timetable.scheduleType = scheduleType;
      timetable.validFrom = normalizedValidFrom;
      timetable.validUntil = normalizedValidUntil;
      timetable.status = 'draft';
      timetable.createdBy = req.user._id;
      await timetable.save();
    } else {
      timetable = await Timetable.create({
        classId,
        term,
        academicYear,
        scheduleType,
        validFrom: normalizedValidFrom,
        validUntil: normalizedValidUntil,
        slots,
        createdBy: req.user._id,
        status: 'draft',
      });
    }

    await timetable.populate('classId', 'name');
    await populateTimetable(timetable);

    createdTimetables.push({ ...timetable.toObject(), generationReport: reports[classId] });
    auditService.log({
      action: 'GENERATE',
      entity: 'Timetable',
      entityId: timetable._id,
      module: 'scheduling',
      description: `Generated timetable for ${timetable.classId?.name || 'class'} (${scheduleType})`,
      performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
      changes: { before: previous, after: timetable.toObject ? timetable.toObject() : timetable },
      req,
    });
    realtimeService.emitTimetableUpdated({
      timetableId: timetable._id,
      classId,
      status: timetable.status,
      term,
      academicYear,
      scheduleType,
      actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
    });
  }

  notifyScheduleChange({
    title: 'Timetables generated',
    message: `${createdTimetables.length} timetable(s) generated for ${scheduleType}; ${createdTimetables.filter(item => item.generationReport?.complete).length} complete.`,
    actor: req.user,
    req,
    context: { classIds, term, academicYear, scheduleType },
  });

  res.status(201).json(createdTimetables);
});

const clearAllTimetables = asyncHandler(async (req, res) => {
  const count = await Timetable.countDocuments({});
  await Timetable.deleteMany({});
  auditService.log({
    action: 'CLEAR_ALL',
    entity: 'Timetable',
    module: 'scheduling',
    description: `Cleared all timetables (${count} removed)`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: { count }, after: { count: 0 } },
    req,
  });
  await notifyScheduleChange({
    title: 'All timetables cleared',
    message: `${count} timetable(s) were cleared.`,
    actor: req.user,
    req,
    context: { count },
  });
  res.json({ message: 'All timetables deleted', count });
});

const getAllTimetables = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.scheduleType) filter.scheduleType = req.query.scheduleType;
  if (req.query.status) filter.status = req.query.status;

  const timetables = await Timetable.find(filter)
    .populate('classId', 'name')
    .sort('classId scheduleType term academicYear');
  res.json(timetables);
});

const getRoomUtilizationDashboard = asyncHandler(async (req, res) => {
  res.json(await getRoomUtilization(req.query));
});

const getTeacherWorkloadDashboard = asyncHandler(async (req, res) => {
  res.json(await getTeacherWorkloadHeatmap(req.query));
});

const getVersions = asyncHandler(async (req, res) => {
  res.json(await getVersionsForTimetable(req.params.timetableId));
});

const compareTimetableVersions = asyncHandler(async (req, res) => {
  res.json(await compareVersions(req.params.leftVersionId, req.params.rightVersionId));
});

const rollbackVersion = asyncHandler(async (req, res) => {
  const { timetable, previous, version } = await rollbackToVersion(req.params.versionId, req.user._id);
  await populateTimetable(timetable);
  auditService.log({
    action: 'ROLLBACK',
    entity: 'Timetable',
    entityId: timetable._id,
    module: 'scheduling',
    description: `Rolled timetable back to version ${version.version}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: previous, after: timetable.toObject ? timetable.toObject() : timetable },
    req,
  });
  await notifyScheduleChange({
    title: 'Timetable rolled back',
    message: `A timetable was rolled back to version ${version.version}.`,
    entityId: timetable._id,
    actor: req.user,
    req,
    context: { version: version.version },
  });
  realtimeService.emitTimetableUpdated({
    timetableId: timetable._id,
    classId: timetable.classId,
    status: 'rolled_back',
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
    actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
  });
  res.json(timetable);
});

const exportTimetableTemplate = asyncHandler(async (req, res) => {
  const template = await exportTemplate(req.params.timetableId);
  auditService.log({
    action: 'EXPORT',
    entity: 'Timetable',
    entityId: req.params.timetableId,
    module: 'scheduling',
    description: 'Timetable template exported',
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });
  res.json(template);
});

const importTimetableTemplate = asyncHandler(async (req, res) => {
  const { timetable, previous } = await importTemplate({
    ...req.body,
    userId: req.user._id,
  });
  await populateTimetable(timetable);
  auditService.log({
    action: 'IMPORT',
    entity: 'Timetable',
    entityId: timetable._id,
    module: 'scheduling',
    description: 'Timetable template imported',
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    changes: { before: previous, after: timetable.toObject ? timetable.toObject() : timetable },
    req,
  });
  await notifyScheduleChange({
    title: 'Timetable template imported',
    message: 'A timetable was created or updated from a template.',
    entityId: timetable._id,
    actor: req.user,
    req,
    context: {
      classId: timetable.classId,
      term: timetable.term,
      academicYear: timetable.academicYear,
      scheduleType: timetable.scheduleType,
    },
  });
  res.status(201).json(timetable);
});

module.exports = {
  getTimetable,
  saveTimetable,
  deleteTimetable,
  getTeachersForSubject,
  copyTimetable,
  checkConflict,
  toggleStatus,
  getAllTimetables,
  getConflicts,
  generate,
  resolveConflict,
  clearAllTimetables,
  getRoomUtilizationDashboard,
  getTeacherWorkloadDashboard,
  getVersions,
  compareTimetableVersions,
  rollbackVersion,
  exportTimetableTemplate,
  importTimetableTemplate,
};
