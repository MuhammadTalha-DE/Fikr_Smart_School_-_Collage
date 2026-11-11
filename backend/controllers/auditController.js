const AuditLog = require('../models/AuditLog');

const buildFilters = (query) => {
  const filter = {};

  if (query.action) filter.action = query.action.toUpperCase();
  if (query.entity) filter.entity = query.entity;
  if (query.role) filter['performedBy.role'] = query.role;
  if (query.userId) filter['performedBy.userId'] = query.userId;
  if (query.module) filter.module = query.module;
  if (query.status) filter.status = query.status;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  if (query.search) {
    filter.$or = [
      { description: { $regex: query.search, $options: 'i' } },
      { entity: { $regex: query.search, $options: 'i' } },
      { 'performedBy.name': { $regex: query.search, $options: 'i' } },
      { module: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const filter = buildFilters(req.query);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    throw error;
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).lean();
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    throw error;
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '30', 10));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary, actions, modules, entities, topUsers, recentFailures] = await Promise.all([
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            warning: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
            failure: { $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] } },
          },
        },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: since }, 'performedBy.userId': { $ne: null } } },
        {
          $group: {
            _id: {
              userId: '$performedBy.userId',
              name: '$performedBy.name',
              role: '$performedBy.role',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AuditLog.find({ createdAt: { $gte: since }, status: 'failure' }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.json({
      success: true,
      data: {
        windowDays: days,
        summary: summary[0] || { total: 0, success: 0, warning: 0, failure: 0 },
        actions,
        modules,
        entities,
        topUsers: topUsers.map((item) => ({
          userId: item._id.userId,
          name: item._id.name,
          role: item._id.role,
          count: item.count,
        })),
        recentFailures,
      },
    });
  } catch (error) {
    throw error;
  }
};

exports.getAuditFilterOptions = async (req, res) => {
  try {
    const [actions, entities, roles, modules] = await Promise.all([
      AuditLog.distinct('action'),
      AuditLog.distinct('entity'),
      AuditLog.distinct('performedBy.role'),
      AuditLog.distinct('module'),
    ]);

    res.json({
      success: true,
      data: {
        actions: actions.filter(Boolean).sort(),
        entities: entities.filter(Boolean).sort(),
        roles: roles.filter(Boolean).sort(),
        modules: modules.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    throw error;
  }
};

