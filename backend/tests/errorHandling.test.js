import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { errorHandler } = require('../middleware/errorHandler');
const { wrapAsyncHandler } = require('../middleware/asyncRouteWrapper');

describe('centralized error handling', () => {
  it('formats async controller failures through the central error handler', async () => {
    const app = express();

    app.get('/boom', wrapAsyncHandler(async () => {
      const error = new Error('Phase 12 test failure');
      error.statusCode = 503;
      throw error;
    }));

    app.use(errorHandler);

    const response = await request(app).get('/boom');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Phase 12 test failure');
    expect(response.body.path).toBe('/boom');
    expect(response.body.timestamp).toBeTruthy();
  });
});
