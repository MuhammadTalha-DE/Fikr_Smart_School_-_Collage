import { Clock, CloudRain, Wind } from 'lucide-react';
import { getWeatherIcon, formatTemp, getTimeFromTimestamp } from '../../utils/weatherHelpers';

const HourlyForecast = ({ hourly = [], loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hourly.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Clock className="w-6 h-6 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Hourly forecast unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">24-Hour Forecast</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {hourly.map((hour, idx) => {
          const weatherIcon = getWeatherIcon(hour.condition);
          const time = getTimeFromTimestamp(hour.time);
          return (
            <div
              key={idx}
              className={`flex-shrink-0 w-20 p-3 rounded-xl border text-center transition-all ${
                idx === 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-100 hover:bg-blue-50/50'
              }`}
            >
              <p className="text-xs text-gray-500 mb-2">{time}</p>
              <span className="text-xl">{weatherIcon?.icon}</span>
              <p className="text-sm font-bold mt-1">{formatTemp(hour.temperature)}</p>
              <div className="mt-1 space-y-0.5">
                <p className="flex items-center justify-center gap-0.5 text-xs text-gray-400">
                  <Wind className="w-3 h-3" /> {hour.windSpeed}
                </p>
                {hour.rainfall > 0 && (
                  <p className="flex items-center justify-center gap-0.5 text-xs text-blue-500">
                    <CloudRain className="w-3 h-3" /> {hour.rainfall}mm
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyForecast;
