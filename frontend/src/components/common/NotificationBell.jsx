import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, ChevronRight, MailWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationCenterService';

const severityTone = {
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  high: 'bg-orange-50 text-orange-700 border-orange-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

const NotificationBell = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const response = await getMyNotifications({ limit: 8 });
      setReceipts(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // Keep the bell resilient even if inbox fails.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadInbox();
  }, [user?._id]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = () => {
      loadInbox();
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadReceipts = useMemo(
    () => receipts.filter((item) => !item.isRead).length,
    [receipts]
  );

  const openCenter = () => {
    setOpen(false);
    if (user?.role === 'admin') {
      navigate('/admin/notifications');
      return;
    }
    navigate('/notifications');
  };

  const handleMarkRead = async (receiptId) => {
    try {
      await markNotificationRead(receiptId);
      setReceipts((current) => current.map((item) => (
        item._id === receiptId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      // Keep UI non-blocking.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setReceipts((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      // Keep UI non-blocking.
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadInbox();
        }}
        className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {(unreadCount || unreadReceipts) > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {Math.min(unreadCount || unreadReceipts, 99)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">Loading notifications...</div>
            ) : receipts.length ? (
              <div className="divide-y divide-slate-100">
                {receipts.map((receipt) => {
                  const notification = receipt.notification || {};
                  const tone = severityTone[notification.severity] || severityTone.info;

                  return (
                    <button
                      key={receipt._id}
                      onClick={() => {
                        if (!receipt.isRead) {
                          handleMarkRead(receipt._id);
                        }
                        openCenter();
                      }}
                      className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 ${
                        receipt.isRead ? 'bg-white' : 'bg-sky-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${tone}`}>
                              {notification.severity || 'info'}
                            </span>
                            <span className="text-[11px] uppercase tracking-wide text-slate-400">
                              {notification.type || 'notification'}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                            {notification.title || 'Notification'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {notification.message || 'Open the inbox to see details.'}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                  <MailWarning className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400">New alerts, reminders, and broadcasts will appear here.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <button
              onClick={openCenter}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Notification Center
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
