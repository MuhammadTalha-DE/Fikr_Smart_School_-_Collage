import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiDownload, FiFileText, FiSearch, FiRefreshCw } from 'react-icons/fi';
import Select from 'react-select';
import toast from 'react-hot-toast';

/* -------------------- Custom styles for react-select -------------------- */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '2px 4px',
    fontSize: '0.95rem',
    color: '#0f172a',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f8fafc',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontWeight: 400,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: '#475569',
    padding: '0 10px',
    '&:hover': { color: '#2563eb' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({
    ...base,
    borderRadius: '12px',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    marginTop: 6,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#eff6ff'
      : state.isFocused
      ? '#f1f5f9'
      : '#fff',
    color: state.isSelected ? '#1e40af' : '#1e293b',
    fontWeight: state.isSelected ? 600 : 400,
    padding: '10px 14px',
    cursor: 'pointer',
    '&:active': { backgroundColor: '#e2e8f0' },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#0f172a',
    fontWeight: 500,
  }),
};

const TimetableReports = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      toast.error('Failed to load classes');
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (err) {
      toast.error('Failed to load teachers');
    }
  };

  const downloadReport = async (type, format) => {
    setLoading(true);
    try {
      let url = '';
      if (type === 'class') {
        url = `/timetable-reports/class/${format}?classId=${selectedClass}&term=${encodeURIComponent(
          selectedTerm
        )}&academicYear=${encodeURIComponent(selectedYear)}`;
      } else if (type === 'teacher') {
        if (!selectedTeacher) {
          toast.error('Please select a teacher');
          return;
        }
        url = `/timetable-reports/teacher/${format}?teacherId=${selectedTeacher}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `timetable-${type}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  const classOpts = classes.map((c) => ({ value: c._id, label: c.name }));
  const teacherOpts = teachers.map((t) => ({
    value: t._id,
    label: t.userId?.name,
  }));

  return (
    <Layout role="admin">
      {/* ---------- Header ---------- */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="p-2 bg-pink-100 rounded-xl">
            <FiFileText className="text-pink-600 text-xl" />
          </span>
          Timetable Reports
        </h1>
        <p className="text-slate-500 mt-1 ml-1">Download class or teacher schedules in PDF or Excel format.</p>
      </div>

      {/* ---------- Class Timetable Card ---------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <h2 className="text-lg font-semibold text-slate-800">Class Timetable</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Class Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
              Class <span className="text-red-400">*</span>
            </label>
            <Select
              options={classOpts}
              onChange={(opt) => setSelectedClass(opt?.value)}
              placeholder="Select class..."
              styles={selectStyles}
              isClearable
              noOptionsMessage={() => 'No classes found'}
            />
          </div>

          {/* Term Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                         cursor-pointer appearance-none
                         bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                         bg-no-repeat bg-[right_12px_center] bg-[length:16px]"
            >
              <option>First Term</option>
              <option>Second Term</option>
              <option>Final Term</option>
            </select>
          </div>

          {/* Academic Year Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
              Academic Year
            </label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="e.g., 2025-2026"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                         placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadReport('class', 'pdf')}
            disabled={!selectedClass || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white font-medium rounded-xl
                       hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            Download PDF
          </button>
          <button
            onClick={() => downloadReport('class', 'excel')}
            disabled={!selectedClass || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl
                       hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            Download Excel
          </button>
        </div>
      </div>

      {/* ---------- Teacher Schedule Card ---------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800">Teacher Schedule</h2>
        </div>

        <div className="max-w-xs mb-6">
          <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
            Teacher <span className="text-red-400">*</span>
          </label>
          <Select
            options={teacherOpts}
            onChange={(opt) => setSelectedTeacher(opt?.value)}
            placeholder="Select teacher..."
            styles={selectStyles}
            isClearable
            noOptionsMessage={() => 'No teachers found'}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadReport('teacher', 'pdf')}
            disabled={!selectedTeacher || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white font-medium rounded-xl
                       hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            Download PDF
          </button>
          <button
            onClick={() => downloadReport('teacher', 'excel')}
            disabled={!selectedTeacher || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl
                       hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            Download Excel
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TimetableReports;