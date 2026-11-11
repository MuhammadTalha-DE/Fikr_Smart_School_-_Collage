import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCheckCircle, FiXCircle, FiAward, FiArrowLeft } from 'react-icons/fi';

const McqResult = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/mcq-exams/${id}/my-result`);
        setResult(data.submission);
      } catch (err) {
        console.error('Failed to load result', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <Layout role="student"><div className="p-6 text-center">Loading result…</div></Layout>;
  if (!result) return <Layout role="student"><div className="p-6 text-center text-red-500">No result found.</div></Layout>;

  return (
    <Layout role="student">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Link to="/student/mcq-exams" className="flex items-center gap-2 text-gray-500 mb-4"><FiArrowLeft /> Back</Link>

        {/* Score Card */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm text-center mb-6">
          <FiAward className="mx-auto text-5xl text-yellow-500 mb-3" />
          <h1 className="text-2xl font-bold">{result.examTitle}</h1>
          <p className="text-gray-500">{result.subject}</p>
          <div className="mt-4 text-4xl font-bold text-blue-600">
            {result.score}/{result.totalMarks}
          </div>
          <p className="text-lg text-gray-600">
            {Math.round((result.score / result.totalMarks) * 100)}%
          </p>
        </div>

        {/* Detailed Answers */}
        <h2 className="text-lg font-semibold mb-4">Detailed Answers</h2>
        <div className="space-y-4">
          {result.answers.map((ans, idx) => (
            <div key={idx} className={`bg-white rounded-2xl border p-5 shadow-sm ${ans.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-start gap-3">
                {ans.isCorrect ? (
                  <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <FiXCircle className="text-red-500 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">Q{idx + 1}. {ans.questionText}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {ans.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg ${
                          oIdx === ans.correctOption
                            ? 'bg-green-100 text-green-800 font-medium'
                            : oIdx === ans.selectedOption && !ans.isCorrect
                            ? 'bg-red-100 text-red-800'
                            : 'text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                        {oIdx === ans.correctOption && ' ✓'}
                        {oIdx === ans.selectedOption && !ans.isCorrect && ' ✗'}
                      </div>
                    ))}
                  </div>
                  {ans.explanation && (
                    <p className="mt-3 text-sm text-gray-500 italic">
                      💡 {ans.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default McqResult;