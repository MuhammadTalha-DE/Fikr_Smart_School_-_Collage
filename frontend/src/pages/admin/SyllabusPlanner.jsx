import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { useDropdownData } from '../../hooks/useDropdownData';
import { getSyllabusUnits, deleteSyllabusUnit } from '../../services/api';
import toast from 'react-hot-toast';
import SyllabusUnitForm from '../../components/SyllabusUnitForm';

const SyllabusPlanner = () => {
  const { user } = useAuth();
  const role = user?.role;

  const { data: curriculums } = useDropdownData('/curriculums','curriculums');
  const { data: subjects } = useDropdownData('/subjects','subjects');

  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editUnit, setEditUnit] = useState(null);

  const fetchUnits = async () => {
    if (!selectedCurriculum && !selectedSubject) return;
    setLoading(true);
    try {
      const params = {};
      if (selectedCurriculum) params.curriculum = selectedCurriculum;
      if (selectedSubject) params.subject = selectedSubject;
      const res = await getSyllabusUnits(params);
      setUnits(res.data.units || []);
    } catch (err) {
      toast.error('Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [selectedCurriculum, selectedSubject]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete unit "${title}"?`)) return;
    try {
      await deleteSyllabusUnit(id);
      toast.success('Unit deleted');
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout role={role}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">📖 Syllabus Planner</h1>
          <button
            onClick={() => { setEditUnit(null); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Unit
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Curriculums</option>
            {curriculums.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.class?.name})
              </option>
            ))}
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Units Table */}
        {loading ? (
          <p className="text-center py-12">Loading…</p>
        ) : (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Subject</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Week</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Topics</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No units found
                      </td>
                    </tr>
                  ) : (
                    units.map((unit) => (
                      <tr key={unit._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{unit.unitNumber}</td>
                        <td className="px-4 py-3 font-medium">{unit.title}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {unit.subject?.code} - {unit.subject?.name}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {unit.weekNumber || '—'}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {unit.topics?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => { setEditUnit(unit); setShowForm(true); }}
                            className="text-blue-600 mr-2 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(unit._id, unit.title)}
                            className="text-red-600 hover:underline"
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <SyllabusUnitForm
            unit={editUnit}
            curriculums={curriculums}
            subjects={subjects}
            onClose={() => setShowForm(false)}
            refresh={fetchUnits}
          />
        )}
      </div>
    </Layout>
  );
};

export default SyllabusPlanner;