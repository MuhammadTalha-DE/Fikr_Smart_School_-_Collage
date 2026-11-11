const fs = require('fs');
const path = require('path');
const { apiModules } = require('./apiModuleCatalog');

const ROUTES_DIR = path.join(__dirname, '..', 'routes');
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const DIRECT_ROUTE_RE = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/gi;
const ROUTE_CHAIN_RE = /router\.route\s*\(\s*(['"`])([^'"`]+)\1\s*\)(.*)/i;
const CHAIN_METHOD_RE = /\.(get|post|put|patch|delete)\s*\(/gi;
const AUTHORIZE_RE = /authorize\s*\(([^)]*)\)/i;

const normalizePath = (value) => {
  const normalized = value
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}');

  return normalized || '/';
};

const joinPaths = (basePath, routePath) => {
  if (!routePath || routePath === '/') return normalizePath(basePath);
  return normalizePath(`${basePath}/${routePath}`);
};

const toTitle = (value) => value
  .replace(/[{}]/g, '')
  .replace(/[-_/]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const makeOperationId = (method, fullPath) => `${method}_${fullPath}`
  .replace(/[{}]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const extractRoles = (source) => {
  const match = source.match(AUTHORIZE_RE);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((role) => role.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);
};

const extractPathParams = (fullPath) => {
  const params = new Set();
  const matches = fullPath.matchAll(/\{([^}]+)\}/g);
  for (const match of matches) {
    params.add(match[1]);
  }

  return [...params].map((name) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: `${toTitle(name)} identifier.`,
  }));
};

const inferRequestSchema = (moduleName, fullPath) => {
  if (fullPath === '/api/auth/login') {
    return { $ref: '#/components/schemas/LoginRequest' };
  }

  if (fullPath === '/api/auth/forgot-password') {
    return { $ref: '#/components/schemas/ForgotPasswordRequest' };
  }

  if (fullPath.startsWith('/api/auth/reset-password')) {
    return { $ref: '#/components/schemas/ResetPasswordRequest' };
  }

  return {
    allOf: [
      { $ref: '#/components/schemas/GenericRequest' },
    ],
    description: `${moduleName} payload. See the route controller for module-specific required fields.`,
  };
};

const makeRequestBody = (method, moduleName, fullPath) => {
  if (!['post', 'put', 'patch'].includes(method)) return undefined;

  return {
    required: method === 'post',
    content: {
      'application/json': {
        schema: inferRequestSchema(moduleName, fullPath),
      },
      'multipart/form-data': {
        schema: { $ref: '#/components/schemas/MultipartRequest' },
      },
    },
  };
};

const makeResponses = (method) => {
  const successCode = method === 'post' ? '201' : '200';
  return {
    [successCode]: {
      description: 'Successful response.',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/SuccessResponse' },
        },
      },
    },
    400: { $ref: '#/components/responses/BadRequest' },
    401: { $ref: '#/components/responses/Unauthorized' },
    403: { $ref: '#/components/responses/Forbidden' },
    404: { $ref: '#/components/responses/NotFound' },
    422: { $ref: '#/components/responses/ValidationError' },
    429: { $ref: '#/components/responses/RateLimited' },
    500: { $ref: '#/components/responses/ServerError' },
  };
};

const routeUsesAuth = (line, fileUsesProtect, moduleInfo) => {
  if (moduleInfo.public) return false;
  return fileUsesProtect || /\bprotect\b/.test(line) || /authorize\s*\(/.test(line);
};

const addRoute = (routes, moduleInfo, method, routePath, sourceLine, fileUsesProtect) => {
  const fullPath = joinPaths(moduleInfo.basePath, routePath);
  const roles = extractRoles(sourceLine);
  const authRequired = routeUsesAuth(sourceLine, fileUsesProtect, moduleInfo);

  routes.push({
    method: method.toLowerCase(),
    fullPath,
    routePath,
    moduleInfo,
    roles,
    authRequired,
    sourceLine: sourceLine.trim(),
  });
};

const parseRouteFile = (moduleInfo) => {
  const routePath = path.join(ROUTES_DIR, moduleInfo.routeFile);
  if (!fs.existsSync(routePath)) {
    return [];
  }

  const source = fs.readFileSync(routePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const fileUsesProtect = /router\.use\s*\(\s*protect\s*\)/.test(source);
  const routes = [];
  let activeRoutePath = null;

  lines.forEach((line) => {
    let directMatch;
    DIRECT_ROUTE_RE.lastIndex = 0;
    while ((directMatch = DIRECT_ROUTE_RE.exec(line)) !== null) {
      addRoute(routes, moduleInfo, directMatch[1], directMatch[3], line, fileUsesProtect);
    }

    const chainMatch = line.match(ROUTE_CHAIN_RE);
    if (chainMatch) {
      activeRoutePath = chainMatch[2];
      const trailing = chainMatch[3] || '';
      let methodMatch;
      CHAIN_METHOD_RE.lastIndex = 0;
      while ((methodMatch = CHAIN_METHOD_RE.exec(trailing)) !== null) {
        addRoute(routes, moduleInfo, methodMatch[1], activeRoutePath, line, fileUsesProtect);
      }
      if (line.includes(';')) activeRoutePath = null;
      return;
    }

    if (activeRoutePath) {
      let methodMatch;
      CHAIN_METHOD_RE.lastIndex = 0;
      while ((methodMatch = CHAIN_METHOD_RE.exec(line)) !== null) {
        addRoute(routes, moduleInfo, methodMatch[1], activeRoutePath, line, fileUsesProtect);
      }
      if (line.includes(';')) activeRoutePath = null;
    }
  });

  return routes;
};

const buildOperation = (route) => {
  const requestBody = makeRequestBody(route.method, route.moduleInfo.name, route.fullPath);
  const roles = route.roles.length ? route.roles.join(', ') : 'Authenticated role allowed by controller middleware';
  const descriptionParts = [
    `${route.method.toUpperCase()} ${route.fullPath}`,
    `Module: ${route.moduleInfo.name}.`,
  ];

  if (route.authRequired) {
    descriptionParts.push(`Requires Bearer JWT authentication. Roles: ${roles}.`);
  } else {
    descriptionParts.push('Public endpoint or authentication handled outside this route.');
  }

  const operation = {
    tags: [route.moduleInfo.name],
    summary: `${route.method.toUpperCase()} ${toTitle(route.routePath === '/' ? route.moduleInfo.name : route.routePath)}`,
    description: descriptionParts.join(' '),
    operationId: makeOperationId(route.method, route.fullPath),
    parameters: [
      ...extractPathParams(route.fullPath),
      ...(route.method === 'get' ? [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1 },
          description: 'Optional page number for list endpoints.',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 200 },
          description: 'Optional page size for list endpoints.',
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Optional search text for endpoints that support searching.',
        },
      ] : []),
    ],
    responses: makeResponses(route.method),
    'x-source-file': route.moduleInfo.routeFile,
    'x-module-base-path': route.moduleInfo.basePath,
    'x-roles': route.roles,
  };

  if (route.authRequired) {
    operation.security = [{ bearerAuth: [] }];
  }

  if (requestBody) {
    operation.requestBody = requestBody;
  }

  return operation;
};

