import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiUserCheck } from 'react-icons/fi';
import Select from 'react-select';
import useSchoolPeriods from '../../hooks/useSchoolPeriods';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherAvailability = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [avail, setAvail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { periods, maxPeriod } = useSchoolPeriods();

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchAvailability();
    }
  }, [selectedTeacher, maxPeriod]);

  const fetchTeachers = async () => {
    const { data } = await api.get('/teachers');
    setTeachers(data);
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/setup/teacher-availability/${selectedTeacher}`);
      setAvail(normalizeAvailability(data?.slots));
    } catch (error) {
      setAvail(normalizeAvailability());
    } finally {
      setLoading(false);
    }
  };

  const normalizeAvailability = (slots = {}) => {
    const normalized = {};
    days.forEach((day) => {
      const current = Array.isArray(slots[day]) ? slots[day] : [];
      normalized[day] = Array.from({ length: maxPeriod }, (_, index) => (
        current[index] !== false
      ));
    });
    return normalized;
  };

  const toggleSlot = (day, periodIdx) => {
    const updated = { ...avail };
    updated[day] = [...updated[day]];
    updated[day][periodIdx] = !updated[day][periodIdx];
    setAvail(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/setup/teacher-availability', {
        teacherId: selectedTeacher,
        slots: avail,
      });
      toast.success('Availability saved');
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const teacherOptions = teachers.map(t => ({ value: t._id, label: t.userId?.name }));

  return (
    <Layout role="admin">
      <div className="relative overflow-hidden">
        {/* Decorative floating orbs */}
        <div className="absolute top-0 right-10 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            <FiUserCheck className="inline mr-2 text-green-600" /> Teacher Availability
          </h1>
          <div className="bg-white backdrop-blur-md bg-opacity-70 rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
            <div className="w-72 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
              <Select
                options={teacherOptions}
                value={teacherOptions.find(t => t.value === selectedTeacher) || null}
                onChange={opt => setSelectedTeacher(opt?.value || '')}
                placeholder="Pick a teacher..."
                className="basic-select"
                classNamePrefix="select"
              />
            </div>

            {selectedTeacher && !loading && avail && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2">Day/Period</th>
                      {periods.map(p => (
                        <th key={p} className="border p-2 text-sm">P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(day => (
                      <tr key={day}>
                        <td className="border p-2 font-medium bg-gray-50">{day}</td>
                        {periods.map((p) => {
                          const periodIdx = p - 1;
                          const isFree = avail[day] ? avail[day][periodIdx] : true;
                          return (
                            <td
                              key={p}
                              onClick={() => toggleSlot(day, periodIdx)}
                              className={`border p-2 text-center cursor-pointer transition-all duration-300 ${
                                isFree
                                  ? 'bg-green-100 hover:bg-green-200'
                                  : 'bg-red-100 hover:bg-red-200'
                              }`}
                              title={isFree ? 'Free' : 'Busy'}
                            >
                              {isFree ? '✔️' : '❌'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedTeacher && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
                >
                  <FiSave /> {saving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            )}
            {selectedTeacher && loading && <p className="text-gray-500">Loading availability...</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherAvailability;
