/**
 * 📄 Reusable Pagination Middleware
 * 
 * Usage in route:
 *   const paginate = require('../utils/paginate');
 *   router.get('/', paginate(StudentModel, ['classId', 'userId']), (req, res) => {
 *     res.json(req.paginatedResult);
 *   });
 * 
 * Query params:
 *   ?page=1&limit=20&sort=-createdAt&name=John
 */

const paginate = (model, populateFields = [], selectFields = '') => {
  return async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const skip = (page - 1) * limit;
      const sort = req.query.sort || '-createdAt';

      // Build filter from query params (exclude pagination/sort params)
      const paginationKeys = ['page', 'limit', 'sort'];
      const filter = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (!paginationKeys.includes(key) && value !== '' && value !== undefined) {
          filter[key] = value;
        }
      }

      const [data, total] = await Promise.all([
        model
          .find(filter)
          .populate(populateFields)
          .select(selectFields)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        model.countDocuments(filter),
      ]);

      req.paginatedResult = {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = paginate;
