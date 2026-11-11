import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiFilter } from 'react-icons/fi';

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [filterSubject, setFilterSubject] = useState('all');
  const subjects = [...new Set(marks.map(m => m.subject))];

  useEffect(() => {
    api.get('/marks').then(res => setMarks(res.data));
  }, []);

  const filtered = filterSubject === 'all' ? marks : marks.filter(m => m.subject === filterSubject);

  return (
    <Layout role="student">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Marks</h1>
        <div className="flex items-center gap-2">
          <FiFilter /><select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field w-40">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Percentage</th></tr></thead>
          <tbody>
            {filtered.map(m => <tr key={m._id}><td>{m.subject}</td><td>{m.examType}</td><td>{m.marksObtained}/{m.totalMarks}</td><td>{((m.marksObtained/m.totalMarks)*100).toFixed(1)}%</td></tr>)}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentMarks;