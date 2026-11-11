import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiUpload, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const BulkDocumentGenerator = () => {
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [reason, setReason] = useState('');
  const [generateClass, setGenerateClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/documents/templates', { params: { isActive: true } }),
      api.get('/classes'),
      api.get('/students'),
      api.get('/teachers'),
      api.get('/users'),
    ]).then((responses) => {
      const [templateResponse, classResponse, studentResponse, teacherResponse, userResponse] = responses;
      if (templateResponse.status === 'fulfilled') {
        const list = templateResponse.value.data || [];
        setTemplates(list);
        setSelectedTemplate(list[0]?._id || '');
      }
      if (classResponse.status === 'fulfilled') setClasses(classResponse.value.data || []);
      if (studentResponse.status === 'fulfilled') setStudents(studentResponse.value.data || []);
      if (teacherResponse.status === 'fulfilled') setTeachers(teacherResponse.value.data || []);
      if (userResponse.status === 'fulfilled') setUsers(userResponse.value.data || []);
    });
  }, []);

  const template = templates.find((item) => item._id === selectedTemplate);
  const recipientRole = template?.roleTarget || 'student';
  const customFields = (template?.fields || []).filter((field) => field.customInput && field.key);

  const recipientOptions = useMemo(() => {
    if (recipientRole === 'student') {
      return students
        .filter((student) => !selectedClass || (student.classId?._id || student.classId) === selectedClass)
        .map((student) => ({
          id: student._id,
          label: `${student.userId?.name || 'Student'} · ${student.admissionNumber || student.rollNumber || student._id.slice(-6)}`,
        }));
    }
    if (recipientRole === 'teacher') {
      return teachers.map((teacher) => ({
        id: teacher._id,
        label: `${teacher.userId?.name || 'Teacher'} · ${teacher.userId?.email || teacher._id.slice(-6)}`,
      }));
    }

    const matchedUsers = recipientRole === 'user'
      ? users
      : recipientRole === 'staff'
      ? users.filter((user) => !['student', 'parent'].includes(user.role))
      : users.filter((user) => user.role === recipientRole);
    return matchedUsers.map((user) => ({
      id: user._id,
      label: `${user.name} · ${user.role} · ${user.email}`,
    }));
  }, [recipientRole, students, teachers, users, selectedClass]);

  const changeTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    setSelectedClass('');
    setSelectedRecipients([]);
    setCustomValues({});
    setGenerateClass(false);
    setResults(null);
  };

  const updateRecipients = (event) => {
    setSelectedRecipients(Array.from(event.target.selectedOptions, (option) => option.value));
    setGenerateClass(false);
  };

  const updateCustomValue = (key, value) => {
    setCustomValues((current) => ({ ...current, [key]: value }));
  };

  const handleBulkGenerate = async () => {
    if (!template) return toast.error('Create or select an active template first.');
    if (recipientRole === 'student' && generateClass && !selectedClass) {
      return toast.error('Select a class to generate for the whole class.');
    }
    if (!(recipientRole === 'student' && generateClass) && selectedRecipients.length === 0) {
      return toast.error('Select at least one recipient.');
    }
    const documentFieldValues = Object.fromEntries(customFields.map((field) => [
      field.key,
      customValues[field.key] ?? field.defaultValue ?? '',
    ]));
    const missingField = customFields.find((field) => field.required && !String(documentFieldValues[field.key]).trim());
    if (missingField) return toast.error(`${missingField.label || missingField.key} is required.`);

    const ownerType = recipientRole === 'student' ? 'student' : recipientRole === 'teacher' ? 'teacher' : 'user';
    setLoading(true);
    setResults(null);
    try {
      const payload = {
        templateId: template._id,
        documentType: template.type,
        ownerType,
        reason: reason.trim(),
        customFields: documentFieldValues,
      };
      if (recipientRole === 'student' && generateClass) {
        payload.classId = selectedClass;
        payload.generateForClass = true;
      } else {
        payload.ownerIds = selectedRecipients;
      }

      const { data } = await api.post('/documents/generate-bulk', payload);
      setResults(data);
      toast.success(`Generated ${data.success} document${data.success === 1 ? '' : 's'}.`);
    } catch (err) {
      const detail = err.response?.data?.errors?.join?.(' · ');
      toast.error(detail || err.response?.data?.message || 'Document generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderCustomField = (field) => {
    const common = {
      value: customValues[field.key] ?? field.defaultValue ?? '',
      required: !!field.required,
      onChange: (event) => updateCustomValue(field.key, event.target.value),
      className: 'w-full p-2.5 border rounded-lg',
    };

    if (field.inputType === 'textarea') return <textarea {...common} rows={3} />;
    if (field.inputType === 'select') {
      return (
        <select {...common}>
          <option value="">Choose {field.label || 'a value'}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input {...common} type={['number', 'date'].includes(field.inputType) ? field.inputType : 'text'} />;
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Custom Document Generation</h1>
        <p className="text-gray-500 mb-8">Choose an admin template, fill its custom fields, and select the people who should receive it.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active document template</label>
            <select value={selectedTemplate} onChange={(event) => changeTemplate(event.target.value)} className="w-full p-2.5 border rounded-lg">
              <option value="">Select a template</option>
              {templates.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.type.replace(/_/g, ' ')}</option>)}
            </select>
            {template && <p className="text-xs text-gray-500 mt-2">Recipients: {recipientRole === 'staff' ? 'staff users' : recipientRole}</p>}
          </div>

          {customFields.length > 0 && (
            <section className="border rounded-lg p-4 space-y-4">
              <h2 className="font-semibold text-gray-800">Document details</h2>
              {customFields.map((field) => (
                <label key={field.key} className="block text-sm font-medium text-gray-700">
                  {field.label || field.key}{field.required ? ' *' : ''}
                  <div className="mt-1">{renderCustomField(field)}</div>
                </label>
              ))}
            </section>
          )}

          {recipientRole === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class (optional filter)</label>
              <select value={selectedClass} onChange={(event) => { setSelectedClass(event.target.value); setSelectedRecipients([]); setGenerateClass(false); }} className="w-full p-2.5 border rounded-lg">
                <option value="">All classes</option>
                {classes.map((item) => <option key={item._id} value={item._id}>{item.name}{item.section ? ` · ${item.section}` : ''}</option>)}
              </select>
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                <input type="checkbox" checked={generateClass} onChange={(event) => { setGenerateClass(event.target.checked); setSelectedRecipients([]); }} disabled={!selectedClass} />
                Generate for every student in this class
              </label>
            </div>
          )}

          {!(recipientRole === 'student' && generateClass) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select recipients</label>
              <select multiple value={selectedRecipients} onChange={updateRecipients} className="w-full min-h-48 p-2.5 border rounded-lg">
                {recipientOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Use Ctrl or Command to select multiple people. Loaded {recipientOptions.length} matching record{recipientOptions.length === 1 ? '' : 's'}.</p>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700">
            Reason or purpose (optional)
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="w-full mt-1 p-2.5 border rounded-lg" />
          </label>

          <button onClick={handleBulkGenerate} disabled={loading || !template} className="w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500">
            <FiUpload /> {loading ? 'Generating documents…' : 'Generate documents'}
          </button>
        </div>

        {results && (
          <div className={`mt-6 p-4 rounded-lg border ${results.failed ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <h2 className="font-semibold text-gray-800 mb-3">Generation results</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold">{results.total}</p><p className="text-xs text-gray-500">Selected</p></div>
              <div><p className="text-2xl font-bold text-green-600"><FiCheckCircle className="inline" /> {results.success}</p><p className="text-xs text-gray-500">Generated</p></div>
              <div><p className="text-2xl font-bold text-red-600"><FiXCircle className="inline" /> {results.failed}</p><p className="text-xs text-gray-500">Failed</p></div>
            </div>
            {results.errors?.length > 0 && <ul className="mt-3 text-xs text-red-600 space-y-1">{results.errors.map((error, index) => <li key={`${error.ownerId}-${index}`}>{error.ownerName || error.ownerId}: {error.error}</li>)}</ul>}
            {results.documents?.length > 0 && <p className="mt-3 text-xs text-gray-600"><FiFileText className="inline mr-1" />Generated documents are saved in the document library.</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BulkDocumentGenerator;
