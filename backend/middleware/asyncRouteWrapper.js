const ROUTE_METHODS = [
  'all',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

const isErrorMiddleware = (handler) => handler.length === 4;

const wrapAsyncHandler = (handler) => {
  if (typeof handler !== 'function' || isErrorMiddleware(handler) || handler.__asyncWrapped) {
    return handler;
  }

  const wrapped = function asyncWrappedRoute(req, res, next) {
    try {
      const result = handler(req, res, next);
      if (result && typeof result.catch === 'function') {
        result.catch(next);
      }
      return result;
    } catch (error) {
      return next(error);
    }
  };

  Object.defineProperty(wrapped, '__asyncWrapped', { value: true });
  return wrapped;
};

const patchRouterMethod = (router, method) => {
  const original = router[method];

  if (typeof original !== 'function' || original.__asyncWrapperPatched) return;

  const patched = function patchedRouterMethod(path, ...handlers) {
    const wrappedHandlers = handlers.map((handler) => {
      if (Array.isArray(handler)) {
        return handler.map(wrapAsyncHandler);
      }
      return wrapAsyncHandler(handler);
    });

    return original.call(this, path, ...wrappedHandlers);
  };

  Object.defineProperty(patched, '__asyncWrapperPatched', { value: true });
  router[method] = patched;
};

const patchAsyncRoutes = (express) => {
  const router = express.Router;
  const route = express.Route;

  ROUTE_METHODS.forEach((method) => {
    patchRouterMethod(router, method);
    patchRouterMethod(route.prototype, method);
  });
};

module.exports = {
  patchAsyncRoutes,
  wrapAsyncHandler,
};
