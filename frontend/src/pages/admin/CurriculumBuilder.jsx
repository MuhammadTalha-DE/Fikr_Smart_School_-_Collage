import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CurriculumForm from '../../components/CurriculumForm'; // to be created

const CurriculumBuilder = () => {
  const { user } = useAuth();
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCurriculum, setEditCurriculum] = useState(null);

  const fetchCurriculums = async () => {
    try {
      const { data } = await api.get('/curriculums');
      setCurriculums(data.curriculums || []);
    } catch (err) {
      toast.error('Failed to load curriculums');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCurriculums(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete curriculum "${name}"?`)) return;
    try {
      await api.delete(`/curriculums/${id}`);
      toast.success('Curriculum deleted');
      fetchCurriculums();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">📐 Curriculum Builder</h1>
          <button onClick={() => { setEditCurriculum(null); setShowForm(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ New Curriculum</button>
        </div>

        {loading ? <p className="text-center py-12 text-slate-500">Loading…</p> : (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Class</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Session</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Subjects</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {curriculums.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No curriculums defined</td></tr>
                  ) : (
                    curriculums.map(cur => (
                      <tr key={cur._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{cur.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{cur.class?.name}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{cur.session?.name}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{cur.subjects?.length || 0}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={() => { setEditCurriculum(cur); setShowForm(true); }} className="text-blue-600 mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(cur._id, cur.name)} className="text-red-600 hover:underline">Del</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <CurriculumForm
            curriculum={editCurriculum}
            onClose={() => setShowForm(false)}
            onSaved={() => { fetchCurriculums(); setShowForm(false); }}
          />
        )}
      </div>
    </Layout>
  );
};

export default CurriculumBuilder;