import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSave, FiArrowLeft, FiUser, FiBook, FiCalendar, FiBarChart2,
  FiFileText, FiEdit2, FiDownload, FiLock, FiCopy, FiEye,
  FiEyeOff, FiMessageCircle,FiCreditCard, FiActivity, FiMessageSquare, FiUsers, FiShield, FiHash,FiTag,FiMapPin , FiBookOpen,FiFile
} from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ðŸ‘‡ Helper component for the new profile cards
const InfoCard = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4">
    <p className="text-xs text-gray-500 uppercase">{label}</p>
    <p className="font-medium text-gray-900 mt-1">{value || 'â€”'}</p>
  </div>
);

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // ðŸ‘‡ Expanded form to include new fields
  const [form, setForm] = useState({
    name: '', email: '', rollNumber: '', classId: '', parentId: '',
    admissionNumber: '', admissionDate: '', dateOfBirth: '', gender: 'male',
    bloodGroup: '', cnic: '', formBNumber: '', address: '', medicalNotes: '', previousSchool: '',
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credForm, setCredForm] = useState({ username: '', password: '' });
  const [permissions, setPermissions] = useState({ canChangeUsername: true, canChangePassword: true });
  const [updatingCreds, setUpdatingCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [academicRecords, setAcademicRecords] = useState([]);
const [loadingHistory, setLoadingHistory] = useState(false);

// Fetch academic records when the tab is opened or student loads
useEffect(() => {
  if (student) fetchAcademicRecords();
}, [student]);




  useEffect(() => {
    fetchStudent();
    fetchClasses();
    fetchParents();
  }, [id]);


  const fetchAcademicRecords = async () => {
  setLoadingHistory(true);
  try {
    const { data } = await api.get(`/academic-records?student=${id}`);
    setAcademicRecords(data.records);
  } catch (error) {
    toast.error('Failed to load academic history');
  } finally { setLoadingHistory(false); }
};

  const fetchStudent = async () => {
    try {
      const { data } = await api.get(`/students/${id}`);
      setStudent(data);
      setPermissions({
        canChangeUsername: data.userId?.canChangeUsername ?? true,
        canChangePassword: data.userId?.canChangePassword ?? true,
      });
      setCredForm({ username: data.userId?.username || '', password: '' });
      // Preâ€‘fill form with existing data (old + new)
      setForm({
        name: data.userId?.name || '',
        email: data.userId?.email || '',
        rollNumber: data.rollNumber || '',
        classId: data.classId?._id || '',
        parentId: data.parentId?._id || '',
        admissionNumber: data.admissionNumber || '',
        admissionDate: data.admissionDate ? data.admissionDate.slice(0, 10) : '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
        gender: data.gender || 'male',
        bloodGroup: data.bloodGroup || '',
        cnic: data.cnic || '',
        formBNumber: data.formBNumber || '',
        address: data.address || '',
        medicalNotes: data.medicalNotes || '',
        previousSchool: data.previousSchool || '',
      });
      fetchAttendance();
      fetchMarks();
      fetchAssignments();
      fetchNotes();
    } catch (error) {
      toast.error('Failed to load student');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => { const { data } = await api.get('/classes'); setClasses(data); };
  const fetchParents = async () => {
    try { const { data } = await api.get('/parents'); setParents(data); }
    catch (err) { toast.error('Failed to load parents'); setParents([]); }
  };
  const fetchAttendance = async () => {
    try { const { data } = await api.get(`/students/${id}/attendance`); setAttendance(data); } catch (err) {}
  };
  const fetchMarks = async () => {
    try { const { data } = await api.get(`/students/${id}/marks`); setMarks(data); } catch (err) {}
  };
  const fetchAssignments = async () => {
    if (!student?.classId?._id) return;
    try { const { data } = await api.get(`/assignments?classId=${student.classId._id}`); setAssignments(data); } catch (err) {}
  };
  const fetchNotes = async () => {
    try { const { data } = await api.get(`/students/${id}/notes`); setNotes(data); } catch (err) {}
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
      await api.put(`/students/${id}`, form);   // sends all form fields
      toast.success('Profile updated');
      setEditMode(false);
      const { data } = await api.get(`/students/${id}`);
      setStudent(data);
      fetchAttendance(); fetchMarks(); fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleTransferClass = async (newClassId) => {
    if (!window.confirm('Transfer this student to another class?')) return;
    try {
      await api.put(`/students/${id}`, { classId: newClassId });
      toast.success('Class transferred');
      fetchStudent();
    } catch (error) { toast.error('Transfer failed'); }
  };

  const generateStrongPassword = () => {
    const length = 10, upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower = 'abcdefghijklmnopqrstuvwxyz',
          numbers = '0123456789', symbols = '!@#$%^&*()_+', all = upper + lower + numbers + symbols;
    let pwd = upper[Math.floor(Math.random() * upper.length)] + lower[Math.floor(Math.random() * lower.length)] +
              numbers[Math.floor(Math.random() * numbers.length)] + symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < length; i++) pwd += all[Math.floor(Math.random() * all.length)];
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); };

  const handleUpdateCredentials = async () => {
    if (!credForm.username) return toast.error('Username required');
    setUpdatingCreds(true);
    try {
      await api.put(`/users/${student.userId._id}/credentials`, credForm);
      toast.success('Credentials updated');
      setGeneratedPassword('');
      setCredForm({ ...credForm, password: '' });
      fetchStudent();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
    finally { setUpdatingCreds(false); }
  };

  const handleTogglePermission = async (field, value) => {
    try {
      await api.put(`/users/${student.userId._id}/permissions`, { [field]: value });
      setPermissions(prev => ({ ...prev, [field]: value }));
      toast.success('Permission updated');
    } catch (error) { toast.error('Failed'); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/students/${id}/notes`, { note: newNote });
      toast.success('Note added');
      setNewNote('');
      fetchNotes();
    } catch (error) { toast.error('Failed to add note'); }
    finally { setAddingNote(false); }
  };

  const generateReportCard = () => {
    const input = document.getElementById('report-card-content');
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student?.userId?.name}_report_card.pdf`);
    });
  };

  const chartData = marks ? {
    labels: marks.subjectAverages?.map(s => s.subject) || [],
    datasets: [{
      label: 'Average %',
      data: marks.subjectAverages?.map(s => s.average) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
    }],
  } : null;

  if (loading) return <Layout role="admin"><div className="p-6 text-center text-gray-900 dark:text-gray-100">Loading student profileâ€¦</div></Layout>;
  if (!student) return <Layout role="admin"><div className="p-6 text-center text-red-500">Student not found.</div></Layout>;

  return (

     <Layout role="admin">
      {/* â•â•â•â•â•â•â•â•â•â•â• HEADER â•â•â•â•â•â•â•â•â•â•â• */}
<div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
  <div className="absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
  <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-28 w-28 rounded-full bg-white/10 blur-xl"></div>

  <div className="relative flex flex-wrap items-center justify-between gap-4">
    
    {/* LEFT SIDE */}
    <div className="flex items-center gap-4">
      
      <button
        onClick={() => navigate(-1)}
        className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <FiArrowLeft size={22} />
      </button>

      <div className="h-14 w-14 rounded-xl border-2 border-white/30 bg-white/20 p-1 shadow-inner">
        {student.userId?.avatar ? (
          <img
            src={student.userId.avatar}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/30 text-2xl font-bold text-white">
            {student.userId?.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          {student.userId?.name}
        </h1>

        <p className="text-sm text-white/70">
          Roll No: {student.rollNumber || 'N/A'} â€¢ Class:{' '}
          {student.classId?.name || 'Not assigned'}
        </p>

        {student.admissionNumber && (
          <span className="mt-1 inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white">
            Adm #: {student.admissionNumber}
          </span>
        )}
      </div>
    </div>

    {/* RIGHT SIDE BUTTONS */}
    <div className="flex flex-wrap items-center gap-3">

      {/* Edit Profile */}
      <button
        onClick={() => setEditMode(true)}
        className="
          flex items-center gap-2
          rounded-xl
          px-5 py-3
          text-sm font-semibold
          text-white
          bg-gradient-to-r from-purple-600 via-pink-500 to-red-500
          shadow-lg
          transition-all duration-300
          hover:scale-105
          hover:shadow-2xl
          hover:from-purple-700
          hover:via-pink-600
          hover:to-red-600
          active:scale-95
        "
      >
        <FiEdit2 className="h-5 w-5" />
        Edit Profile
      </button>

      {/* Download ID Card */}
      <button
        onClick={downloadIdCard}
        className="
          flex items-center gap-2
          rounded-xl
          px-5 py-3
          font-semibold
          text-white
          bg-gradient-to-r from-purple-600 via-pink-500 to-red-500
          shadow-lg
          transition-all duration-300
          hover:scale-105
          hover:shadow-2xl
          hover:from-purple-700
          hover:via-pink-600
          hover:to-red-600
          active:scale-95
        "
      >
        <FiCreditCard className="text-xl" />
        Download ID Card
      </button>

      {/* Report Card */}
      <button
        onClick={generateReportCard}
        className="
          flex items-center gap-2
          rounded-xl
          px-5 py-3
          text-sm font-semibold
          text-white
          bg-gradient-to-r from-purple-600 via-pink-500 to-red-500
          shadow-lg
          backdrop-blur-sm
          transition-all duration-300
          hover:scale-105
          hover:shadow-2xl
          hover:from-purple-700
          hover:via-pink-600
          hover:to-red-600
          active:scale-95
        "
      >
        <FiDownload className="h-5 w-5" />
        Report Card
      </button>

    </div>
  </div>
</div>

    {/* â•â•â•â•â•â•â•â•â•â•â• TABS â•â•â•â•â•â•â•â•â•â•â• */}
    <div className="mb-6 flex flex-wrap gap-2">
      {[
        { key: 'profile', label: 'Profile', icon: FiUser },
        { key: 'attendance', label: 'Attendance', icon: FiCalendar },
        { key: 'marks', label: 'Marks', icon: FiBarChart2 },
        { key: 'assignments', label: 'Assignments', icon: FiFileText },
        { key: 'notes', label: 'Notes', icon: FiMessageSquare },
        { key: 'guardians', label: 'Guardians', icon: FiUsers },
        { key: 'academic', label: 'Academic History', icon: FiBook },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>

    {/* â•â•â•â•â•â•â•â•â•â•â• PROFILE TAB â•â•â•â•â•â•â•â•â•â•â• */}
    {activeTab === 'profile' && (
      <div id="report-card-content">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column â€“ Personal Info */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {editMode ? (
                /* â”€â”€ Edit Form (unchanged logic, only styled) â”€â”€ */
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <InputGroup label="Full Name">
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Email">
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Roll Number">
                      <input type="text" value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Class">
                      <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="input-field">
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </InputGroup>
                    <InputGroup label="Parent/Guardian">
                      <select value={form.parentId || ''} onChange={e => setForm({...form, parentId: e.target.value})} className="input-field">
                        <option value="">Select Parent</option>
                        {parents.map(p => <option key={p._id} value={p._id}>{p.userId?.name}</option>)}
                      </select>
                    </InputGroup>
                    <InputGroup label="Admission Number">
                      <input type="text" value={form.admissionNumber} onChange={e => setForm({...form, admissionNumber: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Admission Date">
                      <input type="date" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Date of Birth">
                      <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="input-field" />
                      <label className="block text-sm font-medium text-gray-700">CNIC</label>
                      <input type="text" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} className="input-field" placeholder="XXXXX-XXXXXXX-X" />
                      <label className="block text-sm font-medium text-gray-700">Form-B / B-Form Number</label>
                      <input type="text" value={form.formBNumber} onChange={e => setForm({...form, formBNumber: e.target.value})} className="input-field" />
                    </InputGroup>
                    <InputGroup label="Gender">
                      <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input-field">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </InputGroup>
                    <InputGroup label="Blood Group">
                      <input type="text" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className="input-field" />
                    </InputGroup>
                    <div className="md:col-span-2">
                      <InputGroup label="Address">
                        <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" />
                      </InputGroup>
                    </div>
                    <div className="md:col-span-2">
                      <InputGroup label="Medical Notes">
                        <textarea value={form.medicalNotes} onChange={e => setForm({...form, medicalNotes: e.target.value})} className="input-field" rows="2" />
                      </InputGroup>
                    </div>
                    <InputGroup label="Previous School">
                      <input type="text" value={form.previousSchool} onChange={e => setForm({...form, previousSchool: e.target.value})} className="input-field" />
                    </InputGroup>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary bg-blue-600 text-white">
                      <FiSave className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                /* â”€â”€ View Mode â”€â”€ */
                <>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ProfileCard icon={FiUser} label="Full Name" value={student.userId?.name} color="blue" />
                    <ProfileCard icon={FiMessageSquare} label="Email" value={student.userId?.email} color="indigo" />
                    <ProfileCard icon={FiUser} label="Username" value={student.userId?.username} color="purple" />
                    <ProfileCard icon={FiHash} label="Roll Number" value={student.rollNumber || 'Not set'} color="pink" />
                    <ProfileCard icon={FiTag} label="Admission No." value={student.admissionNumber || 'â€”'} color="cyan" />
                    <ProfileCard icon={FiCalendar} label="Admission Date" value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'â€”'} color="emerald" />
                    <ProfileCard icon={FiCalendar} label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'â€”'} color="teal" />
                    <ProfileCard icon={FiFileText} label="CNIC" value={student.cnic || 'â€”'} color="cyan" />
                    <ProfileCard icon={FiFileText} label="Form-B / B-Form" value={student.formBNumber || 'â€”'} color="blue" />
                    <ProfileCard icon={FiUser} label="Gender" value={student.gender || 'â€”'} color="orange" />
                    <ProfileCard icon={FiActivity} label="Blood Group" value={student.bloodGroup || 'â€”'} color="red" />
                    <ProfileCard icon={FiBook} label="Class" value={student.classId?.name || 'â€”'} color="blue" />
                    <ProfileCard icon={FiMapPin} label="Address" value={student.address || 'â€”'} color="gray" />
                    <ProfileCard icon={FiFileText} label="Medical Notes" value={student.medicalNotes || 'â€”'} color="yellow" />
                    <ProfileCard icon={FiBookOpen} label="Previous School" value={student.previousSchool || 'â€”'} color="indigo" />
                    <ProfileCard icon={FiFile} label="Documents" value={student.documents?.length ? `${student.documents.length} file(s)` : 'None'} color="purple" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar â€“ Stats & Actions */}
          <div className="space-y-6">
            {/* Class & Parent Info */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Academic & Parent Info</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                  <p className="text-xs font-medium text-blue-600">CLASS</p>
                  <p className="text-lg font-bold text-gray-900">{student.classId?.name || 'Not assigned'}</p>
                  <p className="text-sm text-gray-600">Teacher: {student.classId?.teacherId?.userId?.name || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                  <p className="text-xs font-medium text-purple-600">PARENT / GUARDIAN</p>
                  {student.parentId?.userId ? (
                    <Link to={`/admin/parents/${student.parentId._id}`} className="text-lg font-bold text-blue-600 hover:underline">
                      {student.parentId.userId.name}
                    </Link>
                  ) : (
                    <p className="text-lg font-bold text-gray-400">Not linked</p>
                  )}
                  <p className="text-sm text-gray-600">{student.parentId?.userId?.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{attendance?.percentage || 0}%</p>
                  <p className="text-xs font-medium text-blue-600">Attendance</p>
                  <p className="text-xs text-gray-500">{attendance?.present}/{attendance?.total} days</p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">
                    {marks?.subjectAverages?.length
                      ? (marks.subjectAverages.reduce((acc, s) => acc + parseFloat(s.average), 0) / marks.subjectAverages.length).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-xs font-medium text-green-600">Avg Marks</p>
                </div>
              </div>
            </div>

            {/* Credentials (toggle) */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex w-full items-center justify-between text-left font-medium text-blue-600 hover:text-blue-800"
              >
                <span className="flex items-center gap-2"><FiLock className="h-4 w-4" /> Credentials</span>
                <span>{showCredentials ? 'â–²' : 'â–¼'}</span>
              </button>
              {showCredentials && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <InputGroup label="Username">
                    <input type="text" value={credForm.username} onChange={e => setCredForm({...credForm, username: e.target.value})} className="input-field" />
                  </InputGroup>
                  <InputGroup label="New Password">
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={credForm.password} onChange={e => setCredForm({...credForm, password: e.target.value})} className="input-field pr-20" placeholder="Leave blank to keep" />
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-gray-500">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                        <button type="button" onClick={() => { const pwd = generateStrongPassword(); setCredForm({...credForm, password: pwd}); setGeneratedPassword(pwd); }} className="text-xs font-medium text-blue-600">Gen</button>
                        {credForm.password && <button type="button" onClick={() => copyToClipboard(credForm.password)} className="text-green-600"><FiCopy /></button>}
                      </div>
                    </div>
                    {generatedPassword && (
                      <div className="mt-2 rounded-lg bg-yellow-50 p-2 text-sm">
                        <p className="font-medium text-yellow-800">Temporary Password</p>
                        <code className="text-yellow-700">{generatedPassword}</code>
                      </div>
                    )}
                  </InputGroup>
                  <button onClick={handleUpdateCredentials} disabled={updatingCreds} className="btn-primary w-full bg-blue-600 text-white">
                    {updatingCreds ? 'Updating...' : 'Update Credentials'}
                  </button>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm">
                      <span>Can change username</span>
                      <input type="checkbox" checked={permissions.canChangeUsername} onChange={e => handleTogglePermission('canChangeUsername', e.target.checked)} className="rounded" />
                    </label>
                    <label className="flex items-center justify-between text-sm">
                      <span>Can change password</span>
                      <input type="checkbox" checked={permissions.canChangePassword} onChange={e => handleTogglePermission('canChangePassword', e.target.checked)} className="rounded" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button onClick={() => document.getElementById('transfer-class-modal').showModal()} className="btn-secondary w-full">
                Transfer Class
              </button>
              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <FiMessageCircle className="h-4 w-4" /> Message Parent
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Other Tabs â€“ keep exactly the same, just wrapped in styled cards */}
    {activeTab === 'attendance' && 
    <TabCard title="Attendance History">{ <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attendance History</h3>
              <div className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-gray-800 dark:text-gray-200">
                Overall: <span className="font-bold">{attendance?.percentage || 0}%</span>
              </div>
            </div>
            {attendance?.records?.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 text-sm">
                    <th className="pb-2">Date</th><th className="pb-2">Class</th><th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {attendance.records.map(a => (
                    <tr key={a._id}>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{a.classId?.name}</td>
                      <td className={`py-2 font-medium ${a.status === 'present' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {a.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No attendance records yet.</p>
              </div>
            )}
          </div>}</TabCard>}
    {activeTab === 'marks' && 
    <TabCard title="Marks Overview">{  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Marks Overview</h3>
            {chartData && chartData.labels.length > 0 ? (
              <div className="mb-6"><Bar data={chartData} /></div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mb-4">No marks data to display.</p>
            )}
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Detailed Marks</h4>
            {marks?.allMarks?.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 text-sm">
                    <th className="pb-2">Subject</th><th className="pb-2">Exam</th><th className="pb-2">Marks</th><th className="pb-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {marks.allMarks.map(m => (
                    <tr key={m._id}>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{m.subject}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{m.examType}</td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{m.marksObtained}/{m.totalMarks}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{((m.marksObtained/m.totalMarks)*100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <FiBarChart2 className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No marks recorded yet.</p>
              </div>
            )}
          </div>}</TabCard>}
    {activeTab === 'notes' && 
    <TabCard title="Private Notes">{<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Private Notes</h3>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this student..."
                className="input-field flex-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                rows="2"
              />
              <button onClick={handleAddNote} disabled={addingNote} className="btn-primary text-sm text-white h-fit">
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No notes yet.</p>
              ) : (
                notes.map(n => (
                  <div key={n._id} className="border-l-4 border-primary-500 pl-3 py-2">
                    <p className="text-gray-800 dark:text-gray-200">{n.note}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {n.createdBy?.name} â€¢ {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>}</TabCard>}
    {activeTab === 'assignments' && 
      <TabCard title="Assignments">{ <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assignments</h3>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map(a => {
                  const submission = a.submissions?.find(s => s.studentId === id);
                  return (
                    <div key={a._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{a.title}</h4>
                        <span className={`text-sm ${submission ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {submission ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                      {submission && <p className="text-xs text-gray-500 dark:text-gray-500">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiFileText className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No assignments for this class.</p>
              </div>
            )}
          </div>}</TabCard>}

    {/* Guardians Tab */}
    {activeTab === 'guardians' && (
      <TabCard title="Guardians">
        {student.guardians?.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {student.guardians.map((g, idx) => (
              <GuardianCard key={g._id || idx} guardian={g} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FiUsers} message="No guardians added yet." />
        )}
      </TabCard>
    )}

    {/* Academic History Tab */}
    {activeTab === 'academic' && (
      <TabCard title="Academic History">
         <div className="bg-white rounded-2xl p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic History</h3>
    {loadingHistory ? (
      <p className="text-gray-500">Loading historyâ€¦</p>
    ) : academicRecords?.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Academic Year</th>
              <th className="px-4 py-2 text-left">Class</th>
              <th className="px-4 py-2 text-left">Grade %</th>
              <th className="px-4 py-2 text-left">Attendance %</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {academicRecords.map(rec => (
              <tr key={rec._id}>
                <td className="px-4 py-2">{rec.academicYear}</td>
                <td className="px-4 py-2">{rec.class?.name}</td>
                <td className="px-4 py-2">{rec.finalGrade?.toFixed(1)}%</td>
                <td className="px-4 py-2">{rec.attendancePercentage?.toFixed(1)}%</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.status === 'promoted' ? 'bg-green-100 text-green-700' :
                    rec.status === 'detained' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{rec.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500 italic">No academic records yet.</p>
    )}
  </div>
        <EmptyState icon={FiBook} message="Academic history and progression will appear here (Phase 3)." />
      </TabCard>
    )}

    {/* Transfer Class Modal (unchanged) */}
    <dialog id="transfer-class-modal" className="modal rounded-lg p-6 w-full max-w-md dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-4">Transfer Student to Another Class</h3>
        <select id="newClassSelect" className="input-field mb-4 dark:bg-gray-700 dark:text-gray-100">
          <option value="">Select new class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={() => document.getElementById('transfer-class-modal').close()} className="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Cancel</button>
          <button onClick={() => {
            const select = document.getElementById('newClassSelect');
            if (select.value) {
              handleTransferClass(select.value);
              document.getElementById('transfer-class-modal').close();
            }
          }} className="btn-primary text-sm text-white">Transfer Student</button>
        </div>
      
    </dialog>
  </Layout>
    
  );
};



// Reusable styled profile card
const ProfileCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    pink: 'bg-pink-50 text-pink-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    teal: 'bg-teal-50 text-teal-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-50 text-gray-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorMap[color] || 'bg-gray-50 text-gray-700'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="font-semibold text-gray-900">{value || 'â€”'}</p>
        </div>
      </div>
    </div>
  );
};

// Reusable input group for forms
const InputGroup = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

// Reusable tab card wrapper
const TabCard = ({ title, children }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

// Empty state component
const EmptyState = ({ icon: Icon, message }) => (
  <div className="py-12 text-center">
    <Icon className="mx-auto h-12 w-12 text-gray-300" />
    <p className="mt-3 text-gray-500">{message}</p>
  </div>
);

// Guardian card
const GuardianCard = ({ guardian }) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
        {guardian.name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{guardian.name}</p>
        <p className="text-xs text-gray-500">{guardian.relation}</p>
      </div>
    </div>
    <div className="space-y-1 text-sm text-gray-600">
      {guardian.phone && <p>ðŸ“ž {guardian.phone}</p>}
      {guardian.email && <p>âœ‰ï¸ {guardian.email}</p>}
      {guardian.occupation && <p>ðŸ’¼ {guardian.occupation}</p>}
      {guardian.address && <p className="text-xs text-gray-400 truncate">ðŸ“ {guardian.address}</p>}
    </div>
  </div>
);

export default StudentDetail;

