import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import {
  FiFile, FiCalendar, FiCheckCircle, FiClock,
  FiExternalLink, FiSend, FiStar
} from 'react-icons/fi';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get student profile (to find class)
      const { data: studentData } = await api.get('/students/me');
      const classId = studentData.classId?._id || studentData.classId;

      // 2. Fetch assignments for that class
      const { data: assignmentsData } = await api.get('/assignments', {
        params: { classId },
      });

      // 3. Fetch my submissions
      const { data: mySubsData } = await api.get('/assignments/my-submissions');

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setMySubmissions(Array.isArray(mySubsData) ? mySubsData : []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  // Merge assignments with own submissions
  const mergedAssignments = assignments.map((asg) => {
    const mySub = mySubmissions.find((s) => s.assignmentId === asg._id);
    return { ...asg, mySubmission: mySub || null };
  });

  if (loading) {
    return (
      <Layout role="student">
        <div className="p-6 text-center text-gray-500">Loading assignments…</div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 My Assignments</h1>

        {mergedAssignments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiFile className="mx-auto text-4xl text-gray-300 mb-2" />
            <p>No assignments for your class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mergedAssignments.map((asg) => {
              const submitted = !!asg.mySubmission;
              const graded = submitted && asg.mySubmission.marks != null;

              return (
                <div
                  key={asg._id}
                  className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Title & Subject */}
                  <div className="flex items-start">
                    <FiFile className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{asg.title}</h3>
                      <p className="text-sm text-gray-500">{asg.classId?.name}</p>
                    </div>
                  </div>

                  <p className="mt-2 text-gray-700 text-sm line-clamp-2">{asg.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                    <FiCalendar className="w-4 h-4" />
                    <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                  </div>

                  {/* Submission status & actions */}
                  <div className="mt-3 space-y-2">
                    {!submitted ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1 text-red-500">
                          <FiClock className="w-4 h-4" /> Not submitted
                        </span>
                        <Link
                          to={`/student/assignments/${asg._id}/submit`}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <FiSend className="w-4 h-4" /> Submit
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-green-700">
                            <FiCheckCircle className="w-4 h-4" /> Submitted
                          </span>
                          <span className="text-gray-500">
                            {new Date(asg.mySubmission.submittedAt).toLocaleDateString()}
                          </span>
                          {asg.mySubmission.fileUrl && (
                            <a
                              href={asg.mySubmission.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <FiExternalLink className="w-3.5 h-3.5" /> View
                            </a>
                          )}
                        </div>

                        {/* Grade & Feedback */}
                        {graded ? (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                              <FiStar className="w-4 h-4" /> Grade: {asg.mySubmission.marks}
                            </p>
                            {asg.mySubmission.feedback && (
                              <p className="text-xs text-green-700 mt-1">
                                Feedback: {asg.mySubmission.feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-amber-600">Not graded yet</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentAssignments;