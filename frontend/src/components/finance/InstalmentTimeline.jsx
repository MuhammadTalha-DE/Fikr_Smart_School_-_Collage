import React from 'react';
import { FiCheck, FiClock, FiDollarSign } from 'react-icons/fi';

const InstalmentTimeline = ({ instalments = [], showPayButton = false }) => {
  if (instalments.length === 0) {
    return <p className="text-gray-500 text-sm">No instalments to show.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
      <div className="space-y-5">
        {instalments.map((inst, idx) => {
          const isPaid = inst.status === 'paid';
          return (
            <div key={inst._id || idx} className="relative flex items-start gap-4">
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isPaid ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isPaid ? <FiCheck size={16} /> : <span className="text-xs font-bold">{inst.instalmentNumber}</span>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Instalment #{inst.instalmentNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount: PKR {inst.amount} | Due: {new Date(inst.dueDate).toLocaleDateString()}
                    </p>
                    {inst.paidDate && (
                      <p className="text-xs text-green-600">Paid on: {new Date(inst.paidDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Paid</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <FiClock size={12} /> Pending
                      </span>
                    )}
                    {showPayButton && !isPaid && inst.onPay && (
                      <button
                        onClick={inst.onPay}
                        disabled={inst.paying}
                        className="ml-2 px-3 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <FiDollarSign size={12} /> {inst.paying ? 'Paying...' : 'Pay'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstalmentTimeline;