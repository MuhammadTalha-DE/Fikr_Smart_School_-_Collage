import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import { useDropdownData } from '../../hooks/useDropdownData';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBarChart2 } from 'react-icons/fi';

const CourseCoverage = () => {
  const [teacher, setTeacher] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [coverageData, setCoverageData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: teachers } = useDropdownData('/teachers', 'teachers');
  const { data: classes } = useDropdownData('/classes', 'classes');
  const { data: subjects } = useDropdownData('/subjects', 'subjects');

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const params = {};
      if (teacher) params.teacher = teacher;
      if (classFilter) params.class = classFilter;
      if (subjectFilter) params.subject = subjectFilter;
      const { data } = await api.get('/course-coverage', { params });
      setCoverageData(data.coverage);
    } catch { toast.error('Failed to load coverage data'); }
    finally { setLoading(false); }
  };

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          <FiBarChart2 className="inline mr-2 text-blue-600" /> Course Coverage Tracker
        </h1>
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Teacher</label>
            <select value={teacher} onChange={e => setTeacher(e.target.value)} className="input-field">
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Class</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject</label>
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="input-field">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
            </select>
          </div>
          <button onClick={fetchCoverage} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Search</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {coverageData.map(cov => (
              <div key={cov._id} className="bg-white border rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{cov.teacher?.userId?.name} – {cov.subject?.name}</p>
                  <p className="text-sm text-gray-500">{cov.class?.name} | Unit {cov.syllabusUnit?.unitNumber}: {cov.syllabusUnit?.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${cov.coveragePercentage}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold">{cov.coveragePercentage}%</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cov.status === 'completed' ? 'bg-green-100 text-green-700' :
                    cov.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>{cov.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseCoverage;