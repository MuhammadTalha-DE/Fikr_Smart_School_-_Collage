/**
 * Weather Access Middleware
 * Restricts weather routes based on user role
 */
const weatherAccess = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole) || allowedRoles.includes('all')) {
      return next();
    }

    // If route is for specific role, check if user matches
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This weather data requires role: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { weatherAccess };
