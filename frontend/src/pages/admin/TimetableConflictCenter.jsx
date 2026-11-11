import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const TimetableConflictCenter = () => {
  const [timetables, setTimetables] = useState([]);
  const [selectedTt, setSelectedTt] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    const { data } = await api.get('/timetables'); // adjust as needed (you might need a query to get all drafts/published)
    setTimetables(data);
  };

  const handleCheckConflicts = async (timetableId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/timetables/${timetableId}/conflicts`);
      setConflicts(data);
      toast.success(`Found ${data.length} conflicts`);
    } catch (error) {
      toast.error('Failed to fetch conflicts');
    } finally {
      setLoading(false);
    }
  };

  const buildResolutionPayload = (timetableId, conflict, suggestion) => ({
    timetableId,
    day: conflict.day,
    period: conflict.period,
    action: suggestion.action,
    targetDay: suggestion.day,
    targetPeriod: suggestion.period,
    teacherId: suggestion.teacherId,
    roomId: suggestion.roomId,
  });

  const handleResolve = async (conflict, suggestion) => {
    try {
      await api.post('/timetables/resolve-conflict', buildResolutionPayload(selectedTt, conflict, suggestion));
      toast.success('Conflict resolved');
      handleCheckConflicts(selectedTt);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Resolution failed');
    }
  };

  return (
    <Layout role="admin">
      <h1 className="text-2xl font-bold mb-4">Conflict Center</h1>
      <div className="flex gap-4 mb-6">
        <select value={selectedTt} onChange={e => setSelectedTt(e.target.value)} className="input-field w-64">
  <option value="">Select Timetable</option>
  {timetables.map(tt => (
    <option key={tt._id} value={tt._id}>
      {tt.classId?.name} — {tt.term} ({tt.academicYear})
    </option>
  ))}
</select>
        <button onClick={() => handleCheckConflicts(selectedTt)} disabled={!selectedTt} className="btn-primary">Check Conflicts</button>
      </div>
      {loading && <p>Loading...</p>}
      {conflicts.length > 0 ? (
        <div className="space-y-3">
          {conflicts.map((c, idx) => (
            <div key={idx} className="bg-red-50 border border-red-300 p-3 rounded">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="text-red-600 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {c.day} Period {c.period}: {c.message}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(c.suggestions || []).map((suggestion, suggestionIdx) => (
                      <button
                        key={`${suggestion.action}-${suggestionIdx}`}
                        onClick={() => handleResolve(c, suggestion)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-red-200 rounded hover:bg-red-100"
                      >
                        <FiCheckCircle />
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && <p className="text-gray-500">No conflicts detected.</p>}
    </Layout>
  );
};

export default TimetableConflictCenter;
