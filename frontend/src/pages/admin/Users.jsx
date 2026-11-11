
/*
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiSearch, FiUpload, FiDownload, FiUsers,
  FiX, FiChevronDown
} from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.name.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(filtered);
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const getRoleBadge = (role) => {
    const base = 'px-2 py-0.5 text-xs font-semibold rounded-full border';
    const colors = {
      admin:    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      teacher:  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      student:  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      parent:   'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    };
    return `${base} ${colors[role] || ''}`;
  };

  const handleFileChange = (e) => setImportFile(e.target.files[0]);

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/users/bulk-import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error('Please select a CSV file');
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const { data } = await api.post('/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
      });
      setImportResult(data);
      if (data.errors.length === 0) {
        toast.success(data.message);
      } else {
        toast.error(`${data.errors.length} failed, ${data.successes.length} succeeded`);
      }
      await fetchUsers();
      if (data.errors.length === 0) {
        setTimeout(() => closeImportModal(), 3000);
      }
    } catch (error) {
      if (error.response?.data) {
        setImportResult(error.response.data);
        toast.error(error.response.data.message || 'Import completed with errors');
      } else {
        toast.error('Network error – check console');
      }
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const nonAdmins = filteredUsers.filter(u => u.role !== 'admin').map(u => u._id);
      setSelectedUserIds(nonAdmins);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId, role) => {
    if (role === 'admin') return;
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedUserIds.length) return;
    if (!window.confirm(`Delete ${selectedUserIds.length} selected users permanently?`)) return;
    setBulkDeleting(true);
    try {
      const { data } = await api.post('/users/bulk-delete', { ids: selectedUserIds });
      if (data.deleted.length) {
        toast.success(`${data.deleted.length} user(s) deleted`);
        setUsers(prev => prev.filter(u => !data.deleted.includes(u._id)));
        setSelectedUserIds([]);
      }
      if (data.failed.length) {
        toast.error(`${data.failed.length} deletion(s) failed`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const clearSelection = () => setSelectedUserIds([]);

  return (
    <Layout role="admin">
      // Header 
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            <FiUsers className="inline mr-2 text-primary-600 dark:text-primary-400" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} total user(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-1"
          >
            <FiUpload /> Import
          </button>
          <Link to="/admin/users/create" className="btn-primary flex items-center gap-1">
            <FiPlus /> Create User
          </Link>
        </div>
      </div>

    // Search & Filter Bar 
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 p-4 mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, username, or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-40 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      // Bulk Action Bar 
      {selectedUserIds.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-800 dark:text-primary-200">
            {selectedUserIds.length} user(s) selected
          </span>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : 'Delete Selected'}
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      // Users Table 
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.filter(u => u.role !== 'admin').length > 0 &&
                        selectedUserIds.length === filteredUsers.filter(u => u.role !== 'admin').length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="pl-4 pr-2 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id)}
                          onChange={() => handleSelectUser(user._id, user.role)}
                          disabled={user.role === 'admin'}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{user.username}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={getRoleBadge(user.role)}>{user.role}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteUser(user._id, user.name)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      // Import Modal 
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Import Users from CSV
              </h2>
              <button
                onClick={closeImportModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>Download the template CSV file.</li>
                  <li>Fill in user details (name, username, email, password, role are required).</li>
                  <li>For students: optionally specify className, rollNumber, parentEmail.</li>
                  <li>For teachers: optionally specify subjects (comma‑separated).</li>
                  <li>Upload the completed file.</li>
                </ol>
              </div>

              <button
                onClick={downloadTemplate}
                className="btn-secondary flex items-center gap-2"
              >
                <FiDownload /> Download Template CSV
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 dark:text-gray-300
                    file:mr-4 file:py-2.5 file:px-5 file:rounded-xl
                    file:border-0 file:bg-primary-50 dark:file:bg-primary-900/20
                    file:text-primary-700 dark:file:text-primary-300
                    file:font-semibold hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40
                    transition-all"
                />
              </div>

              {importResult && (
                <div className="border border-pink-100 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Import Results
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    ✅ {importResult.successes.length} succeeded, ❌ {importResult.errors.length} failed
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border-t dark:border-gray-700 pt-2">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Errors:</p>
                      <ul className="text-xs text-red-500 dark:text-red-400 space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeImportModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || !importFile}
                  className="btn-primary disabled:opacity-50"
                >
                  {importing ? 'Importing…' : 'Upload and Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;


*/


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiSearch, FiUpload, FiDownload, FiUsers,
  FiX
} from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { filterUsers(); }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const filterUsers = () => {
    let filtered = users;
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(filtered);
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const getRoleBadge = (role) => {
    const base = 'px-2 py-0.5 text-xs font-semibold rounded-full border';
    const colors = {
      admin:   'bg-red-100 text-red-800 border-red-200',
      teacher: 'bg-green-100 text-green-800 border-green-200',
      student: 'bg-blue-100 text-blue-800 border-blue-200',
      parent:  'bg-purple-100 text-purple-800 border-purple-200',
    };
    return `${base} ${colors[role] || ''}`;
  };

  const handleFileChange = (e) => setImportFile(e.target.files[0]);

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/users/bulk-import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download template'); }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error('Please select a CSV file');
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const { data } = await api.post('/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
      });
      setImportResult(data);
      if (data.errors.length === 0) toast.success(data.message);
      else toast.error(`${data.errors.length} failed, ${data.successes.length} succeeded`);
      await fetchUsers();
      if (data.errors.length === 0) setTimeout(() => closeImportModal(), 3000);
    } catch (error) {
      if (error.response?.data) {
        setImportResult(error.response.data);
        toast.error(error.response.data.message || 'Import completed with errors');
      } else toast.error('Network error');
    } finally { setImporting(false); }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const nonAdmins = filteredUsers.filter(u => u.role !== 'admin').map(u => u._id);
      setSelectedUserIds(nonAdmins);
    } else setSelectedUserIds([]);
  };

  const handleSelectUser = (userId, role) => {
    if (role === 'admin') return;
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedUserIds.length) return;
    if (!window.confirm(`Delete ${selectedUserIds.length} users permanently?`)) return;
    setBulkDeleting(true);
    try {
      const { data } = await api.post('/users/bulk-delete', { ids: selectedUserIds });
      if (data.deleted.length) {
        toast.success(`${data.deleted.length} user(s) deleted`);
        setUsers(prev => prev.filter(u => !data.deleted.includes(u._id)));
        setSelectedUserIds([]);
      }
      if (data.failed.length) toast.error(`${data.failed.length} deletion(s) failed`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk delete failed');
    } finally { setBulkDeleting(false); }
  };

  const clearSelection = () => setSelectedUserIds([]);

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            <FiUsers className="inline mr-2 text-pink-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} total user(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-1">
            <FiUpload /> Import
          </button>
          <Link to="/admin/users/create" className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-1">
            <FiPlus /> Create User
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-40 bg-white"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
            <option value="warden">Warden</option>  
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-pink-800">
            {selectedUserIds.length} user(s) selected
          </span>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : 'Delete Selected'}
            </button>
            <button onClick={clearSelection} className="text-sm text-slate-600 hover:text-slate-800">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-pink-100">
              <thead className="bg-pink-50/50">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.filter(u => u.role !== 'admin').length > 0 &&
                        selectedUserIds.length === filteredUsers.filter(u => u.role !== 'admin').length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="pl-4 pr-2 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id)}
                          onChange={() => handleSelectUser(user._id, user.role)}
                          disabled={user.role === 'admin'}
                          className="rounded border-pink-300 text-pink-600 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold text-sm">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              user.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{user.username}</td>
                      <td className="px-4 py-4 text-slate-600">{user.email}</td>
                      <td className="px-4 py-4"><span className={getRoleBadge(user.role)}>{user.role}</span></td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => deleteUser(user._id, user.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Import Users from CSV</h2>
              <button onClick={closeImportModal} className="p-2 hover:bg-pink-50 rounded-lg text-slate-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Download the template CSV file.</li>
                  <li>Fill in user details (name, username, email, password, role are required).</li>
                  <li>For students: optionally specify className, rollNumber, parentEmail.</li>
                  <li>For teachers: optionally specify subjects (comma‑separated).</li>
                  <li>Upload the completed file.</li>
                </ol>
              </div>

              <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2">
                <FiDownload /> Download Template CSV
              </button>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-700
                    file:mr-4 file:py-2.5 file:px-5 file:rounded-xl
                    file:border-0 file:bg-pink-50 file:text-pink-700
                    file:font-semibold hover:file:bg-pink-100 transition-all"
                />
              </div>

              {importResult && (
                <div className="border border-pink-100 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 text-slate-900">Import Results</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    ✅ {importResult.successes.length} succeeded, ❌ {importResult.errors.length} failed
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border-t border-pink-100 pt-2">
                      <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                      <ul className="text-xs text-red-500 space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeImportModal} className="btn-secondary">Cancel</button>
                <button onClick={handleImport} disabled={importing || !importFile}
                  className="btn-primary bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50">
                  {importing ? 'Importing…' : 'Upload and Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;