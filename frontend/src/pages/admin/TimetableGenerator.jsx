import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const currentYear = new Date().getFullYear();

const TimetableGenerator = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);   // array of class IDs
  const [term, setTerm] = useState('First Term');
  const [academicYear, setAcademicYear] = useState(`${currentYear}-${currentYear + 1}`);
  const [scheduleType, setScheduleType] = useState('regular');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previews, setPreviews] = useState([]);                // array of generated timetables
  const [workingDays, setWorkingDays] = useState(days.slice(0, 5));
  const [maxTeacherDailyPeriods, setMaxTeacherDailyPeriods] = useState(6);
  const [maxTeacherWeeklyPeriods, setMaxTeacherWeeklyPeriods] = useState(30);
  const { periods } = useSchoolPeriods();

  useEffect(() => {
    api.get('/classes').then(res => setClasses(Array.isArray(res.data) ? res.data : [])).catch(() => toast.error('Could not load classes'));
  }, []);

  /*const handleGenerate = async () => {
    if (selectedClasses.length === 0) {                         // ✅ fixed
      return toast.error('Select at least one class');
    }
    setGenerating(true);
    try {
      const { data } = await api.post('/timetables/generate', {
        classIds: selectedClasses,
        term,
        academicYear,
      });
      setPreviews(data);
      toast.success(`${data.length} timetable(s) generated (Draft)`);
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  }; */
  const handleGenerate = async () => {
  if (selectedClasses.length === 0) return toast.error('Select at least one class');
  if (workingDays.length === 0) return toast.error('Select at least one working day');
  if (validFrom && validUntil && validUntil < validFrom) return toast.error('Valid Until must be on or after Valid From');
  setGenerating(true);
  const toastId = toast.loading('Checking constraints and generating timetables...');
  try {
    const { data } = await api.post('/timetables/generate', {
      classIds: selectedClasses,
      term,
      academicYear,
      scheduleType,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      workingDays,
      maxTeacherDailyPeriods: Number(maxTeacherDailyPeriods),
      maxTeacherWeeklyPeriods: Number(maxTeacherWeeklyPeriods),
    }, { timeout: 120000 });
    setPreviews(data);
    const completeCount = data.filter(item => item.generationReport?.complete).length;
    toast.success(`${completeCount} of ${data.length} timetable(s) have all requested periods placed`, { id: toastId, duration: 5000 });
  } catch (error) {
    const message = error.code === 'ECONNABORTED'
      ? 'Timetable generation is taking longer than expected. Check the timetable list before retrying; the server may still finish saving it.'
      : error.response?.data?.message || 'Timetable generation failed';
    toast.error(message, { id: toastId, duration: 8000 });
  } finally {
    setGenerating(false);
  }
};

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  return (
    <Layout role="admin">
      <h1 className="text-2xl font-bold mb-4">Auto‑Generate Timetable</h1>
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-80">
            <label className="block text-sm font-medium mb-1">Classes (select multiple)</label>
            <Select
              isMulti
              options={classOptions}
              value={classOptions.filter(c => selectedClasses.includes(c.value))}
              onChange={(opts) => setSelectedClasses(opts ? opts.map(o => o.value) : [])}
              placeholder="Select classes..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium mb-1">Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="input-field">
              <option>First Term</option>
              <option>Second Term</option>
              <option>Final Term</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Year</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="input-field" />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium mb-1">Schedule</label>
            <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="input-field">
              <option value="regular">Regular</option>
              <option value="ramadan">Ramadan</option>
              <option value="exam">Exam</option>
              <option value="half-day">Half Day</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium mb-1">Valid From</label>
            <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="input-field" />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium mb-1">Teacher periods / day</label>
            <input type="number" min="1" max="12" value={maxTeacherDailyPeriods} onChange={e => setMaxTeacherDailyPeriods(e.target.value)} className="input-field" />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium mb-1">Teacher periods / week</label>
            <input type="number" min="1" max="72" value={maxTeacherWeeklyPeriods} onChange={e => setMaxTeacherWeeklyPeriods(e.target.value)} className="input-field" />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium mb-1">Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="input-field" />
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <div className="mt-5 border-t pt-4">
          <p className="mb-2 text-sm font-medium">Working days</p>
          <div className="flex flex-wrap gap-3">
            {days.map(day => <label key={day} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={workingDays.includes(day)} onChange={e => setWorkingDays(current => e.target.checked ? [...current, day].sort((a, b) => days.indexOf(a) - days.indexOf(b)) : current.filter(item => item !== day))} />{day}</label>)}
          </div>
          <p className="mt-2 text-xs text-gray-500">The generator checks teacher availability, weekly and daily load limits, room type and capacity, and conflicts with other classes in the same term and year.</p>
        </div>
      </div>

      {previews.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Generated Timetables (Drafts)</h2>
            <Link to="/admin/timetable" className="text-primary-600 hover:underline">Open Designer</Link>
          </div>
          {previews.map(timetable => (
            <div key={timetable._id} className="mb-6 bg-white rounded-xl shadow overflow-x-auto">
              <h3 className="px-4 pt-3 font-semibold text-lg">
                {timetable.classId?.name || 'Unknown Class'} — {timetable.term} {timetable.academicYear} ({timetable.scheduleType})
              </h3>
              <div className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm ${timetable.generationReport?.complete ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
                {timetable.generationReport?.complete ? 'Complete schedule' : 'Incomplete schedule'}: {timetable.generationReport?.scheduledPeriods ?? timetable.slots?.length ?? 0} of {timetable.generationReport?.requestedPeriods ?? '?'} requested periods placed.
                {timetable.generationReport?.warnings?.length > 0 && <div className="mt-1">{timetable.generationReport.warnings.join(' ')}</div>}
                {timetable.generationReport?.unscheduledPeriods > 0 && <div className="mt-1">{timetable.generationReport.subjects.filter(item => item.scheduled < item.required).map(item => `${item.subject}: ${item.scheduled}/${item.required} — ${item.reason}`).join(' ')}</div>}
              </div>
              <table className="min-w-full border-collapse mt-2">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2">Day/Period</th>
                    {periods.map(p => <th key={p} className="border p-2">P{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day}>
                      <td className="border p-2 font-medium">{day}</td>
                      {periods.map(period => {
                        const slot = timetable.slots?.find(s => s.day === day && s.period === period);
                        return (
                          <td key={period} className="border p-2 text-center">
                            {slot ? (
                              <div>
                                <div className="text-sm font-medium">{slot.subject}</div>
                                <div className="text-xs text-gray-500">{slot.teacherId?.userId?.name}</div>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default TimetableGenerator;
