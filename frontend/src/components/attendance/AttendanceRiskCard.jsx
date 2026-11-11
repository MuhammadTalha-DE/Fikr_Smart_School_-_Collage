import { FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const riskConfig = {
  High: {
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    icon: FiAlertTriangle,
    iconColor: 'text-red-500',
    bg: 'bg-red-100',
  },
  Medium: {
    color: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-700',
    icon: FiAlertCircle,
    iconColor: 'text-yellow-500',
    bg: 'bg-yellow-100',
  },
  Low: {
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    icon: FiInfo,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-100',
  },
};

const AttendanceRiskCard = ({ student, onViewDetails }) => {
  const { studentName, attendancePercentage, riskLevel, recommendations } = student;
  const config = riskConfig[riskLevel] || riskConfig.Low;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 ${config.color} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${config.textColor}`}>
              {studentName || 'Unknown Student'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Attendance: {attendancePercentage}%
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            riskLevel === 'High'
              ? 'bg-red-100 text-red-700 border-red-200'
              : riskLevel === 'Medium'
              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}
        >
          {riskLevel} Risk
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-white/60 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              attendancePercentage < 40
                ? 'bg-red-500'
                : attendancePercentage < 60
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${attendancePercentage}%` }}
          />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <ul className="space-y-1 mb-3">
          {recommendations.map((rec, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-gray-600"
            >
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              {rec}
            </li>
          ))}
        </ul>
      )}

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(student)}
          className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          View Details →
        </button>
      )}
    </div>
  );
};

export default AttendanceRiskCard;
