import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createDeadline, updateDeadline } from '../../services/api';

const DeadlineForm = ({ deadline, sessions, classes, feePlans, onClose, refresh }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadlineType: 'assignment',
    dueDate: '',
    session: sessions.length > 0 ? sessions[0]._id : '',
    targetClass: '',
    feePlan: '',
    reminderBeforeDays: 3,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deadline) {
      setForm({
        title: deadline.title || '',
        description: deadline.description || '',
        deadlineType: deadline.deadlineType || 'assignment',
        dueDate: deadline.dueDate ? new Date(deadline.dueDate).toISOString().slice(0, 16) : '',
        session: deadline.session?._id || deadline.session || '',
        targetClass: deadline.targetClass?._id || deadline.targetClass || '',
        feePlan: deadline.feePlan?._id || deadline.feePlan || '',
        reminderBeforeDays: deadline.reminderBeforeDays ?? 3,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        session: sessions.length > 0 ? sessions[0]._id : '',
      }));
    }
  }, [deadline, sessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.session) {
      toast.error('Please fill title, due date, and session.');
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      dueDate: new Date(form.dueDate).toISOString(),
      targetClass: form.targetClass || null,
      feePlan: form.deadlineType === 'fee' ? form.feePlan || null : null,
    };
    try {
      if (deadline?._id) {
        await updateDeadline(deadline._id, payload);
        toast.success('Deadline updated successfully!');
      } else {
        await createDeadline(payload);
        toast.success('Deadline created successfully!');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving deadline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">{deadline ? 'Edit' : 'Create'} Deadline</h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            placeholder="e.g., Fee payment deadline"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full p-2 border rounded mb-3"
          />

          {/* Description */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            placeholder="Additional info"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          />

          {/* Deadline Type */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Deadline Type</label>
          <select
            value={form.deadlineType}
            onChange={(e) => setForm({ ...form, deadlineType: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="assignment">Assignment</option>
            <option value="fee">Fee</option>
            <option value="admission">Admission</option>
            <option value="exam-form">Exam Form</option>
            <option value="other">Other</option>
          </select>

          {/* Due Date */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
            className="w-full p-2 border rounded mb-3"
          />

          {/* Session Dropdown */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Academic Session *</label>
          <select
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
            required
            className="w-full p-2 border rounded mb-3"
          >
            {sessions.length === 0 ? (
              <option value="">No sessions available – create a session first</option>
            ) : (
              sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))
            )}
          </select>

          {/* Class Dropdown */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Class</label>
          <select
            value={form.targetClass}
            onChange={(e) => setForm({ ...form, targetClass: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="">All classes</option>
            {classes.length === 0 ? (
              <option disabled>No classes available</option>
            ) : (
              classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))
            )}
          </select>

          {/* Fee Plan (only if fee type) */}
          {form.deadlineType === 'fee' && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fee Plan</label>
              <select
                value={form.feePlan}
                onChange={(e) => setForm({ ...form, feePlan: e.target.value })}
                className="w-full p-2 border rounded mb-3"
              >
                <option value="">Select fee plan (optional)</option>
                {feePlans && feePlans.length > 0 ? (
                  feePlans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name || p._id}
                    </option>
                  ))
                ) : (
                  <option disabled>No fee plans available</option>
                )}
              </select>
            </>
          )}

          {/* Reminder Days */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Remind before (days)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g., 3"
            value={form.reminderBeforeDays}
            onChange={(e) => setForm({ ...form, reminderBeforeDays: parseInt(e.target.value) || 0 })}
            className="w-full p-2 border rounded mb-4"
          />

          {/* Buttons */}
          <div className="flex justify-end gap-2">
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

export default DeadlineForm;