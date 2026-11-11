import request from 'supertest';
import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { createApp } = require('../app');

describe('API documentation', () => {
  it('serves OpenAPI documentation with auth, error, and module metadata', async () => {
    const response = await request(createApp()).get('/api/docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.components.securitySchemes.bearerAuth).toBeTruthy();
    expect(response.body.components.schemas.ErrorResponse).toBeTruthy();
    expect(response.body.components.responses.ServerError).toBeTruthy();
    expect(response.body['x-authentication'].loginEndpoint).toBe('POST /api/auth/login');
    expect(response.body['x-error-format'].success).toBe(false);
    expect(response.body['x-modules'].length).toBeGreaterThan(20);
    expect(response.body.paths['/api/auth/login'].post.requestBody).toBeTruthy();
    expect(response.body.paths['/api/health'].get.responses[200]).toBeTruthy();
  });

  it('serves the browsable API documentation page', async () => {
    const response = await request(createApp()).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('School Management API Docs');
    expect(response.text).toContain('/api/docs/openapi.json');
  });
});
