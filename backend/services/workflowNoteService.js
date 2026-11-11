const WorkflowNote = require('../models/WorkflowNote');

exports.createNote = async ({ entityType, entityId, actorId, actorRole, actionType = 'note', note = '', visibility = 'shared', metadata = {} }) =>
  WorkflowNote.create({
    entityType,
    entityId: String(entityId),
    actorId,
    actorRole,
    actionType,
    note,
    visibility,
    metadata,
  });

exports.getNotesForItems = async (items = []) => {
  if (!items.length) {
    return new Map();
  }

  const filters = items.map((item) => ({
    entityType: item.entityType,
    entityId: String(item.entityId),
  }));

  const notes = await WorkflowNote.find({ $or: filters })
    .populate('actorId', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  const grouped = new Map();
  notes.forEach((note) => {
    const key = `${note.entityType}:${note.entityId}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(note);
  });

  return grouped;
};
