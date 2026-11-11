import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiUsers, FiBookOpen, FiStar, FiArrowRight, FiCalendar } from 'react-icons/fi';
import Avatar from '../../components/common/Avatar';   // reuse the existing avatar component

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, classesRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/classes/my-classes'),
        ]);
        if (profileRes.data.teacher?._id) {
          setTeacherId(profileRes.data.teacher._id);
        }
        setClasses(classesRes.data || []);
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Layout role="teacher"><div className="p-6 text-center">Loading classes…</div></Layout>;

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">📚 My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {classes.length} class{classes.length !== 1 ? 'es' : ''} assigned to you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No classes assigned yet.
            </div>
          ) : (
            classes.map(cls => {
              const isClassTeacher = teacherId && cls.teacherId?._id === teacherId;
              const studentCount = cls.students?.length || 0;
              // Show up to 3 student avatars as preview
              const previewStudents = (cls.students || []).slice(0, 3);

              return (
                <div
                  key={cls._id}
                  className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition group"
                >
                  {/* Class name & badge */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      {cls.name}
                      {isClassTeacher && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <FiStar className="mr-1" /> Class Teacher
                        </span>
                      )}
                    </h2>
                    <Link
                      to={`/teacher/classes/${cls._id}`}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <FiArrowRight className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-4 h-4 text-blue-500" />
                      {studentCount} student{studentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBookOpen className="w-4 h-4 text-green-500" />
                      {cls.subjects?.length || 0} subject{(cls.subjects?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Avatar preview of first students */}
                  {previewStudents.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {previewStudents.map(student => (
                          <Avatar
                            key={student._id}
                            src={student.userId?.avatar}
                            name={student.userId?.name}
                            size="w-8 h-8 border-2 border-white"
                          />
                        ))}
                        {studentCount > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 font-medium">
                            +{studentCount - 3}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/teacher/classes/${cls._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Roster →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyClasses;