import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiUpload,
  FiTrash2,
  FiPlus,
  FiSettings,
  FiBookOpen,
  FiAward,
  FiCalendar,
  FiBox,
  FiCopy,
  FiImage,
  FiEdit3,
  FiCheckCircle,
} from 'react-icons/fi';
import ThemeSettings from './ThemeSettings'; // ensure path is correct

const SchoolSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [signature, setSignature] = useState('');
const [stamp, setStamp] = useState('');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  // School info
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    tagline: '',
    street: '',
    city: '',
    state: '',
    postal: '',
    phone: '',
    email: '',
    logo: '',
    principalName: '',
    principalSignature: '',
    schoolStamp: '',
  });

  // Academic year
  const [academicYear, setAcademicYear] = useState({
    name: '',
    startDate: '',
    endDate: '',
    terms: [{ name: '', startDate: '', endDate: '' }],
  });

  // Grade scales
  const [gradeScales, setGradeScales] = useState([
    { letter: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.0 },
    { letter: 'A', minPercentage: 80, maxPercentage: 89, gpa: 3.7 },
    { letter: 'B+', minPercentage: 75, maxPercentage: 79, gpa: 3.3 },
    { letter: 'B', minPercentage: 70, maxPercentage: 74, gpa: 3.0 },
    { letter: 'C+', minPercentage: 65, maxPercentage: 69, gpa: 2.7 },
    { letter: 'C', minPercentage: 60, maxPercentage: 64, gpa: 2.3 },
    { letter: 'D', minPercentage: 50, maxPercentage: 59, gpa: 2.0 },
    { letter: 'F', minPercentage: 0, maxPercentage: 49, gpa: 0.0 },
  ]);

  // Holidays
  const [holidays, setHolidays] = useState([]);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayFormState] = useState({
    name: '',
    date: '',
    isRecurring: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'holidays') fetchHolidays();
  }, [activeTab]);


 const fetchSettings = async () => {
  try {
    const { data } = await api.get('/school-settings');
    if (data.schoolInfo) {
      setSchoolInfo(data.schoolInfo);

      // ✅ ADD THESE TWO LINES HERE (after setting schoolInfo)
      setSignature(data.schoolInfo.principalSignature || '');
      setStamp(data.schoolInfo.schoolStamp || '');
    }
    if (data.academicYear) {
      setAcademicYear({
        name: data.academicYear.name || '',
        startDate: data.academicYear.startDate?.slice(0, 10) || '',
        endDate: data.academicYear.endDate?.slice(0, 10) || '',
        terms: data.academicYear.terms?.length
          ? data.academicYear.terms.map((t) => ({
              name: t.name,
              startDate: t.startDate?.slice(0, 10) || '',
              endDate: t.endDate?.slice(0, 10) || '',
            }))
          : [{ name: '', startDate: '', endDate: '' }],
      });
    }
    if (data.gradeScales?.length) setGradeScales(data.gradeScales);
  } catch (error) {
    toast.error('Failed to load settings');
  } finally {
    setLoading(false);
  }
};

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get('/holidays');
      setHolidays(data);
    } catch (error) {
      toast.error('Failed to load holidays');
    }
  };

  const validateOfficialImage = (file, { label, minWidth, minHeight, requireWide = false }) =>
    new Promise((resolve, reject) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error(`${label} must be a PNG, JPG, JPEG, or WEBP image`));
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        reject(new Error(`${label} image must be under 4MB`));
        return;
      }

      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (image.width < minWidth || image.height < minHeight) {
          reject(new Error(`${label} image is too small. Upload a clearer image.`));
          return;
        }
        if (requireWide && image.width <= image.height) {
          reject(new Error('Principal signature must be a wide handwritten signature image'));
          return;
        }
        resolve();
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`${label} is not a valid image`));
      };
      image.src = objectUrl;
    });

  const handleSignatureUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingSignature(true);
  try {
  await validateOfficialImage(file, {
    label: 'Principal signature',
    minWidth: 180,
    minHeight: 45,
    requireWide: true,
  });
  const formData = new FormData();
  formData.append('signature', file);
  const { data } = await api.put('/school-settings/principal-signature', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  setSignature(data.signature);
  if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
  toast.success('Signature uploaded');
  } catch (error) {
    toast.error(error.response?.data?.message || error.message || 'Signature upload failed');
  } finally {
    setUploadingSignature(false);
    e.target.value = '';
  }
};

const handleStampUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingStamp(true);
  try {
  await validateOfficialImage(file, {
    label: 'School stamp',
    minWidth: 100,
    minHeight: 100,
  });
  const formData = new FormData();
  formData.append('stamp', file);
  const { data } = await api.put('/school-settings/school-stamp', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  setStamp(data.stamp);
  if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
  toast.success('Stamp uploaded');
  } catch (error) {
    toast.error(error.response?.data?.message || error.message || 'Stamp upload failed');
  } finally {
    setUploadingStamp(false);
    e.target.value = '';
  }
};

  const handleSaveAll = async () => {
    if (academicYear.name) {
      if (!academicYear.startDate || !academicYear.endDate) {
        toast.error('Academic year must have start and end dates');
        return;
      }
      for (const term of academicYear.terms) {
        if (!term.name || !term.startDate || !term.endDate) {
          toast.error('All term fields are required');
          return;
        }
      }
    }

    setSaving(true);
    try {
      await api.put('/school-settings', {
        schoolInfo,
        academicYear: academicYear.name
          ? {
              name: academicYear.name,
              startDate: academicYear.startDate,
              endDate: academicYear.endDate,
              terms: academicYear.terms,
            }
          : null,
        gradeScales,
      });
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await api.post('/school-settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setSchoolInfo({ ...schoolInfo, logo: data.logo });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove the school logo?')) return;
    try {
      await api.delete('/school-settings/logo');
      setSchoolInfo({ ...schoolInfo, logo: '' });
      toast.success('Logo removed');
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleAddTerm = () => {
    setAcademicYear({
      ...academicYear,
      terms: [
        ...academicYear.terms,
        { name: '', startDate: '', endDate: '' },
      ],
    });
  };

  const handleTermChange = (index, field, value) => {
    const updated = [...academicYear.terms];
    updated[index][field] = value;
    setAcademicYear({ ...academicYear, terms: updated });
  };

  const handleRemoveTerm = (index) => {
    const updated = academicYear.terms.filter((_, i) => i !== index);
    setAcademicYear({
      ...academicYear,
      terms: updated.length ? updated : [{ name: '', startDate: '', endDate: '' }],
    });
  };

  const handleGradeChange = (index, field, value) => {
    const updated = [...gradeScales];
    updated[index][field] = value;
    setGradeScales(updated);
  };

  const handleAddGrade = () => {
    setGradeScales([
      ...gradeScales,
      { letter: '', minPercentage: 0, maxPercentage: 0, gpa: 0 },
    ]);
  };

  const handleRemoveGrade = (index) => {
    setGradeScales(gradeScales.filter((_, i) => i !== index));
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date)
      return toast.error('Name and date required');
    setSaving(true);
    try {
      await api.post('/holidays', holidayForm);
      toast.success('Holiday added');
      setHolidayFormState({ name: '', date: '', isRecurring: false });
      setShowHolidayForm(false);
      fetchHolidays();
    } catch (error) {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      toast.success('Deleted');
      fetchHolidays();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleCloneYear = async () => {
    if (!academicYear.name || !academicYear.startDate || !academicYear.endDate) {
      toast.error('Save the current academic year first');
      return;
    }
    const newName = prompt(
      'Enter new academic year name (e.g., 2026-2027):',
      academicYear.name.replace(/\d+/g, (m) => String(Number(m) + 1))
    );
    if (!newName) return;
    try {
      const { data } = await api.post('/school-settings/academic-year/clone', {
        newYearName: newName,
        dateShift: 365,
      });
      setAcademicYear({
        name: data.name,
        startDate: data.startDate?.slice(0, 10),
        endDate: data.endDate?.slice(0, 10),
        terms: data.terms?.map((t) => ({
          name: t.name,
          startDate: t.startDate?.slice(0, 10),
          endDate: t.endDate?.slice(0, 10),
        })) || [{ name: '', startDate: '', endDate: '' }],
      });
      toast.success('Academic year cloned');
    } catch (error) {
      toast.error('Clone failed');
    }
  };

  if (loading)
    return (
      <Layout role="admin">
        <div className="p-10 text-center text-slate-500">Loading settings...</div>
      </Layout>
    );

  return (
    <Layout role="admin">
      {/* ---------- Header ---------- */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="p-2 bg-indigo-100 rounded-xl">
            <FiSettings className="text-indigo-600 text-xl" />
          </span>
          School Profile
        </h1>
        <p className="text-slate-500 mt-1 ml-1">Manage general information, academics, grading, holidays and branding.</p>
      </div>

      {/* ---------- Main Card ---------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

        {/* Tabs */}
        <div className="border-b border-slate-100 px-6 pt-4">
          <nav className="flex space-x-1 overflow-x-auto pb-0" role="tablist">
            {[
              { key: 'general', icon: <FiSettings />, label: 'General' },
              { key: 'academics', icon: <FiBookOpen />, label: 'Academics' },
              { key: 'grading', icon: <FiAward />, label: 'Grading' },
              { key: 'holidays', icon: <FiCalendar />, label: 'Holidays' },
              { key: 'signatory', icon: <FiEdit3 />, label: 'Signatory' },
              { key: 'branding', icon: <FiBox />, label: 'Branding' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all
                  ${
                    activeTab === tab.key
                      ? 'text-indigo-700 bg-white border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ---------- General Tab ---------- */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  School Logo
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {schoolInfo.logo ? (
                    <img
                      src={schoolInfo.logo}
                      alt="School logo"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                      <FiImage className="text-3xl" />
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition text-sm font-medium text-slate-700">
                    <FiUpload /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {schoolInfo.logo && (
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                      <FiTrash2 /> Remove
                    </button>
                  )}
                </div>
              </div>

              {/* School Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'School Name *', id: 'name', value: schoolInfo.name, onChange: (e) => setSchoolInfo({ ...schoolInfo, name: e.target.value }), type: 'text' },
                  { label: 'Tagline', id: 'tagline', value: schoolInfo.tagline, onChange: (e) => setSchoolInfo({ ...schoolInfo, tagline: e.target.value }), type: 'text' },
                  { label: 'Street', id: 'street', value: schoolInfo.street, onChange: (e) => setSchoolInfo({ ...schoolInfo, street: e.target.value }), type: 'text' },
                  { label: 'City', id: 'city', value: schoolInfo.city, onChange: (e) => setSchoolInfo({ ...schoolInfo, city: e.target.value }), type: 'text' },
                  { label: 'State', id: 'state', value: schoolInfo.state, onChange: (e) => setSchoolInfo({ ...schoolInfo, state: e.target.value }), type: 'text' },
                  { label: 'Postal Code', id: 'postal', value: schoolInfo.postal, onChange: (e) => setSchoolInfo({ ...schoolInfo, postal: e.target.value }), type: 'text' },
                  { label: 'Phone', id: 'phone', value: schoolInfo.phone, onChange: (e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value }), type: 'tel' },
                  { label: 'Email', id: 'email', value: schoolInfo.email, onChange: (e) => setSchoolInfo({ ...schoolInfo, email: e.target.value }), type: 'email' },
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-slate-600 mb-1.5 ml-1"
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      id={field.id}
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                                 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400
                                 placeholder:text-slate-400"
                      placeholder={`Enter ${field.label.replace(' *', '')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ---------- Signatory Tab ---------- */}
          {activeTab === 'signatory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                      Principal Name *
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.principalName || ''}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, principalName: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                                 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      placeholder="Enter principal name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">Principal Signature</h3>
                        {signature && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <FiCheckCircle /> Active
                          </span>
                        )}
                      </div>
                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {signature ? (
                          <img src={signature} alt="Principal signature" className="max-h-24 max-w-full object-contain" />
                        ) : (
                          <span className="text-sm text-slate-400">No signature uploaded</span>
                        )}
                      </div>
                      <label className={`mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition ${
                        uploadingSignature ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-300'
                      }`}>
                        <FiUpload /> {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleSignatureUpload}
                          disabled={uploadingSignature}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">School Stamp</h3>
                        {stamp && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <FiCheckCircle /> Active
                          </span>
                        )}
                      </div>
                      <div className="h-28 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {stamp ? (
                          <img src={stamp} alt="School stamp" className="max-h-24 max-w-full object-contain" />
                        ) : (
                          <span className="text-sm text-slate-400">No stamp uploaded</span>
                        )}
                      </div>
                      <label className={`mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition ${
                        uploadingStamp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-300'
                      }`}>
                        <FiUpload /> {uploadingStamp ? 'Uploading...' : 'Upload Stamp'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleStampUpload}
                          disabled={uploadingStamp}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3">Document Readiness</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Principal name', done: Boolean(schoolInfo.principalName?.trim()) },
                      { label: 'Signature image', done: Boolean(signature) },
                      { label: 'School stamp', done: Boolean(stamp) },
                      { label: 'School logo', done: Boolean(schoolInfo.logo) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3">
                        <span className="text-slate-700">{item.label}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          item.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.done ? 'Ready' : 'Needed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- Academics Tab ---------- */}
          {activeTab === 'academics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  Academic Year
                </h3>
                <button
                  onClick={handleCloneYear}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl
                             hover:bg-indigo-100 transition border border-indigo-100"
                >
                  <FiCopy /> Clone to New Year
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                    Year Name (e.g. 2025-2026)
                  </label>
                  <input
                    type="text"
                    value={academicYear.name}
                    onChange={(e) =>
                      setAcademicYear({ ...academicYear, name: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="2025-2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={academicYear.startDate}
                    onChange={(e) =>
                      setAcademicYear({ ...academicYear, startDate: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={academicYear.endDate}
                    onChange={(e) =>
                      setAcademicYear({ ...academicYear, endDate: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mt-6">Terms</h3>
              {academicYear.terms.map((term, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <input
                    type="text"
                    placeholder="Term name"
                    value={term.name}
                    onChange={(e) => handleTermChange(idx, 'name', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <input
                    type="date"
                    value={term.startDate}
                    onChange={(e) => handleTermChange(idx, 'startDate', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <input
                    type="date"
                    value={term.endDate}
                    onChange={(e) => handleTermChange(idx, 'endDate', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <button
                    onClick={() => handleRemoveTerm(idx)}
                    className="text-red-500 hover:text-red-700 text-sm justify-self-start ml-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddTerm}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl
                           hover:bg-slate-50 transition"
              >
                <FiPlus /> Add Term
              </button>
            </div>
          )}

          {/* ---------- Grading Tab ---------- */}
          {activeTab === 'grading' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Grade Scale</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Grade</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Min %</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Max %</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">GPA</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {gradeScales.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={g.letter}
                            onChange={(e) => handleGradeChange(idx, 'letter', e.target.value)}
                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-sm text-center
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={g.minPercentage}
                            onChange={(e) =>
                              handleGradeChange(idx, 'minPercentage', Number(e.target.value))
                            }
                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-sm text-center
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={g.maxPercentage}
                            onChange={(e) =>
                              handleGradeChange(idx, 'maxPercentage', Number(e.target.value))
                            }
                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-sm text-center
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            value={g.gpa}
                            onChange={(e) =>
                              handleGradeChange(idx, 'gpa', Number(e.target.value))
                            }
                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-sm text-center
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveGrade(idx)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleAddGrade}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl
                           hover:bg-slate-50 transition"
              >
                <FiPlus /> Add Grade
              </button>
            </div>
          )}

          {/* ---------- Holidays Tab ---------- */}
          {activeTab === 'holidays' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Holiday Calendar</h3>
                <button
                  onClick={() => setShowHolidayForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl
                             hover:bg-indigo-700 transition shadow-sm"
                >
                  <FiPlus /> Add Holiday
                </button>
              </div>

              {showHolidayForm && (
                <div className="mb-5 p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Holiday Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Independence Day"
                        value={holidayForm.name}
                        onChange={(e) =>
                          setHolidayFormState({ ...holidayForm, name: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={holidayForm.date}
                        onChange={(e) =>
                          setHolidayFormState({ ...holidayForm, date: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={holidayForm.isRecurring}
                        onChange={(e) =>
                          setHolidayFormState({ ...holidayForm, isRecurring: e.target.checked })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="recurring" className="text-sm text-slate-700">
                        Recurring yearly
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddHoliday}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl
                                   hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowHolidayForm(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl
                                   hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Recurring</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {holidays.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          No holidays added yet.
                        </td>
                      </tr>
                    ) : (
                      holidays.map((h) => (
                        <tr key={h._id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-sm">
                            {new Date(h.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {h.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                h.isRecurring
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {h.isRecurring ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteHoliday(h._id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------- Branding Tab ---------- */}
          {activeTab === 'branding' && <ThemeSettings />}

          {/* ---------- Save Button ---------- */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-xl font-medium
                         hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <FiSave /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SchoolSettings;
