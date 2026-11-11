const { cacheStore } = require('../utils/cacheStore');

const buildCacheKey = (req, namespace, varyBy = []) => {
  const varyParts = varyBy.map((field) => {
    if (field === 'role') return `role=${req.user?.role || 'anonymous'}`;
    if (field === 'user') return `user=${req.user?._id || 'anonymous'}`;

    if (field.startsWith('header:')) {
      const headerName = field.slice('header:'.length).toLowerCase();
      return `${field}=${req.headers[headerName] || ''}`;
    }

    return `${field}=`;
  });

  return [
    namespace,
    req.method,
    req.originalUrl || req.url,
    ...varyParts,
  ].join(':');
};

const cacheResponse = ({ namespace, ttlSeconds = 60, varyBy = [] } = {}) => {
  if (!namespace) {
    throw new Error('cacheResponse requires a namespace');
  }

  const ttlMs = ttlSeconds * 1000;

  return (req, res, next) => {
    if (req.method !== 'GET' || req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const cacheKey = buildCacheKey(req, namespace, varyBy);
    const cached = cacheStore.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
      return res.status(cached.statusCode).json(cached.body);
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      const statusCode = res.statusCode || 200;

      if (statusCode >= 200 && statusCode < 300) {
        cacheStore.set(cacheKey, { statusCode, body }, ttlMs);
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
      }

      return originalJson(body);
    };

    return next();
  };
};

const clearCacheNamespace = (namespace) => {
  cacheStore.clearNamespace(namespace);
};

const clearCache = (...namespaces) => (req, res, next) => {
  namespaces.forEach(clearCacheNamespace);
  next();
};

module.exports = {
  cacheResponse,
  clearCache,
  clearCacheNamespace,
};
