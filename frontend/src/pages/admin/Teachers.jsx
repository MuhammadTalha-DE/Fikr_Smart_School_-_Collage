import { useState, useEffect, useMemo } from 'react';   // 🔥 added useMemo
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';   // 🔥 added
import { FiUsers } from 'react-icons/fi';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 fetch real subjects and build a quick ID->name map
  const { data: subjectList } = useDropdownData('/subjects', 'subjects');
  const subjectNameMap = useMemo(() => {
    const map = {};
    (subjectList || []).forEach(s => { map[s._id] = s.name; });
    return map;
  }, [subjectList]);

  useEffect(() => {
    api.get('/teachers').then(res => setTeachers(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Layout role="admin">
      <h1 className="text-2xl font-bold mb-4"><FiUsers className="inline mr-2" />Teachers</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <Link key={t._id} to={`/admin/teachers/${t._id}`} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold">
                  {t.userId?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{t.userId?.name}</p>
                  {/* 🔥 display subject names, fallback to raw ID */}
                  <p className="text-sm text-gray-500">
                    {t.subjects?.map(id => subjectNameMap[id] || id).join(', ') || 'No subjects'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Teachers;