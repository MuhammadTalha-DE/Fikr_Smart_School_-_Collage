import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const statusIcons = {
  present: '🟢',
  absent: '🔴',
  late: '🟡',
  leave: '🔵',
  medical_leave: '🟣',
};

const AttendanceCalendar = ({ records = [], year, month, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(month || new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());

  const monthStart = startOfMonth(new Date(currentYear, currentMonth));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = getDay(monthStart);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getStatusForDay = (day) => {
    const record = records.find((r) => isSameDay(new Date(r.date), day));
    return record?.status || null;
  };

  return (
    <div className="bg-white rounded-xl border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {/* Empty cells for start day */}
        {Array.from({ length: startDay }).map((_, idx) => (
          <div key={`empty-${idx}`} className="p-2" />
        ))}

        {days.map((day) => {
          const status = getStatusForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`p-2 text-center relative transition-colors hover:bg-gray-50 ${
                isCurrentDay ? 'bg-sky-50' : ''
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isCurrentDay ? 'text-sky-600' : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </span>
              {status && (
                <div className="text-xs mt-0.5">
                  {statusIcons[status] || '⚪'}
                </div>
              )}
              {isCurrentDay && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-3 border-t bg-gray-50 rounded-b-xl">
        {Object.entries(statusIcons).map(([status, icon]) => (
          <div key={status} className="flex items-center gap-1">
            <span>{icon}</span>
            <span className="text-xs text-gray-500 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
