import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const WeatherMetricCard = ({ icon: Icon, label, value, suffix = '', color = 'text-blue-400', trend = 'stable' }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-gray-50 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
        {trend === 'stable' && <Activity className="w-4 h-4 text-gray-400" />}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {value}{suffix}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

export default WeatherMetricCard;
