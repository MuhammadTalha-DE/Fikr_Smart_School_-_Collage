import { useState, useEffect } from 'react';
import Layout from '../../../components/common/Layout';
import api from '../../../services/api';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CollectionSummary = () => {
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/collection-summary');
      setDaily(data.daily || []);
      setMonthly(data.monthly || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Layout role="admin">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Collection Summary</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Daily Collection</h2>
            <table className="text-sm w-full">
              <thead><tr><th>Date</th><th>Total</th></tr></thead>
              <tbody>{daily.map(d=><tr key={d._id}><td>{d._id}</td><td>{d.total}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Monthly Collection</h2>
            <table className="text-sm w-full">
              <thead><tr><th>Month</th><th>Total</th></tr></thead>
              <tbody>{monthly.map(m=><tr key={m._id}><td>{m._id}</td><td>{m.total}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default CollectionSummary;