const buildPaths = () => {
  const paths = {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        description: 'Returns API status, MongoDB connection status, uptime, and timestamp.',
        operationId: 'get_api_health',
        responses: {
          200: {
            description: 'API health status.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
  };

  const seen = new Set();
  apiModules.flatMap(parseRouteFile).forEach((route) => {
    if (!HTTP_METHODS.includes(route.method)) return;

    const key = `${route.method} ${route.fullPath}`;
    if (seen.has(key)) return;
    seen.add(key);

    if (!paths[route.fullPath]) paths[route.fullPath] = {};
    paths[route.fullPath][route.method] = buildOperation(route);
  });

  return Object.keys(paths)
    .sort()
    .reduce((sorted, routePath) => {
      sorted[routePath] = paths[routePath];
      return sorted;
    }, {});
};

const createOpenApiDocument = (req) => {
  const host = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';

  return {
    openapi: '3.0.3',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: [
        'Backend API documentation for the School Management System.',
        'Use the Bearer JWT token returned by POST /api/auth/login for protected routes.',
        'Errors use a centralized response format with success, message, errors, timestamp, and path fields.',
      ].join(' '),
    },
    servers: [
      { url: host, description: 'Current backend server' },
      { url: 'http://localhost:5000', description: 'Local development backend' },
    ],
    tags: [
      { name: 'System', description: 'Health and API documentation endpoints.' },
      ...apiModules.map((moduleInfo) => ({
        name: moduleInfo.name,
        description: `${moduleInfo.description} Base path: ${moduleInfo.basePath}.`,
      })),
    ],
    paths: buildPaths(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Send the JWT access token as: Authorization: Bearer <token>.',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@school.test' },
            password: { type: 'string', format: 'password', minLength: 8, example: 'StrongPass123!' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@school.test' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string', format: 'password', minLength: 8, example: 'NewStrongPass123!' },
          },
        },
        GenericRequest: {
          type: 'object',
          additionalProperties: true,
          example: {
            name: 'Example value',
            status: 'active',
          },
        },
        MultipartRequest: {
          type: 'object',
          additionalProperties: true,
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Uploaded file when the endpoint accepts multipart data.',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          additionalProperties: true,
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Request completed successfully' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'message', 'timestamp', 'path'],
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              nullable: true,
              items: { type: 'string' },
              example: ['Name is required'],
            },
            stack: {
              type: 'string',
              nullable: true,
              description: 'Included outside production only.',
            },
            timestamp: { type: 'string', format: 'date-time', example: '2026-07-04T10:30:00.000Z' },
            path: { type: 'string', example: '/api/students' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'OK' },
            mongodb: { type: 'string', enum: ['connected', 'disconnected'] },
            uptime: { type: 'number', example: 132.42 },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Unauthorized: {
          description: 'Missing, invalid, or expired authentication token.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Authenticated user does not have permission for this route.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource or route not found.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Validation failed.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        RateLimited: {
          description: 'Too many requests. Retry after the rate limit window resets.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServerError: {
          description: 'Centralized server error response.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    'x-authentication': {
      type: 'Bearer JWT',
      loginEndpoint: 'POST /api/auth/login',
      header: 'Authorization: Bearer <token>',
      notes: [
        'Most module endpoints require protect middleware and role authorization.',
        'Role requirements are exposed on operations through x-roles when they can be inferred from route middleware.',
      ],
    },
    'x-error-format': {
      success: false,
      message: 'Human-readable error message',
      errors: ['Optional validation or field-level errors'],
      stack: 'Development-only stack trace',
      timestamp: 'ISO timestamp',
      path: 'Original request path',
    },
    'x-modules': apiModules.map(({ name, basePath, routeFile, description, public: isPublic }) => ({
      name,
      basePath,
      routeFile,
      description,
      public: Boolean(isPublic),
    })),
  };
};

module.exports = {
  createOpenApiDocument,
  parseRouteFile,
};
