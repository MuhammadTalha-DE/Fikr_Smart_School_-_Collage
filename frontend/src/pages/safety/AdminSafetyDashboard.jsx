import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, AlertTriangle, Bell, FileText, Phone, Activity, 
  CheckCircle, Clock, Users, TrendingUp, Plus, Search,
  Filter, RefreshCw, X, MapPin, Loader2, ChevronRight
} from 'lucide-react';
import { 
  getSafetyStats, getAlerts, updateAlert, deleteAlert,
  createAlert, getIncidents, updateIncident, deleteIncident,
  getContacts, deleteContact, createContact, updateContact
} from '../../services/safetyApi';
import EmergencyAlertCard from '../../components/safety/EmergencyAlertCard';
import SafetyStatsCard from '../../components/safety/SafetyStatsCard';
import ActiveAlertsTable from '../../components/safety/ActiveAlertsTable';
import EmergencyContactsList from '../../components/safety/EmergencyContactsList';
import SafetyTimeline from '../../components/safety/SafetyTimeline';
import toast from 'react-hot-toast';
import { getApiErrorMessage, normalizeEmergencyContact, validateEmergencyContact, validateSafetyAlert } from '../../utils/safetyValidation';

const AdminSafetyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [alertForm, setAlertForm] = useState({ title: '', message: '', type: 'emergency', severity: 'medium', targetRoles: ['all'], location: '' });
  const [contactForm, setContactForm] = useState({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, alertsRes, incidentsRes, contactsRes] = await Promise.all([
        getSafetyStats(),
        getAlerts(),
        getIncidents(),
        getContacts(),
      ]);
      setStats(statsRes.data.stats);
      setAlerts(alertsRes.data.alerts);
      setIncidents(incidentsRes.data.incidents);
      setContacts(contactsRes.data.contacts);
    } catch (error) {
      console.error('Failed to fetch safety data:', error);
      setError(getApiErrorMessage(error, 'Failed to load safety dashboard data'));
      toast.error(getApiErrorMessage(error, 'Failed to load safety dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleResolveAlert = async (id) => {
    if (!window.confirm('Mark this safety alert as resolved? This action will be recorded in the audit log.')) return;
    try {
      await updateAlert(id, { status: 'resolved' });
      toast.success('Alert marked as resolved');
      fetchData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error(getApiErrorMessage(error, 'Failed to resolve alert'));
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Delete this safety alert permanently? This action will be recorded in the audit log.')) return;
    try {
      await deleteAlert(id);
      toast.success('Alert deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast.error(getApiErrorMessage(error, 'Failed to delete alert'));
    }
  };

  const handleSubmitAlert = async () => {
    const validationError = validateSafetyAlert(alertForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await createAlert(alertForm);
      setShowAlertModal(false);
      setAlertForm({ title: '', message: '', type: 'emergency', severity: 'medium', targetRoles: ['all'], location: '' });
      toast.success('Broadcast alert published');
      fetchData();
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast.error(getApiErrorMessage(error, 'Failed to publish broadcast alert'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitContact = async () => {
    const validationError = validateEmergencyContact(contactForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = normalizeEmergencyContact(contactForm);
      if (editingContact) {
        await updateContact(editingContact._id, payload);
        toast.success('Emergency contact updated');
      } else {
        await createContact(payload);
        toast.success('Emergency contact added');
      }
      setShowContactModal(false);
      setEditingContact(null);
      setContactForm({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save contact:', error);
      toast.error(getApiErrorMessage(error, 'Failed to save emergency contact'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    try {
      await deleteContact(id);
      toast.success('Emergency contact deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error(getApiErrorMessage(error, 'Failed to delete emergency contact'));
    }
  };

  const handleToggleTargetRole = (role) => {
    setAlertForm((current) => {
      if (role === 'all') return { ...current, targetRoles: ['all'] };
      const existing = current.targetRoles.includes('all') ? [] : current.targetRoles;
      const next = existing.includes(role)
        ? existing.filter((item) => item !== role)
        : [...existing, role];
      return { ...current, targetRoles: next.length ? next : ['all'] };
    });
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      alternatePhone: contact.alternatePhone || '',
      email: contact.email || '',
      address: contact.address || '',
      priority: contact.priority || 0,
      notes: contact.notes || '',
    });
    setShowContactModal(true);
  };

  // Build timeline from alerts & incidents
  const timelineEvents = [
    ...alerts.filter(a => a.status === 'active').slice(0, 5).map(a => ({
      type: 'alert_created',
      title: a.title,
      description: a.message,
      severity: a.severity,
      user: a.createdBy?.name,
      createdAt: a.createdAt,
    })),
    ...incidents.slice(0, 5).map(i => ({
      type: 'incident_reported',
      title: i.title,
      description: i.description,
      severity: i.severity,
      user: i.reportedBy?.name,
      createdAt: i.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  const statCards = stats ? [
    { icon: AlertTriangle, label: 'Active Alerts', value: stats.activeAlerts, color: 'text-red-400', bgColor: 'bg-red-500/10', trend: stats.activeAlerts > 0 ? 'up' : 'stable' },
    { icon: Bell, label: 'Total Alerts', value: stats.totalAlerts, color: 'text-amber-400', bgColor: 'bg-amber-500/10', trend: 'stable' },
    { icon: FileText, label: 'Pending Incidents', value: stats.pendingIncidents, color: 'text-orange-400', bgColor: 'bg-orange-500/10', trend: stats.pendingIncidents > 0 ? 'up' : 'down' },
    { icon: CheckCircle, label: 'Resolved Alerts', value: stats.resolvedAlerts, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', trend: 'down' },
    { icon: Activity, label: 'Critical Alerts', value: stats.criticalAlerts, color: 'text-red-500', bgColor: 'bg-red-500/20', trend: stats.criticalAlerts > 0 ? 'up' : 'stable' },
    { icon: Phone, label: 'Emergency Contacts', value: contacts.length, color: 'text-blue-400', bgColor: 'bg-blue-500/10', trend: 'stable' },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              Safety & Emergency Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Monitor, manage, and respond to safety incidents across campus</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowAlertModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium 
                hover:from-red-500 hover:to-red-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Broadcast Alert
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'alerts', label: 'Alerts', icon: Bell },
            { id: 'incidents', label: 'Incidents', icon: FileText },
            { id: 'contacts', label: 'Contacts', icon: Phone },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white shadow' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm">
              Retry
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat, idx) => (
                <SafetyStatsCard key={idx} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Alerts */}
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" /> Active Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.filter(a => a.status === 'active').slice(0, 5).map(alert => (
                    <EmergencyAlertCard 
                      key={alert._id} 
                      alert={alert} 
                      compact 
                      onView={() => {}}
                    />
                  ))}
                  {alerts.filter(a => a.status === 'active').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No active alerts</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" /> Recent Activity
                </h3>
                <SafetyTimeline events={timelineEvents} />
              </div>
            </div>

            {/* Stats by Type */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                  <h3 className="text-lg font-semibold mb-4">Alerts by Type</h3>
                  <div className="space-y-3">
                    {stats.alertsByType?.map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{item._id?.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400"
                              style={{ width: `${stats.totalAlerts ? (item.count / stats.totalAlerts) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                  <h3 className="text-lg font-semibold mb-4">Incidents by Type</h3>
                  <div className="space-y-3">
                    {stats.incidentsByType?.map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{item._id?.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400"
                              style={{ width: `${stats.totalIncidents ? (item.count / stats.totalIncidents) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">All Emergency Alerts</h3>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                {alerts.length} Total
              </span>
            </div>
            <ActiveAlertsTable 
              alerts={alerts} 
              loading={loading}
              onResolve={handleResolveAlert}
              onDelete={handleDeleteAlert}
              onView={(alert) => alert.title && console.log('View:', alert.title)}
            />
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
            <h3 className="text-lg font-semibold mb-6">Incident Reports</h3>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-500/50 mx-auto mb-4" />
                <p className="text-gray-400">No incidents reported</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div key={incident._id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          incident.severity === 'critical' ? 'bg-red-500/20' :
                          incident.severity === 'high' ? 'bg-orange-500/20' :
                          'bg-amber-500/20'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            incident.severity === 'critical' ? 'text-red-400' :
                            incident.severity === 'high' ? 'text-orange-400' :
                            'text-amber-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{incident.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {incident.type?.replace('_', ' ')} • by {incident.reportedBy?.name || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs ${
                        incident.status === 'reported' ? 'bg-red-500/20 text-red-400' :
                        incident.status === 'investigating' ? 'bg-amber-500/20 text-amber-400' :
                        incident.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2 ml-12">{incident.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Emergency Contacts</h3>
              <button 
                onClick={() => { setEditingContact(null); setContactForm({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' }); setShowContactModal(true); }}
                className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Contact
              </button>
            </div>
            <EmergencyContactsList 
              contacts={contacts} 
              loading={loading}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onAdd={() => { setEditingContact(null); setContactForm({ name: '', relationship: 'other', phone: '', alternatePhone: '', email: '', address: '', priority: 0, notes: '' }); setShowContactModal(true); }}
            />
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold">Broadcast Alert</h3>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Alert Title *" value={alertForm.title}
                onChange={(e) => setAlertForm({...alertForm, title: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              <textarea placeholder="Alert Message *" value={alertForm.message} rows={3}
                onChange={(e) => setAlertForm({...alertForm, message: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <select value={alertForm.type} onChange={(e) => setAlertForm({...alertForm, type: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none">
                  <option value="emergency">Emergency</option>
                  <option value="weather">Weather</option>
                  <option value="transport">Transport</option>
                  <option value="hostel">Hostel</option>
                  <option value="medical">Medical</option>
                  <option value="security">Security</option>
                  <option value="fire">Fire</option>
                  <option value="lockdown">Lockdown</option>
                </select>
                <select value={alertForm.severity} onChange={(e) => setAlertForm({...alertForm, severity: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <input type="text" placeholder="Location (optional)" value={alertForm.location}
                onChange={(e) => setAlertForm({...alertForm, location: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Audience *</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['all', 'teacher', 'student', 'parent', 'warden', 'librarian'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleTargetRole(role)}
                      className={`px-3 py-2 rounded-lg border text-sm capitalize transition-all ${
                        alertForm.targetRoles.includes(role)
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSubmitAlert} disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-500 hover:to-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Bell className="w-4 h-4" /> Broadcast Alert</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
              </div>
              <button onClick={() => { setShowContactModal(false); setEditingContact(null); }} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Contact Name *" value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="grid grid-cols-2 gap-4">
                <select value={contactForm.relationship} onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none">
                  <option value="guardian">Guardian</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="police">Police</option>
                  <option value="fire">Fire Service</option>
                  <option value="hospital">Hospital</option>
                  <option value="school_staff">School Staff</option>
                  <option value="other">Other</option>
                </select>
                <input type="number" placeholder="Priority" value={contactForm.priority}
                  onChange={(e) => setContactForm({...contactForm, priority: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              </div>
              <input type="tel" placeholder="Phone Number *" value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="tel" placeholder="Alternate Phone" value={contactForm.alternatePhone}
                onChange={(e) => setContactForm({...contactForm, alternatePhone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="email" placeholder="Email" value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <input type="text" placeholder="Address" value={contactForm.address}
                onChange={(e) => setContactForm({...contactForm, address: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none" />
              <textarea placeholder="Notes (optional)" value={contactForm.notes} rows={2}
                onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none resize-none" />
              <button onClick={handleSubmitContact} disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>{editingContact ? 'Update Contact' : 'Add Contact'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSafetyDashboard;
