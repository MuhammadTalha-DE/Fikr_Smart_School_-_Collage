import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const SyllabusUnitForm = ({ unit, curriculums, subjects, onClose, refresh }) => {
  const [form, setForm] = useState({
    subject: '',
    curriculum: '',
    title: '',
    description: '',
    unitNumber: 1,
    weekNumber: '',
    topics: [{ name: '', subtopics: [''], estimatedLessons: 1 }],
    learningOutcomes: [''],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  // Pre‑fill when editing
  useEffect(() => {
    if (unit) {
      setForm({
        subject: unit.subject?._id || unit.subject,
        curriculum: unit.curriculum?._id || unit.curriculum,
        title: unit.title,
        description: unit.description || '',
        unitNumber: unit.unitNumber,
        weekNumber: unit.weekNumber || '',
        topics: unit.topics.length
          ? unit.topics.map((t) => ({
              name: t.name,
              subtopics: t.subtopics.length ? [...t.subtopics] : [''],
              estimatedLessons: t.estimatedLessons || 1,
            }))
          : [{ name: '', subtopics: [''], estimatedLessons: 1 }],
        learningOutcomes: unit.learningOutcomes.length ? [...unit.learningOutcomes] : [''],
        isActive: unit.isActive ?? true,
      });
    }
  }, [unit]);

  // ---- Topic Helpers ----
  const handleTopicChange = (index, field, value) => {
    const updated = [...form.topics];
    if (field === 'subtopics') {
      updated[index].subtopics = value;
    } else {
      updated[index][field] = value;
    }
    setForm({ ...form, topics: updated });
  };

  const addTopic = () =>
    setForm({
      ...form,
      topics: [...form.topics, { name: '', subtopics: [''], estimatedLessons: 1 }],
    });

  const removeTopic = (index) =>
    setForm({ ...form, topics: form.topics.filter((_, i) => i !== index) });

  const addSubtopic = (topicIndex) => {
    const updated = [...form.topics];
    updated[topicIndex].subtopics.push('');
    setForm({ ...form, topics: updated });
  };

  const removeSubtopic = (topicIndex, subtopicIndex) => {
    const updated = [...form.topics];
    updated[topicIndex].subtopics = updated[topicIndex].subtopics.filter(
      (_, i) => i !== subtopicIndex
    );
    setForm({ ...form, topics: updated });
  };

  // ---- Learning Outcomes Helpers ----
  const handleOutcomeChange = (index, value) => {
    const outcomes = [...form.learningOutcomes];
    outcomes[index] = value;
    setForm({ ...form, learningOutcomes: outcomes });
  };

  const addOutcome = () =>
    setForm({ ...form, learningOutcomes: [...form.learningOutcomes, ''] });

  const removeOutcome = (index) =>
    setForm({
      ...form,
      learningOutcomes: form.learningOutcomes.filter((_, i) => i !== index),
    });

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.curriculum || !form.title) {
      return toast.error('Subject, Curriculum, and Title are required');
    }
    setLoading(true);
    const payload = {
      ...form,
      weekNumber: form.weekNumber ? Number(form.weekNumber) : undefined,
      // Remove empty subtopic strings for cleanliness
      topics: form.topics.map((t) => ({
        name: t.name,
        subtopics: t.subtopics.filter((s) => s.trim() !== ''),
        estimatedLessons: t.estimatedLessons,
      })),
      learningOutcomes: form.learningOutcomes.filter((o) => o.trim() !== ''),
    };
    try {
      if (unit) {
        await api.put(`/syllabus/${unit._id}`, payload);
        toast.success('Unit updated');
      } else {
        await api.post('/syllabus', payload);
        toast.success('Unit created');
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving unit');
    } finally {
      setLoading(false);
    }
  };

  // ---- Render ----
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {unit ? 'Edit Syllabus Unit' : 'Create Syllabus Unit'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subject *
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Curriculum *
              </label>
              <select
                value={form.curriculum}
                onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select curriculum</option>
                {curriculums.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g., Integration Techniques"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit #
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.unitNumber}
                  onChange={(e) =>
                    setForm({ ...form, unitNumber: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Week #
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.weekNumber}
                  onChange={(e) => setForm({ ...form, weekNumber: e.target.value })}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Brief overview of the unit..."
            />
          </div>

          {/* 2. Topics Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Topics</h3>
              <button
                type="button"
                onClick={addTopic}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                + Add Topic
              </button>
            </div>

            {form.topics.map((topic, ti) => (
              <div
                key={ti}
                className="border border-slate-200 rounded-xl p-4 mb-3 bg-slate-50"
              >
                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Topic name"
                    value={topic.name}
                    onChange={(e) => handleTopicChange(ti, 'name', e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Lessons"
                    value={topic.estimatedLessons}
                    onChange={(e) =>
                      handleTopicChange(ti, 'estimatedLessons', parseInt(e.target.value) || 1)
                    }
                    className="w-24 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeTopic(ti)}
                    className="self-start text-red-500 hover:text-red-700 p-2"
                    title="Remove topic"
                  >
                    ✕
                  </button>
                </div>

                {/* Subtopics */}
                <div className="ml-2">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Subtopics
                  </label>
                  {topic.subtopics.map((sub, si) => (
                    <div key={si} className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => {
                          const newSubtopics = [...topic.subtopics];
                          newSubtopics[si] = e.target.value;
                          handleTopicChange(ti, 'subtopics', newSubtopics);
                        }}
                        placeholder={`Subtopic ${si + 1}`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtopic(ti, si)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSubtopic(ti)}
                    className="text-blue-500 text-xs hover:underline mt-1"
                  >
                    + Add Subtopic
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Learning Outcomes */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Learning Outcomes</h3>
              <button
                type="button"
                onClick={addOutcome}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                + Add Outcome
              </button>
            </div>

            {form.learningOutcomes.map((outcome, oi) => (
              <div key={oi} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => handleOutcomeChange(oi, e.target.value)}
                  placeholder="e.g., CLO-3: Apply integration by parts"
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOutcome(oi)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 4. Active Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-slate-700">Active</label>
          </div>

          {/* 5. Buttons */}
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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SyllabusUnitForm;