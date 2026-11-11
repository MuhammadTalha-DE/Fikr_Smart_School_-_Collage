import { FiClock, FiDollarSign, FiRefreshCw } from 'react-icons/fi';

const LoanCard = ({ loan, onRenew }) => {
  const isActive = loan.status === 'issued';
  const isOverdue = isActive && new Date(loan.dueDate) < new Date();

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-start">
      <div className="flex-1">
        <h3 className="font-bold text-gray-900">{loan.book?.title}</h3>
        <p className="text-sm text-gray-500">{loan.book?.author}</p>
        <p className="text-xs text-gray-400 mt-1">Rack: {loan.book?.rackNo || '—'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <FiClock /> Due: {new Date(loan.dueDate).toLocaleDateString()}
          </span>
          {loan.fine > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <FiDollarSign /> Fine: PKR {loan.fine}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            loan.status === 'issued'
              ? isOverdue
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {loan.status === 'issued' && isOverdue ? 'Overdue' : loan.status}
        </span>
        {isActive && loan.fine === 0 && (
          <button
            onClick={() => onRenew(loan._id)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <FiRefreshCw /> Renew (7 days)
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanCard;