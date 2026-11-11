import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StudentTranscript = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [studentRes, recordRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/academic-records?student=${id}`),
        ]);
        setStudent(studentRes.data);
        setRecords(recordRes.data.records);
      } catch { toast.error('Failed to load transcript'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const downloadPDF = async () => {
    const el = document.getElementById('transcript-content');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w - 10, h - 10);
    pdf.save(`${student?.userId?.name}_transcript.pdf`);
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center">Loading…</div></Layout>;
  if (!student) return <Layout role="admin"><div className="p-6 text-center text-red-500">Student not found</div></Layout>;

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <FiArrowLeft /> Back
          </button>
          <button onClick={downloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <FiDownload /> Download PDF
          </button>
        </div>

        <div id="transcript-content" className="bg-white p-8 rounded-2xl shadow-lg border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Student Transcript</h1>
            <p className="text-gray-600 mt-1">{student.userId?.name}</p>
            <p className="text-sm text-gray-500">Admission No: {student.admissionNumber} | Roll No: {student.rollNumber}</p>
          </div>

          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-4 py-2 text-left">Academic Year</th>
                <th className="border px-4 py-2 text-left">Class</th>
                <th className="border px-4 py-2 text-center">Grade %</th>
                <th className="border px-4 py-2 text-center">Attendance %</th>
                <th className="border px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">No records found</td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec._id}>
                    <td className="border px-4 py-2">{rec.academicYear}</td>
                    <td className="border px-4 py-2">{rec.class?.name}</td>
                    <td className="border px-4 py-2 text-center">{rec.finalGrade?.toFixed(1)}%</td>
                    <td className="border px-4 py-2 text-center">{rec.attendancePercentage?.toFixed(1)}%</td>
                    <td className="border px-4 py-2 text-center capitalize">{rec.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default StudentTranscript;