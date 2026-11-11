




import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiEdit2, FiUsers, FiBook,
  FiCheckSquare, FiClock, FiClipboard, FiBell, FiExternalLink,
  FiDownload, FiSearch
} from 'react-icons/fi';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Classes = () => {
  // ── class list & form ──
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({ name: '', teacherId: '', subjects: '' });
  const [loading, setLoading] = useState(false);

  // ── student modal state ──
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'rollNumber', direction: 'asc' });

  // ── timetable modal state ──
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetable, setTimetable] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ day: 'Monday', period: 1, subject: '', teacherId: '' });
  const [eligibleTeachers, setEligibleTeachers] = useState([]);
  const { periods } = useSchoolPeriods();

  // ── subjects (real Subject module) ──
  const { data: realSubjects, loading: subsLoading } = useDropdownData('/subjects', 'subjects');

  const subjectNameMap = useMemo(() => {
    const map = {};
    (realSubjects || []).forEach(s => { map[s._id] = s.name; });
    return map;
  }, [realSubjects]);

  const subjectOptions = useMemo(() => {
    return (realSubjects || []).map(s => ({
      value: s.name,
      label: `${s.code} - ${s.name}`,
    }));
  }, [realSubjects]);

  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => { fetchClasses(); fetchTeachers(); }, []);

  const fetchClasses = async () => {
    try { const { data } = await api.get('/classes'); setClasses(data); } catch { toast.error('Failed to load classes'); }
  };

  const fetchTeachers = async () => {
    try { const { data } = await api.get('/teachers'); setTeachers(data); } catch { toast.error('Failed to load teachers'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectsArray = selectedSubjects.map(opt => opt.value);
      const payload = { name: form.name, teacherId: form.teacherId, subjects: subjectsArray };
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/classes', payload);
        toast.success('Class created');
      }
      setShowModal(false);
      setForm({ name: '', teacherId: '', subjects: '' });
      setSelectedSubjects([]);
      setEditingClass(null);
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  const deleteClass = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    try { await api.delete(`/classes/${id}`); toast.success('Class deleted'); fetchClasses(); } catch { toast.error('Delete failed'); }
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setForm({
      name: cls.name,
      teacherId: cls.teacherId?._id || '',
      subjects: cls.subjects?.join(', ') || '',
    });
    setSelectedSubjects(
      (cls.subjects || []).map(sub => ({
        label: subjectNameMap[sub] || sub,
        value: sub,
      }))
    );
    setShowModal(true);
  };

  
  // … (keep all other handler functions unchanged, I'm omitting them for brevity but they must remain exactly as you have them)

  const teacherOptions = teachers.map(t => ({
    value: t._id,
    label: t.userId?.name || 'Unnamed',
    avatar: t.userId?.avatar,
    subjects: t.subjects?.join(', ') || 'No subjects',
  }));


// ── Student management ──

const fetchClassStudents = async (classId) => {
  setLoadingStudents(true);
  try {
    const { data } = await api.get(`/classes/${classId}/students`);
    setClassStudents(data);
    setSelectedClass(classId);
    setShowStudentsModal(true);
    fetchAvailableStudents(classId, data);
  } catch { toast.error('Failed to load students'); }
  finally { setLoadingStudents(false); }
};

const fetchAvailableStudents = async (classId, currentStudents) => {
  try {
    const { data } = await api.get('/students');
    const enrolledIds = (currentStudents || classStudents).map(s => s._id);
    setAllStudents(data.filter(s => !enrolledIds.includes(s._id)));
  } catch { /* ignore */ }
};

const handleAddStudent = async () => {
  if (!selectedStudentToAdd) return toast.error('Select a student');
  try {
    await api.post(`/classes/${selectedClass}/students`, { studentId: selectedStudentToAdd });
    toast.success('Student added');
    fetchClassStudents(selectedClass);
    setSelectedStudentToAdd('');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to add student');
  }
};

const handleRemoveStudent = async (studentId) => {
  if (!window.confirm('Remove this student?')) return;
  try {
    await api.delete(`/classes/${selectedClass}/students/${studentId}`);
    toast.success('Student removed');
    fetchClassStudents(selectedClass);
  } catch { toast.error('Remove failed'); }
};

// Sorting
const filteredClassStudents = classStudents.filter(stud => {
  const term = studentSearchTerm.toLowerCase();
  return stud.userId?.name?.toLowerCase().includes(term) ||
         stud.rollNumber?.toLowerCase().includes(term) ||
         stud.userId?.email?.toLowerCase().includes(term);
});

const sortedStudents = [...filteredClassStudents].sort((a, b) => {
  const { key, direction } = sortConfig;
  let valA, valB;
  switch (key) {
    case 'rollNumber': valA = a.rollNumber || ''; valB = b.rollNumber || ''; break;
    case 'name':      valA = a.userId?.name || ''; valB = b.userId?.name || ''; break;
    case 'email':     valA = a.userId?.email || ''; valB = b.userId?.email || ''; break;
    case 'parent':    valA = a.parentId?.userId?.name || ''; valB = b.parentId?.userId?.name || ''; break;
    default: return 0;
  }
  return (valA < valB ? -1 : 1) * (direction === 'asc' ? 1 : -1);
});

const requestSort = (key) => {
  setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));
};

