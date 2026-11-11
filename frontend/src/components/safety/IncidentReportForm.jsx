import React, { useState } from 'react';
import {
  FileText, Send, X, AlertTriangle, Loader2, CheckCircle,
  Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createIncident } from '../../services/safetyApi';
import { getApiErrorMessage, validateIncidentReport } from '../../utils/safetyValidation';

const incidentTypes = [
  { value: 'bullying', label: 'Bullying', code: 'BL' },
  { value: 'injury', label: 'Injury', code: 'IN' },
  { value: 'transport', label: 'Transport Issue', code: 'TR' },
  { value: 'hostel', label: 'Hostel Issue', code: 'HS' },
  { value: 'theft', label: 'Theft', code: 'TH' },
  { value: 'fire', label: 'Fire Hazard', code: 'FR' },
  { value: 'medical', label: 'Medical Emergency', code: 'MD' },
  { value: 'discipline', label: 'Discipline Issue', code: 'DS' },
  { value: 'safety_hazard', label: 'Safety Hazard', code: 'SH' },
  { value: 'other', label: 'Other', code: 'OT' },
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400' },
];

const IncidentReportForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    severity: 'medium',
    location: '',
    isAnonymous: false,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!form.type) {
      const message = 'Select an incident type';
      setError(message);
      toast.error(message);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    const validationError = validateIncidentReport(form);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSending(true);
    setError('');
    try {
      await createIncident(form);
      setSent(true);
      toast.success('Incident report submitted');
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit report');
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X className="w-5 h-5 text-white" />
          </button>

          {sent ? (
            <div className="text-center py-10">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Report Submitted</h3>
              <p className="text-gray-400">Your incident report has been received.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-red-500/20">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Report an Incident</h3>
                  <p className="text-sm text-gray-400">Help us keep the campus safe</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Incident Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {incidentTypes.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setForm({ ...form, type: t.value })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            form.type === t.value
                              ? 'bg-red-500/20 border-red-500/40 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold">
                            {t.code}
                          </span>
                          <p className="text-xs mt-1">{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Severity *</label>
                    <div className="flex gap-2">
                      {severityLevels.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setForm({ ...form, severity: s.value })}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                            form.severity === s.value ? `${s.color} ring-2 ring-white/20` : 'bg-white/5 text-gray-500 hover:bg-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!form.type}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Brief title of the incident"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe what happened in detail..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Where did this happen?"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                      {form.isAnonymous ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-gray-300">Report anonymously</span>
                    </div>
                    <button
                      onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isAnonymous ? 'bg-blue-500' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={sending}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-500 hover:to-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Submit Report</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentReportForm;
