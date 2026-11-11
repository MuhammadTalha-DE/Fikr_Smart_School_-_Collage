import { MapPin, Clock } from 'lucide-react';
import { formatTemp, getWeatherIcon } from '../../utils/weatherHelpers';

const WeatherHeroCard = ({ weather, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="h-4 w-48 bg-white/20 rounded mb-4" />
        <div className="h-16 w-32 bg-white/20 rounded mb-2" />
        <div className="h-4 w-64 bg-white/20 rounded" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 shadow-lg text-white">
        <p className="text-lg font-semibold">Weather Unavailable</p>
        <p className="text-sm text-white/70 mt-1">{error || 'Could not fetch weather data'}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition">
            Retry
          </button>
        )}
      </div>
    );
  }

  const weatherIcon = getWeatherIcon(weather.condition);
  const liveBadge = weather.isFallback ? 'Cached' : 'Live';
  const sourceNote = weather.source || (weather.isFallback ? 'Fallback weather data' : 'OpenWeather API');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 shadow-lg text-white">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/70 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{weather.locationName || 'Current Location'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{liveBadge}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold">{formatTemp(weather.temperature)}</span>
              <span className="text-xl text-white/60">Feels {formatTemp(weather.feelsLike)}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl">{weatherIcon?.icon}</span>
              <span className="text-xl font-medium">{weather.condition}</span>
              <span className="text-sm text-white/60 capitalize">— {weather.description}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Clock className="w-4 h-4" />
            <span>{new Date(weather.recordedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/75">
          <span className="rounded-full bg-white/10 px-2.5 py-1">{sourceNote}</span>
          {weather.apiError ? (
            <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-100">
              Live API unavailable
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WeatherHeroCard;
