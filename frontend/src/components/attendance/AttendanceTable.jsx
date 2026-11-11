import { format } from 'date-fns';

const statusColors = {
  present: 'bg-green-100 text-green-700 border-green-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  leave: 'bg-blue-100 text-blue-700 border-blue-200',
  medical_leave: 'bg-purple-100 text-purple-700 border-purple-200',
};

const statusLabels = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  leave: 'Leave',
  medical_leave: 'Medical Leave',
};

const AttendanceTable = ({ records, showStudent = true, showDate = true, showClass = false }) => {
  if (!records?.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg">No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {showDate && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            )}
            {showStudent && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
            )}
            {showClass && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record._id} className="hover:bg-gray-50 transition-colors">
              {showDate && (
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {format(new Date(record.date), 'dd MMM yyyy')}
                </td>
              )}
              {showStudent && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {record.studentId?.userId?.name?.charAt(0) || '?'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {record.studentId?.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.studentId?.userId?.rollNumber || ''}
                      </p>
                    </div>
                  </div>
                </td>
              )}
              {showClass && (
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {record.classId?.name || '—'}
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    statusColors[record.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusLabels[record.status] || record.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                {record.method || 'manual'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {record.remarks || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
