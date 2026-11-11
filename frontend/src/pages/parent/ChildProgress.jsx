import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../../components/common/Layout";
import api from "../../services/api";
import { Bar } from "react-chartjs-2";

const ChildProgress = () => {
  const { childId } = useParams();

  const [child, setChild] = useState(null);
  const [attendance, setAttendance] = useState({
    present: 0,
    total: 0,
  });
  const [marks, setMarks] = useState([]);

  const [activeTab, setActiveTab] = useState("attendance");
  const [timetable, setTimetable] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    if (childId) {
      fetchChildData();
      fetchAttendance();
      fetchMarks();
    }
  }, [childId]);

  useEffect(() => {
    if (child?.classId?._id) {
      fetchTimetable();
      fetchAssignments();
      setTeacher(child.classId.teacherId?.userId);
    }
  }, [child]);

  // Fetch Child Data
  const fetchChildData = async () => {
    try {
      const { data } = await api.get(`/students/${childId}`);
      setChild(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Attendance
  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance?studentId=${childId}`);

      const present = data.filter(
        (a) => a.status === "present"
      ).length;

      setAttendance({
        present,
        total: data.length,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Marks
  const fetchMarks = async () => {
    try {
      const { data } = await api.get(`/marks?studentId=${childId}`);
      setMarks(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Timetable
  const fetchTimetable = async () => {
    try {
      const { data } = await api.get(`/timetables/${child.classId._id}`, {
        params: { status: 'published', date: new Date().toISOString() },
      });
      setTimetable(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Assignments
  const fetchAssignments = async () => {
    try {
      const { data } = await api.get(
        `/assignments?classId=${child.classId._id}`
      );
      setAssignments(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!child) {
    return (
      <Layout role="parent">
        <div className="p-6">Loading...</div>
      </Layout>
    );
  }

  const attendancePercent = attendance.total
    ? Math.round(
        (attendance.present / attendance.total) * 100
      )
    : 0;

  const chartData = {
    labels: marks.map((m) => m.subject),
    datasets: [
      {
        label: "Marks %",
        data: marks.map(
          (m) => (m.marksObtained / m.totalMarks) * 100
        ),
        backgroundColor: "#8b5cf6",
        borderRadius: 8,
      },
    ],
  };

  const tabStyle = (tab) =>
    activeTab === tab
      ? "bg-purple-600 text-white px-4 py-2 rounded-lg"
      : "bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200";

  return (
    <Layout role="parent">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {child.userId.name}'s Progress
        </h1>

        <p className="text-gray-500 mb-6">
          Class: {child.classId?.name}
        </p>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("attendance")}
              className={tabStyle("attendance")}
            >
              Attendance / Marks
            </button>

            <button
              onClick={() => setActiveTab("timetable")}
              className={tabStyle("timetable")}
            >
              Timetable
            </button>

            <button
              onClick={() => setActiveTab("assignments")}
              className={tabStyle("assignments")}
            >
              Assignments
            </button>

            <button
              onClick={() => setActiveTab("teacher")}
              className={tabStyle("teacher")}
            >
              Teacher
            </button>
          </nav>
        </div>

        {/* Attendance + Marks */}
        {activeTab === "attendance" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-gray-500 text-sm">
                  Attendance
                </p>

                <h2 className="text-4xl font-bold text-purple-600 mt-2">
                  {attendancePercent}%
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  {attendance.present} Present /{" "}
                  {attendance.total} Total Days
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl font-semibold mb-4">
                Marks Overview
              </h2>

              {marks.length > 0 ? (
                <Bar data={chartData} />
              ) : (
                <p className="text-gray-500">
                  No marks available.
                </p>
              )}
            </div>
          </>
        )}

        {/* Timetable */}
        {activeTab === "timetable" && (
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-xl font-semibold mb-4">
              Class Timetable
            </h2>

            {timetable?.slots?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="p-3 text-left">Day</th>
                      <th className="p-3 text-left">Period</th>
                      <th className="p-3 text-left">Subject</th>
                      <th className="p-3 text-left">Teacher</th>
                    </tr>
                  </thead>

                  <tbody>
                    {timetable.slots.map((s, idx) => (
                      <tr
                        key={idx}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-3">{s.day}</td>
                        <td className="p-3">{s.period}</td>
                        <td className="p-3">{s.subject}</td>
                        <td className="p-3">
                          {s.teacherId?.userId?.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No timetable available.</p>
            )}
          </div>
        )}

        {/* Assignments */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div
                  key={a._id}
                  className="bg-white rounded-2xl shadow p-5"
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    {a.title}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    {a.description}
                  </p>

                  <p className="text-sm text-red-500 mt-3">
                    Due:{" "}
                    {new Date(
                      a.dueDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                No assignments available.
              </p>
            )}
          </div>
        )}

        {/* Teacher */}
        {activeTab === "teacher" && (
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-xl font-semibold mb-4">
              Class Teacher
            </h2>

            {teacher ? (
              <div className="space-y-3">
                <p>
                  <strong>Name:</strong> {teacher.name}
                </p>

                <p>
                  <strong>Email:</strong> {teacher.email}
                </p>
              </div>
            ) : (
              <p>No class teacher assigned.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildProgress;
