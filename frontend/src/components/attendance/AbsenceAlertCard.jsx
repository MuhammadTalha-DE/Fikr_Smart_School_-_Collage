import { FiBell, FiMail, FiMessageSquare, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

const AbsenceAlertCard = ({ alert, onDismiss, onResend }) => {
  const { studentName, className, date, status, sentTo, sentVia } = alert;

  const statusLabels = {
    absent: 'Absent',
    late: 'Late',
    leave: 'On Leave',
    medical_leave: 'Medical Leave',
  };

  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <FiBell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-gray-800">
                {studentName}
              </h4>
              <span className="text-xs text-gray-400">• {className}</span>
            </div>
            <p className="text-xs text-gray-500">
              {format(new Date(date), 'dd MMM yyyy')} ·{' '}
              <span
                className={`font-medium ${
                  status === 'absent'
                    ? 'text-red-600'
                    : status === 'late'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}
              >
                {statusLabels[status] || status}
              </span>
            </p>

            {sentTo && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">Alert sent to:</span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {sentVia?.includes('email') && <FiMail className="w-3 h-3" />}
                  {sentVia?.includes('notification') && (
                    <FiMessageSquare className="w-3 h-3" />
                  )}
                  <span>{sentTo}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onResend && (
            <button
              onClick={() => onResend(alert)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-sky-600 transition-colors"
              title="Resend alert"
            >
              <FiMail className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
              title="Dismiss"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {alert.notes && (
        <p className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
          {alert.notes}
        </p>
      )}
    </div>
  );
};

export default AbsenceAlertCard;
