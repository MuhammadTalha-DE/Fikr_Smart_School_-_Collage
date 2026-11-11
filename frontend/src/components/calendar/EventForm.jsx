import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createEvent, updateEvent } from '../../services/api';

const EventForm = ({ event, sessions, classes, onClose, refresh }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'other',
    startDate: '',
    endDate: '',
    isAllDay: true,
    color: '#3b82f6',
    session: '',
    targetClass: '',
    affectsTimetable: true,
    scheduleEffect: '',
    scheduleTypeOverride: '',
    activePeriods: '',
    cancelledPeriods: '',
    timetableNote: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || 'other',
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        isAllDay: event.isAllDay ?? true,
        color: event.color || '#3b82f6',
        session: event.session?._id || event.session || '',
        targetClass: event.targetClass?._id || event.targetClass || '',
        affectsTimetable: event.affectsTimetable ?? true,
        scheduleEffect: event.scheduleEffect || '',
        scheduleTypeOverride: event.scheduleTypeOverride || '',
        activePeriods: (event.activePeriods || []).join(','),
        cancelledPeriods: (event.cancelledPeriods || []).join(','),
        timetableNote: event.timetableNote || '',
      });
    } else {
      setForm((prev) => ({
        ...prev,
        session: sessions.length > 0 ? sessions[0]._id : '',
      }));
    }
  }, [event, sessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate || !form.session) {
      toast.error('Please fill title, dates, and session.');
      return;
    }
    setLoading(true);
    const parsePeriods = (value) => String(value || '')
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => item >= 1 && item <= 12);

    const payload = {
      ...form,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      targetClass: form.targetClass || null,
      scheduleEffect: form.scheduleEffect || null,
      scheduleTypeOverride: form.scheduleTypeOverride || null,
      activePeriods: parsePeriods(form.activePeriods),
      cancelledPeriods: parsePeriods(form.cancelledPeriods),
    };
    try {
      if (event?._id) {
        await updateEvent(event._id, payload);
        toast.success('Event updated successfully!');
      } else {
        await createEvent(payload);
        toast.success('Event created successfully!');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">{event ? 'Edit Event' : 'Create Event'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            placeholder="e.g., Mid-Term Exam"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full p-2 border rounded mb-3"
          />

          {/* Description */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            placeholder="Optional details"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          />

          {/* Event Type */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
          <select
            value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="meeting">Meeting</option>
            <option value="result">Result</option>
            <option value="other">Other</option>
          </select>

          {/* Start & End Date – responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start *</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End *</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* All Day Checkbox */}
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={form.isAllDay}
              onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">All day</span>
          </label>

          {/* Color Picker */}
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Color</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="mb-3 w-16 h-10 rounded border"
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
              <option value="">No sessions available – create one first</option>
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
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Affects Timetable */}
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={form.affectsTimetable}
              onChange={(e) => setForm({ ...form, affectsTimetable: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">
              Affects timetable (no school if holiday)
            </span>
          </label>

          {form.affectsTimetable && (
            <div className="border border-slate-200 rounded p-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Effect</label>
                  <select
                    value={form.scheduleEffect}
                    onChange={(e) => setForm({ ...form, scheduleEffect: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Auto</option>
                    <option value="none">No change</option>
                    <option value="cancel">Cancel day</option>
                    <option value="shorten">Shorten day</option>
                    <option value="override">Use schedule type</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Override Type</label>
                  <select
                    value={form.scheduleTypeOverride}
                    onChange={(e) => setForm({ ...form, scheduleTypeOverride: e.target.value })}
                    className="w-full p-2 border rounded"
                    disabled={form.scheduleEffect !== 'override'}
                  >
                    <option value="">Auto</option>
                    <option value="regular">Regular</option>
                    <option value="ramadan">Ramadan</option>
                    <option value="exam">Exam</option>
                    <option value="half-day">Half-day</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Active Periods</label>
                  <input
                    type="text"
                    placeholder="1,2,3,4"
                    value={form.activePeriods}
                    onChange={(e) => setForm({ ...form, activePeriods: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cancelled Periods</label>
                  <input
                    type="text"
                    placeholder="7,8"
                    value={form.cancelledPeriods}
                    onChange={(e) => setForm({ ...form, cancelledPeriods: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-1 mt-3">Timetable Note</label>
              <input
                type="text"
                placeholder="Shown with effective timetable metadata"
                value={form.timetableNote}
                onChange={(e) => setForm({ ...form, timetableNote: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          )}

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

export default EventForm;
