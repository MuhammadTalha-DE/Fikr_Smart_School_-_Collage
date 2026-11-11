import { useState } from 'react';
import { Search, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTemp, getWeatherIcon, getTimeFromTimestamp } from '../../utils/weatherHelpers';

const ITEMS_PER_PAGE = 15;

const WeatherHistoryTable = ({ history = [], loading, total = 0 }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No Weather History</p>
        <p className="text-sm text-gray-400 mt-1">Weather data will appear here once the cron job starts recording.</p>
      </div>
    );
  }

  // Filter
  let filtered = [...history];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(h =>
      h.condition?.toLowerCase().includes(q) ||
      h.locationName?.toLowerCase().includes(q) ||
      `${h.temperature}`.includes(q)
    );
  }
  if (dateFrom) filtered = filtered.filter(h => new Date(h.recordedAt) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(h => new Date(h.recordedAt) <= new Date(dateTo + 'T23:59:59'));

  // Paginate
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-900">Weather History</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{total || filtered.length} records</span>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by condition, temp..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
              <th className="text-left py-3 px-2 text-gray-500 font-medium">Condition</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium">Temp</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Humidity</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Wind</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium hidden lg:table-cell">Rain</th>
              <th className="text-right py-3 px-2 text-gray-500 font-medium hidden lg:table-cell">AQI</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((record, idx) => {
              const weatherIcon = getWeatherIcon(record.condition);
              return (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-2 text-gray-600">{getTimeFromTimestamp(record.recordedAt)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span>{weatherIcon?.icon}</span>
                      <span className="text-gray-800">{record.condition}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-medium">{formatTemp(record.temperature)}</td>
                  <td className="py-3 px-2 text-right text-gray-600 hidden md:table-cell">{record.humidity}%</td>
                  <td className="py-3 px-2 text-right text-gray-600 hidden md:table-cell">{record.windSpeed} km/h</td>
                  <td className="py-3 px-2 text-right text-gray-600 hidden lg:table-cell">{record.rainfall || 0} mm</td>
                  <td className="py-3 px-2 text-right text-gray-600 hidden lg:table-cell">{record.aqi || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherHistoryTable;
