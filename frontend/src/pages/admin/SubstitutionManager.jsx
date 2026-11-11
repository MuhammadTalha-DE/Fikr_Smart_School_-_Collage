import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiUserX,
  FiUserCheck,
  FiCalendar,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiBookOpen,
  FiUsers,
} from 'react-icons/fi';
import Select from 'react-select';

/* -------------------- Custom react-select styles -------------------- */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '2px 4px',
    fontSize: '0.95rem',
    color: '#0f172a',
    boxShadow: state.isFocused
      ? '0 0 0 3px rgba(37,99,235,0.15)'
      : '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f8fafc',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8',
    fontWeight: 400,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: '#475569',
    padding: '0 10px',
    '&:hover': { color: '#2563eb' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({
    ...base,
    borderRadius: '12px',
    boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
    marginTop: 6,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#eff6ff'
      : state.isFocused
      ? '#f1f5f9'
      : '#fff',
    color: state.isSelected ? '#1e40af' : '#1e293b',
    fontWeight: state.isSelected ? 600 : 400,
    padding: '10px 14px',
    cursor: 'pointer',
    '&:active': { backgroundColor: '#e2e8f0' },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#0f172a',
    fontWeight: 500,
  }),
};

const SubstitutionManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [affectedSlots, setAffectedSlots] = useState([]);
  const [substitutesMap, setSubstitutesMap] = useState({});
  const [selectedSubstitutes, setSelectedSubstitutes] = useState({});
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  // Additional loading state for substitute fetching per slot
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (err) {
      toast.error('Failed to load teachers');
    }
  };

  const handleLoadAffected = async () => {
    if (!selectedAbsentTeacher || !date)
      return toast.error('Select teacher and date');
    setLoading(true);
    try {
      const { data } = await api.get('/substitutions/affected-slots', {
        params: { teacherId: selectedAbsentTeacher, date },
      });
      setAffectedSlots(data);

      // Load substitutes for each slot
      setLoadingSubstitutes(true);
      const map = {};
      for (const slot of data) {
        const key = `${slot.day}-${slot.period}`;
        try {
          const subRes = await api.get('/substitutions/eligible-substitutes', {
            params: {
              teacherId: selectedAbsentTeacher,
              day: slot.day,
              period: slot.period,
              subject: slot.subject,
              classId: slot.classId._id,
              date,
            },
          });
          map[key] = subRes.data;
        } catch (err) {
          map[key] = [];
          toast.error(`Failed to fetch substitutes for Period ${slot.period}`);
        }
      }
      setSubstitutesMap(map);
      setLoadingSubstitutes(false);
    } catch (error) {
      toast.error('Failed to load affected slots');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubstitute = async (slot) => {
    const key = `${slot.day}-${slot.period}`;
    const subId = selectedSubstitutes[key];
    if (!subId) return toast.error('Select a substitute');
    setAssigning(true);
    try {
      await api.post('/substitutions/assign', {
        absentTeacherId: selectedAbsentTeacher,
        timetableId: slot.timetableId,
        date,
        period: slot.period,
        subject: slot.subject,
        classId: slot.classId._id,
        substituteTeacherId: subId,
      });
      toast.success('Substitute assigned');
      // Remove slot from list
      setAffectedSlots((prev) =>
        prev.filter((s) => !(s.day === slot.day && s.period === slot.period))
      );
    } catch (error) {
      toast.error('Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t._id,
    label: t.userId?.name,
  }));

  const getSubOptions = (slotKey) => {
    return (substitutesMap[slotKey] || []).map((t) => ({
      value: t._id,
      label: t.userId?.name,
    }));
  };

  return (
    <Layout role="admin">
      {/* ---------- Header ---------- */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="p-2 bg-pink-100 rounded-xl">
            <FiUserX className="text-pink-600 text-xl" />
          </span>
          Teacher Substitution
        </h1>
        <p className="text-slate-500 mt-1 ml-1">
          Manage absent teachers and assign substitutes for affected periods.
        </p>
      </div>

      {/* ---------- Selection Card ---------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 transition-all hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Absent Teacher */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
              Absent Teacher <span className="text-red-400">*</span>
            </label>
            <Select
              options={teacherOptions}
              onChange={(opt) => setSelectedAbsentTeacher(opt?.value || '')}
              placeholder="Select teacher..."
              styles={selectStyles}
              isClearable
              noOptionsMessage={() => 'No teachers available'}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                         cursor-pointer"
            />
          </div>

          {/* Load Button */}
          <div>
            <button
              onClick={handleLoadAffected}
              disabled={loading || loadingSubstitutes}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-pink-500 text-white font-medium rounded-xl
                         hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              {loading || loadingSubstitutes ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiSearch />
              )}
              {loading
                ? 'Loading...'
                : loadingSubstitutes
                ? 'Loading substitutes...'
                : 'Load Affected Periods'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Affected Periods Section ---------- */}
      {affectedSlots.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="p-1.5 bg-orange-100 rounded-lg">
              <FiClock className="text-orange-600" />
            </span>
            <h2 className="text-lg font-semibold text-slate-800">
              Affected Periods ({affectedSlots.length})
            </h2>
          </div>

          <div className="space-y-4">
            {affectedSlots.map((slot, idx) => {
              const key = `${slot.day}-${slot.period}`;
              const subs = substitutesMap[key] || [];
              return (
                <div
                  key={idx}
                  className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  {/* Slot Details */}
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-4 flex-1">
                    <div className="flex items-start gap-2">
                      <FiUsers className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Class
                        </span>
                        <span className="font-semibold text-slate-900">
                          {slot.classId?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiClock className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Period
                        </span>
                        <span className="font-semibold text-slate-900">
                          P{slot.period}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiBookOpen className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Subject
                        </span>
                        <span className="font-semibold text-slate-900">
                          {slot.subject}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Substitute Selector & Assign */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex-1 sm:min-w-[220px]">
                      <label className="text-xs font-medium text-slate-500 block mb-1">
                        Substitute teacher
                      </label>
                      <Select
                        options={getSubOptions(key)}
                        value={
                          getSubOptions(key).find(
                            (o) => o.value === selectedSubstitutes[key]
                          ) || null
                        }
                        onChange={(opt) =>
                          setSelectedSubstitutes((prev) => ({
                            ...prev,
                            [key]: opt?.value || '',
                          }))
                        }
                        placeholder="Select..."
                        styles={selectStyles}
                        isClearable
                        noOptionsMessage={() =>
                          loadingSubstitutes
                            ? 'Loading...'
                            : 'No substitutes'
                        }
                        isDisabled={loadingSubstitutes}
                      />
                    </div>
                    <button
                      onClick={() => handleAssignSubstitute(slot)}
                      disabled={
                        assigning || !selectedSubstitutes[key]
                      }
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl
                                 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      {assigning ? (
                        <FiRefreshCw className="animate-spin" />
                      ) : (
                        <FiUserCheck />
                      )}
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- Empty State ---------- */}
      {affectedSlots.length === 0 && !loading && !loadingSubstitutes && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-slate-100 rounded-full mb-4">
            <FiCalendar className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-600 mb-1">
            No affected periods
          </h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Select an absent teacher and date, then click "Load Affected
            Periods" to see which periods need a substitute.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default SubstitutionManager;
