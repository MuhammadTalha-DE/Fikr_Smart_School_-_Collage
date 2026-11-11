import { useEffect, useState } from "react";
import Layout from "../../components/common/Layout";
import api from "../../services/api";
import { Bar, Pie } from "react-chartjs-2";
import SchoolClock from '../../components/SchoolClock';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

import {
  FiUsers,
  FiBook,
  FiUserCheck,
  FiActivity,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

import { formatDistanceToNow } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    classes: 0,
    totalUsers: 0,
  });

  const [dashboardData, setDashboardData] = useState({
    recentActivities: [],
    upcomingEvents: [],
    attendance: { present: 0, absent: 0, rate: 0 },
    topClasses: [],
    bottomClasses: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDashboardData();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        api.get("/users"),
        api.get("/classes"),
      ]);
      const users = usersRes.data;
      const studentCount = users.filter((u) => u.role === "student").length;
      const teacherCount = users.filter((u) => u.role === "teacher").length;
      const parentCount = users.filter((u) => u.role === "parent").length;
      const totalUsers = studentCount + teacherCount + parentCount;
      setStats({
        students: studentCount,
        teachers: teacherCount,
        parents: parentCount,
        totalUsers,
        classes: classesRes.data.length,
      });
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/dashboard/admin");
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };


  const [monthly, setMonthly] = useState(0);
useEffect(() => {
  api.get('/reports/monthly-collection').then(res => setMonthly(res.data.total)).catch(()=>{});
}, []);

  const statCards = [
    { title: "Students", value: stats.students, icon: FiUsers, color: "from-blue-500 to-cyan-500" },
    { title: "Teachers", value: stats.teachers, icon: FiBook, color: "from-emerald-500 to-green-600" },
    { title: "Parents", value: stats.parents, icon: FiUserCheck, color: "from-violet-500 to-purple-600" },
    { title: "Classes", value: stats.classes, icon: FiActivity, color: "from-orange-500 to-amber-500" },
    { title: "Total Users", value: stats.totalUsers, icon: FiUsers, color: "from-pink-500 to-rose-500" },
  ];

  const attendanceChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [dashboardData.attendance.present, dashboardData.attendance.absent],
        backgroundColor: ["#10b981", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const performanceChartData = {
    labels: dashboardData.topClasses.map((c) => c.name),
    datasets: [
      {
        label: "Average Marks (%)",
        data: dashboardData.topClasses.map((c) => c.average),
        backgroundColor: "rgba(59,130,246,0.75)",
        borderRadius: 10,
      },
    ],
  };

  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/20 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header + Clock */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Admin Dashboard
              </h1>
              <p className="text-slate-500 mt-2">
                Welcome back! Here is your live school overview.
              </p>
            </div>

            {/* LIVE SCHOOL CLOCK – best place, right next to the heading */}
            <div className="w-full md:w-auto">
              <SchoolClock />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
  <p className="text-sm text-green-600">Collection This Month</p>
  <p className="text-2xl font-bold">PKR {monthly}</p>
</div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className="card border-pink-100 p-5 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{card.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="text-white text-xl" />
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* Recent Activities */}
              <div className="card border-pink-100 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-5 flex items-center">
                  <FiClock className="mr-2 text-pink-600" />
                  Recent Activities
                </h2>
                {loading ? (
                  <p className="text-slate-500">Loading...</p>
                ) : dashboardData.recentActivities.length === 0 ? (
                  <p className="text-slate-500">No recent activities.</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.recentActivities.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                        <div className="w-3 h-3 rounded-full bg-pink-500 mt-2"></div>
                        <div className="flex-1">
                          <p className="text-slate-800 font-medium">{activity.action}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {activity.time && !isNaN(new Date(activity.time).getTime())
                              ? formatDistanceToNow(new Date(activity.time), { addSuffix: true })
                              : "recently"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Assignments */}
              <div className="card border-pink-100 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-5 flex items-center">
                  <FiCalendar className="mr-2 text-violet-600" />
                  Upcoming Assignments
                </h2>
                {loading ? (
                  <p className="text-slate-500">Loading...</p>
                ) : dashboardData.upcomingEvents.length === 0 ? (
                  <p className="text-slate-500">No upcoming assignments.</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.upcomingEvents.map((event, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition">
                        <p className="font-semibold text-slate-800">{event.title}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {event.class} • Due {new Date(event.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Attendance */}
              <div className="card border-pink-100 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-5">Attendance Overview</h2>
                <div className="w-56 h-56 mx-auto">
                  <Pie data={attendanceChartData} options={{ plugins: { legend: { position: "bottom" } } }} />
                </div>
                <h3 className="text-center text-4xl font-bold text-emerald-600 mt-4">
                  {dashboardData.attendance.rate}%
                </h3>
                <p className="text-center text-slate-500 mt-1">Overall Attendance Rate</p>
              </div>

              {/* Top Classes */}
              <div className="card border-pink-100 p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-5 flex items-center">
                  <FiTrendingUp className="mr-2 text-green-600" />
                  Top Performing Classes
                </h2>
                {dashboardData.topClasses.length > 0 ? (
                  <Bar data={performanceChartData} options={{ indexAxis: "y", plugins: { legend: { display: false } } }} />
                ) : (
                  <p className="text-slate-500">No marks data available.</p>
                )}
              </div>

              {/* Bottom Classes */}
              {dashboardData.bottomClasses.length > 0 && (
                <div className="card border-pink-100 p-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-5 flex items-center">
                    <FiTrendingDown className="mr-2 text-red-500" />
                    Needs Attention
                  </h2>
                  <div className="space-y-3">
                    {dashboardData.bottomClasses.map((cls, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-red-50">
                        <span className="font-medium text-slate-700">{cls.name}</span>
                        <span className="font-bold text-red-600">{cls.average}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;