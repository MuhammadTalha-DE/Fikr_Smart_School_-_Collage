import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CloudRain, Laptop, MessageSquare } from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import { getWeatherImpactAnalytics } from '../../services/weatherService';

const WeatherLMSImpactPage = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContinuity = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getWeatherImpactAnalytics({ days });
      setAnalytics(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load LMS weather continuity data.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadContinuity();
  }, [loadContinuity]);

  const attendanceDrop = analytics?.attendance?.insights?.attendanceDropOnRainyDays ?? 0;
  const continuity = analytics?.lms;
  const remoteLearningLevel = useMemo(() => {
    return continuity?.insights?.readinessLevel || (attendanceDrop >= 10
      ? 'High readiness trigger'
      : attendanceDrop >= 5
        ? 'Moderate readiness trigger'
        : 'Routine monitoring');
  }, [attendanceDrop, continuity]);

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !analytics) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadContinuity} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">LMS vs Weather</p>
            <h1 className="text-3xl font-bold text-slate-900">Weather-driven Learning Continuity</h1>
            <p className="mt-1 text-sm text-slate-500">
              This module translates weather and attendance signals into LMS readiness guidance until dedicated LMS telemetry is added.
            </p>
          </div>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 lg:w-auto"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-800">
          Learning continuity data is now tracked from assignments, lesson planning, lesson completion, and submission activity, then correlated with weather-sensitive days for admin review.
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <CloudRain className="h-5 w-5 text-rose-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Rainy-day Attendance Drop</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{attendanceDrop}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Laptop className="h-5 w-5 text-indigo-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Remote Learning Trigger</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{remoteLearningLevel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Weather-triggered LMS Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{continuity?.insights?.weatherTriggeredDays ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <MessageSquare className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Suggested Messaging Mode</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {attendanceDrop >= 5 ? 'Parent + LMS notice' : 'Dashboard only'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Assignments Published</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{continuity?.totals?.assignmentsPublished ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Lesson Plans Prepared</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{continuity?.totals?.lessonPlansPrepared ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Remote Learning Days</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{continuity?.insights?.remoteLearningDays ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">Continuity Score Avg</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{continuity?.insights?.continuityScoreAverage ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            If rainy-day attendance drops remain high, publish assignments and recorded content earlier in the day.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Combine transport risk alerts with teacher lesson continuity plans to reduce class disruption.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Parent notices should reference both route conditions and the LMS fallback plan when weather is severe.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WeatherLMSImpactPage;
