import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
// 🔥 CHANGED: Added import for the reusable dropdown hook
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import {
  FiSave, FiArrowLeft, FiUser,FiCreditCard, FiBook, FiClock,
  FiEdit2, FiLock, FiCopy, FiUsers, FiAward, FiGrid
} from 'react-icons/fi';
import Select from 'react-select';
import { useMemo } from 'react';   // ← add this at top if not already

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    classes: [],
    subjects: [],
    preferredSubjects: [],
    preferredGrades: [],
  });
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credForm, setCredForm] = useState({ username: '', password: '' });
  const [permissions, setPermissions] = useState({ canChangeUsername: true, canChangePassword: true });
  const [updatingCreds, setUpdatingCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // 🔥 CHANGED: Fetch real subjects from Subject module
  const { data: realSubjects } = useDropdownData('/subjects', 'subjects');
  const subjectNameMap = useMemo(() => {
  const map = {};
  (realSubjects || []).forEach(s => { map[s._id] = s.name; });
  return map;
}, [realSubjects]);
  useEffect(() => {
    fetchTeacher();
    fetchClasses();
  }, [id]);

  const fetchTeacher = async () => {
    try {
      const { data } = await api.get(`/teachers/${id}`);
      setTeacher(data);
      setForm({
        name: data.userId?.name || '',
        email: data.userId?.email || '',
        classes: data.classes?.map(c => c._id) || [],
        subjects: data.subjects || [],
        preferredSubjects: data.preferredSubjects || [],
        preferredGrades: data.preferredGrades || [],
      });
      setCredForm({ username: data.userId?.username || '', password: '' });
      setPermissions({
        canChangeUsername: data.userId?.canChangeUsername ?? true,
        canChangePassword: data.userId?.canChangePassword ?? true,
      });
      fetchSchedule();
    } catch (error) {
      toast.error('Failed to load teacher');
      navigate('/admin/teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (error) { /* silent */ }
  };

  const fetchSchedule = async () => {
    try {
      const { data } = await api.get('/teachers/schedule');
      setSchedule(data || []);
    } catch (error) {
      console.error('Failed to load schedule', error);
    }
  };
  const downloadIdCard = async () => {
  try {
    const response = await api.get(`/id-cards/student/${student._id}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ID_${student.admissionNo}.pdf`;
    a.click();
    toast.success('ID Card downloaded');
  } catch (err) {
    toast.error('Download failed');
  }
};

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/teachers/${id}`, {
        name: form.name,
        email: form.email,
        classes: form.classes,
        subjects: form.subjects,
        preferredSubjects: form.preferredSubjects,
        preferredGrades: form.preferredGrades,
      });
      toast.success('Teacher updated');
      setEditMode(false);
      fetchTeacher();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Credential helpers
  const generateStrongPassword = () => {
    const length = 10,
      upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower = 'abcdefghijklmnopqrstuvwxyz',
      numbers = '0123456789',
      symbols = '!@#$%^&*()_+',
      all = upper + lower + numbers + symbols;
    let pwd = upper[Math.floor(Math.random() * upper.length)] +
              lower[Math.floor(Math.random() * lower.length)] +
              numbers[Math.floor(Math.random() * numbers.length)] +
              symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < length; i++) pwd += all[Math.floor(Math.random() * all.length)];
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleUpdateCredentials = async () => {
    if (!credForm.username) return toast.error('Username required');
    setUpdatingCreds(true);
    try {
      await api.put(`/users/${teacher.userId._id}/credentials`, credForm);
      toast.success('Credentials updated');
      setGeneratedPassword('');
      setCredForm({ ...credForm, password: '' });
      fetchTeacher();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setUpdatingCreds(false);
    }
  };

  const handleTogglePermission = async (field, value) => {
    try {
      await api.put(`/users/${teacher.userId._id}/permissions`, { [field]: value });
      setPermissions(prev => ({ ...prev, [field]: value }));
      toast.success('Permission updated');
    } catch (error) {
      toast.error('Failed');
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center text-gray-900 dark:text-gray-100">Loading…</div></Layout>;
  if (!teacher) return <Layout role="admin"><div className="p-6 text-center text-red-500">Teacher not found.</div></Layout>;

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));

  // 🔥 CHANGED: Build subject options from real Subject module (uses name as value to match existing string storage)
  const subjectOptions = realSubjects.map(s => ({
    value: s._id,
    label: `${s.code} - ${s.name}`
  }));

  // The rest of the component is 100% unchanged from your original file.
  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* ═══════════ HEADER ═══════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <FiArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200 overflow-hidden">
                {teacher.userId?.avatar ? (
                  <img src={teacher.userId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  teacher.userId?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{teacher.userId?.name}</h1>
                <p className="text-sm text-gray-500 font-medium">Teacher</p>
              </div>
            </div>
          </div>
          <div>
  <button
    onClick={downloadIdCard}
    className="
      flex items-center gap-2
      px-5 py-3
      rounded-xl
      font-semibold
      text-white
      bg-gradient-to-r from-purple-600 via-pink-500 to-red-500
      shadow-lg
      hover:scale-105
      hover:shadow-2xl
      hover:from-purple-700
      hover:via-pink-600
      hover:to-red-600
      active:scale-95
      transition-all duration-300
    "
  >
    <FiCreditCard className="text-xl" />
    Download ID Card
  </button>
</div>
          {activeTab === 'profile' && !editMode && (


             
            <button onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <FiEdit2 className="w-4 h-4" /> Edit Profile
            </button>
            
          )}
        </div>

        {/* ═══════════ TABS ═══════════ */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'profile', icon: FiUser, label: 'Profile' },
            { key: 'timetable', icon: FiClock, label: 'Timetable' },
            { key: 'credentials', icon: FiLock, label: 'Credentials' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'credentials') setShowCredentials(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════ PROFILE TAB ═══════════ */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ── Main Column ── */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              
              {editMode ? (
                /* ── Edit Form ── */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Assigned Classes</label>
                    <Select isMulti options={classOptions}
                      value={classOptions.filter(o => form.classes.includes(o.value))}
                      onChange={(opts) => setForm({...form, classes: opts.map(o => o.value)})}
                      placeholder="Select classes..." classNamePrefix="select" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Subjects Taught</label>
                    <Select isMulti options={subjectOptions}
                      value={form.subjects.map(s => ({ value: s, label: subjectNameMap[s] || s }))}
                      onChange={(opts) => setForm({...form, subjects: opts.map(o => o.value)})}
                      placeholder="Select subjects..." classNamePrefix="select" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Preferred Subjects</label>
                    <Select isMulti options={subjectOptions}
                      value={form.preferredSubjects.map(s => ({ value: s, label: subjectNameMap[s] || s }))}
                      onChange={(opts) => setForm({...form, preferredSubjects: opts.map(o => o.value)})}
                      placeholder="Select preferred subjects..." classNamePrefix="select" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Preferred Grades</label>
                    <Select isMulti
                      options={[{value:'9th',label:'9th'},{value:'10th',label:'10th'}]}
                      value={form.preferredGrades.map(g => ({ value: g, label: g }))}
                      onChange={(opts) => setForm({...form, preferredGrades: opts.map(o => o.value)})}
                      placeholder="Select grades..." classNamePrefix="select" />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setEditMode(false)}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                      <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ── */
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                        <p className="font-semibold text-gray-900 mt-1">{teacher.userId?.name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="font-semibold text-gray-900 mt-1">{teacher.userId?.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                        <p className="font-semibold text-gray-900 mt-1">{teacher.userId?.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Classes</h3>
                    {teacher.classes?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {teacher.classes.map(c => (
                          <span key={c._id} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 italic">No classes assigned</p>}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
                    {teacher.subjects?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map(subId => (
                          <span key={subId} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            {subjectNameMap[subId] || subId}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 italic">No subjects</p>}
                  </div>
                </>
              )}
            </div>

            {/* ── Quick Stats Sidebar ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium uppercase">Classes Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{teacher.classes?.length || 0}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium uppercase">Subjects Taught</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{teacher.subjects?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TIMETABLE TAB ═══════════ */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
            {schedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Day</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Period</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedule.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.day}</td>
                        <td className="px-4 py-3 text-gray-600">{s.period}</td>
                        <td className="px-4 py-3 text-gray-600">{s.subject}</td>
                        <td className="px-4 py-3 text-gray-600">{s.class}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 italic py-8 text-center">No schedule found. Publish a class timetable first.</p>
            )}
          </div>
        )}

        {/* ═══════════ CREDENTIALS TAB ═══════════ */}
        {activeTab === 'credentials' && showCredentials && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">User Credentials</h3>
              <p className="text-sm text-gray-500">The current password is encrypted and cannot be viewed. Set a new password below.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Username</label>
                <input type="text" value={credForm.username}
                  onChange={(e) => setCredForm({ ...credForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={credForm.password}
                    onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none pr-28" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-1">{showPassword ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => {
                      const pwd = generateStrongPassword();
                      setCredForm({ ...credForm, password: pwd });
                      setGeneratedPassword(pwd);
                    }} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1">Gen</button>
                    {credForm.password && (
                      <button type="button" onClick={() => copyToClipboard(credForm.password)}
                        className="text-green-600 hover:text-green-800"><FiCopy className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
                {generatedPassword && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                    <p className="font-medium text-amber-800">Temporary Password</p>
                    <code className="text-amber-700">{generatedPassword}</code>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleUpdateCredentials} disabled={updatingCreds}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {updatingCreds ? 'Updating...' : 'Update Credentials'}
            </button>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Allow teacher to change username</span>
                <input type="checkbox" checked={permissions.canChangeUsername}
                  onChange={(e) => handleTogglePermission('canChangeUsername', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Allow teacher to change password</span>
                <input type="checkbox" checked={permissions.canChangePassword}
                  onChange={(e) => handleTogglePermission('canChangePassword', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </label>
              <p className="text-xs text-gray-500">When disabled, the teacher cannot change their own credentials via their profile.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherDetail;