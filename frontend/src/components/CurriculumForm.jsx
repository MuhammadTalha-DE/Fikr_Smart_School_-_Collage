import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useDropdownData } from '../hooks/useDropdownData';

const CurriculumForm = ({ curriculum, onClose, onSaved }) => {
  // ----- Form State -----
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [subjects, setSubjects] = useState([]);         // added subjects
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // ----- Dropdown Data -----
  const { data: classes } = useDropdownData('/classes');
  const { data: sessions } = useDropdownData('/calendar/sessions', 'sessions');
  const { data: allSubjects } = useDropdownData('/subjects', 'subjects');

  // ----- Subject addition state -----
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectCompulsory, setSubjectCompulsory] = useState(true);
  const [subjectCredits, setSubjectCredits] = useState('');

  // ----- Pre‑fill on edit -----
  useEffect(() => {
    if (curriculum) {
      setName(curriculum.name || '');
      setClassId(curriculum.class?._id || curriculum.class || '');
      setSessionId(curriculum.session?._id || curriculum.session || '');
      setSubjects(
        (curriculum.subjects || []).map((s) => ({
          subject: s.subject?._id || s.subject,
          isCompulsory: s.isCompulsory ?? true,
          creditHours: s.creditHours ?? '',
          sortOrder: s.sortOrder ?? 0,
        }))
      );
      setIsActive(curriculum.isActive ?? true);
    }
  }, [curriculum]);

  // ----- Add a subject to the list -----
  const handleAddSubject = () => {
    if (!selectedSubjectId) {
      return toast.error('Please select a subject');
    }

    // Check if already added
    if (subjects.some((s) => s.subject === selectedSubjectId)) {
      return toast.error('Subject already added');
    }

    setSubjects((prev) => [
      ...prev,
      {
        subject: selectedSubjectId,
        isCompulsory: subjectCompulsory,
        creditHours: subjectCredits ? Number(subjectCredits) : undefined,
        sortOrder: prev.length + 1,
      },
    ]);

    // Reset selection
    setSelectedSubjectId('');
    setSubjectCompulsory(true);
    setSubjectCredits('');
  };

  // ----- Remove a subject -----
  const handleRemoveSubject = (index) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Submit the whole form -----
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !classId || !sessionId) {
      return toast.error('Name, Class, and Session are required');
    }
    if (subjects.length === 0) {
      return toast.error('Add at least one subject');
    }

    setLoading(true);
    try {
      const payload = {
        name,
        class: classId,
        session: sessionId,
        subjects,
        isActive,
      };

      if (curriculum?._id) {
        await api.put(`/curriculums/${curriculum._id}`, payload);
        toast.success('Curriculum updated');
      } else {
        await api.post('/curriculums', payload);
        toast.success('Curriculum created');
      }

      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving curriculum');
    } finally {
      setLoading(false);
    }
  };

  // ----- Helper to get subject name from ID -----
  const getSubjectName = (id) => {
    const sub = allSubjects.find((s) => s._id === id);
    return sub ? `${sub.code} - ${sub.name}` : 'Unknown';
  };

  // ----- Render -----
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {curriculum ? 'Edit Curriculum' : 'Create Curriculum'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 10 Science"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Session */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Session *</label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Subjects Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Subjects</h3>

            {subjects.length > 0 && (
              <div className="mb-4 space-y-2">
                {subjects.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border">
                    <div>
                      <p className="font-medium text-slate-800">{getSubjectName(s.subject)}</p>
                      <p className="text-xs text-slate-500">
                        {s.isCompulsory ? 'Compulsory' : 'Elective'}
                        {s.creditHours ? ` · ${s.creditHours} credits` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Subject Picker */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm text-slate-600 mb-1">Add Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Choose a subject</option>
                  {allSubjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={subjectCompulsory}
                  onChange={(e) => setSubjectCompulsory(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Compulsory</span>
              </label>

              <input
                type="number"
                placeholder="Credits"
                value={subjectCredits}
                onChange={(e) => setSubjectCredits(e.target.value)}
                className="w-24 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <button
                type="button"
                onClick={handleAddSubject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* 3. Active Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-slate-700">Active</label>
          </div>

          {/* 4. Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Curriculum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CurriculumForm;