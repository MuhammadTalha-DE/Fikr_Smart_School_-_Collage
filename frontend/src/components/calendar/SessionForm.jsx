import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createSession, updateSession } from '../../services/api';

const SessionForm = ({ session, onClose, refresh }) => {
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
    terms: [{ name: '', startDate: '', endDate: '' }],
  });
  const [loading, setLoading] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (session) {
      setForm({
        name: session.name || '',
        startDate: session.startDate ? new Date(session.startDate).toISOString().slice(0, 10) : '',
        endDate: session.endDate ? new Date(session.endDate).toISOString().slice(0, 10) : '',
        isActive: session.isActive || false,
        terms: session.terms.length
          ? session.terms.map((t) => ({
              name: t.name || '',
              startDate: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : '',
              endDate: t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : '',
            }))
          : [{ name: '', startDate: '', endDate: '' }],
      });
    }
  }, [session]);

  const handleTermChange = (index, field, value) => {
    const updatedTerms = [...form.terms];
    updatedTerms[index][field] = value;
    setForm({ ...form, terms: updatedTerms });
  };

  const addTerm = () => {
    setForm({ ...form, terms: [...form.terms, { name: '', startDate: '', endDate: '' }] });
  };

  const removeTerm = (index) => {
    if (form.terms.length === 1) {
      toast.error('You must keep at least one term.');
      return;
    }
    setForm({ ...form, terms: form.terms.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Please fill the session name and dates.');
      return;
    }
    if (form.terms.some((t) => !t.name || !t.startDate || !t.endDate)) {
      toast.error('All term fields are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('Session end date must be on or after its start date.');
      return;
    }
    const invalidTerm = form.terms.find((term) => (
      term.endDate < term.startDate ||
      term.startDate < form.startDate ||
      term.endDate > form.endDate
    ));
    if (invalidTerm) {
      toast.error('Each term must have a valid date range within the academic session.');
      return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
      terms: form.terms.map((t) => ({
        name: t.name,
        startDate: new Date(t.startDate).toISOString(),
        endDate: new Date(t.endDate).toISOString(),
      })),
    };
    try {
      if (session?._id) {
        await updateSession(session._id, payload);
        toast.success('Session updated successfully!');
      } else {
        await createSession(payload);
        toast.success('Session created successfully!');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">{session ? 'Edit' : 'Create'} Academic Session</h2>
        <form onSubmit={handleSubmit}>
          {/* Session Name */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Session Name *</label>
          <input
            type="text"
            placeholder="e.g., 2025-2026"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full p-2 border rounded mb-3"
          />

          {/* Dates – responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Active Checkbox */}
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Active session</span>
          </label>

          {/* Terms Section */}
          <h3 className="font-semibold text-slate-700 mb-2">Terms *</h3>
          {form.terms.map((term, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-2 mb-2 items-start sm:items-center p-2 bg-slate-50 rounded"
            >
              <input
                type="text"
                placeholder="Term name e.g., First Term"
                value={term.name}
                onChange={(e) => handleTermChange(i, 'name', e.target.value)}
                required
                className="p-2 border rounded w-full sm:flex-1"
              />
              <input
                type="date"
                value={term.startDate}
                min={form.startDate || undefined}
                max={form.endDate || undefined}
                onChange={(e) => handleTermChange(i, 'startDate', e.target.value)}
                required
                className="p-2 border rounded w-full sm:w-auto"
              />
              <input
                type="date"
                value={term.endDate}
                min={term.startDate || form.startDate || undefined}
                max={form.endDate || undefined}
                onChange={(e) => handleTermChange(i, 'endDate', e.target.value)}
                required
                className="p-2 border rounded w-full sm:w-auto"
              />
              {form.terms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTerm(i)}
                  className="text-red-500 hover:text-red-700 font-bold self-center sm:self-auto"
                  title="Remove term"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTerm}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 font-medium"
          >
            + Add Term
          </button>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-slate-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionForm;
