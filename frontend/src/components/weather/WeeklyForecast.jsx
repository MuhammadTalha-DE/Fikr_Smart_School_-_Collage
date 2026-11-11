import { Calendar, Droplets, Wind } from 'lucide-react';
import { getWeatherIcon, formatTemp, getDayFromDate } from '../../utils/weatherHelpers';

const WeeklyForecast = ({ weekly = [], loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg mb-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!weekly.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Calendar className="w-6 h-6 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Weekly forecast unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-900">7-Day Forecast</h3>
      </div>

      <div className="space-y-2">
        {weekly.map((day, idx) => {
          const weatherIcon = getWeatherIcon(day.condition);
          const dayLabel = getDayFromDate(day.date) || day.day;
          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                idx === 0 ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 w-24">
                <span className="text-sm font-medium text-gray-700">{dayLabel}</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">{weatherIcon?.icon}</span>
                <span className="text-xs text-gray-500 hidden sm:block">{day.condition}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> {day.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3" /> {day.windSpeed} km/h
                </span>
              </div>
              <div className="flex items-center gap-2 w-16 justify-end">
                <span className="text-sm font-bold text-gray-900">{day.high}°</span>
                <span className="text-sm text-gray-400">{day.low}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyForecast;
