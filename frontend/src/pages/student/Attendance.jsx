import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { format } from 'date-fns';

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0 });

  useEffect(() => {
    api.get('/attendance').then(res => {
      setAttendance(res.data);
      const present = res.data.filter(a => a.status === 'present').length;
      setStats({ present, absent: res.data.length - present });
    });
  }, []);

  return (
    <Layout role="student">
      <h1 className="text-2xl font-bold mb-6">Attendance Record</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-lg"><p className="text-green-800">Present</p><p className="text-3xl font-bold">{stats.present}</p></div>
        <div className="bg-red-100 p-4 rounded-lg"><p className="text-red-800">Absent</p><p className="text-3xl font-bold">{stats.absent}</p></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {attendance.map(a => <tr key={a._id}><td>{format(new Date(a.date), 'dd MMM yyyy')}</td><td><span className={a.status === 'present' ? 'text-green-600' : 'text-red-600'}>{a.status}</span></td></tr>)}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default StudentAttendance;