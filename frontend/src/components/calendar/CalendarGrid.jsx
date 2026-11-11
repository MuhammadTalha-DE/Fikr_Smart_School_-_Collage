import React, { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarGrid = ({ events = [], deadlines = [], onSelectEvent, onSelectSlot, onRangeChange }) => {
  const calendarItems = useMemo(() => {
    const items = [];
    events.forEach((ev) => {
      items.push({
        id: ev._id,
        title: ev.title,
        start: new Date(ev.startDate),
        end: new Date(ev.endDate),
        color: ev.color || '#3b82f6',
        type: 'event',
        resource: ev,
      });
    });
    deadlines.forEach((dl) => {
      items.push({
        id: `deadline-${dl._id}`,
        title: `⏰ ${dl.title}`,
        start: new Date(dl.dueDate),
        end: new Date(dl.dueDate),
        color: '#ef4444',
        type: 'deadline',
        resource: dl,
      });
    });
    return items;
  }, [events, deadlines]);

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.85,
      color: 'white',
      border: 'none',
      fontSize: '0.75rem',
      padding: '2px 4px',
    },
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 md:p-4 overflow-x-auto">
      <Calendar
        localizer={localizer}
        events={calendarItems}
        startAccessor="start"
        endAccessor="end"
        style={{ minHeight: 500, height: 'calc(100vh - 220px)' }}
        views={['month', 'week', 'day']}
        defaultView="month"
        selectable
        popup
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        onRangeChange={onRangeChange}
        eventPropGetter={eventStyleGetter}
        tooltipAccessor={(event) => event.title}
      />
    </div>
  );
};

export default CalendarGrid;