import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Thermometer, Droplets, Wind, Gauge } from 'lucide-react';

const chartColors = {
  temperature: '#f87171',
  humidity: '#22d3ee',
  wind: '#38bdf8',
  aqi: '#fb923c',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}{entry.name === 'Temperature' ? '°C' : entry.name === 'Humidity' ? '%' : entry.name === 'AQI' ? '' : ' km/h'}
        </p>
      ))}
    </div>
  );
};

const WeatherChart = ({ type = 'area', data = [], dataKey, color, title, icon: Icon, unit = '', height = 250 }) => {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Icon className="w-6 h-6 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  const ChartComponent = type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart;
  const DataComponent = type === 'bar' ? Bar : type === 'line' ? Line : Area;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color }} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {type !== 'bar' && <Legend />}
          {type === 'area' && (
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          <DataComponent
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={type === 'area' ? `url(#gradient-${dataKey})` : undefined}
            fillOpacity={1}
            radius={type === 'bar' ? [4, 4, 0, 0] : undefined}
            name={title}
            unit={unit}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

const WeatherCharts = ({ chartData = [] }) => {
  if (!chartData?.length) return null;

  return (
    <>
      <WeatherChart type="area" data={chartData} dataKey="temperature" color={chartColors.temperature} title="Temperature Trend (24h)" icon={Thermometer} unit="°C" />
      <WeatherChart type="area" data={chartData} dataKey="humidity" color={chartColors.humidity} title="Humidity Trend (24h)" icon={Droplets} unit="%" />
      <WeatherChart type="line" data={chartData} dataKey="wind" color={chartColors.wind} title="Wind Speed Trend (24h)" icon={Wind} unit=" km/h" />
      <WeatherChart type="bar" data={chartData} dataKey="aqi" color={chartColors.aqi} title="AQI Trend (24h)" icon={Gauge} />
    </>
  );
};

export default WeatherCharts;
export { WeatherChart, chartColors };
