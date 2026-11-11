const formatErrorResponse = (err, req) => ({
  success: false,
  message: err.message || 'Internal server error',
  errors: err.errors,
  stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  timestamp: new Date().toISOString(),
  path: req.originalUrl,
});

const getErrorStatus = (err, res) => {
  if (err.statusCode) return err.statusCode;
  if (err.status) return err.status;
  return res.statusCode === 200 ? 500 : res.statusCode;
};

const errorHandler = (err, req, res, next) => {
  const statusCode = getErrorStatus(err, res);

  console.error(`[Error] ${new Date().toISOString()} ${req.method} ${req.originalUrl}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry - this record already exists',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  return res.status(statusCode).json(formatErrorResponse(err, req));
};

module.exports = {
  errorHandler,
  formatErrorResponse,
  getErrorStatus,
};
