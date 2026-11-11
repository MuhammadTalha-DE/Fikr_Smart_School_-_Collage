import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import {
  FiUser, FiBook, FiAward, FiAlertTriangle,
  FiStar, FiChevronRight, FiRefreshCw
} from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';

const ChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meritData, setMeritData] = useState({});

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/profile');

      // Get children from profile (now properly populated from backend)
      let childList = data.parent?.children || [];

      // Enrich any children that still don't have classId populated
      childList = await enrichChildren(childList);
      setChildren(childList);

      // Fetch merit summaries for all children
      if (childList.length > 0) {
        const meritResults = await Promise.allSettled(
          childList.map(child => api.get(`/behaviour/child/${child._id}/summary`))
        );
        const meritMap = {};
        meritResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.data) {
            meritMap[childList[index]._id] = result.value.data;
          }
        });
        setMeritData(meritMap);
      }
    } catch (error) {
      console.error('Failed to load children', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch missing class info for any child that doesn't have it populated
  const enrichChildren = async (childList) => {
    const enriched = await Promise.all(
      childList.map(async (child) => {
        // If classId is already populated with a name, use it
        if (child.classId && typeof child.classId === 'object' && child.classId.name) {
          return child;
        }

        // If classId is just an ID string, fetch the class
        if (child.classId && typeof child.classId === 'string') {
          try {
            const { data: classData } = await api.get(`/classes/${child.classId}`);
            return { ...child, classId: classData };
          } catch {
            return child;
          }
        }

        // Otherwise, fetch the full student profile
        try {
          const { data: studentData } = await api.get(`/students/${child._id}`);
          return {
            ...child,
            ...studentData,
            classId: studentData.classId || null,
            rollNumber: child.rollNumber || studentData.rollNumber,
            userId: child.userId || studentData.userId,
          };
        } catch {
          return child;
        }
      })
    );
    return enriched;
  };

  // Refresh handler
  const handleRefresh = () => {
    setMeritData({});
    fetchChildren();
  };

  if (loading) {
    return (
      <Layout role="parent">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border p-5 h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="parent">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUser className="text-blue-600" /> My Children
            </h1>
            <p className="text-gray-500 mt-1">View progress, behaviour, and academic records</p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
            <FiUser className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No children linked to your account</p>
            <p className="text-sm text-gray-500 mt-2">Please contact the school administrator to link your children.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map(child => {
              const merit = meritData[child._id] || { totalPoints: 0 };
              const points = merit.totalPoints || 0;
              const meritStatus =
                points >= 30 ? 'excellent' :
                points >= 0 ? 'good' :
                points >= -20 ? 'warning' : 'critical';

              const statusColors = {
                excellent: { bg: 'bg-green-50', text: 'text-green-700' },
                good: { bg: 'bg-blue-50', text: 'text-blue-700' },
                warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
                critical: { bg: 'bg-red-50', text: 'text-red-700' },
              };
              const colors = statusColors[meritStatus];

              return (
                <div
                  key={child._id}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition group"
                >
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={child.userId?.avatar}
                        name={child.userId?.name}
                        size="w-12 h-12"
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {child.userId?.name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Roll No: {child.rollNumber || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Class Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <FiBook className="w-4 h-4 text-blue-500" />
                      <span>
                        Class: {child.classId?.name || child.classId || 'Not assigned'}
                      </span>
                    </div>

                    {/* Merit Points */}
                    <div className={`${colors.bg} rounded-xl p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <FiAward className={`w-5 h-5 ${colors.text}`} />
                        <span className={`text-sm font-medium ${colors.text}`}>Merit Points</span>
                      </div>
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {points > 0 ? '+' : ''}{points}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t divide-y divide-gray-100">
                    <Link
                      to={`/parent/child/${child._id}`}
                      className="flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FiBook className="w-4 h-4 text-blue-500" />
                        Academic Progress
                      </span>
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link
                      to={`/parent/child/${child._id}/behaviour`}
                      className="flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FiStar className="w-4 h-4 text-amber-500" />
                        View Behaviour
                      </span>
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildrenList;