import { useState, useEffect } from 'react';

const AttendanceChart = ({ data = [], height = 200, type = 'bar' }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value || 0), 1);
  const barWidth = Math.max(20, Math.min(60, 600 / data.length - 8));

  if (type === 'bar') {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-end justify-around h-full gap-1 px-2">
          {data.map((item, idx) => {
            const percentage = (item.value / maxValue) * 100;
            const barHeight = animated ? percentage : 0;

            return (
              <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-medium text-gray-500">
                  {item.value}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${barHeight}%`,
                    maxHeight: `${height - 40}px`,
                    backgroundColor: item.color || '#3b82f6',
                    minHeight: item.value > 0 ? '4px' : '0px',
                  }}
                />
                <span className="text-[10px] text-gray-400 truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Donut/semi-circle summary
  if (type === 'donut') {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let cumulative = 0;

    return (
      <div className="flex items-center justify-center gap-6" style={{ height }}>
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {data.map((item, idx) => {
              const percentage = (item.value / total) * 100;
              const startAngle = cumulative;
              cumulative += percentage;
              const length = (percentage / 100) * 2 * Math.PI * 15.9;
              const offset = (startAngle / 100) * 2 * Math.PI * 15.9;

              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke={item.color || '#3b82f6'}
                  strokeWidth="3"
                  strokeDasharray={animated ? `${length} ${2 * Math.PI * 15.9}` : '0 100'}
                  strokeDashoffset={animated ? -offset : 0}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 15.9}`}
              className="opacity-50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-[10px] text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.label}</span>
              <span className="text-xs font-medium text-gray-800">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default AttendanceChart;
