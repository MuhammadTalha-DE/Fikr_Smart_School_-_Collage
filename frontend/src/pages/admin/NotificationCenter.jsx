import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BellRing,
  CheckSquare,
  Edit3,
  Megaphone,
  Send,
  SlidersHorizontal,
  Square,
  Trash2,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  bulkDeleteNotificationCampaigns,
  createNotificationCampaign,
  deleteNotificationCampaign,
  getNotificationAdminOptions,
  getNotificationAdminOverview,
  getNotificationCampaignById,
  getNotificationCampaigns,
  getNotificationReceipts,
  sendNotificationCampaign,
  updateNotificationCampaign,
} from '../../services/notificationCenterService';

const initialComposer = {
  title: '',
  message: '',
  type: 'announcement',
  severity: 'info',
  channels: ['in_app', 'email'],
  roles: ['teacher', 'student', 'parent'],
  sendToAll: false,
  sendNow: true,
};

const NotificationCenter = () => {
  const [overview, setOverview] = useState(null);
  const [options, setOptions] = useState({ types: [], severities: [], statuses: [] });
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [composer, setComposer] = useState(initialComposer);
  const [filters, setFilters] = useState({ status: '', type: '', severity: '', search: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadCenter = async (nextFilters = filters) => {
    const [overviewResponse, optionsResponse, campaignsResponse] = await Promise.all([
      getNotificationAdminOverview(),
      getNotificationAdminOptions(),
      getNotificationCampaigns({ ...nextFilters, limit: 20 }),
    ]);

    setOverview(overviewResponse.data.data);
    setOptions(optionsResponse.data.data || { types: [], severities: [], statuses: [] });
    setCampaigns(campaignsResponse.data.data || []);
    setSelectedIds((current) => current.filter((id) => (campaignsResponse.data.data || []).some((campaign) => campaign._id === id)));

    if (campaignsResponse.data.data?.length) {
      await loadCampaignDetails(campaignsResponse.data.data[0]._id);
    } else {
      setSelectedCampaign(null);
      setReceipts([]);
    }
  };

  const loadCampaignDetails = async (campaignId) => {
    const [campaignResponse, receiptsResponse] = await Promise.all([
      getNotificationCampaignById(campaignId),
      getNotificationReceipts(campaignId, { limit: 20 }),
    ]);
    setSelectedCampaign(campaignResponse.data.data);
    setReceipts(receiptsResponse.data.data || []);
  };

  useEffect(() => {
    loadCenter();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCenter(filters);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.status, filters.type, filters.severity, filters.search]);

  const deliveryRate = useMemo(() => {
    const delivered = overview?.summary?.deliveredRecipients || 0;
    const total = overview?.summary?.readRecipients || 0;
    return delivered && total ? Math.round((total / delivered) * 100) : 0;
  }, [overview]);

  const handleRoleToggle = (role) => {
    setComposer((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
  };

  const handleChannelToggle = (channel) => {
    setComposer((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!composer.channels.length) {
      toast.error('Select at least one delivery channel');
      return;
    }
    if (!composer.sendToAll && !composer.roles.length) {
      toast.error('Select target roles or send to all users');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateNotificationCampaign(editingId, composer);
        if (composer.sendNow) {
          await sendNotificationCampaign(editingId);
        }
        toast.success(composer.sendNow ? 'Notification campaign updated and queued' : 'Notification campaign updated');
      } else {
        await createNotificationCampaign(composer);
        toast.success(composer.sendNow ? 'Notification campaign created and queued' : 'Notification campaign saved as draft');
      }
      setComposer(initialComposer);
      setEditingId(null);
      await loadCenter();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Notification campaign action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (campaign) => {
    setEditingId(campaign._id);
    setComposer({
      title: campaign.title || '',
      message: campaign.message || '',
      type: campaign.type || 'announcement',
      severity: campaign.severity || 'info',
      channels: campaign.channels?.length ? campaign.channels : ['in_app'],
      roles: campaign.audience?.roles?.length ? campaign.audience.roles : [],
      sendToAll: Boolean(campaign.audience?.sendToAll),
      sendNow: false,
      metadata: campaign.metadata || {},
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setComposer(initialComposer);
  };

  const toggleSelected = (campaignId) => {
    setSelectedIds((current) => (
      current.includes(campaignId)
        ? current.filter((id) => id !== campaignId)
        : [...current, campaignId]
    ));
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (
      current.length === campaigns.length ? [] : campaigns.map((campaign) => campaign._id)
    ));
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Delete this notification campaign and all recipient receipts?')) return;

    try {
      await deleteNotificationCampaign(campaignId);
      toast.success('Notification campaign deleted');
      setSelectedIds((current) => current.filter((id) => id !== campaignId));
      await loadCenter(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (!selectedIds.length) {
      toast.error('Select notifications first');
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected notification campaigns and their receipts?`)) return;

    try {
      await bulkDeleteNotificationCampaigns({ ids: selectedIds });
      toast.success('Selected notification campaigns deleted');
      setSelectedIds([]);
      await loadCenter(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleBulkDeleteFiltered = async () => {
    const hasFilter = Object.values(filters).some(Boolean);
    if (!hasFilter) {
      toast.error('Apply at least one filter first, or use Delete all');
      return;
    }
    if (!window.confirm('Delete all notification campaigns matching the current filters and their receipts?')) return;

    try {
      await bulkDeleteNotificationCampaigns({ filter: filters });
      toast.success('Filtered notification campaigns deleted');
      setSelectedIds([]);
      await loadCenter(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Filtered delete failed');
    }
  };

  const handleDeleteAllCampaigns = async () => {
    if (!window.confirm('Delete ALL notification campaigns and all shared recipient receipts? This cannot be undone.')) return;

    try {
      await bulkDeleteNotificationCampaigns({ deleteAll: true });
      toast.success('All notification campaigns deleted');
      setSelectedIds([]);
      await loadCenter(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete all failed');
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Communications"
          title="Notification Center"
          subtitle="Compose targeted broadcasts, track delivery health, and monitor who has actually seen school-critical updates."
          meta={[
            `${overview?.summary?.total || 0} campaigns in 30 days`,
            `${overview?.summary?.deliveredRecipients || 0} delivered recipients`,
            `${overview?.summary?.readRecipients || 0} reads`,
          ]}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCard icon={Megaphone} label="Campaigns" value={overview?.summary?.total || 0} helper="Draft, scheduled, and sent" tone="blue" />
          <DashboardStatCard icon={Send} label="Delivered" value={overview?.summary?.deliveredRecipients || 0} helper="Recipients reached successfully" tone="emerald" />
          <DashboardStatCard icon={BellRing} label="Unread" value={(overview?.unreadByRole || []).reduce((sum, item) => sum + item.count, 0)} helper="Pending user attention" tone="amber" />
          <DashboardStatCard icon={WalletCards} label="Read Rate" value={`${deliveryRate}%`} helper="Reads relative to delivered recipients" tone="violet" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardCard className="p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <DashboardSectionHeader
                icon={Send}
                title={editingId ? 'Edit Campaign' : 'Compose Campaign'}
                subtitle={editingId ? 'Update the selected notification or send the revised draft' : 'Broadcast messages, announcements, and alerts to roles or the whole school'}
                tone="emerald"
              />
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={composer.title}
                onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))}
                placeholder="Notification title"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />
              <textarea
                value={composer.message}
                onChange={(event) => setComposer((current) => ({ ...current, message: event.target.value }))}
                placeholder="Write the message that recipients should receive"
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                required
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={composer.type} onChange={(event) => setComposer((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['announcement', 'message', 'manual', 'weather', 'safety', 'attendance', 'finance', 'hostel', 'transport', 'library', 'academic'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select value={composer.severity} onChange={(event) => setComposer((current) => ({ ...current, severity: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['info', 'low', 'medium', 'high', 'critical'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>Send to all users</span>
                  <input
                    type="checkbox"
                    checked={composer.sendToAll}
                    onChange={(event) => setComposer((current) => ({ ...current, sendToAll: event.target.checked }))}
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Channels</p>
                <div className="flex flex-wrap gap-2">
                  {['in_app', 'email', 'sms', 'push'].map((channel) => (
                    <button
                      type="button"
                      key={channel}
                      onClick={() => handleChannelToggle(channel)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                        composer.channels.includes(channel)
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {!composer.sendToAll ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Target roles</p>
                  <div className="flex flex-wrap gap-2">
                    {['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'].map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                          composer.roles.includes(role)
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
                <span>Send immediately after saving</span>
                <input
                  type="checkbox"
                  checked={composer.sendNow}
                  onChange={(event) => setComposer((current) => ({ ...current, sendNow: event.target.checked }))}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving campaign...' : editingId ? 'Update notification campaign' : 'Create notification campaign'}
              </button>
            </form>
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={SlidersHorizontal} title="Campaign Activity" subtitle="Filter and review recent broadcasts" tone="blue" />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">All statuses</option>
                {options.statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">All types</option>
                {options.types.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={filters.severity} onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">All severity</option>
                {options.severities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950"
              >
                {selectedIds.length === campaigns.length && campaigns.length ? <CheckSquare className="h-4 w-4 text-sky-600" /> : <Square className="h-4 w-4" />}
                {selectedIds.length ? `${selectedIds.length} selected` : 'Select visible'}
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBulkDeleteSelected}
                  disabled={!selectedIds.length}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete selected
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteFiltered}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete filtered
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllCampaigns}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete all
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  onClick={() => loadCampaignDetails(campaign._id)}
                  className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    selectedCampaign?._id === campaign._id
                      ? 'border-sky-200 bg-sky-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSelected(campaign._id);
                      }}
                      className="mt-1 rounded-lg text-slate-400 hover:text-sky-600"
                      aria-label={`Select ${campaign.title}`}
                    >
                      {selectedIds.includes(campaign._id) ? <CheckSquare className="h-4 w-4 text-sky-600" /> : <Square className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">{campaign.status}</span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700">{campaign.type}</span>
                        {campaign.channels?.map((channel) => (
                          <span key={`${campaign._id}-${channel}`} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase text-sky-700">{channel}</span>
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-950">{campaign.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{campaign.message}</p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {campaign.createdBy?.name || 'System'} • {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            try {
                              await sendNotificationCampaign(campaign._id);
                              toast.success('Campaign queued for delivery');
                              await loadCenter(filters);
                            } catch (error) {
                              toast.error(error?.response?.data?.message || 'Send failed');
                            }
                          }}
                          className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                        >
                          Send now
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          startEdit(campaign);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteCampaign(campaign._id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!campaigns.length ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm font-semibold text-slate-500">
                  No notification campaigns match the current filters.
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Selected Campaign" subtitle="Audience, channels, and send result" tone="violet" />
            {selectedCampaign ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{selectedCampaign.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(selectedCampaign.channels || []).map((channel) => (
                          <span key={`selected-${channel}`} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase text-sky-700">{channel}</span>
                        ))}
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">
                          {selectedCampaign.audience?.sendToAll ? 'all users' : (selectedCampaign.audience?.roles || []).join(', ') || 'custom users'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(selectedCampaign)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(selectedCampaign._id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCampaign.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Status', selectedCampaign.status],
                    ['Severity', selectedCampaign.severity],
                    ['Type', selectedCampaign.type],
                    ['Recipients', selectedCampaign.stats?.totalRecipients || 0],
                    ['Delivered', selectedCampaign.stats?.deliveredRecipients || 0],
                    ['Read', selectedCampaign.stats?.readRecipients || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">Select a campaign to inspect details.</div>
            )}
          </DashboardCard>

          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Recipient Receipts" subtitle="Who received the notification and whether they read it" tone="amber" />
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div key={receipt._id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{receipt.user?.name || 'Unknown user'}</p>
                      <p className="mt-1 text-xs text-slate-500">{receipt.user?.email || 'No email'} • {receipt.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-slate-500">{receipt.deliveryStatus}</p>
                      <p className="mt-1 text-xs text-slate-400">{receipt.isRead ? 'Read' : 'Unread'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {receipt.channelResults?.map((channel) => (
                      <span key={`${receipt._id}-${channel.channel}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {channel.channel}: {channel.status}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!receipts.length ? (
                <div className="py-10 text-center text-sm text-slate-500">Recipient receipts will appear here after a campaign is selected.</div>
              ) : null}
            </div>
          </DashboardCard>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationCenter;
