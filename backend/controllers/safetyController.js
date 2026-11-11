const EmergencyAlert = require('../models/EmergencyAlert');
const IncidentReport = require('../models/IncidentReport');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const notificationCenterService = require('../services/notificationCenterService');

const ALERT_TYPES = ['emergency', 'weather', 'transport', 'hostel', 'medical', 'security', 'fire', 'natural_disaster', 'lockdown', 'other'];
const ALERT_STATUSES = ['active', 'resolved', 'dismissed'];
const INCIDENT_TYPES = ['bullying', 'injury', 'transport', 'hostel', 'theft', 'fire', 'medical', 'discipline', 'safety_hazard', 'other'];
const INCIDENT_STATUSES = ['reported', 'investigating', 'resolved', 'dismissed'];
const CONTACT_RELATIONSHIPS = ['guardian', 'ambulance', 'police', 'fire', 'hospital', 'school_staff', 'other'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const TARGET_ROLES = ['all', 'admin', 'teacher', 'student', 'parent', 'warden', 'librarian'];
const REPORTER_ROLE_ALIASES = {
  transport: 'transport_staff',
  transport_staff: 'transport_staff',
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const phonePattern = /^[+()\-\s\d]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const failValidation = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const clampPriority = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(10, Math.max(0, Math.round(parsed)));
};

const cleanTargetRoles = (roles) => {
  const list = Array.isArray(roles) ? roles : ['all'];
  const unique = [...new Set(list.map(text).filter(Boolean))];
  if (!unique.length) return ['all'];
  const invalid = unique.find((role) => !TARGET_ROLES.includes(role));
  if (invalid) failValidation(`Invalid target role: ${invalid}`);
  return unique.includes('all') ? ['all'] : unique;
};

const validateAlertPayload = (payload = {}, { partial = false } = {}) => {
  const data = {};
  const title = text(payload.title);
  const message = text(payload.message);
  const type = text(payload.type) || 'emergency';
  const severity = text(payload.severity) || 'medium';
  const status = text(payload.status);

  if (!partial || payload.title !== undefined) {
    if (title.length < 5 || title.length > 120) failValidation('Alert title must be 5 to 120 characters');
    data.title = title;
  }
  if (!partial || payload.message !== undefined) {
    if (message.length < 10 || message.length > 1000) failValidation('Alert message must be 10 to 1000 characters');
    data.message = message;
  }
  if (!partial || payload.type !== undefined) {
    if (!ALERT_TYPES.includes(type)) failValidation('Select a valid alert type');
    data.type = type;
  }
  if (!partial || payload.severity !== undefined) {
    if (!SEVERITIES.includes(severity)) failValidation('Select a valid severity');
    data.severity = severity;
  }
  if (payload.status !== undefined) {
    if (!ALERT_STATUSES.includes(status)) failValidation('Select a valid alert status');
    data.status = status;
  }
  if (!partial || payload.targetRoles !== undefined) {
    data.targetRoles = cleanTargetRoles(payload.targetRoles);
  }
  if (payload.targetClasses !== undefined) data.targetClasses = Array.isArray(payload.targetClasses) ? payload.targetClasses : [];
  if (payload.location !== undefined) data.location = text(payload.location).slice(0, 160);

  return data;
};

const validateIncidentPayload = (payload = {}, user, { partial = false } = {}) => {
  const data = {};
  const title = text(payload.title);
  const description = text(payload.description);
  const type = text(payload.type);
  const severity = text(payload.severity) || 'medium';
  const status = text(payload.status);

  if (!partial || payload.title !== undefined) {
    if (title.length < 5 || title.length > 140) failValidation('Incident title must be 5 to 140 characters');
    data.title = title;
  }
  if (!partial || payload.description !== undefined) {
    if (description.length < 20 || description.length > 2000) failValidation('Incident description must be 20 to 2000 characters');
    data.description = description;
  }
  if (!partial || payload.type !== undefined) {
    if (!INCIDENT_TYPES.includes(type)) failValidation('Select a valid incident type');
    data.type = type;
  }
  if (!partial || payload.severity !== undefined) {
    if (!SEVERITIES.includes(severity)) failValidation('Select a valid severity');
    data.severity = severity;
  }
  if (payload.status !== undefined) {
    if (!INCIDENT_STATUSES.includes(status)) failValidation('Select a valid incident status');
    data.status = status;
  }

  if (payload.location !== undefined) data.location = text(payload.location).slice(0, 160);
  if (payload.involvedStudents !== undefined) data.involvedStudents = Array.isArray(payload.involvedStudents) ? payload.involvedStudents : [];
  if (payload.class !== undefined) data.class = payload.class || null;
  if (payload.assignedTo !== undefined) data.assignedTo = payload.assignedTo || null;
  if (payload.resolutionNotes !== undefined) data.resolutionNotes = text(payload.resolutionNotes).slice(0, 1000);
  if (payload.isAnonymous !== undefined) data.isAnonymous = Boolean(payload.isAnonymous);

  const reporterRole = REPORTER_ROLE_ALIASES[user?.role] || user?.role;
  if (!partial && !['student', 'teacher', 'parent', 'warden', 'admin', 'librarian', 'transport_staff'].includes(reporterRole)) {
    failValidation('Your role is not allowed to report safety incidents');
  }
  if (!partial) data.reporterRole = reporterRole;

  return data;
};

const validateContactPayload = (payload = {}) => {
  const name = text(payload.name);
  const relationship = text(payload.relationship) || 'other';
  const phone = text(payload.phone);
  const alternatePhone = text(payload.alternatePhone);
  const email = text(payload.email);

  if (name.length < 2 || name.length > 100) failValidation('Contact name must be 2 to 100 characters');
  if (!CONTACT_RELATIONSHIPS.includes(relationship)) failValidation('Select a valid contact relationship');
  if (!phonePattern.test(phone)) failValidation('Enter a valid emergency phone number');
  if (alternatePhone && !phonePattern.test(alternatePhone)) failValidation('Enter a valid alternate phone number');
  if (email && !emailPattern.test(email)) failValidation('Enter a valid emergency contact email');

  return {
    name,
    relationship,
    phone,
    alternatePhone,
    email,
    address: text(payload.address).slice(0, 240),
    priority: clampPriority(payload.priority),
    notes: text(payload.notes).slice(0, 500),
    isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
  };
};

const alertVisibilityFilter = (user, base = {}) => {
  if (user?.role === 'admin') return base;
  return {
    ...base,
    $or: [{ targetRoles: 'all' }, { targetRoles: user?.role }],
  };
};

const incidentVisibilityFilter = (user, base = {}) => {
  if (user?.role === 'admin') return base;
  if (user?.role === 'student' || user?.role === 'parent') return { ...base, reportedBy: user._id };
  if (user?.role === 'teacher' || user?.role === 'warden') {
    return {
      ...base,
      $or: [{ reportedBy: user._id }, { reporterRole: user.role }],
    };
  }
  return { ...base, reportedBy: user._id };
};

const actor = (req) => ({ userId: req.user?._id, role: req.user?.role, name: req.user?.name });

const auditSafety = (req, action, entity, entityId, description, changes = null) => {
  auditService.log({
    action,
    module: 'safety',
    entity,
    entityId,
    description,
    performedBy: actor(req),
    changes,
    req,
  });
};

const notifyAlertAudience = (alert, req) => {
  const roles = alert.targetRoles?.includes('all') ? [] : alert.targetRoles || [];
  const sendToAll = !roles.length;
  const channels = ['in_app'];
  if (['high', 'critical'].includes(alert.severity)) channels.push('email');

  notificationCenterService.createAndDispatch({
    title: alert.title,
    message: alert.message,
    type: 'safety',
    severity: alert.severity,
    channels,
    sendToAll,
    roles,
    metadata: {
      entity: 'EmergencyAlert',
      entityId: alert._id,
      link: '/safety/alerts',
      context: { alertType: alert.type, location: alert.location },
    },
    sourceModule: 'safety',
  }, req.user, req).catch(console.error);
};

const notifyIncidentStakeholders = (incident, req) => {
  const critical = ['high', 'critical'].includes(incident.severity);
  notificationCenterService.createAndDispatch({
    title: critical ? `Critical Incident: ${incident.title}` : `New Incident Report: ${incident.title}`,
    message: incident.description,
    type: 'safety',
    severity: critical ? incident.severity : 'medium',
    channels: critical ? ['in_app', 'email'] : ['in_app'],
    roles: ['admin'],
    metadata: {
      entity: 'IncidentReport',
      entityId: incident._id,
      link: '/admin/safety-dashboard',
      context: { incidentType: incident.type, location: incident.location },
    },
    sourceModule: 'safety',
  }, req.user, req).catch(console.error);
};

// =====================================================
// EMERGENCY ALERTS
// =====================================================

// @desc    Create an emergency alert
// @route   POST /api/safety/alerts
exports.createAlert = async (req, res) => {
  try {
    const payload = validateAlertPayload(req.body);

    const alert = await EmergencyAlert.create({
      ...payload,
      createdBy: req.user._id,
    });

    notifyAlertAudience(alert, req);

    if (['high', 'critical'].includes(alert.severity)) {
      const notifyQuery = {};
      if (!alert.targetRoles.includes('all')) {
        notifyQuery.role = { $in: alert.targetRoles };
      }
      const users = await User.find(notifyQuery).select('email name');
      notificationService.broadcastAlert({ alert, users }).catch(console.error);
    }

    auditSafety(req, 'CREATE', 'EmergencyAlert', alert._id, `Safety alert "${alert.title}" created`);
    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Get all alerts (filtered by role)
// @route   GET /api/safety/alerts
exports.getAlerts = async (req, res) => {
  try {
    const filter = {};
    const { status, type, severity } = req.query;

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const scopedFilter = alertVisibilityFilter(req.user, filter);

    const alerts = await EmergencyAlert.find(scopedFilter)
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('acknowledgedBy.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, alerts, total: alerts.length });
  } catch (error) {
    throw error;
  }
};

// @desc    Get single alert
// @route   GET /api/safety/alerts/:id
exports.getAlertById = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('acknowledgedBy.user', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    throw error;
  }
};

// @desc    Update alert status
// @route   PUT /api/safety/alerts/:id
exports.updateAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const before = alert.toObject();
    const payload = validateAlertPayload(req.body, { partial: true });

    Object.assign(alert, payload);

    if (payload.status === 'resolved') {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    auditSafety(req, 'UPDATE', 'EmergencyAlert', alert._id, `Safety alert "${alert.title}" updated`, {
      before: {
        title: before.title,
        message: before.message,
        severity: before.severity,
        status: before.status,
        targetRoles: before.targetRoles,
      },
      after: {
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        targetRoles: alert.targetRoles,
      },
    });
    res.json({ success: true, alert });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge an alert
// @route   POST /api/safety/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Check if already acknowledged
    const alreadyAcknowledged = alert.acknowledgedBy.find(
      (a) => a.user.toString() === req.user._id.toString()
    );

    if (!alreadyAcknowledged) {
      alert.acknowledgedBy.push({ user: req.user._id });
      await alert.save();
      auditSafety(req, 'UPDATE', 'EmergencyAlert', alert._id, `Safety alert "${alert.title}" acknowledged`);
    }

    res.json({ success: true, alert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete alert
// @route   DELETE /api/safety/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    await alert.deleteOne();
    auditSafety(req, 'DELETE', 'EmergencyAlert', alert._id, `Safety alert "${alert.title}" deleted`);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    throw error;
  }
};

// =====================================================
// INCIDENT REPORTS
// =====================================================

// @desc    Report an incident
// @route   POST /api/safety/incidents
exports.createIncident = async (req, res) => {
  try {
    const payload = validateIncidentPayload(req.body, req.user);

    const incident = await IncidentReport.create({
      ...payload,
      reportedBy: req.user._id,
    });

    notifyIncidentStakeholders(incident, req);

    if (['high', 'critical'].includes(incident.severity)) {
      const admins = await User.find({ role: 'admin' }).select('email name');
      notificationService.broadcastAlert({
        alert: { title: `Critical Incident: ${incident.title}`, message: incident.description, type: incident.type },
        users: admins,
      }).catch(console.error);
    }

    auditSafety(req, 'CREATE', 'IncidentReport', incident._id, `Incident report "${incident.title}" created`);
    res.status(201).json({ success: true, incident });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Get all incidents
// @route   GET /api/safety/incidents
exports.getIncidents = async (req, res) => {
  try {
    const filter = {};
    const { status, type, severity } = req.query;

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const scopedFilter = incidentVisibilityFilter(req.user, filter);

    const incidents = await IncidentReport.find(scopedFilter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('involvedStudents', 'name rollNumber class')
      .populate('class', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, incidents, total: incidents.length });
  } catch (error) {
    throw error;
  }
};

// @desc    Get single incident
// @route   GET /api/safety/incidents/:id
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await IncidentReport.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('involvedStudents', 'name rollNumber class')
      .populate('class', 'name');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.json({ success: true, incident });
  } catch (error) {
    throw error;
  }
};

// @desc    Update incident status
// @route   PUT /api/safety/incidents/:id
exports.updateIncident = async (req, res) => {
  try {
    const incident = await IncidentReport.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const before = incident.toObject();
    const payload = validateIncidentPayload(req.body, req.user, { partial: true });

    Object.assign(incident, payload);

    if (payload.status === 'resolved') {
      incident.resolvedBy = req.user._id;
      incident.resolvedAt = new Date();
      if (!incident.isAnonymous && incident.reportedBy) {
        notificationCenterService.createAndDispatch({
          title: `Incident Resolved: ${incident.title}`,
          message: incident.resolutionNotes || 'Your safety incident report has been marked as resolved.',
          type: 'safety',
          severity: 'medium',
          channels: ['in_app'],
          userIds: [incident.reportedBy],
          metadata: {
            entity: 'IncidentReport',
            entityId: incident._id,
            link: '/safety/incidents',
          },
          sourceModule: 'safety',
        }, req.user, req).catch(console.error);
      }
    }

    await incident.save();

    auditSafety(req, 'UPDATE', 'IncidentReport', incident._id, `Incident report "${incident.title}" updated`, {
      before: {
        status: before.status,
        severity: before.severity,
        assignedTo: before.assignedTo,
        resolutionNotes: before.resolutionNotes,
      },
      after: {
        status: incident.status,
        severity: incident.severity,
        assignedTo: incident.assignedTo,
        resolutionNotes: incident.resolutionNotes,
      },
    });
    res.json({ success: true, incident });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Delete incident
// @route   DELETE /api/safety/incidents/:id
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await IncidentReport.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    await incident.deleteOne();
    auditSafety(req, 'DELETE', 'IncidentReport', incident._id, `Incident report "${incident.title}" deleted`);
    res.json({ success: true, message: 'Incident deleted' });
  } catch (error) {
    throw error;
  }
};

// =====================================================
// EMERGENCY CONTACTS
// =====================================================

// @desc    Add emergency contact
// @route   POST /api/safety/contacts
exports.createContact = async (req, res) => {
  try {
    const payload = validateContactPayload(req.body);

    const contact = await EmergencyContact.create({
      ...payload,
      addedBy: req.user._id,
    });

    auditSafety(req, 'CREATE', 'EmergencyContact', contact._id, `Emergency contact "${contact.name}" created`);
    res.status(201).json({ success: true, contact });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Get all emergency contacts
// @route   GET /api/safety/contacts
exports.getContacts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.relationship) filter.relationship = req.query.relationship;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const contacts = await EmergencyContact.find(filter)
      .populate('addedBy', 'name email')
      .sort({ priority: -1, name: 1 });

    res.json({ success: true, contacts });
  } catch (error) {
    throw error;
  }
};

// @desc    Update emergency contact
// @route   PUT /api/safety/contacts/:id
exports.updateContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    const before = contact.toObject();
    const payload = validateContactPayload({ ...contact.toObject(), ...req.body });
    Object.assign(contact, payload);
    await contact.save();
    auditSafety(req, 'UPDATE', 'EmergencyContact', contact._id, `Emergency contact "${contact.name}" updated`, {
      before: {
        name: before.name,
        relationship: before.relationship,
        phone: before.phone,
        alternatePhone: before.alternatePhone,
        email: before.email,
        priority: before.priority,
        isActive: before.isActive,
      },
      after: {
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        alternatePhone: contact.alternatePhone,
        email: contact.email,
        priority: contact.priority,
        isActive: contact.isActive,
      },
    });
    res.json({ success: true, contact });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/safety/contacts/:id
exports.deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    await contact.deleteOne();
    auditSafety(req, 'DELETE', 'EmergencyContact', contact._id, `Emergency contact "${contact.name}" deleted`);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    throw error;
  }
};

// =====================================================
// DASHBOARD STATS
// =====================================================

// @desc    Get safety dashboard stats
// @route   GET /api/safety/stats
exports.getSafetyStats = async (req, res) => {
  try {
    const alertFilter = alertVisibilityFilter(req.user);
    const incidentFilter = incidentVisibilityFilter(req.user);
    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      totalIncidents,
      pendingIncidents,
      criticalAlerts,
      recentAlerts,
      recentIncidents,
      alertsByType,
      incidentsByType,
    ] = await Promise.all([
      EmergencyAlert.countDocuments(alertFilter),
      EmergencyAlert.countDocuments(alertVisibilityFilter(req.user, { status: 'active' })),
      EmergencyAlert.countDocuments(alertVisibilityFilter(req.user, { status: 'resolved' })),
      IncidentReport.countDocuments(incidentFilter),
      IncidentReport.countDocuments(incidentVisibilityFilter(req.user, { status: { $in: ['reported', 'investigating'] } })),
      EmergencyAlert.countDocuments(alertVisibilityFilter(req.user, { severity: 'critical', status: 'active' })),
      EmergencyAlert.find(alertVisibilityFilter(req.user, { status: 'active' }))
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      IncidentReport.find(incidentFilter)
        .populate('reportedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      EmergencyAlert.aggregate([
        { $match: alertFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      IncidentReport.aggregate([
        { $match: incidentFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        totalIncidents,
        pendingIncidents,
        criticalAlerts,
        recentAlerts,
        recentIncidents,
        alertsByType,
        incidentsByType,
      },
    });
  } catch (error) {
    throw error;
  }
};

