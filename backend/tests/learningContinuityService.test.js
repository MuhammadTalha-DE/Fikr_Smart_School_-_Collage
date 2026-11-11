import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const learningContinuityService = require('../services/learningContinuityService');
const LearningContinuityLog = require('../models/LearningContinuityLog');
const WeatherHistory = require('../models/WeatherHistory');

describe('learningContinuityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds an LMS continuity summary with weather-triggered insights', async () => {
    vi.spyOn(LearningContinuityLog, 'find').mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          date: '2026-06-10T00:00:00.000Z',
          source: 'assignment',
          deliveryMode: 'hybrid',
          assignmentsPublished: 2,
          lessonPlansPrepared: 1,
          lessonsCompleted: 0,
          submissionsReceived: 3,
          resourcesShared: 1,
          liveSessionsScheduled: 1,
          continuityScore: 64,
          triggeredByWeather: true,
        },
        {
          date: '2026-06-11T00:00:00.000Z',
          source: 'lesson_completion',
          deliveryMode: 'in_person',
          assignmentsPublished: 0,
          lessonPlansPrepared: 1,
          lessonsCompleted: 1,
          submissionsReceived: 1,
          resourcesShared: 0,
          liveSessionsScheduled: 0,
          continuityScore: 40,
          triggeredByWeather: false,
        },
      ]),
    });

    vi.spyOn(WeatherHistory, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { recordedAt: '2026-06-10T06:00:00.000Z', condition: 'Rain', temperature: 29 },
        { recordedAt: '2026-06-11T06:00:00.000Z', condition: 'Clear', temperature: 33 },
      ]),
    });

    const summary = await learningContinuityService.getSummary(30);

    expect(summary.daily).toHaveLength(2);
    expect(summary.totals.assignmentsPublished).toBe(2);
    expect(summary.insights.weatherTriggeredDays).toBe(1);
    expect(summary.insights.remoteLearningDays).toBe(0);
    expect(summary.insights.readinessLevel).toBe('Routine monitoring');
    expect(summary.daily[0].isRainy).toBe(true);
  });
});
