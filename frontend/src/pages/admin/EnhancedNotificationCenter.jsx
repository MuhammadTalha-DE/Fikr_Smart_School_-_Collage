import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BellRing,
  Megaphone,
  Send,
  SlidersHorizontal,
  Users,
  WalletCards,
  ShieldCheck,
  Lock,
  UserCog,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import {
  DashboardCard,
  DashboardHero,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import {
  createNotificationCampaign,
  getNotificationAdminOptions,
  getNotificationAdminOverview,
  getNotificationCampaignById,
  getNotificationCampaigns,
  getNotificationReceipts,
  sendNotificationCampaign,
} from '../../services/notificationCenterService';
import {
  createSecureNotification,
  broadcastToRole,
  getRoleBasedStats,
} from '../../services/secureNotificationService';

const initialComposer = {
  title: '',
  message: '',
  type: 'manual',
  severity: 'info',
  channels: ['in_app', 'email'],
  roles: ['teacher', 'student', 'parent'],
  sendToAll: false,
  sendNow: true,
  isSecure: false,
};

const EnhancedNotificationCenter = () => {
  const [overview, setOverview] = useState(null);
  const [options, setOptions] = useState({ types: [], severities: [], statuses: [] });
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [composer, setComposer] = useState(initialComposer);
  const [filters, setFilters] = useState({ status: '', type: '', severity: '', search: '' });
  const [submitting, setSubmitting] = useState(false);
  const [roleStats, setRoleStats] = useState({});
  const [activeTab, setActiveTab] = useState('compose');

  const loadCenter = async (nextFilters = filters) => {
    const [overviewResponse, optionsResponse, campaignsResponse, statsResponse] = await Promise.all([
      getNotificationAdminOverview(),
      getNotificationAdminOptions(),
      getNotificationCampaigns({ ...nextFilters, limit: 20 }),
      getRoleBasedStats(),
    ]);

    setOverview(overviewResponse.data.data);
    setOptions(optionsResponse.data.data || { types: [], severities: [], statuses: [] });
    setCampaigns(campaignsResponse.data.data || []);
    setRoleStats(statsResponse.data.data || {});

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
    setSubmitting(true);
    try {
      if (composer.isSecure) {
        await createSecureNotification(composer);
      } else {
        await createNotificationCampaign(composer);
      }
      setComposer(initialComposer);
      await loadCenter();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleBroadcast = async (role) => {
    try {
      await broadcastToRole(role, {
        title: `Important Update for ${role}s`,
        message: composer.message || 'This is an important update for your role.',
        type: composer.type,
        severity: composer.severity,
        channels: composer.channels,
        isSecure: composer.isSecure,
      });
      await loadCenter();
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  };

  return (
    <Layout role="admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Secure Communications"
          title="Enhanced Notification Center"
          subtitle="Create secure broadcasts with TLS encryption, role-based targeting, and real-time cryptographic messaging."
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => setActiveTab('compose')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${activeTab === 'compose' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            <Send className="inline-block h-4 w-4 mr-2" />
            Compose Message
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${activeTab === 'broadcast' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            <UserCog className="inline-block h-4 w-4 mr-2" />
            Role Broadcast
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${activeTab === 'analytics' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            <ShieldCheck className="inline-block h-4 w-4 mr-2" />
            Security Stats
          </button>
        </div>

        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Send} title="Compose Secure Campaign" subtitle="Broadcast with TLS encryption and cryptographic security" tone="emerald" />

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
                    {['manual', 'weather', 'safety', 'attendance', 'finance', 'hostel', 'transport', 'library', 'academic'].map((item) => (
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Security</p>
                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
                      <span><Lock className="inline-block h-4 w-4 mr-2" /> Enable Cryptographic Messaging</span>
                      <input
                        type="checkbox"
                        checked={composer.isSecure}
                        onChange={(event) => setComposer((current) => ({ ...current, isSecure: event.target.checked }))}
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
                          className={`rounded-full border px-3 py-2 text-xs font-semibold ${composer.channels.includes(channel) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
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
                          className={`rounded-full border px-3 py-2 text-xs font-semibold ${composer.roles.includes(role) ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
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
                  {submitting ? 'Sending campaign...' : composer.isSecure ? 'Create Secure Notification' : 'Create Notification Campaign'}
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

              <div className="mt-5 space-y-3">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign._id}
                    onClick={() => loadCampaignDetails(campaign._id)}
                    className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selectedCampaign?._id === campaign._id ? 'border-sky-200 bg-sky-50/60' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">{campaign.status}</span>
                          {campaign.isSecure && (
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700">SECURE</span>
                          )}
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700">{campaign.type}</span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-950">{campaign.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{campaign.message}</p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {campaign.createdBy?.name || 'System'} • {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                        <button
                          onClick={async (event) => {
                            event.stopPropagation();
                            if (campaign.isSecure) {
                              await sendSecureNotification(campaign._id);
                            } else {
                              await sendNotificationCampaign(campaign._id);
                            }
                            await loadCenter(filters);
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                          Send now
                        </button>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </DashboardCard>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={UserCog} title="Role-Based Broadcast" subtitle="Send targeted messages to specific roles with TLS security" tone="violet" />

            <div className="space-y-4">
              <textarea
                value={composer.message}
                onChange={(event) => setComposer((current) => ({ ...current, message: event.target.value }))}
                placeholder="Write the message for role-based broadcast"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select value={composer.type} onChange={(event) => setComposer((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['manual', 'weather', 'safety', 'attendance', 'finance', 'hostel', 'transport', 'library', 'academic'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select value={composer.severity} onChange={(event) => setComposer((current) => ({ ...current, severity: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {['info', 'low', 'medium', 'high', 'critical'].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {['in_app', 'email', 'sms', 'push'].map((channel) => (
                  <button
                    type="button"
                    key={channel}
                    onClick={() => handleChannelToggle(channel)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${composer.channels.includes(channel) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    {channel}
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700">
                <span><Lock className="inline-block h-4 w-4 mr-2" /> Enable Cryptographic Messaging</span>
                <input
                  type="checkbox"
                  checked={composer.isSecure}
                  onChange={(event) => setComposer((current) => ({ ...current, isSecure: event.target.checked }))}
                />
              </label>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleBroadcast(role)}
                    disabled={!composer.message.trim()}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${!composer.message.trim() ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    <Users className="inline-block h-4 w-4 mr-2" />
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </DashboardCard>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={ShieldCheck} title="Role-Based Unread Stats" subtitle="Unread notifications by role" tone="amber" />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(roleStats).map(([role, count]) => (
                  <div key={role} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800 capitalize">{role}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
                    <p className="mt-1 text-xs text-slate-500">unread notifications</p>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Lock} title="Security Features" subtitle="Enterprise-grade notification security" tone="violet" />
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="font-semibold text-slate-900">TLS 1.2/1.3 Encryption</h4>
                  <p className="mt-2 text-sm text-slate-600">All messages are transmitted over secure TLS channels with modern cipher suites.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="font-semibold text-slate-900">AES-256-GCM Cryptography</h4>
                  <p className="mt-2 text-sm text-slate-600">End-to-end encryption with authenticated encryption for message confidentiality and integrity.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="font-semibold text-slate-900">Role-Based Access Control</h4>
                  <p className="mt-2 text-sm text-slate-600">Granular permissions with role-specific notification capabilities and audience targeting.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="font-semibold text-slate-900">Real-time Delivery</h4>
                  <p className="mt-2 text-sm text-slate-600">Instant delivery with WebSocket push notifications and read receipts.</p>
                </div>
              </div>
            </DashboardCard>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DashboardCard className="p-5 md:p-6">
            <DashboardSectionHeader icon={Users} title="Selected Campaign" subtitle="Audience, channels, and send result" tone="violet" />
            {selectedCampaign ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-bold text-slate-950">{selectedCampaign.title}</p>
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

export default EnhancedNotificationCenter;
