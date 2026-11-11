import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiTrash2, FiDownload,
  FiChevronLeft, FiChevronRight,
  FiUsers, FiBook, FiUserCheck, FiHash, FiTag
} from 'react-icons/fi';

const PAGE_SIZE = 12;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    let result = students;
    if (classFilter) {
      result = result.filter(s => s.classId?._id === classFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.userId?.name?.toLowerCase().includes(term) ||
          s.userId?.username?.toLowerCase().includes(term) ||
          s.userId?.email?.toLowerCase().includes(term) ||
          (s.rollNumber || '').toLowerCase().includes(term) ||
          (s.admissionNumber || '').toLowerCase().includes(term)   // 🔥 added admission number to search
      );
    }
    setFilteredStudents(result);
    setCurrentPage(1);
    setSelectedIds([]);
  }, [students, searchTerm, classFilter]);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (error) {
      // silent
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedStudents = filteredStudents.slice(start, start + PAGE_SIZE);

  // Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(pagedStudents.map(s => s.userId._id));
    else setSelectedIds([]);
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} student(s)?`)) return;
    try {
      await api.post('/users/bulk-delete', { ids: selectedIds });
      setStudents(prev => prev.filter(s => !selectedIds.includes(s.userId._id)));
      setSelectedIds([]);
      toast.success('Deleted');
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  const deleteSingle = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.delete(`/users/${id}`);
      setStudents(prev => prev.filter(s => s.userId._id !== id));
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed');
    }
  };

  const exportCSV = () => {
    const rows = filteredStudents.map(s => [
      s.userId?.name, s.userId?.username, s.userId?.email,
      s.rollNumber, s.admissionNumber || '', s.classId?.name, s.parentId?.userId?.name,
      (s.guardians || []).length
    ]);
    const csv = [
      ['Name', 'Username', 'Email', 'Roll No', 'Admission No', 'Class', 'Parent', 'Guardians'],
      ...rows
    ].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
  };

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-pink-500" />
            Students
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredStudents.length} student(s) found
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users/create" className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-1">
            <FiHash className="w-4 h-4" /> Add Student
          </Link>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-1">
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[220px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, email, roll no, admission no…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 bg-white"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input-field w-48 bg-white"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-sm font-medium text-pink-800">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Student Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading students…</div>
      ) : pagedStudents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No students found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedStudents.map(student => (
              <div
                key={student._id}
                className="card p-5 group hover:border-pink-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.userId._id)}
                      onChange={() => handleSelect(student.userId._id)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold overflow-hidden">
                      {student.userId?.avatar ? (
                        <img src={student.userId.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        student.userId?.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSingle(student.userId._id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete student"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                




                {/* Student Name – now links to /admin/students/:studentId */}
                <Link
                  to={`/admin/students/${student._id}`}
                  className="text-lg font-semibold text-slate-900 hover:text-pink-600 transition-colors"
                >
                  {student.userId?.name}
                </Link>

                {/* Admission Number */}
                {student.admissionNumber && (
                  <p className="text-xs text-slate-500 mt-1">
                    Adm #: {student.admissionNumber}
                  </p>
                )}

                <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FiHash className="w-4 h-4 text-blue-500" />
                    <span>Roll No: {student.rollNumber || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiBook className="w-4 h-4 text-green-500" />
                    <span>Class: {student.classId?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiUserCheck className="w-4 h-4 text-purple-500" />
                    <span>Parent: {student.parentId?.userId?.name || '—'}</span>
                  </div>
                  {/* 🔥 Guardian count */}
                  {(student.guardians || []).length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <FiUsers className="w-4 h-4 text-amber-500" />
                      <span>{student.guardians.length} guardian(s)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Students;