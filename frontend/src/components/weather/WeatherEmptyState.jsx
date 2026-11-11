import { CloudOff, RefreshCw } from 'lucide-react';

const WeatherEmptyState = ({ 
  message = 'No weather data available', 
  subtitle = 'Weather data will appear once the system starts collecting it.',
  onRetry 
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
        <CloudOff className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-lg font-semibold text-gray-700">{message}</p>
      {subtitle && (
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{subtitle}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};

export default WeatherEmptyState;
