const AttendanceStatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', percentage }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const iconColors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  const c = colorClasses[color] || colorClasses.blue;
  const ic = iconColors[color] || iconColors.blue;

  return (
    <div className={`rounded-xl border p-5 ${c} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
          {subtitle && (
            <p className="text-xs mt-1 opacity-70">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${ic}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-white/50 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percentage >= 75
                  ? 'bg-green-500'
                  : percentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs mt-1 font-medium">{percentage}%</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatsCard;
