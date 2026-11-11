import axios from 'axios';
import toast from 'react-hot-toast';

const AUTH_REDIRECT_STATUSES = new Set([401, 419]);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

const getServerMessage = (data) => {
  if (!data) return '';

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((item) => (typeof item === 'string' ? item : item.message || item.error))
      .filter(Boolean)
      .join('\n');
  }

  return data.message || data.error || '';
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.userMessage) return error.userMessage;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.';
  if (!error?.response) return 'Unable to reach the server. Please check your connection.';

  const { status, data } = error.response;
  const serverMessage = getServerMessage(data);

  if (serverMessage) return serverMessage;
  if (status === 400) return 'Please check the form and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 409) return 'This record already exists or conflicts with another record.';
  if (status === 422) return 'Some fields need correction before saving.';
  if (status === 423) return 'This account is temporarily locked. Please try again later.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Please try again shortly.';

  return fallback;
};

const shouldShowGlobalToast = (error) => {
  if (error.config?.silentErrorToast) return false;

  const method = (error.config?.method || 'get').toLowerCase();
  const status = error.response?.status;

  return (
    method !== 'get' &&
    !AUTH_REDIRECT_STATUSES.has(status) &&
    (status >= 500 || status === 429 || error.code === 'ECONNABORTED' || !error.response)
  );
};

const redirectToLogin = () => {
  localStorage.removeItem('user');

  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  (config) => {
    // Storage can be stale or manually edited. A malformed user record must not
    // reject every request before it reaches the API.
    let token = localStorage.getItem('authToken');
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      token = user?.token || token;
    } catch {
      localStorage.removeItem('user');
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const userMessage = getApiErrorMessage(error);
    error.userMessage = userMessage;

    if (AUTH_REDIRECT_STATUSES.has(error.response?.status)) {
      toast.error(userMessage);
      redirectToLogin();
    } else if (shouldShowGlobalToast(error)) {
      toast.error(userMessage);
    }

    return Promise.reject(error);
  }
);

// ======================================================
// AUTH / USER APIs
// (Keep your existing APIs here if already present)
// ======================================================

// Example:
// export const login = (data) => api.post('/auth/login', data);

// ======================================================
// CALENDAR SESSION APIs
// ======================================================
export const getClasses = () => api.get('/classes');

// ================== FEE PLANS ==================
export const getFeePlans = () => api.get('/fee-setup/plans');   // adjust if your route is different
export const getSessions = () =>
  api.get('/calendar/sessions');

export const createSession = (data) =>
  api.post('/calendar/sessions', data);

export const updateSession = (id, data) =>
  api.put(`/calendar/sessions/${id}`, data);

export const deleteSession = (id) =>
  api.delete(`/calendar/sessions/${id}`);

// ======================================================
// CALENDAR EVENT APIs
// ======================================================

export const getEvents = (params) =>
  api.get('/calendar/events', { params });

export const createEvent = (data) =>
  api.post('/calendar/events', data);

export const updateEvent = (id, data) =>
  api.put(`/calendar/events/${id}`, data);

export const deleteEvent = (id) =>
  api.delete(`/calendar/events/${id}`);

// ======================================================
// DEADLINE APIs
// ======================================================

export const getDeadlines = (params) =>
  api.get('/calendar/deadlines', { params });

export const createDeadline = (data) =>
  api.post('/calendar/deadlines', data);

export const updateDeadline = (id, data) =>
  api.put(`/calendar/deadlines/${id}`, data);

export const deleteDeadline = (id) =>
  api.delete(`/calendar/deadlines/${id}`);


// Subjects
export const getSubjects = (params) => api.get('/subjects', { params });
export const createSubject = (data) => api.post('/subjects', data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// Curriculums
export const getCurriculums = (params) => api.get('/curriculums', { params });
export const createCurriculum = (data) => api.post('/curriculums', data);
export const updateCurriculum = (id, data) => api.put(`/curriculums/${id}`, data);
export const deleteCurriculum = (id) => api.delete(`/curriculums/${id}`);

// Syllabus Units
export const getSyllabusUnits = (params) => api.get('/syllabus', { params });
export const createSyllabusUnit = (data) => api.post('/syllabus', data);
export const updateSyllabusUnit = (id, data) => api.put(`/syllabus/${id}`, data);
export const deleteSyllabusUnit = (id) => api.delete(`/syllabus/${id}`);
export const bulkCreateSyllabusUnits = (data) => api.post('/syllabus/bulk', data);
// Lesson Plans
export const getLessonPlans = (params) => api.get('/lesson-plans', { params });
export const createLessonPlan = (data) => api.post('/lesson-plans', data);
export const updateLessonPlan = (id, data) => api.put(`/lesson-plans/${id}`, data);
export const deleteLessonPlan = (id) => api.delete(`/lesson-plans/${id}`);
export const completeLessonPlan = (id) => api.post(`/lesson-plans/${id}/complete`);

// Course Coverage
export const getCourseCoverage = (params) => api.get('/course-coverage', { params });
export const updateCourseCoverage = (data) => api.post('/course-coverage', data);

// Students
export const getStudents = (params) => api.get('/students', { params });
export const getStudentById = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const getAcademicRecords = (params) => api.get('/academic-records', { params });
export const runPromotion = (data) => api.post('/academic-records/promote', data);



export const recordPayment = (accountId, data) =>
  api.post(`/fee-accounts/${accountId}/payments/pay`, data);

export const getPayments = (accountId) =>
  api.get(`/fee-accounts/${accountId}/payments`);
export const getBooks = (params) => api.get('/books', { params });
export const getBookById = (id) => api.get(`/books/${id}`);
export const createBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);
export const getLoans = (params) => api.get('/library/loans', { params });
export const issueBook = (data) => api.post('/library/issue', data);
export const returnBook = (data) => api.post('/library/return', data);
export const getLibraryStats = () => api.get('/library/stats');

export const getMyLoans = () => api.get('/library/my-loans');
export const getRoutes = (params) => api.get('/transport/routes', { params });
export const createRoute = (data) => api.post('/transport/routes', data);
export const updateRoute = (id, data) => api.put(`/transport/routes/${id}`, data);
export const deleteRoute = (id) => api.delete(`/transport/routes/${id}`);

export const getVehicles = (params) => api.get('/transport/vehicles', { params });
export const createVehicle = (data) => api.post('/transport/vehicles', data);
export const updateVehicle = (id, data) => api.put(`/transport/vehicles/${id}`, data);
export const deleteVehicle = (id) => api.delete(`/transport/vehicles/${id}`);
export const getAllocations = (params) => api.get('/transport/allocations', { params });
export const createAllocation = (data) => api.post('/transport/allocations', data);
export const updateAllocation = (id, data) => api.put(`/transport/allocations/${id}`, data);
export const deleteAllocation = (id) => api.delete(`/transport/allocations/${id}`);

export const getTransportRoster = (params) => api.get('/transport/roster', { params });
export const getTripSheet = (params) => api.get('/transport/trip-sheet', { params });




export const renewBook = (transactionId, days = 7) =>
  api.post(`/library/renew/${transactionId}`, { days });

// ======================================================
// CALENDAR FEED API
// (Combined Events + Deadlines)
// ======================================================

export const getCalendarFeed = (start, end, sessionId) =>
  api.get('/calendar/feed', {
    params: {
      start,
      end,
      session: sessionId,
    },
  });

// ======================================================
// EXPORT DEFAULT API INSTANCE
// ======================================================

export default api;
