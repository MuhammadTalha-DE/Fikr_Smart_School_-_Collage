import React, { useState, useEffect } from 'react';
import {
  Shield, FileText, AlertTriangle, Bell, Plus, Search,
  Filter, Clock, CheckCircle, ChevronRight, User, MapPin
} from 'lucide-react';
import { getIncidents, updateIncident } from '../../services/safetyApi';
import { getAlerts } from '../../services/safetyApi';
import IncidentReportForm from '../../components/safety/IncidentReportForm';
import EmergencyAlertCard from '../../components/safety/EmergencyAlertCard';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/safetyValidation';

const TeacherIncidentReports = () => {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [activeTab, setActiveTab] = useState('incidents');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [incidentsRes, alertsRes] = await Promise.all([
        getIncidents(),
        getAlerts({ status: 'active' }),
      ]);
      setIncidents(incidentsRes.data.incidents);
      setAlerts(alertsRes.data.alerts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(getApiErrorMessage(error, 'Failed to load safety data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredIncidents = incidents.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.type?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolveIncident = async (id) => {
    if (!window.confirm('Mark this incident as resolved? This action will be recorded in the audit log.')) return;
    try {
      await updateIncident(id, { status: 'resolved', resolutionNotes: 'Resolved by teacher' });
      toast.success('Incident marked as resolved');
      fetchData();
    } catch (error) {
      console.error('Failed to resolve:', error);
      toast.error(getApiErrorMessage(error, 'Failed to resolve incident'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-400" />
              Safety & Incident Management
            </h1>
            <p className="text-gray-400 mt-1">Report and manage classroom and campus safety incidents</p>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium 
              hover:from-amber-400 hover:to-orange-500 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Report Incident
          </button>
        </div>

        {/* Active Alerts Banner */}
        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm">
              Retry
            </button>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <p className="text-red-300 font-medium">{alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map(alert => (
                <EmergencyAlertCard key={alert._id} alert={alert} compact />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'incidents' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> All Incidents
          </button>
          <button
            onClick={() => setActiveTab('reported')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'reported' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" /> My Reports
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-500/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No incidents found</p>
              <button onClick={() => setShowReportForm(true)}
                className="mt-4 px-6 py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all">
                <Plus className="w-4 h-4 inline mr-2" /> Report First Incident
              </button>
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div key={incident._id} className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 hover:bg-white/10 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${
                      incident.severity === 'critical' ? 'bg-red-500/20' :
                      incident.severity === 'high' ? 'bg-orange-500/20' :
                      incident.severity === 'medium' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        incident.severity === 'critical' ? 'text-red-400' :
                        incident.severity === 'high' ? 'text-orange-400' :
                        incident.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{incident.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{incident.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="capitalize flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {incident.type?.replace('_', ' ')}
                        </span>
                        {incident.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {incident.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {incident.reportedBy?.name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      incident.status === 'reported' ? 'bg-red-500/20 text-red-400' :
                      incident.status === 'investigating' ? 'bg-amber-500/20 text-amber-400' :
                      incident.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {incident.status}
                    </span>
                    {incident.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveIncident(incident._id)}
                        className="p-2 rounded-lg hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors"
                        title="Mark as Resolved"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

export default TeacherIncidentReports;
