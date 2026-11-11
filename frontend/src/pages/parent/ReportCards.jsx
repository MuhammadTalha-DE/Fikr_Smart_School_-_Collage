import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiAward, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportCard = () => {
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data } = await api.get('/results/mine');
    setResults(data);
  };

  const printReport = () => {
    const element = document.getElementById('report-card');
    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('report-card.pdf');
    });
  };

  if (selectedResult) {
    const r = selectedResult;
    return (
      <Layout role="student">
        <button onClick={() => setSelectedResult(null)} className="mb-4 text-primary-600 hover:underline">← Back to exams</button>
        <div id="report-card" className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">School Management System</h1>
            <p className="text-gray-500">Report Card</p>
          </div>
          <div className="flex justify-between mb-6">
            <div>
              <p><strong>Student:</strong> {r.studentId?.userId?.name}</p>
              <p><strong>Roll No:</strong> {r.studentId?.rollNumber}</p>
            </div>
            <div>
              <p><strong>Exam:</strong> {r.examId?.name}</p>
              <p><strong>Date:</strong> {new Date(r.examId?.date).toLocaleDateString()}</p>
            </div>
          </div>
          <table className="w-full mb-4 border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">%</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">GPA</th>
              </tr>
            </thead>
            <tbody>
              {r.subjectResults.map(sub => (
                <tr key={sub.subject}>
                  <td className="p-2 border">{sub.subject}</td>
                  <td className="p-2 border">{sub.marksObtained}/{sub.maxMarks}</td>
                  <td className="p-2 border">{sub.percentage}%</td>
                  <td className="p-2 border">{sub.grade}</td>
                  <td className="p-2 border">{sub.gpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-4">
            <div>
              <p><strong>Overall Percentage:</strong> {r.overallPercentage}%</p>
              <p><strong>Overall Grade:</strong> {r.overallGrade}</p>
              <p><strong>Overall GPA:</strong> {r.overallGPA}</p>
            </div>
            <div className="text-right">
              <p><strong>Class Rank:</strong> #{r.classRank}</p>
            </div>
          </div>
          <button onClick={printReport} className="mt-6 btn-primary flex items-center gap-2"><FiPrinter /> Print</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
        My Report Cards
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(r => (
          <div key={r._id} className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition" onClick={() => setSelectedResult(r)}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2" />
            <div className="p-5">
              <h3 className="font-bold text-xl">{r.examId?.name}</h3>
              <p className="text-sm text-gray-500">{new Date(r.examId?.date).toLocaleDateString()}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-2xl font-bold text-purple-600">{r.overallPercentage}%</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">{r.overallGrade}</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Rank: #{r.classRank}</p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ReportCard;