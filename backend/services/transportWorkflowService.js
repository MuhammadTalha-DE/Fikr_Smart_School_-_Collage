const TransportIncident = require('../models/TransportIncident');
const Notification = require('../models/Notification');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const workflowNoteService = require('./workflowNoteService');

const attachNotes = async (entityType, items) => {
  const notesMap = await workflowNoteService.getNotesForItems(
    items.map((item) => ({ entityType, entityId: item._id }))
  );

  return items.map((item) => {
    const notes = notesMap.get(`${entityType}:${item._id}`) || [];
    return {
      ...item,
      noteCount: notes.length,
      latestNote: notes[0] || null,
    };
  });
};

exports.getOverview = async (userId) => {
  const [incidents, notifications] = await Promise.all([
    TransportIncident.find().sort({ createdAt: -1 }).limit(20).lean(),
    Notification.find({ sourceModule: 'transport' }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return {
    summary: {
      totalIncidents: incidents.length,
      pendingApproval: incidents.filter((item) => item.status === 'pending').length,
      approved: incidents.filter((item) => item.status === 'approved' || item.status === 'notified').length,
      parentNoticesSent: incidents.filter((item) => item.parentNoticeStatus === 'sent').length,
      critical: incidents.filter((item) => ['high', 'critical'].includes(item.severity)).length,
      createdByMe: incidents.filter((item) => String(item.createdBy) === String(userId)).length,
    },
    recentIncidents: incidents.slice(0, 5),
    recentNotifications: notifications.slice(0, 4),
  };
};

exports.getIncidentCenter = async () => {
  const incidents = await TransportIncident.find()
    .populate('routeId', 'name')
    .populate('vehicleId', 'registrationNumber')
    .populate('createdBy', 'name role')
    .populate('approvedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  const items = await attachNotes('transport_incident', incidents);

  return {
    summary: {
      total: items.length,
      pendingApproval: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      notified: items.filter((item) => item.status === 'notified').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
      parentNoticesSent: items.filter((item) => item.parentNoticeStatus === 'sent').length,
    },
    items,
  };
};

exports.createIncident = async (userId, payload) => {
  if (!payload.routeId && !payload.vehicleId) {
    throw new Error('A route or vehicle is required');
  }

  const [route, vehicle] = await Promise.all([
    payload.routeId ? Route.findById(payload.routeId).select('name').lean() : Promise.resolve(null),
    payload.vehicleId ? Vehicle.findById(payload.vehicleId).select('registrationNumber').lean() : Promise.resolve(null),
  ]);

  const record = await TransportIncident.create({
    title: payload.title || `${payload.category === 'incident' ? 'Transport incident' : 'Transport delay'}${route?.name ? ` - ${route.name}` : vehicle?.registrationNumber ? ` - ${vehicle.registrationNumber}` : ''}`,
    category: payload.category || 'delay',
    description: payload.description || payload.reason || '',
    routeId: payload.routeId || null,
    vehicleId: payload.vehicleId || null,
    delayMinutes: Number(payload.delayMinutes || 0),
    severity: payload.severity || 'medium',
    occurredAt: payload.occurredAt || new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  if (record.description) {
    await workflowNoteService.createNote({
      entityType: 'transport_incident',
      entityId: record._id,
      actorId: userId,
      actorRole: 'transport',
      actionType: 'submit',
      note: record.description,
      visibility: 'shared',
    });
  }

  return record;
};

exports.addWorkflowNote = async (userId, payload) => {
  const record = await TransportIncident.findById(payload.entityId).select('_id').lean();
  if (!record) {
    throw new Error('Workflow item not found');
  }

  return workflowNoteService.createNote({
    entityType: 'transport_incident',
    entityId: payload.entityId,
    actorId: userId,
    actorRole: 'transport',
    actionType: payload.actionType || 'note',
    note: payload.note || '',
    visibility: 'shared',
  });
};
