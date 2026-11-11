import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import SubjectForm from '../../components/subjectForm'; // we'll create this component

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects || []);
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openCreate = () => { setEditSubject(null); setShowForm(true); };
  const openEdit = (subject) => { setEditSubject(subject); setShowForm(true); };
  const closeForm = () => setShowForm(false);

  return (
    <Layout role={user?.role}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">📚 Subjects</h1>
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Add Subject
          </button>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-12">Loading…</p>
        ) : (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Credits</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No subjects yet</td></tr>
                  ) : (
                    subjects.map(sub => (
                      <tr key={sub._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold">{sub.code}</td>
                        <td className="px-4 py-3">{sub.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{sub.type}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{sub.credits}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{sub.department || '—'}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={() => openEdit(sub)} className="text-blue-600 mr-2 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(sub._id, sub.name)} className="text-red-600 hover:underline">Del</button>
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
          <SubjectForm
            subject={editSubject}
            onClose={closeForm}
            onSaved={() => { fetchSubjects(); closeForm(); }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Subjects;