import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  Mail,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import { useAuth } from '../../context/AuthContext';
import {
  getMyNotifications,
  getNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../../services/notificationCenterService';

const NotificationInbox = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inboxResponse, prefsResponse] = await Promise.all([
        getMyNotifications({ limit: 50 }),
        getNotificationPreferences(),
      ]);
      setReceipts(inboxResponse.data.data || []);
      setPreferences(prefsResponse.data.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unreadCount = useMemo(
    () => receipts.filter((item) => !item.isRead).length,
    [receipts]
  );
  const readRate = receipts.length ? Math.round(((receipts.length - unreadCount) / receipts.length) * 100) : 0;

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setReceipts((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
  };

  const handleMarkRead = async (receiptId) => {
    await markNotificationRead(receiptId);
    setReceipts((current) => current.map((item) => (
      item._id === receiptId
        ? { ...item, isRead: true, readAt: new Date().toISOString() }
        : item
    )));
  };

  const handlePreferenceChange = async (section, key, value) => {
    if (!preferences) return;

    const next = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    };
    setPreferences(next);
    setSaving(true);
    try {
      await updateNotificationPreferences({ [section]: next[section] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout role={user?.role}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Inbox"
          title="Notification Center"
          subtitle="Stay on top of weather alerts, safety escalations, attendance reminders, and school-wide updates from one inbox."
          meta={[
            `${receipts.length} total notifications`,
            `${unreadCount} unread`,
            `${readRate}% read rate`,
          ]}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashboardStatCard icon={Bell} label="Unread" value={unreadCount} helper="Needs attention now" tone="amber" />
          <DashboardStatCard icon={CheckCheck} label="Read Rate" value={`${readRate}%`} helper="How quickly you clear inbox items" tone="emerald" />
          <DashboardStatCard icon={Mail} label="Total" value={receipts.length} helper="Recent delivered notifications" tone="blue" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={Bell}
              title="Recent Notifications"
              subtitle="Your latest alerts and reminders"
              tone="blue"
              action={
                <button
                  onClick={handleMarkAllRead}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Mark all read
                </button>
              }
            />

            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading notifications...</div>
            ) : receipts.length ? (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div
                    key={receipt._id}
                    className={`rounded-3xl border p-4 transition ${
                      receipt.isRead
                        ? 'border-slate-200 bg-white'
                        : 'border-sky-200 bg-sky-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">
                            {receipt.notification?.type || 'notification'}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-slate-400">
                            {receipt.notification?.severity || 'info'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-950">
                          {receipt.notification?.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {receipt.notification?.message}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!receipt.isRead ? (
                        <button
                          onClick={() => handleMarkRead(receipt._id)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">No notifications in your inbox yet.</div>
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader
              icon={SlidersHorizontal}
              title="Preferences"
              subtitle={saving ? 'Saving your preferences...' : 'Control how you receive alerts'}
              tone="violet"
            />

            {preferences ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Channels</p>
                  <div className="space-y-3">
                    {[
                      ['inApp', 'In-app'],
                      ['email', 'Email'],
                      ['sms', 'SMS'],
                      ['push', 'Push'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-700">{label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(preferences.channels?.[key])}
                          onChange={(event) => handlePreferenceChange('channels', key, event.target.checked)}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Categories</p>
                  <div className="space-y-3">
                    {Object.entries(preferences.categories || {}).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-sm font-semibold capitalize text-slate-700">{key}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(event) => handlePreferenceChange('categories', key, event.target.checked)}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                    <p>Critical school safety notices should stay enabled so you do not miss emergency instructions.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">Loading preferences...</div>
            )}
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationInbox;
