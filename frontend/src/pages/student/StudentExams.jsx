import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCalendar } from 'react-icons/fi';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/exams/student/mine');
      setExams(data);
    } catch (error) {
      console.error('Failed to load exams', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-gray-500">Loading exams…</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
        Exams
      </h1>

      {exams.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-500">
          No exams scheduled for your class.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2" />
              <div className="p-5">
                <h3 className="font-bold text-xl">{exam.name}</h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <FiCalendar className="mr-1" />
                  {new Date(exam.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exam.subjects.map(sub => (
                    <span
                      key={sub}
                      className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StudentExams;