import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, FileText, FileType2 } from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import { getWeatherReportExport } from '../../services/weatherService';
import { downloadTextFile } from './weatherPageHelpers';

const formatRows = (rows = []) =>
  rows.map((row) => ({
    RecordedAt: new Date(row.recordedAt).toLocaleString(),
    Location: row.locationName,
    TemperatureC: row.temperature,
    FeelsLikeC: row.feelsLike,
    Humidity: row.humidity,
    WindKmh: row.windSpeed,
    VisibilityKm: row.visibility,
    AQI: row.aqi,
    Condition: row.condition,
    RainfallMm: row.rainfall || 0,
  }));

const WeatherReportsPage = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await getWeatherReportExport(params);
      setRows(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load weather reports.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const exportRows = useMemo(() => formatRows(rows), [rows]);

  const handleCsvExport = () => {
    const header = Object.keys(exportRows[0] || {}).join(',');
    const lines = exportRows.map((row) => Object.values(row).map((value) => `"${String(value ?? '')}"`).join(','));
    downloadTextFile('weather-report.csv', [header, ...lines].join('\n'), 'text/csv;charset=utf-8');
  };

  const handleExcelExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weather Report');
    XLSX.writeFile(workbook, 'weather-report.xlsx');
  };

  const handlePdfExport = () => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    pdf.setFontSize(18);
    pdf.text('Weather Report', 40, 50);
    pdf.setFontSize(11);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 72);
    pdf.text(`Records: ${rows.length}`, 40, 88);

    let y = 120;
    exportRows.slice(0, 18).forEach((row) => {
      const line = `${row.RecordedAt} | ${row.Condition} | ${row.TemperatureC} C | AQI ${row.AQI ?? 'N/A'} | Wind ${row.WindKmh} km/h`;
      pdf.text(line, 40, y);
      y += 18;
    });

    if (exportRows.length > 18) {
      pdf.text(`... ${exportRows.length - 18} additional rows available in CSV/Excel export.`, 40, y + 12);
    }

    pdf.save('weather-report.pdf');
  };

  if (loading) {
    return (
      <Layout role="admin">
        <WeatherSkeleton />
      </Layout>
    );
  }

  if (error && !rows.length) {
    return (
      <Layout role="admin">
        <WeatherEmptyState message={error} onRetry={loadReports} />
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Weather Reports</p>
            <h1 className="text-3xl font-bold text-slate-900">Exportable Weather Records</h1>
            <p className="mt-1 text-sm text-slate-500">
              Download historical weather data for compliance, leadership updates, or operational review.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleCsvExport} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button type="button" onClick={handleExcelExport} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
            <button type="button" onClick={handlePdfExport} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Highest Temp</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length ? Math.max(...rows.map((row) => row.temperature || 0)) : 0} C</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lowest Visibility</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length ? Math.min(...rows.map((row) => row.visibility || 0)) : 0} km</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Max AQI</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length ? Math.max(...rows.map((row) => row.aqi || 0)) : 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <button type="button" onClick={loadReports} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
              <FileType2 className="h-4 w-4" />
              Apply range
            </button>
          </div>

          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Recorded</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Condition</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Temp</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Humidity</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Wind</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">AQI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 20).map((row) => (
                    <tr key={row._id}>
                      <td className="px-4 py-3 text-slate-700">{new Date(row.recordedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-700">{row.condition}</td>
                      <td className="px-4 py-3 text-slate-700">{row.temperature} C</td>
                      <td className="px-4 py-3 text-slate-700">{row.humidity}%</td>
                      <td className="px-4 py-3 text-slate-700">{row.windSpeed} km/h</td>
                      <td className="px-4 py-3 text-slate-700">{row.aqi ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <WeatherEmptyState message="No weather records found for this range" />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WeatherReportsPage;
