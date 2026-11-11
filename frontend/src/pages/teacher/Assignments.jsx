import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiFile, FiUsers, FiCalendar,
  FiEdit2, FiTrash2, FiSave, FiX
} from 'react-icons/fi';

const Assignments = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', classId: '', dueDate: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(null);           // the assignment being edited
  const [editForm, setEditForm] = useState({
    title: '', description: '', classId: '', dueDate: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const fetchClasses = async () => {
    const { data } = await api.get('/classes/my-classes');
    setClasses(data);
  };

  const fetchAssignments = async () => {
    const { data } = await api.get('/assignments');
    setAssignments(data);
  };

  // ────────────── CREATE ──────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post('/assignments', createForm);
      toast.success('Assignment created');
      setCreateForm({ title: '', description: '', classId: '', dueDate: '' });
      setShowCreateForm(false);
      fetchAssignments();
    } catch (error) {
      toast.error('Creation failed');
    } finally {
      setCreateLoading(false);
    }
  };

  // ────────────── EDIT ──────────────
  const openEditModal = (a) => {
    setEditing(a);
    setEditForm({
      title: a.title,
      description: a.description || '',
      classId: a.classId?._id || a.classId,
      dueDate: a.dueDate ? a.dueDate.slice(0, 10) : '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/assignments/${editing._id}`, editForm);
      toast.success('Assignment updated');
      setEditing(null);
      fetchAssignments();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // ────────────── DELETE ──────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">📋 Assignments</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <FiPlus /> New Assignment
          </button>
        </div>

        {/* ─── Create Form ─── */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Title" value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="input-field" required />
              <textarea placeholder="Description" value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="input-field" required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={createForm.classId}
                  onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                  className="input-field bg-white" required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <input type="date" value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="input-field" required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createLoading} className="btn-primary bg-blue-600 text-white">
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Assignment Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No assignments yet. Create your first one!
            </div>
          ) : (
            assignments.map((a) => (
              <div
                key={a._id}
                className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <FiFile className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-500">{a.classId?.name}</p>
                    </div>
                  </div>
                  {/* Action icons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(a)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-gray-700 text-sm line-clamp-2">{a.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                  <FiCalendar className="w-4 h-4" />
                  <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                </div>

                <Link
                  to={`/teacher/assignments/${a._id}/submissions`}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <FiUsers className="w-4 h-4" /> View Submissions →
                </Link>
              </div>
            ))
          )}
        </div>

        {/* ─── Edit Modal ─── */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Assignment</h2>
                <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <input type="text" placeholder="Title" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input-field" required />
                <textarea placeholder="Description" value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={editForm.classId}
                    onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                    className="input-field bg-white" required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <input type="date" value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="input-field" required />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={editLoading} className="btn-primary bg-blue-600 text-white">
                    <FiSave className="mr-1" /> {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Assignments;