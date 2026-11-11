import express from 'express';
import request from 'supertest';
import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { cacheResponse, clearCache } = require('../middleware/cacheMiddleware');
const { cacheStore } = require('../utils/cacheStore');

const createApp = () => {
  const app = express();
  app.use(express.json());

  let count = 0;

  app.get('/cached', cacheResponse({ namespace: 'test', ttlSeconds: 60 }), (req, res) => {
    count += 1;
    res.json({ count, query: req.query.value || null });
  });

  app.post('/clear', clearCache('test'), (req, res) => {
    res.json({ success: true });
  });

  return app;
};

describe('cache middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cacheStore.clearAll();
  });

  it('returns cached GET responses for matching URLs', async () => {
    const app = createApp();

    const first = await request(app).get('/cached?value=a');
    const second = await request(app).get('/cached?value=a');

    expect(first.status).toBe(200);
    expect(first.headers['x-cache']).toBe('MISS');
    expect(first.body.count).toBe(1);
    expect(second.status).toBe(200);
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body.count).toBe(1);
  });

  it('separates cache entries by URL including query string', async () => {
    const app = createApp();

    const first = await request(app).get('/cached?value=a');
    const second = await request(app).get('/cached?value=b');

    expect(first.body).toEqual({ count: 1, query: 'a' });
    expect(second.body).toEqual({ count: 2, query: 'b' });
    expect(second.headers['x-cache']).toBe('MISS');
  });

  it('allows callers to bypass the cache with Cache-Control no-cache', async () => {
    const app = createApp();

    await request(app).get('/cached');
    const response = await request(app)
      .get('/cached')
      .set('Cache-Control', 'no-cache');

    expect(response.body.count).toBe(2);
    expect(response.headers['x-cache']).toBeUndefined();
  });

  it('clears cached entries by namespace', async () => {
    const app = createApp();

    await request(app).get('/cached');
    await request(app).post('/clear');
    const response = await request(app).get('/cached');

    expect(response.headers['x-cache']).toBe('MISS');
    expect(response.body.count).toBe(2);
  });
});
