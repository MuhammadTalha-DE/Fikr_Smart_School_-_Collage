import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import { getCalendarFeed } from '../../services/api';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  const fetchFeed = async (start, end) => {
    try {
      const res = await getCalendarFeed(start, end);
      setEvents(res.data.events || []);
      setDeadlines(res.data.deadlines || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    fetchFeed(start.toISOString(), end.toISOString());
  }, []);

  const handleRangeChange = (range) => {
    if (range.start && range.end) {
      fetchFeed(range.start.toISOString(), range.end.toISOString());
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">School Calendar</h1>
        <CalendarGrid
          events={events}
          deadlines={deadlines}
          onSelectEvent={(e) => alert(`Event: ${e.title}`)}
          onSelectSlot={null}
        />
      </div>
    </Layout>
  );
};

export default CalendarView;