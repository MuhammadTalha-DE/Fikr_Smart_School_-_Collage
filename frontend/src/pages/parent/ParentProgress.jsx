import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCalendar, FiBarChart2, FiChevronRight } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';

const ParentProgress = () => {
  const [children, setChildren] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildrenAndProgress();
  }, []);

  const fetchChildrenAndProgress = async () => {
    try {
      const { data } = await api.get('/users/profile');
      const childrenList = data.parent?.children || [];
      setChildren(childrenList);

      // Fetch attendance & marks for each child
      const progressMap = {};
      await Promise.all(
        childrenList.map(async (child) => {
          try {
            const [attRes, marksRes] = await Promise.all([
              api.get(`/students/${child._id}/attendance`),
              api.get(`/students/${child._id}/marks`),
            ]);
            progressMap[child._id] = {
              attendance: attRes.data.percentage || 0,
              avgMarks: marksRes.data.subjectAverages?.length
                ? (marksRes.data.subjectAverages.reduce((acc, s) => acc + parseFloat(s.average), 0) / marksRes.data.subjectAverages.length).toFixed(1)
                : 0,
            };
          } catch (err) {
            progressMap[child._id] = { attendance: 0, avgMarks: 0 };
          }
        })
      );
      setProgressData(progressMap);
    } catch (error) {
      console.error('Failed to load progress', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: children.map(c => c.userId?.name || 'Unknown'),
    datasets: [
      {
        label: 'Attendance %',
        data: children.map(c => progressData[c._id]?.attendance || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderRadius: 6,
      },
      {
        label: 'Avg Marks %',
        data: children.map(c => progressData[c._id]?.avgMarks || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderRadius: 6,
      },
    ],
  };

  return (
    <Layout role="parent">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Children Progress Overview</h1>
        <p className="text-gray-500">Attendance and performance summary for all your children</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading progress data...</div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No children linked to your account.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {children.map(child => (
              <Link
                key={child._id}
                to={`/parent/child/${child._id}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                <p className="font-medium truncate">{child.userId?.name}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-blue-600">Attendance</p>
                    <p className="text-lg font-bold">{progressData[child._id]?.attendance || 0}%</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-green-600">Avg Marks</p>
                    <p className="text-lg font-bold">{progressData[child._id]?.avgMarks || 0}%</p>
                  </div>
                </div>
                <p className="text-xs text-primary-600 mt-2 flex items-center">
                  View details <FiChevronRight className="ml-1" />
                </p>
              </Link>
            ))}
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold mb-4">Performance Comparison</h2>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
        </>
      )}
    </Layout>
  );
};

export default ParentProgress;