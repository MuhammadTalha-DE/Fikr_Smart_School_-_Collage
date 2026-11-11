import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiFileText, FiCalendar, FiBook, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchClasses();
  }, [classFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = classFilter ? { classId: classFilter } : {};
      const { data } = await api.get('/lab/projects', { params });

      // Handle different response structures
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data.projects) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes/my-classes');
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">📁 Projects</h1>
          <Link
            to="/teacher/projects/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <FiPlus /> Create Project
          </Link>
        </div>

        {/* Class Filter */}
        <div className="mb-6">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input-field w-48 bg-white"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 py-8 text-center">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-2" />
            <p>No projects found.</p>
            <Link to="/teacher/projects/create" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiBook className="w-4 h-4 text-blue-500" />
                    <span>Class: {project.classId?.name || '—'}</span>
                  </div>
                  {project.subject && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiFileText className="w-4 h-4 text-purple-500" />
                      <span>Subject: {project.subject}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiCalendar className="w-4 h-4 text-green-500" />
                    <span>Due: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiUsers className="w-4 h-4 text-amber-500" />
                    <span>Marks: {project.maxMarks || 100}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/teacher/projects/${project._id}/submissions`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Submissions →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Projects;