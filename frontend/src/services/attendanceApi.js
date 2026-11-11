import api from './api';

// ======================================================
// STUDENT ATTENDANCE APIs
// ======================================================

export const markAttendance = (data) => api.post('/attendance', data);

export const getAttendance = (params) => api.get('/attendance', { params });

export const getStudentAttendanceStats = (studentId, params) =>
  api.get(`/attendance/stats/student/${studentId}`, { params });

export const getTodayStats = () => api.get('/attendance/stats/today');

export const getLowAttendanceStudents = (params) =>
  api.get('/attendance/stats/low-attendance', { params });

export const getClassAttendanceSummary = (classId, params) =>
  api.get(`/attendance/stats/class/${classId}`, { params });

export const getMonthlyTrends = (params) =>
  api.get('/attendance/stats/monthly-trends', { params });

export const getAttendanceRiskAnalysis = () =>
  api.get('/attendance/stats/risk-analysis');

export const generateAttendanceRecommendations = () =>
  api.post('/attendance/recommendations');

export const bulkImportAttendance = (data) =>
  api.post('/attendance/bulk', data);

// ======================================================
// TEACHER ATTENDANCE APIs
// ======================================================

export const markTeacherAttendance = (data) =>
  api.post('/attendance/teacher', data);

export const getTeacherAttendance = (params) =>
  api.get('/attendance/teacher', { params });

export const getTeacherAttendanceStats = (params) =>
  api.get('/attendance/teacher/stats', { params });

export const teacherCheckIn = () => api.post('/attendance/teacher/check-in');

export const teacherCheckOut = () => api.post('/attendance/teacher/check-out');

// ======================================================
// TRANSPORT ATTENDANCE APIs
// ======================================================

export const markTransportAttendance = (data) =>
  api.post('/attendance/transport', data);

export const getTransportAttendance = (params) =>
  api.get('/attendance/transport', { params });

export const getTransportAttendanceStats = (params) =>
  api.get('/attendance/transport/stats', { params });

export const getMyTransportAttendance = () =>
  api.get('/attendance/transport/my');
