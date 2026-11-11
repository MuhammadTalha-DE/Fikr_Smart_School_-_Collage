import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getWeatherHistory } from '../../services/weatherService';
import WeatherHistoryTable from '../../components/weather/WeatherHistoryTable';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';

const WeatherHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { limit: 50, skip: (page - 1) * 50 };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await getWeatherHistory(params);
      setHistory(res.data.data || []);
      setTotal(res.data.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load weather history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, dateFrom, dateTo]);

  return (
    <Layout role="admin">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Weather History</h1>
          <p className="text-sm text-gray-500">Historical weather data records</p>
        </div>
      </div>

      {loading ? (
        <WeatherSkeleton />
      ) : error ? (
        <WeatherEmptyState message={error} onRetry={fetchHistory} />
      ) : (
        <WeatherHistoryTable
          history={history}
          loading={false}
          total={total}
        />
      )}
    </div>
    </Layout>
  );
};

export default WeatherHistoryPage;
