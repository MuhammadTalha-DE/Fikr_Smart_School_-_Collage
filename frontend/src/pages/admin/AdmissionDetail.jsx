import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiCheck, FiX, FiUser, FiBook, FiCalendar, FiMail, FiPhone, FiMapPin,
  FiUsers, FiActivity
} from 'react-icons/fi';

const AdmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/admissions/${id}`);
        setAdmission(data.admission);
      } catch { toast.error('Failed to load admission'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleAccept = async () => {
    if (!window.confirm('Accept this application and create student?')) return;
    try {
      const { data } = await api.put(`/admissions/${id}/accept`);
      toast.success(`Student enrolled! Temp password: ${data.temporaryPassword}`);
      setAdmission(data.admission);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed');
    }
  };

  const handleReject = async () => {
    const remarks = prompt('Reason for rejection (optional):');
    try {
      const { data } = await api.put(`/admissions/${id}/reject`, { remarks });
      toast.success('Application rejected');
      setAdmission(data.admission);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  if (loading) return <Layout role="admin"><div className="p-6 text-center">Loadingâ€¦</div></Layout>;
  if (!admission) return <Layout role="admin"><div className="p-6 text-center text-red-500">Admission not found.</div></Layout>;

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/admin/admissions')} className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application: {admission.studentName}</h1>
            <p className="text-sm text-gray-500">
              Status: <span className={`font-medium capitalize ${
                admission.applicationStatus === 'accepted' ? 'text-green-600' :
                admission.applicationStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
              }`}>{admission.applicationStatus}</span>
            </p>
          </div>
          {admission.applicationStatus === 'pending' && (
            <div className="flex gap-2 ml-auto">
              <button onClick={handleAccept} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-green-700">
                <FiCheck /> Accept
              </button>
              <button onClick={handleReject} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-red-700">
                <FiX /> Reject
              </button>
            </div>
          )}
        </div>

        {/* Application Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiUser className="text-blue-500" /> Student Information</h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Full Name" value={admission.studentName} />
              <InfoRow label="Email" value={admission.email || 'â€”'} />
              <InfoRow label="Phone" value={admission.phone || 'â€”'} />
              <InfoRow label="CNIC" value={admission.cnic || 'â€”'} />
              <InfoRow label="Form-B / B-Form" value={admission.formBNumber || 'â€”'} />
              <InfoRow label="Date of Birth" value={admission.dateOfBirth ? new Date(admission.dateOfBirth).toLocaleDateString() : 'â€”'} />
              <InfoRow label="Gender" value={admission.gender} />
              <InfoRow label="Blood Group" value={admission.bloodGroup || 'â€”'} />
              <InfoRow label="Address" value={admission.address || 'â€”'} />
              <InfoRow label="Previous School" value={admission.previousSchool || 'â€”'} />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiBook className="text-blue-500" /> Application Details</h3>
              <div className="space-y-3 text-sm">
                <InfoRow label="Intended Class" value={admission.intendedClass?.name} />
                <InfoRow label="Application Date" value={new Date(admission.applicationDate).toLocaleString()} />
                <InfoRow label="Remarks" value={admission.remarks || 'â€”'} />
                <InfoRow label="Documents" value={admission.documents?.length ? `${admission.documents.length} file(s)` : 'None'} />
                {admission.createdUserId && (
                  <InfoRow label="Enrolled User" value={admission.createdUserId?.name} />
                )}
                {admission.createdStudentId && (
                  <InfoRow label="Student ID" value={admission.createdStudentId?.admissionNumber} />
                )}
              </div>
            </div>

            {/* Guardians */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiUsers className="text-blue-500" /> Guardians</h3>
              {admission.guardians?.length > 0 ? (
                <div className="space-y-3">
                  {admission.guardians.map((g, idx) => (
                    <div key={idx} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{g.name} <span className="text-gray-500">({g.relation})</span></p>
                      {g.phone && <p className="text-gray-600"><FiPhone className="inline mr-1" /> {g.phone}</p>}
                      {g.email && <p className="text-gray-600"><FiMail className="inline mr-1" /> {g.email}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500">No guardians listed.</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right max-w-[60%]">{value || 'â€”'}</span>
  </div>
);

export default AdmissionDetail;
