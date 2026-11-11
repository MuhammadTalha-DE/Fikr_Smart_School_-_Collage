import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const StudentPracticalMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      // Get student ID first
      const { data: profile } = await api.get('/users/profile');
      if (profile.student) {
        const { data } = await api.get(`/lab/marks?studentId=${profile.student._id}`);
        setMarks(data);
      }
    } catch (error) {
      console.error('Failed to load marks', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="student">
      <h1 className="text-2xl font-bold mb-6">My Practical Marks</h1>

      {loading ? (
        <p className="text-gray-500">Loading marks...</p>
      ) : marks.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No practical marks recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3">Experiment</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m._id} className="border-t">
                  <td className="px-4 py-3">{m.experimentName || '—'}</td>
                  <td className="px-4 py-3 font-medium">
                    {m.marksObtained}/{m.maxMarks}
                  </td>
                  <td className="px-4 py-3">{m.remarks || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default StudentPracticalMarks;