import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/common/Layout';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import SessionForm from '../../components/calendar/SessionForm';
import EventForm from '../../components/calendar/EventForm';
import DeadlineForm from '../../components/calendar/DeadlineForm';
import { useDropdownData } from '../../hooks/useDropdownData';
import api from '../../services/api';
import toast from 'react-hot-toast';

// API helpers (inline, to keep everything in one place)
const fetchEvents = () => api.get('/calendar/events').then(r => r.data.events || []);
const fetchDeadlines = () => api.get('/calendar/deadlines').then(r => r.data.deadlines || []);

const AcademicCalendar = () => {
  const { user } = useAuth();
  const role = user?.role;

  // ---- Dropdown data (auto‑loaded) ----
  const { data: sessions } = useDropdownData('/calendar/sessions');
  const { data: classes } = useDropdownData('/classes');
  const { data: feePlans } = useDropdownData('/fee-setup/plans');

  // ---- Events & Deadlines (manually managed to refresh after CRUD) ----
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  const refreshEventsAndDeadlines = useCallback(async () => {
    try {
      const [evs, dls] = await Promise.all([fetchEvents(), fetchDeadlines()]);
      setEvents(evs);
      setDeadlines(dls);
    } catch (err) {
      // silently keep previous data
    }
  }, []);

  // Load once on mount
  React.useEffect(() => { refreshEventsAndDeadlines(); }, [refreshEventsAndDeadlines]);

  // ---- UI State ----
  const [activeTab, setActiveTab] = useState('calendar');
  const [showForm, setShowForm] = useState(null); // 'session', 'event', 'deadline'
  const [selectedItem, setSelectedItem] = useState(null);

  // ---- CRUD Handlers ----
  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'session') await api.delete(`/calendar/sessions/${id}`);
      else if (type === 'event') await api.delete(`/calendar/events/${id}`);
      else if (type === 'deadline') await api.delete(`/calendar/deadlines/${id}`);
      toast.success(`${type} deleted`);
      // Refresh the affected list(s)
      if (type === 'session') window.location.reload(); // quick way to reload sessions (dropdown will refresh too)
      else refreshEventsAndDeadlines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openForm = (type, item = null) => {
    setSelectedItem(item);
    setShowForm(type);
  };
  const closeForm = () => { setShowForm(null); setSelectedItem(null); };

  const handleCalendarSelectEvent = (event) => {
    if (event.type === 'deadline') {
      const dl = deadlines.find(d => d._id === event.id.replace('deadline-', ''));
      if (dl) openForm('deadline', dl);
    } else {
      const ev = events.find(e => e._id === event.id);
      if (ev) openForm('event', ev);
    }
  };

  const handleCalendarSelectSlot = (slotInfo) => {
    // Prefill a new event with the clicked date range
    setSelectedItem({
      startDate: slotInfo.start.toISOString(),
      endDate: slotInfo.end.toISOString(),
      isAllDay: true,
    });
    setShowForm('event');
  };

  // ---- Tabs content ----
  const renderTable = (list, type, columns) => (
    <div className="overflow-x-auto shadow-sm rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>{columns.map(col => <th key={col.key} className={col.className}>{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">No {type}s yet</td></tr>
          ) : (
            list.map(item => (
              <tr key={item._id} className="border-t hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col.key} className={col.cellClass || ''}>{col.render(item)}</td>
                ))}
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openForm(type, item)} className="text-blue-600 mr-2 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(type, item._id)} className="text-red-600 hover:underline">Del</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout role={role}>
      <div className="p-4 md:p-6 max-w-full">
        <h1 className="text-xl md:text-2xl font-bold mb-4">Academic Calendar</h1>

        {/* Tabs */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 mb-4">
          {['calendar', 'sessions', 'events', 'deadlines'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg font-medium text-sm md:text-base ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          ))}
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <CalendarGrid events={events} deadlines={deadlines}
            onSelectEvent={handleCalendarSelectEvent}
            onSelectSlot={handleCalendarSelectSlot} />
        )}

        {/* Sessions List */}
        {activeTab === 'sessions' && (
          <div>
            <button onClick={() => openForm('session')} className="mb-3 px-4 py-2 bg-green-600 text-white rounded text-sm md:text-base">+ Add Session</button>
            {renderTable(sessions, 'session', [
              { key: 'name', label: 'Name', className: 'px-4 py-2 text-left', render: s => s.name },
              { key: 'start', label: 'Start', className: 'px-4 py-2 text-left hidden sm:table-cell', render: s => new Date(s.startDate).toLocaleDateString() },
              { key: 'end', label: 'End', className: 'px-4 py-2 text-left hidden sm:table-cell', render: s => new Date(s.endDate).toLocaleDateString() },
              { key: 'active', label: 'Active', className: 'px-4 py-2 text-center', render: s => s.isActive ? '✅' : '', cellClass: 'px-4 py-2 text-center' },
            ])}
          </div>
        )}

        {/* Events List */}
        {activeTab === 'events' && (
          <div>
            <button onClick={() => openForm('event')} className="mb-3 px-4 py-2 bg-green-600 text-white rounded text-sm md:text-base">+ Add Event</button>
            {renderTable(events, 'event', [
              { key: 'title', label: 'Title', className: 'px-4 py-2 text-left', render: e => e.title },
              { key: 'type', label: 'Type', className: 'px-4 py-2 text-left hidden sm:table-cell', render: e => e.eventType },
              { key: 'date', label: 'Date', className: 'px-4 py-2 text-left hidden md:table-cell', render: e => `${new Date(e.startDate).toLocaleDateString()} - ${new Date(e.endDate).toLocaleDateString()}` },
              { key: 'session', label: 'Session', className: 'px-4 py-2 text-left hidden md:table-cell', render: e => e.session?.name || '' },
            ])}
          </div>
        )}

        {/* Deadlines List */}
        {activeTab === 'deadlines' && (
          <div>
            <button onClick={() => openForm('deadline')} className="mb-3 px-4 py-2 bg-green-600 text-white rounded text-sm md:text-base">+ Add Deadline</button>
            {renderTable(deadlines, 'deadline', [
              { key: 'title', label: 'Title', className: 'px-4 py-2 text-left', render: d => d.title },
              { key: 'type', label: 'Type', className: 'px-4 py-2 text-left hidden sm:table-cell', render: d => d.deadlineType },
              { key: 'due', label: 'Due Date', className: 'px-4 py-2 text-left hidden md:table-cell', render: d => new Date(d.dueDate).toLocaleString() },
              { key: 'class', label: 'Class', className: 'px-4 py-2 text-left hidden md:table-cell', render: d => d.targetClass?.name || 'All' },
            ])}
          </div>
        )}

        {/* Modals */}
        {showForm === 'session' && (
          <SessionForm session={selectedItem} onClose={closeForm}
            refresh={() => { window.location.reload(); }} />   // quick reload to refresh sessions list; better: refetch sessions via callback
        )}
        {showForm === 'event' && (
          <EventForm event={selectedItem} sessions={sessions} classes={classes}
            onClose={closeForm} refresh={refreshEventsAndDeadlines} />
        )}
        {showForm === 'deadline' && (
          <DeadlineForm deadline={selectedItem} sessions={sessions} classes={classes} feePlans={feePlans}
            onClose={closeForm} refresh={refreshEventsAndDeadlines} />
        )}
      </div>
    </Layout>
  );
};

export default AcademicCalendar;