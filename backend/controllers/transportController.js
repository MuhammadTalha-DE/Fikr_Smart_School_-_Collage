const asyncHandler = require('express-async-handler');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const TransportAllocation = require('../models/TransportAllocation');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Notification = require('../models/Notification');
const WeatherHistory = require('../models/WeatherHistory');
const transportFeeService = require('../services/transportFeeService');
const weatherAlertService = require('../services/weatherAlertService');
const notificationAutomationService = require('../services/notificationAutomationService');

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceFromLatLngInKm = (lat1, lng1, lat2, lng2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const withPickupStopName = (allocation) => {
  if (!allocation?.route?.stops) {
    return allocation;
  }

  const stop = allocation.route.stops.find((item) => item.order === allocation.pickupStop);
  return {
    ...allocation,
    pickupStopName: stop ? stop.location : 'Unknown',
  };
};

const getRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find(
    req.query.search
      ? { name: { $regex: req.query.search, $options: 'i' } }
      : {}
  ).sort({ name: 1 });
  res.json({ success: true, routes });
});

const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }
  res.json({ success: true, route });
});

const createRoute = asyncHandler(async (req, res) => {
  const route = await Route.create(req.body);
  res.status(201).json({ success: true, route });
});

const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }
  res.json({ success: true, route });
});

const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByIdAndDelete(req.params.id);
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }
  res.json({ success: true, message: 'Route deleted' });
});

const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find(
    req.query.search
      ? { registrationNumber: { $regex: req.query.search, $options: 'i' } }
      : {}
  ).sort({ registrationNumber: 1 });
  res.json({ success: true, vehicles });
});

const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.json({ success: true, vehicle });
});

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json({ success: true, vehicle });
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.json({ success: true, vehicle });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.json({ success: true, message: 'Vehicle deleted' });
});

const getAllocations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.route) filter.route = req.query.route;
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const allocations = await TransportAllocation.find(filter)
    .populate({
      path: 'student',
      select: 'userId admissionNumber',
      populate: { path: 'userId', select: 'name avatar' },
    })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber capacity driverName driverContact')
    .sort({ startDate: -1 })
    .lean();

  res.json({ success: true, allocations: allocations.map(withPickupStopName) });
});

const createAllocation = asyncHandler(async (req, res) => {
  const { student, route, vehicle, pickupStop, startDate, endDate } = req.body;
  if (!student || !route || !vehicle || pickupStop === undefined) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const allocation = await TransportAllocation.create({
    student,
    route,
    vehicle,
    pickupStop,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    isActive: true,
    monthlyFee: req.body.monthlyFee || 0,
  });

  const populated = await TransportAllocation.findById(allocation._id)
    .populate({ path: 'student', select: 'userId admissionNumber', populate: { path: 'userId', select: 'name avatar' } })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber capacity driverName driverContact')
    .lean();

  res.status(201).json({ success: true, allocation: withPickupStopName(populated) });
});

const updateAllocation = asyncHandler(async (req, res) => {
  const allocation = await TransportAllocation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({ path: 'student', select: 'userId admissionNumber', populate: { path: 'userId', select: 'name avatar' } })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber capacity driverName driverContact')
    .lean();

  if (!allocation) {
    res.status(404);
    throw new Error('Allocation not found');
  }
  res.json({ success: true, allocation: withPickupStopName(allocation) });
});

const deleteAllocation = asyncHandler(async (req, res) => {
  const allocation = await TransportAllocation.findByIdAndDelete(req.params.id);
  if (!allocation) {
    res.status(404);
    throw new Error('Allocation not found');
  }
  res.json({ success: true, message: 'Allocation deleted' });
});

const chargeTransportFee = asyncHandler(async (req, res) => {
  const allocation = await TransportAllocation.findById(req.params.id);
  if (!allocation) {
    res.status(404);
    throw new Error('Allocation not found');
  }
  if (!allocation.monthlyFee || allocation.monthlyFee <= 0) {
    res.status(400);
    throw new Error('Monthly fee not set');
  }

  const instalment = await transportFeeService.addTransportFeeForStudent(
    allocation.student,
    allocation.monthlyFee
  );

  res.json({ success: true, instalment });
});

