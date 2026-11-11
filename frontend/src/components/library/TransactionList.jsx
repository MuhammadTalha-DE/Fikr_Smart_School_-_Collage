import { FiCheck, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';   // adjust path if needed

const TransactionList = ({ loans, onReturn }) => {
  if (loans.length === 0) {
    return <p className="text-gray-500 text-center py-8">No transactions found.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Borrower</th>
            <th className="px-4 py-3 text-left">Book</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">Issue Date</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Due Date</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-right">Fine</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loans.map((loan) => (
            <tr key={loan._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={loan.user?.avatar}
                    name={loan.user?.name}
                    size="w-8 h-8"
                  />
                  <span className="font-medium">{loan.user?.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">{loan.book?.title}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {new Date(loan.issueDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {new Date(loan.dueDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    loan.status === 'issued'
                      ? 'bg-blue-100 text-blue-700'
                      : loan.status === 'returned'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {loan.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {loan.fine > 0 ? `PKR ${loan.fine}` : '—'}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {loan.status === 'issued' && (
                  <button
                    onClick={() => onReturn(loan._id)}
                    className="text-green-600 hover:text-green-800 mr-2"
                  >
                    <FiCheck className="inline" /> Return
                  </button>
                )}
                {loan.fine > 0 && loan.status === 'returned' && (
                  <Link
                    to="/admin/student-fee-accounts"
                    className="text-blue-600 hover:text-blue-800"
                    title="Pay fine"
                  >
                    <FiDollarSign className="inline" /> Pay Fine
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;