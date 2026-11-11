
import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';

const ParentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get('/announcements').then(res => {
      setAnnouncements(res.data.filter(a => a.targetRole === 'all' || a.targetRole === 'parent'));
    });
  }, []);

  return (
    <Layout role="parent">
      <h1 className="text-2xl font-bold mb-6">Announcements</h1>
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a._id} className="bg-white p-5 rounded-lg shadow">
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-gray-600 mt-2">{a.message}</p>
            <p className="text-sm text-gray-400 mt-3">{new Date(a.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ParentAnnouncements;