const chargeAllTransportFees = asyncHandler(async (req, res) => {
  const allocations = await TransportAllocation.find({
    isActive: true,
    monthlyFee: { $gt: 0 },
  });

  let count = 0;
  for (const allocation of allocations) {
    try {
      await transportFeeService.addTransportFeeForStudent(allocation.student, allocation.monthlyFee);
      count += 1;
    } catch (error) {
      console.error('Failed to charge fee for allocation', allocation._id, error.message);
    }
  }

  res.json({ success: true, charged: count, total: allocations.length });
});

const getRoster = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.route) filter.route = req.query.route;
  if (req.query.vehicle) filter.vehicle = req.query.vehicle;

  const allocations = await TransportAllocation.find(filter)
    .populate({
      path: 'student',
      select: 'userId admissionNumber',
      populate: { path: 'userId', select: 'name avatar' },
    })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber capacity driverName driverContact')
    .lean();

  res.json({ success: true, roster: allocations.map(withPickupStopName) });
});

const getTripSheet = asyncHandler(async (req, res) => {
  const { vehicle, route } = req.query;
  const filter = { isActive: true };
  if (vehicle) filter.vehicle = vehicle;
  if (route) filter.route = route;

  const allocations = await TransportAllocation.find(filter)
    .populate({
      path: 'student',
      select: 'userId admissionNumber',
      populate: { path: 'userId', select: 'name' },
    })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber capacity driverName driverContact')
    .lean();

  const vehicleData = {};

  for (const allocation of allocations) {
    const vehicleId = allocation.vehicle?._id?.toString();
    const routeId = allocation.route?._id?.toString();
    if (!vehicleId || !routeId) continue;

    if (!vehicleData[vehicleId]) {
      vehicleData[vehicleId] = {
        vehicle: allocation.vehicle,
        routes: {},
      };
    }
    if (!vehicleData[vehicleId].routes[routeId]) {
      vehicleData[vehicleId].routes[routeId] = {
        route: allocation.route,
        students: [],
      };
    }
    const stop = allocation.route?.stops?.find((item) => item.order === allocation.pickupStop);
    vehicleData[vehicleId].routes[routeId].students.push({
      student: allocation.student,
      pickupStop: stop ? stop.location : 'Unknown',
      pickupOrder: allocation.pickupStop,
    });
  }

  for (const vehicleItem of Object.values(vehicleData)) {
    for (const routeItem of Object.values(vehicleItem.routes)) {
      routeItem.students.sort((left, right) => left.pickupOrder - right.pickupOrder);
    }
  }

  res.json({ success: true, tripSheet: vehicleData });
});

const updateVehicleLocation = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { lng, lat } = req.body;

  const vehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    {
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat],
        lastUpdated: new Date(),
      },
    },
    { new: true }
  );

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const io = req.app.get('io');
  const allocations = await TransportAllocation.find({ vehicle: vehicleId, isActive: true })
    .populate({ path: 'student', select: 'userId', populate: { path: 'userId', select: 'name' } })
    .populate('route', 'stops')
    .lean();

  for (const allocation of allocations) {
    const stop = allocation.route?.stops?.find((item) => item.order === allocation.pickupStop);
    if (!stop || stop.lat === undefined || stop.lng === undefined) {
      continue;
    }

    const distance = getDistanceFromLatLngInKm(lat, lng, stop.lat, stop.lng);
    if (distance < 0.5) {
      const parent = await Parent.findOne({ children: allocation.student?._id }).lean();
      if (parent && io) {
        io.to(String(parent.userId)).emit('bus-near-stop', {
          message: `The bus is approaching ${stop.location} for your child.`,
          studentName: allocation.student?.userId?.name,
        });
      }
    }
  }

  if (io) {
    io.to(`vehicle-${vehicleId}`).emit('vehicle-location-update', {
      vehicleId,
      lng,
      lat,
      timestamp: new Date(),
    });
  }

  res.json({ success: true, vehicle });
});

const getMyAllocation = asyncHandler(async (req, res) => {
  let studentId = null;
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (student) studentId = student._id;
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user._id });
    if (parent?.children?.length > 0) {
      studentId = parent.children[0];
    }
  }

  if (!studentId) {
    res.status(404);
    throw new Error('No student profile found');
  }

  const allocation = await TransportAllocation.findOne({ student: studentId, isActive: true })
    .populate('route', 'name stops')
    .populate('vehicle', 'registrationNumber driverName driverContact')
    .populate({
      path: 'student',
      select: 'userId admissionNumber',
      populate: { path: 'userId', select: 'name avatar' },
    })
    .lean();

  if (!allocation) {
    res.status(404);
    throw new Error('No active allocation');
  }

  res.json({ success: true, allocation: withPickupStopName(allocation) });
});

