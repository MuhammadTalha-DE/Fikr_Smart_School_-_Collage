import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiClock, FiAlertTriangle, FiEye, FiEyeOff, FiCheckCircle
} from 'react-icons/fi';

const MAX_TAB_SWITCHES = 3;   // warn after 3, auto‑submit after 5

const TakeMcq = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(new Date().toISOString());  // stored for backend validation
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const timerRef = useRef(null);
  const hasSubmitted = useRef(false);   // prevent double submit

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.get(`/mcq-exams/${id}/take`);
        setExam(data.exam);
        setTimeLeft(data.exam.duration * 60);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load exam');
        navigate('/student/mcq-exams');
      }
    };
    fetchExam();
  }, [id, navigate]);

  // ⏱️ Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // 👁️ Tab‑switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
        setTabSwitches(prev => {
          const newCount = prev + 1;

          if (newCount === MAX_TAB_SWITCHES) {
            toast.error(`Warning: Tab switch ${newCount}/${MAX_TAB_SWITCHES}. Further switches may auto‑submit.`);
          }

          if (newCount > MAX_TAB_SWITCHES) {
            toast.error('Too many tab switches. Your exam will be auto‑submitted.');
            setShowWarning(true);
            setTimeout(() => {
              handleAutoSubmit();
            }, 2000);
          }

          return newCount;
        });
      } else {
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto‑submit handler
  const handleAutoSubmit = useCallback(async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    toast.error('Time is up! Your exam is being submitted.');
    await submitExam();
  }, []);

  // Manual submit handler
  const submitExam = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    const answerArray = Object.entries(answers).map(([qIdx, opt]) => ({
      questionIndex: Number(qIdx),
      selectedOption: opt,
    }));

    const timeTaken = Math.round((Date.now() - new Date(startTime).getTime()) / 1000);

    try {
      const { data } = await api.post(`/mcq-exams/${id}/submit`, {
        answers: answerArray,
        timeTaken,
        startTime,
        tabSwitches,
      });
      toast.success(`Exam submitted! Score: ${data.submission.score}/${data.submission.totalMarks}`);
      navigate(`/student/mcq-exams/${id}/result`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      hasSubmitted.current = false;
      setSubmitting(false);
    }
  };

  const selectOption = (questionIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!exam) return <Layout role="student"><div className="p-6 text-center">Loading exam…</div></Layout>;

  const question = exam.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestion === exam.questions.length - 1;

  return (
    <Layout role="student">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-gray-500">{exam.subject}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tab switch indicator */}
            {tabSwitches > 0 && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <FiAlertTriangle />
                <span>{tabSwitches}</span>
              </div>
            )}
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg ${
              timeLeft <= 60 ? 'bg-red-100 text-red-700 animate-pulse' :
              timeLeft <= 300 ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              <FiClock /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Warning banner */}
        {!isTabActive && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl mb-4 flex items-center gap-2">
            <FiAlertTriangle /> Please return to the exam tab immediately.
          </div>
        )}

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {exam.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                answers[idx] !== undefined
                  ? 'bg-green-500 text-white'
                  : currentQuestion === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <p className="text-lg font-medium mb-4">
            Q{currentQuestion + 1}. {question.questionText}
          </p>
          <div className="space-y-3">
            {question.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => selectOption(currentQuestion, oIdx)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  answers[currentQuestion] === oIdx
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {String.fromCharCode(65 + oIdx)}. {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Progress & Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">
            {answeredCount}/{exam.questions.length} answered
          </span>

          {!isLastQuestion ? (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))}
              className="btn-primary bg-blue-600 text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                if (answeredCount < exam.questions.length) {
                  const unconfirmed = window.confirm(
                    `You have only answered ${answeredCount}/${exam.questions.length} questions. Submit anyway?`
                  );
                  if (!unconfirmed) return;
                } else if (!window.confirm('Submit your exam? You cannot change answers after submission.')) {
                  return;
                }
                submitExam();
              }}
              disabled={submitting}
              className="btn-primary bg-green-600 text-white"
            >
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TakeMcq;