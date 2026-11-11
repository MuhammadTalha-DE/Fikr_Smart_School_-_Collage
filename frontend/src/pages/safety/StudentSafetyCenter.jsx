import React, { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, Bell, FileText, Phone, 
  CheckCircle, MapPin, Plus, Eye
} from 'lucide-react';
import { getAlerts, getIncidents, getContacts } from '../../services/safetyApi';
import EmergencyAlertCard from '../../components/safety/EmergencyAlertCard';
import SOSButton from '../../components/safety/SOSButton';
import IncidentReportForm from '../../components/safety/IncidentReportForm';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/safetyValidation';

const StudentSafetyCenter = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [alertsRes, incidentsRes, contactsRes] = await Promise.all([
        getAlerts({ status: 'active' }),
        getIncidents(),
        getContacts({ isActive: true }),
      ]);
      setAlerts(alertsRes.data.alerts);
      setIncidents(incidentsRes.data.incidents);
      setContacts(contactsRes.data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch safety data:', error);
      const message = getApiErrorMessage(error, 'Failed to load safety center data');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentUserId = user?._id || user?.id;
  const myIncidents = currentUserId
    ? incidents.filter(i => (i.reportedBy?._id || i.reportedBy) === currentUserId)
    : incidents;
  const priorityContacts = contacts.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              Safety Center
            </h1>
            <p className="text-gray-400 mt-1">Stay informed and report safety concerns</p>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium 
              hover:from-amber-400 hover:to-orange-500 transition-all flex items-center gap-2"
          >
            <FileText className="w-5 h-5" /> Report Incident
          </button>
        </div>

        {/* Safety Tips Bar */}
        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm">
              Retry
            </button>
          </div>
        )}

        <div className="p-4 mb-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">Your safety matters!</span> Use the SOS button for immediate emergencies. Report any incidents or unsafe situations you witness. All reports are confidential.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Alerts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" /> Active Alerts
              </h3>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">All Clear! No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <EmergencyAlertCard key={alert._id} alert={alert} compact />
                  ))}
                </div>
              )}
            </div>

            {/* My Reports */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> My Incident Reports
              </h3>
              {myIncidents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-500/50 mx-auto mb-3" />
                  <p className="text-gray-400">No reports yet</p>
                  <button onClick={() => setShowReportForm(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> File a Report
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myIncidents.slice(0, 5).map(incident => (
                    <div key={incident._id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{incident.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          incident.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{incident.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{incident.type?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Contacts */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-400" /> Emergency Contacts
              </h3>
              <div className="space-y-3">
                {priorityContacts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400">
                    Emergency contacts are not available right now.
                  </div>
                ) : priorityContacts.map((contact) => (
                  <div key={contact._id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-300 font-medium uppercase">{contact.relationship?.replace('_', ' ') || 'Emergency'}</p>
                    <p className="text-sm text-white font-medium">{contact.name}</p>
                    <a href={`tel:${contact.phone}`} className="text-lg font-bold text-white hover:text-red-300 transition-colors">{contact.phone}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
              <h3 className="text-lg font-semibold mb-4">Safety Tips</h3>
              <div className="space-y-3">
                {[
                  { text: 'Use SOS button in case of emergency', icon: AlertTriangle },
                  { text: 'Report unsafe conditions immediately', icon: Eye },
                  { text: 'Keep emergency contacts saved', icon: Phone },
                  { text: 'Stay aware of weather alerts', icon: MapPin },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                    <tip.icon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Button - floating */}
      <SOSButton />

      {/* Incident Report Form Modal */}
      {showReportForm && (
        <IncidentReportForm 
          onClose={() => setShowReportForm(false)}
          onSuccess={() => {
            setShowReportForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default StudentSafetyCenter;