const getDashboardOverview = asyncHandler(async (req, res) => {
  const [routes, vehicles, allocations, latestWeather, recentAlerts] = await Promise.all([
    Route.find({}).lean(),
    Vehicle.find({}).lean(),
    TransportAllocation.find({ isActive: true })
      .populate({
        path: 'student',
        select: 'userId admissionNumber',
        populate: { path: 'userId', select: 'name avatar' },
      })
      .populate('route', 'name stops')
      .populate('vehicle', 'registrationNumber driverName driverContact')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    WeatherHistory.findOne().sort({ recordedAt: -1 }).lean(),
    Notification.find({ sourceModule: 'transport' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title message severity status createdAt metadata stats')
      .lean(),
  ]);

  const transportRisk = latestWeather
    ? weatherAlertService.assessTransportRisk(latestWeather)
    : { overallRisk: 'low', risks: [], suggestedAction: 'No action needed' };

  res.json({
    success: true,
    data: {
      summary: {
        totalRoutes: routes.length,
        activeRoutes: routes.filter((route) => route.isActive !== false).length,
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter((vehicle) => vehicle.isActive !== false).length,
        activeAllocations: allocations.length,
        feeEnabledAllocations: allocations.filter((allocation) => Number(allocation.monthlyFee || 0) > 0).length,
      },
      transportRisk,
      latestWeather,
      fleet: vehicles.slice(0, 6),
      rosterPreview: allocations.map(withPickupStopName),
      recentAlerts,
    },
  });
});

const listDelayAlerts = asyncHandler(async (req, res) => {
  const alerts = await Notification.find({
    sourceModule: 'transport',
    type: 'transport',
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({ success: true, data: alerts });
});

const createDelayAlert = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    routeId,
    delayMinutes = 10,
    severity = 'medium',
    reason = '',
    title,
    message,
  } = req.body;

  if (!vehicleId && !routeId) {
    res.status(400);
    throw new Error('A vehicle or route is required');
  }

  const [vehicle, route] = await Promise.all([
    vehicleId ? Vehicle.findById(vehicleId).lean() : Promise.resolve(null),
    routeId ? Route.findById(routeId).lean() : Promise.resolve(null),
  ]);

  const filter = { isActive: true };
  if (vehicleId) filter.vehicle = vehicleId;
  if (routeId) filter.route = routeId;

  const allocations = await TransportAllocation.find(filter).select('student route vehicle').lean();
  const studentIds = allocations.map((allocation) => allocation.student);
  const audienceUserIds = await notificationAutomationService.getAudienceForStudents(studentIds, {
    includeStudents: true,
    includeParents: true,
  });

  const finalTitle = title || `Transport delay${route?.name ? ` - ${route.name}` : ''}`;
  const finalMessage = message || `School transport is delayed by about ${delayMinutes} minutes${reason ? ` due to ${reason}` : ''}. Please plan drop-off or pickup accordingly.`;

  const notification = await notificationAutomationService.dispatch({
    title: finalTitle,
    message: finalMessage,
    type: 'transport',
    severity,
    channels: ['in_app', 'email'],
    roles: ['admin', 'transport'],
    userIds: audienceUserIds,
    metadata: {
      entity: 'TransportDelay',
      link: '/notifications',
      context: {
        vehicleId: vehicle?._id || null,
        vehicleNumber: vehicle?.registrationNumber || '',
        routeId: route?._id || null,
        routeName: route?.name || '',
        delayMinutes,
        reason,
      },
    },
    sourceModule: 'transport',
  }, req.user, req);

  res.status(201).json({
    success: true,
    data: notification,
    affectedAllocations: allocations.length,
  });
});

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllocations,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  chargeTransportFee,
  chargeAllTransportFees,
  getRoster,
  getTripSheet,
  updateVehicleLocation,
  getMyAllocation,
  getDashboardOverview,
  listDelayAlerts,
  createDelayAlert,
};
