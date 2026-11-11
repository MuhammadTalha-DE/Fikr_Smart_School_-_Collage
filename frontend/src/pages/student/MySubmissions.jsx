import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiClock, FiCheckCircle, FiFile } from 'react-icons/fi';

const StudentMySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get('/lab/student/submissions');
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="student">
      <h1 className="text-2xl font-bold mb-6">My Submissions</h1>

      {loading ? (
        <p className="text-gray-500">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub._id} className="bg-white p-5 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{sub.projectId?.title || 'Project'}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(sub.submittedAt).toLocaleString()}
                  </p>
                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm flex items-center">
                      <FiFile className="mr-1" /> View File
                    </a>
                  )}
                </div>
                <div className="text-right">
                  {sub.marksObtained !== undefined ? (
                    <p className="text-lg font-bold text-green-600">
                      <FiCheckCircle className="inline mr-1" /> {sub.marksObtained}/{sub.projectId?.maxMarks}
                    </p>
                  ) : (
                    <p className="text-yellow-600 flex items-center">
                      <FiClock className="mr-1" /> Pending
                    </p>
                  )}
                  {sub.feedback && (
                    <p className="text-sm text-gray-500 mt-1">Feedback: {sub.feedback}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StudentMySubmissions;