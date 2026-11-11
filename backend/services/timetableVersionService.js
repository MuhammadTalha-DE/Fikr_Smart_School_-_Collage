const Timetable = require('../models/Timetable');
const TimetableVersion = require('../models/TimetableVersion');

const slotKey = (slot) => `${slot.day}|${Number(slot.period)}`;
const normalizeId = (value) => {
  if (!value) return '';
  return value._id ? value._id.toString() : value.toString();
};

const normalizeSlot = (slot) => ({
  day: slot.day,
  period: Number(slot.period),
  subject: slot.subject,
  teacherId: normalizeId(slot.teacherId),
  roomId: normalizeId(slot.roomId),
});

const getSlotChanges = (fromSlots = [], toSlots = []) => {
  const fromMap = new Map(fromSlots.map((slot) => [slotKey(slot), normalizeSlot(slot)]));
  const toMap = new Map(toSlots.map((slot) => [slotKey(slot), normalizeSlot(slot)]));
  const keys = [...new Set([...fromMap.keys(), ...toMap.keys()])].sort();

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  keys.forEach((key) => {
    const before = fromMap.get(key);
    const after = toMap.get(key);

    if (!before && after) added.push(after);
    else if (before && !after) removed.push(before);
    else if (JSON.stringify(before) !== JSON.stringify(after)) changed.push({ before, after });
    else unchanged.push(after);
  });

  return { added, removed, changed, unchanged };
};

const getVersionsForTimetable = async (timetableId) => {
  const timetable = await Timetable.findById(timetableId).lean();
  if (!timetable) throw new Error('Timetable not found');

  return TimetableVersion.find({
    classId: timetable.classId,
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
  })
    .populate('createdBy', 'name role')
    .sort({ version: -1 })
    .lean();
};

const compareVersions = async (leftVersionId, rightVersionId) => {
  const [left, right] = await Promise.all([
    TimetableVersion.findById(leftVersionId).lean(),
    TimetableVersion.findById(rightVersionId).lean(),
  ]);

  if (!left || !right) throw new Error('Version not found');

  return {
    from: {
      id: left._id,
      version: left.version,
      createdAt: left.createdAt,
    },
    to: {
      id: right._id,
      version: right.version,
      createdAt: right.createdAt,
    },
    ...getSlotChanges(left.slots, right.slots),
  };
};

const rollbackToVersion = async (versionId, userId) => {
  const version = await TimetableVersion.findById(versionId).lean();
  if (!version) throw new Error('Version not found');

  let timetable = await Timetable.findOne({
    classId: version.classId,
    term: version.term,
    academicYear: version.academicYear,
    scheduleType: version.scheduleType,
  });

  const previous = timetable ? timetable.toObject() : null;

  if (!timetable) {
    timetable = await Timetable.create({
      classId: version.classId,
      term: version.term,
      academicYear: version.academicYear,
      scheduleType: version.scheduleType,
      validFrom: version.validFrom,
      validUntil: version.validUntil,
      slots: version.slots,
      status: 'draft',
      isActive: true,
      createdBy: userId,
    });
  } else {
    timetable.validFrom = version.validFrom;
    timetable.validUntil = version.validUntil;
    timetable.slots = version.slots;
    timetable.createdBy = userId;
    timetable.isActive = true;
    await timetable.save();
  }

  return { timetable, previous, version };
};

const exportTemplate = async (timetableId) => {
  const timetable = await Timetable.findById(timetableId)
    .populate('classId', 'name grade')
    .lean();
  if (!timetable) throw new Error('Timetable not found');

  return {
    templateType: 'timetable',
    exportedAt: new Date().toISOString(),
    source: {
      timetableId: timetable._id,
      className: timetable.classId?.name || '',
      classGrade: timetable.classId?.grade || '',
    },
    term: timetable.term,
    academicYear: timetable.academicYear,
    scheduleType: timetable.scheduleType,
    validFrom: timetable.validFrom,
    validUntil: timetable.validUntil,
    slots: (timetable.slots || []).map(normalizeSlot),
  };
};

const importTemplate = async ({
  template,
  classId,
  term,
  academicYear,
  scheduleType,
  validFrom = null,
  validUntil = null,
  userId,
}) => {
  if (!template?.slots || !Array.isArray(template.slots)) {
    throw new Error('Invalid timetable template');
  }

  const target = {
    classId,
    term: term || template.term,
    academicYear: academicYear || template.academicYear,
    scheduleType: scheduleType || template.scheduleType || 'regular',
  };

  if (!target.classId || !target.term || !target.academicYear) {
    throw new Error('classId, term, and academicYear are required');
  }

  const slots = template.slots.map((slot) => ({
    day: slot.day,
    period: Number(slot.period),
    subject: slot.subject,
    teacherId: slot.teacherId,
    roomId: slot.roomId || null,
  }));

  let timetable = await Timetable.findOne(target);
  const previous = timetable ? timetable.toObject() : null;

  if (timetable) {
    timetable.slots = slots;
    timetable.validFrom = validFrom ?? template.validFrom ?? null;
    timetable.validUntil = validUntil ?? template.validUntil ?? null;
    timetable.status = 'draft';
    timetable.isActive = true;
    timetable.createdBy = userId;
    await timetable.save();
  } else {
    timetable = await Timetable.create({
      ...target,
      slots,
      validFrom: validFrom ?? template.validFrom ?? null,
      validUntil: validUntil ?? template.validUntil ?? null,
      status: 'draft',
      isActive: true,
      createdBy: userId,
    });
  }

  return { timetable, previous };
};

module.exports = {
  getSlotChanges,
  getVersionsForTimetable,
  compareVersions,
  rollbackToVersion,
  exportTemplate,
  importTemplate,
};
