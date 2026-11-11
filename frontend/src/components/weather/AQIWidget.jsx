import { Gauge, Shield } from 'lucide-react';
import { getAQIInfo } from '../../utils/weatherHelpers';

const AQIWidget = ({ aqi, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 mb-4" />
        <div className="h-4 w-20 mx-auto bg-gray-200 rounded" />
      </div>
    );
  }

  if (!aqi) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <Gauge className="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">AQI data unavailable</p>
      </div>
    );
  }

  const aqiInfo = getAQIInfo(aqi.aqi);
  const aqiValue = aqi.aqi * 50; // Convert 1-5 scale to 0-250 approximate

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900">Air Quality Index</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${aqiInfo.bg} border-2 ${aqiInfo.border}`}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{aqi.aqi}</p>
            <p className={`text-xs font-medium ${aqiInfo.color}`}>{aqiInfo.label}</p>
          </div>
        </div>

        <div className="w-full mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">PM2.5</span>
            <span className="font-medium">{aqi.pm25?.toFixed(1)} µg/m³</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">PM10</span>
            <span className="font-medium">{aqi.pm10?.toFixed(1)} µg/m³</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">O₃</span>
            <span className="font-medium">{aqi.o3?.toFixed(1)} µg/m³</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AQIWidget;
