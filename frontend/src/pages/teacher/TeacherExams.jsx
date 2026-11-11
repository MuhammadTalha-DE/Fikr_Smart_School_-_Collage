import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCalendar, FiBook, FiClipboard } from 'react-icons/fi';

const TeacherExams = () => {
  const [exams, setExams] = useState([]);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    const { data } = await api.get('/exams/teacher/mine');
    setExams(data);
  };

  return (
    <Layout role="teacher">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">Exam Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div key={exam._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2" />
            <div className="p-5">
              <h3 className="font-bold text-xl">{exam.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p><FiBook className="inline mr-1" /> {exam.classId?.name}</p>
                <p><FiCalendar className="inline mr-1" /> {new Date(exam.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exam.subjects.map(sub => (
                    <span key={sub} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">{sub}</span>
                  ))}
                </div>
              </div>
              <Link to={`/teacher/marks?classId=${exam.classId?._id}&subject=&examId=${exam._id}`} className="mt-4 inline-flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
  <FiClipboard className="mr-2" /> Enter Marks
</Link>
<Link to={`/teacher/exams/${exam._id}/results`} className="mt-4 inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
  Results
</Link>


            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default TeacherExams;