import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { useDropdownData } from '../../hooks/useDropdownData';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import Select from 'react-select';

const McqExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: classes } = useDropdownData('/classes/my-classes');
  const [mySubjects, setMySubjects] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    subject: '',
    duration: 30,
    questions: [{ questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1, explanation: '' }],
  });
  const [saving, setSaving] = useState(false);

   useEffect(() => {
  const fetchTeacherSubjects = async () => {
    try {
      const { data: teacherData } = await api.get('/teachers/me');
      const raw = teacherData.subjects || [];

      const subjectIds = raw.map(item =>
        typeof item === 'object' && item._id ? item._id : String(item)
      );

      const { data: allSubjectsData } = await api.get('/subjects');
      const allSubjects = allSubjectsData.subjects || allSubjectsData || [];

      const subjectMap = {};
      allSubjects.forEach(s => {
        subjectMap[s._id] = s.name || s.code || s._id;
      });

      const resolvedSubjects = subjectIds.map(id => ({
        value: id,
        label: subjectMap[id] || id,
      }));

      setMySubjects(resolvedSubjects);
    } catch (err) {
      console.error('Failed to load teacher subjects', err);
    }
  };
  fetchTeacherSubjects();

  if (isEdit) {
    const fetchExam = async () => {
      const { data } = await api.get(`/mcq-exams/${id}`);
      const exam = data.exam;
      setForm({
        title: exam.title,
        description: exam.description || '',
        classId: exam.classId?._id || exam.classId,
        subject: exam.subject,
        duration: exam.duration,
        questions: exam.questions.length
          ? exam.questions
          : [{ questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1, explanation: '' }],
      });
    };
    fetchExam();
  }
}, [id, isEdit]);

  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1, explanation: '' }],
    }));
  };

  const removeQuestion = (idx) => {
    if (form.questions.length === 1) {
      return toast.error('An exam must have at least one question');
    }
    setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...form.questions];
    updated[idx][field] = value;
    setForm({ ...form, questions: updated });
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    const updated = [...form.questions];
    updated[qIdx].options[optIdx] = value;
    setForm({ ...form, questions: updated });
  };

  // 🔥 FIXED: Added 'async' keyword
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subject) {
      return toast.error('Title, class, and subject are required');
    }

    // Validate each question
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return toast.error(`Question ${i + 1}: Text is required`);
      }
      if (q.options.some(opt => !opt || !opt.trim())) {
        return toast.error(`Question ${i + 1}: All options must be filled`);
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/mcq-exams/${id}`, form);
        toast.success('MCQ Exam updated');
      } else {
        await api.post('/mcq-exams', form);
        toast.success('MCQ Exam created');
      }
      navigate('/teacher/mcq-exams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classes.map(c => ({ value: c._id, label: c.name }));
  //const subjectOptions = mySubjects.map(s => ({ value: s, label: s }));
// mySubjects is already [{ value: id, label: 'Subject Name' }]
const subjectOptions = mySubjects;
  return (
    <Layout role="teacher">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-4">
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit' : 'Create'} MCQ Exam</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
            <div className="grid grid-cols-2 gap-4">
              <Select options={classOptions} value={classOptions.find(o => o.value === form.classId)} onChange={opt => setForm({...form, classId: opt?.value || ''})} placeholder="Class" />
              <Select
  options={subjectOptions}
  value={subjectOptions.find(o => o.value === form.subject) || null}
  onChange={opt => setForm({...form, subject: opt?.value || ''})}
  placeholder="Select subject"
/>
            </div>
            <input type="number" placeholder="Duration (minutes)" value={form.duration} onChange={e => setForm({...form, duration: Number(e.target.value)})} className="input-field w-40" />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Questions ({form.questions.length})</h2>
              <button type="button" onClick={addQuestion} className="text-blue-600 flex items-center gap-1"><FiPlus /> Add</button>
            </div>
            {form.questions.map((q, qIdx) => (
              <div key={qIdx} className="border rounded-xl p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Q{qIdx + 1}</span>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIdx)} className="text-red-500"><FiTrash2 /></button>
                  )}
                </div>
                <input type="text" placeholder="Question text" value={q.questionText} onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)} className="input-field" required />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)} className="input-field" required />
                  ))}
                </div>
                <div className="flex gap-4 items-center">
                  <div>
                    <label className="text-sm">Correct Option</label>
                    <select value={q.correctOption} onChange={e => handleQuestionChange(qIdx, 'correctOption', Number(e.target.value))} className="input-field w-20">
                      {[0,1,2,3].map(i => <option key={i} value={i}>{i+1}</option>)}
                    </select>
                  </div>
                  <input type="number" placeholder="Marks" value={q.marks} onChange={e => handleQuestionChange(qIdx, 'marks', Number(e.target.value))} className="input-field w-20" />
                </div>
                <input type="text" placeholder="Explanation (shown after exam)" value={q.explanation} onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)} className="input-field" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary bg-blue-600 text-white flex items-center gap-2"><FiSave /> {saving ? 'Saving…' : 'Save Exam'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default McqExamForm;