import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { TrendingUp, CloudRain, Bus, Building2, Lightbulb } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}{entry.name.includes('Rate') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const ImpactChart = ({ data = [], type, title, icon: Icon, height = 280 }) => {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Icon className="w-6 h-6 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No analytics data available yet</p>
        <p className="text-xs text-gray-400 mt-1">Data will appear as weather history grows</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'composed' ? (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis yAxisId="left" stroke="#f87171" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#22d3ee" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="attendanceRate" fill="#f87171" radius={[4, 4, 0, 0]} name="Attendance Rate" />
            <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#22d3ee" strokeWidth={2} name="Avg Temperature" dot={false} />
          </ComposedChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="complaintCount" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Complaints" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const WeatherImpactCharts = ({ analytics }) => {
  if (!analytics) return null;

  const { attendance, transport, hostel, insights = [] } = analytics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Correlation */}
        <ImpactChart
          data={attendance?.correlation || []}
          type="composed"
          title="Weather vs Attendance"
          icon={TrendingUp}
        />

        {/* Hostel Complaints */}
        <ImpactChart
          data={hostel?.hostelImpact || []}
          type="bar"
          title="Weather vs Hostel Complaints"
          icon={Building2}
        />
      </div>

      {/* Transport Impact */}
      {transport?.transportImpact?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bus className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Transport Weather Risk</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-50 text-center">
              <p className="text-2xl font-bold text-red-600">{transport.totalHighRiskDays || 0}</p>
              <p className="text-xs text-red-500">High Risk Days</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-center">
              <p className="text-2xl font-bold text-amber-600">{transport.totalMediumRiskDays || 0}</p>
              <p className="text-xs text-amber-500">Medium Risk Days</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-center">
              <p className="text-2xl font-bold text-blue-600">{transport.foggyDays || 0}</p>
              <p className="text-xs text-blue-500">Foggy Days</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 text-center">
              <p className="text-2xl font-bold text-gray-600">{transport.transportImpact?.length || 0}</p>
              <p className="text-xs text-gray-500">Total Days</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  insight.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    insight.severity === 'high' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                  }`}>
                    {insight.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{insight.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Metric: {insight.metric}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherImpactCharts;
