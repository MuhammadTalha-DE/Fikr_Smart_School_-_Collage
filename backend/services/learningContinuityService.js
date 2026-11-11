const LearningContinuityLog = require('../models/LearningContinuityLog');
const WeatherHistory = require('../models/WeatherHistory');

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateKey = (value) => startOfDay(value).toISOString().split('T')[0];

const safeAverage = (values) => {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
};

class LearningContinuityService {
  buildContinuityScore(update = {}) {
    return (
      (Number(update.assignmentsPublished) || 0) * 18 +
      (Number(update.lessonPlansPrepared) || 0) * 14 +
      (Number(update.lessonsCompleted) || 0) * 20 +
      (Number(update.submissionsReceived) || 0) * 6 +
      (Number(update.resourcesShared) || 0) * 8 +
      (Number(update.liveSessionsScheduled) || 0) * 16 +
      (update.deliveryMode === 'remote' ? 12 : 0) +
      (update.deliveryMode === 'hybrid' ? 8 : 0) +
      (update.triggeredByWeather ? 10 : 0)
    );
  }

  async recordEvent({
    date = new Date(),
    teacher = null,
    classId = null,
    subject = null,
    source = 'manual',
    increments = {},
    setFields = {},
    notes = '',
    metadata = {},
  }) {
    const normalizedDate = startOfDay(date);
    const filter = {
      date: normalizedDate,
      teacher: teacher || null,
      class: classId || null,
      subject: subject || null,
      source,
    };

    const existing = await LearningContinuityLog.findOne(filter);
    const current = existing || new LearningContinuityLog(filter);

    Object.entries(increments).forEach(([key, value]) => {
      current[key] = Number(current[key] || 0) + Number(value || 0);
    });

    Object.entries(setFields).forEach(([key, value]) => {
      if (value !== undefined) {
        current[key] = value;
      }
    });

    if (notes) {
      current.notes = [current.notes, notes].filter(Boolean).join(' | ');
    }

    current.metadata = {
      ...(current.metadata || {}),
      ...(metadata || {}),
    };
    current.continuityScore = this.buildContinuityScore(current);

    await current.save();
    return current;
  }

  async getSummary(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - Number(days || 30));
    since.setHours(0, 0, 0, 0);

    const [logs, weatherHistory] = await Promise.all([
      LearningContinuityLog.find({ date: { $gte: since } })
        .populate('class', 'name')
        .populate('subject', 'name code')
        .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
        .sort({ date: 1, createdAt: 1 })
        .lean(),
      WeatherHistory.find({ recordedAt: { $gte: since } }).sort({ recordedAt: 1 }).lean(),
    ]);

    const weatherByDay = {};
    weatherHistory.forEach((entry) => {
      const key = dateKey(entry.recordedAt);
      if (!weatherByDay[key]) {
        weatherByDay[key] = [];
      }
      weatherByDay[key].push(entry);
    });

    const dailyMap = {};
    logs.forEach((log) => {
      const key = dateKey(log.date);
      if (!dailyMap[key]) {
        dailyMap[key] = {
          date: key,
          assignmentsPublished: 0,
          lessonPlansPrepared: 0,
          lessonsCompleted: 0,
          submissionsReceived: 0,
          resourcesShared: 0,
          liveSessionsScheduled: 0,
          continuityScore: 0,
          triggeredByWeather: false,
          deliveryModes: new Set(),
          sources: new Set(),
        };
      }

      const row = dailyMap[key];
      row.assignmentsPublished += Number(log.assignmentsPublished || 0);
      row.lessonPlansPrepared += Number(log.lessonPlansPrepared || 0);
      row.lessonsCompleted += Number(log.lessonsCompleted || 0);
      row.submissionsReceived += Number(log.submissionsReceived || 0);
      row.resourcesShared += Number(log.resourcesShared || 0);
      row.liveSessionsScheduled += Number(log.liveSessionsScheduled || 0);
      row.continuityScore += Number(log.continuityScore || 0);
      row.triggeredByWeather = row.triggeredByWeather || Boolean(log.triggeredByWeather);
      row.deliveryModes.add(log.deliveryMode || 'in_person');
      row.sources.add(log.source || 'manual');
    });

    const daily = Object.values(dailyMap).map((row) => {
      const weatherSamples = weatherByDay[row.date] || [];
      const rainy = weatherSamples.some((sample) => ['rain', 'rainy', 'drizzle', 'storm', 'thunderstorm'].includes(String(sample.condition || '').toLowerCase()));
      const avgTemp = safeAverage(weatherSamples.map((sample) => Number(sample.temperature || 0)));

      return {
        ...row,
        deliveryModes: Array.from(row.deliveryModes),
        sources: Array.from(row.sources),
        isRainy: rainy,
        averageTemperature: avgTemp,
      };
    });

    const rainyDays = daily.filter((row) => row.isRainy);
    const normalDays = daily.filter((row) => !row.isRainy);
    const weatherTriggeredDays = daily.filter((row) => row.triggeredByWeather);
    const remoteDays = daily.filter((row) => row.deliveryModes.includes('remote'));
    const hybridDays = daily.filter((row) => row.deliveryModes.includes('hybrid'));

    return {
      days,
      daily,
      totals: {
        logs: logs.length,
        assignmentsPublished: daily.reduce((sum, row) => sum + row.assignmentsPublished, 0),
        lessonPlansPrepared: daily.reduce((sum, row) => sum + row.lessonPlansPrepared, 0),
        lessonsCompleted: daily.reduce((sum, row) => sum + row.lessonsCompleted, 0),
        submissionsReceived: daily.reduce((sum, row) => sum + row.submissionsReceived, 0),
        resourcesShared: daily.reduce((sum, row) => sum + row.resourcesShared, 0),
        liveSessionsScheduled: daily.reduce((sum, row) => sum + row.liveSessionsScheduled, 0),
      },
      insights: {
        continuityScoreAverage: safeAverage(daily.map((row) => Number(row.continuityScore || 0))),
        rainyDayContinuityScore: safeAverage(rainyDays.map((row) => Number(row.continuityScore || 0))),
        normalDayContinuityScore: safeAverage(normalDays.map((row) => Number(row.continuityScore || 0))),
        submissionsOnRainyDays: safeAverage(rainyDays.map((row) => Number(row.submissionsReceived || 0))),
        submissionsOnNormalDays: safeAverage(normalDays.map((row) => Number(row.submissionsReceived || 0))),
        weatherTriggeredDays: weatherTriggeredDays.length,
        remoteLearningDays: remoteDays.length,
        hybridLearningDays: hybridDays.length,
        readinessLevel:
          weatherTriggeredDays.length >= 5 || remoteDays.length >= 3
            ? 'High readiness trigger'
            : weatherTriggeredDays.length >= 2 || hybridDays.length >= 3
              ? 'Moderate readiness trigger'
              : 'Routine monitoring',
      },
    };
  }
}

module.exports = new LearningContinuityService();
