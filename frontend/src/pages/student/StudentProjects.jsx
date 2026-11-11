import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiFileText, FiCalendar, FiBook, FiExternalLink } from 'react-icons/fi';

const StudentProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects/my');   // or '/lab/student/projects'

      // Handle different response shapes
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data.projects) {
        setProjects(data.projects);
      } else if (data.data) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      toast.error('Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-gray-500">Loading projects…</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📁 My Projects</h1>
        <p className="text-sm text-gray-500 mb-6">
          Projects assigned by your teachers
        </p>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-3" />
            <p>No projects assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiBook className="w-4 h-4 text-blue-500" />
                    <span>Teacher: {project.teacher?.userId?.name || '—'}</span>
                  </div>
                  {project.subject && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Subject: {project.subject}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiCalendar className="w-4 h-4 text-green-500" />
                    <span>
                      Due:{' '}
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString()
                        : 'No deadline'}
                    </span>
                  </div>
                </div>

                <a
                  href={`/student/projects/${project._id}/submit`}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <FiExternalLink className="w-4 h-4" /> Submit / View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentProjects;