import { useState, useEffect } from 'react';
import Layout from '../../../components/common/Layout';
import api from '../../../services/api';
import { useDropdownData } from '../../../hooks/useDropdownData';
import { FiFilter, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
const DefaulterList = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useDropdownData('/classes');

  useEffect(() => { fetchDefaulters(); }, [classFilter]);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const params = classFilter ? { class: classFilter } : {};
      const { data } = await api.get('/reports/defaulters', { params });
      setDefaulters(data);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Layout role="admin">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Defaulter List</h1>
        <div className="flex gap-4 mb-4">
          <FiFilter /><select value={classFilter} onChange={e=>setClassFilter(e.target.value)} className="input-field w-48">
            <option value="">All Classes</option>
            {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <table className="min-w-full text-sm">
          <thead><tr><th>Student</th><th>Class</th><th>Instalment</th><th>Due Date</th><th>Amount</th></tr></thead>
          <tbody>{defaulters.map(d=><tr key={d._id}>
            <td>{d.studentName}</td><td>{d.className}</td><td>#{d.instalmentNumber}</td>
            <td>{new Date(d.dueDate).toLocaleDateString()}</td><td className="text-red-600">{d.amount}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Layout>
  );
};
export default DefaulterList;