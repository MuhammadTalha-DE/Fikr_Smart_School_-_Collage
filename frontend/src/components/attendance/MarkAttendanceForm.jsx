import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { validateForm, getFirstValidationError } from '../../utils/validation';
import { attendanceSchema, validAttendanceStatuses } from '../../utils/validationSchemas';

const statusOptions = [
  { value: 'present', label: 'Present', color: 'bg-green-500' },
  { value: 'absent', label: 'Absent', color: 'bg-red-500' },
  { value: 'late', label: 'Late', color: 'bg-yellow-500' },
  { value: 'leave', label: 'Leave', color: 'bg-blue-500' },
  { value: 'medical_leave', label: 'Medical Leave', color: 'bg-purple-500' },
];

const MarkAttendanceForm = ({ classId, selectedDate, onSave, role = 'teacher' }) => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  useEffect(() => {
    if (classId) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [classId, selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/classes/${classId}/students`);
      setStudents(data);
      const init = {};
      data.forEach((s) => (init[s._id] = 'present'));
      setAttendance((prev) => ({ ...init, ...prev }));
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data } = await api.get(
        `/attendance?classId=${classId}&date=${selectedDate}`
      );
      const existing = {};
      data.forEach((rec) => (existing[rec.studentId?._id] = rec.status));
      setAttendance((prev) => ({ ...prev, ...existing }));
    } catch (error) {
      // No existing attendance
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status) => {
    const newAttendance = {};
    students.forEach((s) => (newAttendance[s._id] = status));
    setAttendance(newAttendance);
    setBulkStatus(status);
    toast.success(`All marked as ${status}`);
  };

  const handleSubmit = async () => {
    const validation = validateForm(attendanceSchema, { classId, date: selectedDate });
    if (!validation.isValid) {
      toast.error(getFirstValidationError(validation.errors));
      return;
    }

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    if (records.length === 0) {
      toast.error('No students are available for attendance');
      return;
    }

    if (records.some((record) => !record.studentId || !validAttendanceStatuses.includes(record.status))) {
      toast.error('Attendance contains an invalid student or status');
      return;
    }

    setSaving(true);

    try {
      await api.post('/attendance', {
        classId,
        date: selectedDate,
        records,
        method: 'manual',
      });
      toast.success(`Attendance saved for ${records.length} students`);
      onSave?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const found = statusOptions.find((s) => s.value === status);
    return found?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FiClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No students found in this class</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <FiFilter className="text-gray-400 w-4 h-4" />
        <span className="text-sm text-gray-500 mr-2">Quick mark:</span>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleBulkMark(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              bulkStatus === opt.value
                ? 'ring-2 ring-offset-1 border-gray-400 bg-white shadow-sm'
                : 'border-gray-200 hover:bg-white hover:shadow-sm'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${opt.color} mr-1.5`}
            />
            All {opt.label}
          </button>
        ))}
      </div>

      {/* Student List */}
      <div className="max-h-[500px] overflow-y-auto border rounded-lg divide-y">
        {students.map((student, idx) => (
          <div
            key={student._id}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {student.userId?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {student.userId?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">
                  {student.rollNumber || ''}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(student._id, opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    attendance[student._id] === opt.value
                      ? `${opt.color.replace('bg-', 'bg-').replace('500', '100')} border-${opt.color.replace('bg-', '')} text-${opt.color.replace('bg-', '').replace('500', '700')} shadow-sm`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-sm text-gray-500">
          {Object.values(attendance).filter((s) => s === 'present').length} Present |{' '}
          {Object.values(attendance).filter((s) => s === 'absent').length} Absent |{' '}
          {Object.values(attendance).filter((s) => s === 'late').length} Late
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                Save Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceForm;
