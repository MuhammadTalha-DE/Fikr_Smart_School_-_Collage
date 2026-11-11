import React, { useEffect, useState } from 'react';
import {
  Shield, Bell, AlertTriangle, Phone, CheckCircle,
  User, Car, Home, Cloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { acknowledgeAlert, getAlerts, getContacts } from '../../services/safetyApi';
import EmergencyAlertCard from '../../components/safety/EmergencyAlertCard';
import { getApiErrorMessage } from '../../utils/safetyValidation';

const ParentSafetyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [alertsRes, contactsRes] = await Promise.all([
        getAlerts(),
        getContacts({ isActive: true }),
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setContacts(contactsRes.data.contacts || []);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load safety alerts');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(a => a.type === filter || a.severity === filter));
    }
  }, [filter, alerts]);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlert(id);
      toast.success('Alert acknowledged');
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to acknowledge alert'));
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const priorityContacts = contacts.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            Safety Alerts
          </h1>
          <p className="text-gray-400 mt-1">Stay informed about safety-related events at school</p>
        </div>

        <div className={`p-4 mb-8 rounded-2xl border flex items-center gap-3 ${
          activeAlerts.length > 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          {activeAlerts.length > 0 ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <p className="text-sm font-medium text-red-300">
                {activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''} - please review
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-300">All Clear - No active alerts</p>
            </>
          )}
        </div>

        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Child's Status</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">Safe</p>
            <p className="text-xs text-gray-400 mt-1">Last updated: Just now</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <span className="font-medium">Active Alerts</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeAlerts.length}</p>
            <p className="text-xs text-gray-400 mt-1">Across visible categories</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-white">{resolvedAlerts.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total resolved alerts</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Alerts', icon: Bell },
            { id: 'critical', label: 'Critical', icon: AlertTriangle },
            { id: 'transport', label: 'Transport', icon: Car },
            { id: 'hostel', label: 'Hostel', icon: Home },
            { id: 'weather', label: 'Weather', icon: Cloud },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white bg-white/5 border border-transparent hover:border-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-500/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No alerts found</p>
              <p className="text-gray-500 text-sm mt-1">There are no safety alerts matching your criteria</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <EmergencyAlertCard key={alert._id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))
          )}
        </div>

        <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-400" /> Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {priorityContacts.length === 0 ? (
              <div className="col-span-full p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400">
                Emergency contacts are not available right now.
              </div>
            ) : priorityContacts.map((contact) => (
              <a key={contact._id} href={`tel:${contact.phone}`}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <p className="text-xs text-gray-500 mb-1 capitalize">{contact.relationship?.replace('_', ' ')}</p>
                <p className="font-medium text-white">{contact.name}</p>
                <p className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">{contact.phone}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSafetyAlerts;