// Bulk actions
const handleSelectAll = (e) => {
  if (e.target.checked) setSelectedStudents(sortedStudents.map(s => s._id));
  else setSelectedStudents([]);
};

const handleSelectStudent = (id) => {
  setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const handleBulkRemove = async () => {
  if (!selectedStudents.length) return;
  if (!window.confirm(`Remove ${selectedStudents.length} student(s)?`)) return;
  let success = 0, fail = 0;
  for (const id of selectedStudents) {
    try {
      await api.delete(`/classes/${selectedClass}/students/${id}`);
      success++;
    } catch { fail++; }
  }
  if (fail) toast.error(`${fail} failed, ${success} removed`);
  else toast.success(`${success} removed`);
  setSelectedStudents([]);
  fetchClassStudents(selectedClass);
};

// Export
const exportToCSV = () => {
  const ws = XLSX.utils.json_to_sheet(sortedStudents.map(s => ({
    'Roll No': s.rollNumber || '—',
    'Name': s.userId?.name || '—',
    'Email': s.userId?.email || '—',
    'Parent': s.parentId?.userId?.name || '—'
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, `class-${classes.find(c => c._id === selectedClass)?.name}-roster.xlsx`);
};

const exportToPDF = async () => {
  const el = document.getElementById('student-table-container');
  if (!el) return;
  const canvas = await html2canvas(el);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 5, 5, w - 10, h - 10);
  pdf.save(`class-${classes.find(c => c._id === selectedClass)?.name}-roster.pdf`);
};


  return (
    <Layout role="admin">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          <FiBook className="inline mr-2 text-pink-500" /> Class Management
        </h1>
        <button
          onClick={() => {
            setEditingClass(null);
            setForm({ name: '', teacherId: '', subjects: '' });
            setSelectedSubjects([]);
            setShowModal(true);
          }}
          className="btn-primary bg-pink-500 hover:bg-pink-600 text-white flex items-center"
        >
          <FiPlus className="mr-2" /> Add Class
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => (
          <div key={cls._id} className="card p-5 group hover:border-pink-200 transition-all">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/admin/classes/${cls._id}`} className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg" title="Manage Class">
                  <FiExternalLink className="w-4 h-4" />
                </Link>
                <button onClick={() => openEditModal(cls)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Class">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteClass(cls._id, cls.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Class">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold shadow-sm overflow-hidden">
                {cls.teacherId?.userId?.avatar ? (
                  <img src={cls.teacherId.userId.avatar} alt="" className="h-10 w-10 object-cover" />
                ) : (
                  cls.teacherId?.userId?.name?.charAt(0)?.toUpperCase() || 'T'
                )}
              </div>
              <div className="ml-3">
                {cls.teacherId ? (
                  <Link to={`/admin/teachers/${cls.teacherId._id}`} className="text-sm font-medium text-pink-600 hover:text-pink-800 hover:underline">
                    {cls.teacherId.userId?.name || 'Unnamed Teacher'}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-slate-400">Not assigned</p>
                )}
                {/* Teacher's subjects displayed with names */}
                <p className="text-xs text-slate-500">
                  {(cls.teacherId?.subjects || [])
                    .map(subId => subjectNameMap[subId] || subId)
                    .slice(0, 2)
                    .join(', ') || 'No subjects'}
                  {cls.teacherId?.subjects?.length > 2 && '...'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center text-slate-600 text-sm"><FiUsers className="mr-1.5 text-pink-500" /> {cls.students?.length || 0} students</span>
              <span className="flex items-center text-slate-600 text-sm"><FiBook className="mr-1.5 text-amber-500" /> {cls.subjects?.length || 0} subjects</span>
            </div>

            {/* Subjects of the class */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cls.subjects?.slice(0, 3).map((sub, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs font-medium bg-pink-50 text-pink-700 rounded-full">
                  {subjectNameMap[sub] || sub}
                </span>
              ))}
              {cls.subjects?.length > 3 && (
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">+{cls.subjects.length - 3}</span>
              )}
              {!cls.subjects?.length && <span className="text-xs text-slate-400 italic">No subjects</span>}
            </div>

            {/* Quick Actions */}
            <div className="mt-2 pt-3 border-t border-pink-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => fetchClassStudents(cls._id)} className="text-xs font-medium text-pink-600 hover:text-pink-800 flex items-center">
                <FiUsers className="w-3.5 h-3.5 mr-1" /> View Students
              </button>
              <div className="flex space-x-3">
                <button className="text-xs text-slate-500 hover:text-pink-600" title="Take Attendance"><FiCheckSquare className="w-4 h-4" /></button>
                <button className="text-xs text-slate-500 hover:text-pink-600" title="Enter Marks"><FiClipboard className="w-4 h-4" /></button>
                <button className="text-xs text-slate-500 hover:text-pink-600" title="Send Announcement"><FiBell className="w-4 h-4" /></button>
                <button onClick={() => handleOpenTimetable(cls._id)} className="text-xs text-slate-500 hover:text-pink-600" title="Timetable"><FiClock className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingClass ? 'Edit Class' : 'Create New Class'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Class Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher (Optional)</label>
                <Select
                  options={teacherOptions}
                  value={teacherOptions.find(o => o.value === form.teacherId) || null}
                  onChange={(opt) => setForm({...form, teacherId: opt?.value || ''})}
                  isClearable
                  placeholder="Search teacher..."
                  formatOptionLabel={(option) => (
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold mr-3">
                        {option.avatar ? <img src={option.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : option.label.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.subjects}</div>
                      </div>
                    </div>
                  )}
                  className="basic-select" classNamePrefix="select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subjects</label>
                <CreatableSelect
                  isMulti isClearable isLoading={subsLoading}
                  options={subjectOptions}
                  value={selectedSubjects}
                  onChange={(val) => setSelectedSubjects(val)}
                  placeholder="Select or create subjects..."
                  noOptionsMessage={() => "Type to create new subject"}
                  formatCreateLabel={(input) => `Create "${input}"`}
                  className="basic-multi-select" classNamePrefix="select"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Students ── */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Students in {classes.find(c => c._id === selectedClass)?.name}
              </h2>
              <button onClick={() => setShowStudentsModal(false)} className="p-2 hover:bg-pink-50 rounded-lg text-slate-500">
                &times;
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search name, roll, email..." value={studentSearchTerm}
                  onChange={e => setStudentSearchTerm(e.target.value)} className="input-field pl-9" />
              </div>
              <div className="flex gap-2">
                <button onClick={exportToCSV} className="btn-secondary text-sm flex items-center gap-1"><FiDownload /> CSV</button>
                <button onClick={exportToPDF} className="btn-secondary text-sm flex items-center gap-1"><FiDownload /> PDF</button>
              </div>
              <div className="flex gap-2 flex-1 justify-end">
                <select value={selectedStudentToAdd} onChange={e => setSelectedStudentToAdd(e.target.value)} className="input-field w-64">
                  <option value="">Add student...</option>
                  {allStudents.map(s => (
                    <option key={s._id} value={s._id}>{s.userId?.name} ({s.userId?.username})</option>
                  ))}
                </select>
                <button onClick={handleAddStudent} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white">Add</button>
              </div>
            </div>

            {selectedStudents.length > 0 && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4 flex justify-between items-center">
                <span className="text-sm font-medium text-pink-800">{selectedStudents.length} selected</span>
                <div className="flex gap-3">
                  <button onClick={handleBulkRemove} className="text-sm font-medium text-red-600 hover:text-red-800">Remove Selected</button>
                  <button onClick={() => setSelectedStudents([])} className="text-sm text-slate-600 hover:text-slate-800">Clear</button>
                </div>
              </div>
            )}

            <div id="student-table-container" className="overflow-y-auto flex-1">
              {loadingStudents ? <p className="text-center py-4 text-slate-500">Loading...</p> :
               sortedStudents.length === 0 ? <p className="text-center py-4 text-slate-500">No students enrolled.</p> : (
                <table className="w-full border-collapse">
                  <thead className="bg-pink-50 text-slate-700 text-sm">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <input type="checkbox" checked={selectedStudents.length === sortedStudents.length && sortedStudents.length > 0}
                          onChange={handleSelectAll} className="rounded border-pink-300" />
                      </th>
                      <th className="p-3 text-left cursor-pointer hover:bg-pink-100" onClick={() => requestSort('rollNumber')}>
                        Roll No {sortConfig.key === 'rollNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left cursor-pointer hover:bg-pink-100" onClick={() => requestSort('name')}>
                        Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left cursor-pointer hover:bg-pink-100" onClick={() => requestSort('email')}>
                        Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left cursor-pointer hover:bg-pink-100" onClick={() => requestSort('parent')}>
                        Parent {sortConfig.key === 'parent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {sortedStudents.map((stud, idx) => (
                      <tr key={stud._id} className="hover:bg-pink-50/30">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedStudents.includes(stud._id)}
                            onChange={() => handleSelectStudent(stud._id)} className="rounded border-pink-300" />
                        </td>
                        <td className="p-3">{stud.rollNumber || idx + 1}</td>
                        <td className="p-3">
                          <Link to={`/admin/students/${stud._id}`} className="text-pink-600 hover:underline font-medium">{stud.userId?.name}</Link>
                        </td>
                        <td className="p-3 text-slate-600">{stud.userId?.email}</td>
                        <td className="p-3 text-slate-600">{stud.parentId?.userId?.name || '—'}</td>
                        <td className="p-3">
                          <button onClick={() => handleRemoveStudent(stud._id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center pt-2 border-t border-pink-100">
              <p className="text-sm text-slate-500">Showing {sortedStudents.length} of {classStudents.length} students</p>
              <button onClick={() => setShowStudentsModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Timetable ── */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Timetable: {classes.find(c => c._id === selectedClass)?.name}</h2>
              <button onClick={() => setShowTimetableModal(false)} className="p-2 hover:bg-pink-50 rounded-lg text-slate-500">&times;</button>
            </div>
            <div className="flex gap-4 mb-4">
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field w-40">
                <option>First Term</option><option>Second Term</option><option>Final Term</option>
              </select>
              <input type="text" placeholder="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="input-field w-32" />
              <button onClick={() => fetchTimetable(selectedClass)} className="btn-secondary">Load</button>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border border-pink-100">
                <thead>
                  <tr className="bg-pink-50">
                    <th className="border border-pink-100 p-2">Day / Period</th>
                    {periods.map(p => <th key={p} className="border border-pink-100 p-2">Period {p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => (
                    <tr key={day}>
                      <td className="border border-pink-100 p-2 font-medium">{day}</td>
                      {periods.map(period => {
                        const slot = timetable?.slots?.find(s => s.day === day && s.period === period);
                        return (
                          <td key={period} onClick={() => {
                            if (slot) { setEditingSlot(slot); setSlotForm(slot); }
                            else { setEditingSlot(null); setSlotForm({ day, period, subject: '', teacherId: '' }); }
                          }} className="border border-pink-100 p-2 text-sm cursor-pointer hover:bg-pink-50">
                            {slot ? <><div className="font-medium">{slot.subject}</div><div className="text-xs text-slate-500">{slot.teacherId?.userId?.name}</div></> : <span className="text-slate-300">+ Add</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(editingSlot || slotForm.day) && (
              <div className="bg-pink-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-3">{editingSlot ? 'Edit Slot' : 'Add Slot'} - {slotForm.day} Period {slotForm.period}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Subject" value={slotForm.subject}
                    onChange={e => { setSlotForm({...slotForm, subject: e.target.value}); fetchEligibleTeachers(e.target.value); }}
                    className="input-field bg-white" />
                  <select value={slotForm.teacherId} onChange={e => setSlotForm({...slotForm, teacherId: e.target.value})} className="input-field bg-white">
                    <option value="">Select Teacher</option>
                    {eligibleTeachers.map(t => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  {editingSlot && <button onClick={() => handleDeleteSlot(editingSlot._id)} className="text-red-500 text-sm">Delete Slot</button>}
                  <button onClick={() => { setEditingSlot(null); setSlotForm({ day: '', period: 0, subject: '', teacherId: '' }); }} className="btn-secondary">Cancel</button>
                  <button onClick={handleSaveSlot} className="btn-primary bg-pink-500 hover:bg-pink-600 text-white">{editingSlot ? 'Update' : 'Add'}</button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setShowTimetableModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Classes;
