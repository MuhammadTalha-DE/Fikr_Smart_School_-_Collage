import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PracticalMarksEntry = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [maxMarks, setMaxMarks] = useState(10);
  const [experimentName, setExperimentName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionAndStudents();
  }, [sessionId]);

  const fetchSessionAndStudents = async () => {
    try {
      const sessionRes = await api.get(`/lab/sessions/${sessionId}`);
      const sess = sessionRes.data;
      setSession(sess);
      setExperimentName(sess.topic || '');

      const studentsRes = await api.get(`/classes/${sess.classId._id}/students`);
      setStudents(studentsRes.data);

      // init marks
      const initialMarks = {};
      studentsRes.data.forEach(s => { initialMarks[s._id] = ''; });
      setMarksData(initialMarks);
    } catch (error) {
      toast.error('Failed to load session');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const records = Object.entries(marksData)
      .filter(([_, val]) => val !== '')
      .map(([studentId, marksObtained]) => ({
        studentId,
        labSessionId: sessionId,
        experimentName,
        marksObtained: Number(marksObtained),
        maxMarks: Number(maxMarks),
      }));
    try {
      await api.post('/lab/marks', { marksData: records });
      toast.success('Marks saved');
      navigate('/teacher/lab');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!session) return <Layout role="teacher"><div className="p-6 text-center">Loading session...</div></Layout>;

  return (
    <Layout role="teacher">
      <h1 className="text-2xl font-bold mb-2">Practical Marks</h1>
      <p className="text-gray-500 mb-4">{session.topic} — {session.labId?.name}</p>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Experiment name"
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
          className="input-field w-64"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm">Max Marks:</label>
          <input
            type="number"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            className="w-20 input-field"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Roll No</th>
              <th className="py-2">Name</th>
              <th className="py-2">Marks (/{maxMarks})</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s._id} className="border-b">
                <td className="py-2">{s.rollNumber || '—'}</td>
                <td className="py-2">{s.userId?.name}</td>
                <td className="py-2">
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    value={marksData[s._id] || ''}
                    onChange={(e) => setMarksData(prev => ({ ...prev, [s._id]: e.target.value }))}
                    className="w-20 input-field"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default PracticalMarksEntry;