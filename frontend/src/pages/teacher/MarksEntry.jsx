import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiTrash2, FiUser } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';
import Select from 'react-select';

const MarksEntry = () => {
  // Dropdown data
  const { data: classes } = useDropdownData('/classes/my-classes');   // teacher's classes
  const { data: allSubjects } = useDropdownData('/subjects', 'subjects');

  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('Midterm');
  const [totalMarks, setTotalMarks] = useState(100);
  const [examId, setExamId] = useState('');

  // Students & marks
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});   // { studentId: marksObtained }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mySubjectIds, setMySubjectIds] = useState([]);
  useEffect(() => {
  const fetchTeacherSubjects = async () => {
    try {
      const { data } = await api.get('/teachers/me');
      const raw = data.subjects || [];
      // normalise to array of ids (or names if stored as strings)
      const ids = raw.map(item =>
        typeof item === 'object' && item._id ? item._id : item
      );
      setMySubjectIds(ids);
    } catch (err) {
      console.error('Failed to load teacher subjects');
    }
  };
  fetchTeacherSubjects();
}, []);

  // Load students when class changes
  useEffect(() => {
    if (selectedClass) fetchStudents(selectedClass);
  }, [selectedClass]);

  // Load existing marks when subject/examType changes (after both selected)
  useEffect(() => {
    if (selectedClass && selectedSubject && examType) {
      fetchExistingMarks();
    }
  }, [selectedClass, selectedSubject, examType]);

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${classId}/students`);
      setStudents(data);
      // Initialize marksMap from existing marks if any (will be overwritten by fetchExistingMarks)
      const init = {};
      data.forEach(s => { init[s._id] = ''; });
      setMarksMap(init);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMarks = async () => {
    try {
      const { data } = await api.get('/marks', {
        params: {
          classId: selectedClass,
          subject: selectedSubject,
          examType,
        }
      });
      // Build marksMap from response
      const map = {};
      students.forEach(s => { map[s._id] = ''; });   // reset all
      if (Array.isArray(data)) {
        data.forEach(m => {
          map[m.studentId] = m.marksObtained.toString();
        });
      }
      setMarksMap({ ...map });
    } catch (err) {
      console.error('Failed to load existing marks', err);
    }
  };

  const handleMarksChange = (studentId, value) => {
    setMarksMap({ ...marksMap, [studentId]: value });
  };

  // Bulk fill all empty marks with a value
  const fillAll = (value) => {
    const updated = { ...marksMap };
    Object.keys(updated).forEach(sid => {
      if (!updated[sid]) updated[sid] = value;
    });
    setMarksMap(updated);
  };

  const clearAll = () => {
    const cleared = {};
    Object.keys(marksMap).forEach(sid => { cleared[sid] = ''; });
    setMarksMap(cleared);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) return toast.error('Select class and subject');
    setSaving(true);
    const marksArray = Object.entries(marksMap)
      .filter(([_, val]) => val !== '' && !isNaN(parseFloat(val)))
      .map(([studentId, marksObtained]) => ({
        studentId,
        marksObtained: parseFloat(marksObtained),
        totalMarks,
      }));

    if (marksArray.length === 0) {
      toast.error('No valid marks to save');
      setSaving(false);
      return;
    }

    try {
      await api.post('/marks/save', {
        classId: selectedClass,
        subject: selectedSubject,
        examType,
        totalMarks,
        marksData: marksArray,
        examId: examId || undefined,
      });
      toast.success('Marks saved successfully');
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  const subjectOptions = allSubjects
  .filter(s => mySubjectIds.includes(s._id) || mySubjectIds.includes(s.name))
  .map(s => ({
    value: s.name,
    label: `${s.code} - ${s.name}`,
  }));

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📝 Marks Entry</h1>

        {/* Selection Bar */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <Select
                options={classOptions}
                value={classOptions.find(o => o.value === selectedClass) || null}
                onChange={opt => { setSelectedClass(opt?.value || ''); }}
                placeholder="Select class"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Select
                options={subjectOptions}
                value={subjectOptions.find(o => o.value === selectedSubject) || null}
                onChange={opt => { setSelectedSubject(opt?.value || ''); }}
                placeholder="Select subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="input-field bg-white"
              >
                <option>Midterm</option><option>Final</option><option>Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          {/* Optional: examId for linking */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Exam ID (optional)</label>
            <input
              type="text"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="Link to a specific exam"
              className="input-field w-64"
            />
          </div>
        </div>

        {/* Students Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No students in this class.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Roll No</th>
                    <th className="px-4 py-3 text-right w-32">Marks (/{totalMarks})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={s.userId?.avatar}
                            name={s.userId?.name}
                            size="w-8 h-8"
                          />
                          <span className="font-medium">{s.userId?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                        {s.rollNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={totalMarks}
                          value={marksMap[s._id] || ''}
                          onChange={(e) => handleMarksChange(s._id, e.target.value)}
                          className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                onClick={fetchExistingMarks}
                className="btn-secondary flex items-center gap-1"
              >
                <FiRefreshCw /> Refresh Marks
              </button>
              <button
                type="button"
                onClick={() => fillAll('')}
                className="btn-secondary"
              >
                Clear All
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary bg-blue-600 text-white flex items-center gap-2"
              >
                <FiSave />
                {saving ? 'Saving…' : 'Save Marks'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default MarksEntry;