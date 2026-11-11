/**
 * 📦 Standardized API Response Format
 * 
 * All API endpoints should use these helpers so that the frontend
 * always receives a consistent shape:
 * 
 * Success: { success: true, data: {...}, message: "Success", timestamp: "..." }
 * Error:   { success: false, message: "Error message", errors: [...], timestamp: "..." }
 * Paginated: { success: true, data: [...], pagination: { page, limit, total, pages }, message: "...", timestamp: "..." }
 */

class ApiResponse {
  /**
   * Send a success response
   * @param {object} res - Express response object
   * @param {*} data - Response payload
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a paginated success response
   * @param {object} res - Express response object
   * @param {Array} data - Array of items
   * @param {object} pagination - { page, limit, total, pages }
   * @param {string} message - Success message
   */
  static paginated(res, data = [], pagination = { page: 1, limit: 20, total: 0, pages: 0 }, message = 'Success') {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: Number(pagination.page) || 1,
        limit: Number(pagination.limit) || 20,
        total: Number(pagination.total) || 0,
        pages: Number(pagination.pages) || 0,
      },
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a created response (201)
   * @param {object} res - Express response object
   * @param {*} data - Created resource
   * @param {string} message - Success message
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {Array|null} errors - Validation errors array
   */
  static error(res, message = 'Internal server error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Send a not found response (404)
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

  /**
   * Send a validation error response (422)
   */
  static validationError(res, errors, message = 'Validation failed') {
    return ApiResponse.error(res, message, 422, errors);
  }

  /**
   * Send a too many requests response (429)
   */
  static tooManyRequests(res, message = 'Too many requests, please try again later') {
    return ApiResponse.error(res, message, 429);
  }
}

module.exports = ApiResponse;
