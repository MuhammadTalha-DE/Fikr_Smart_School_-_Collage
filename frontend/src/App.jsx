import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import InstallAppPrompt from './components/common/InstallAppPrompt';

// ===== Suspense Wrapper Component =====
function SuspenseWrapper({ children, skeletonType = 'default' }) {
  const fallbacks = {
    default: <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>,
    form: <div className="max-w-md mx-auto mt-8 p-6 space-y-4 animate-pulse"><div className="h-8 bg-gray-200 rounded w-3/4"></div><div className="h-10 bg-gray-200 rounded"></div><div className="h-10 bg-gray-200 rounded"></div><div className="h-10 bg-gray-200 rounded"></div></div>,
    table: <div className="p-6 space-y-4 animate-pulse"><div className="h-10 bg-gray-200 rounded w-full"></div><div className="h-24 bg-gray-200 rounded w-full"></div><div className="h-24 bg-gray-200 rounded w-full"></div></div>,
    profile: <div className="max-w-2xl mx-auto mt-8 p-6 space-y-6 animate-pulse"><div className="flex items-center space-x-4"><div className="rounded-full bg-gray-200 h-16 w-16"></div><div className="space-y-2"><div className="h-5 bg-gray-200 rounded w-48"></div><div className="h-4 bg-gray-200 rounded w-32"></div></div></div><div className="h-40 bg-gray-200 rounded"></div></div>
  };
  return <Suspense fallback={fallbacks[skeletonType] || fallbacks.default}>{children}</Suspense>;
}

// ===== LAZY LOADED IMPORTS =====

// Auth
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const FaceLogin = lazy(() => import('./pages/auth/FaceLogin'));
const FaceEnrollment = lazy(() => import('./pages/auth/FaceEnrollment'));

// Admin Core
const DropoutPredictor = lazy(() =>import('./pages/admin/DropoutPredictor'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminMonitor = lazy(() => import('./pages/admin/AdminMonitor'));
const Users = lazy(() => import('./pages/admin/Users'));
const CreateUser = lazy(() => import('./pages/admin/CreateUser'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Announcements = lazy(() => import('./pages/admin/Announcements'));
const ProfileShared = lazy(() => import('./pages/shared/Profile'));
const StudentDetail = lazy(() => import('./pages/admin/StudentDetail'));
const ChatAnalytics = lazy(() => import('./pages/admin/ChatAnalytics'));
const ExamList = lazy(() => import('./pages/admin/ExamList'));
const Labs = lazy(() => import('./pages/admin/Labs'));
const LabSessions = lazy(() => import('./pages/admin/LabSessions'));
const TimetableDesigner = lazy(() => import('./pages/admin/TimetableDesigner'));
const ThemeSettings = lazy(() => import('./pages/admin/ThemeSettings'));
const TimetableConflictCenter = lazy(() => import('./pages/admin/TimetableConflictCenter'));
const Rooms = lazy(() => import('./pages/admin/Rooms'));
const TimetableGenerator = lazy(() => import('./pages/admin/TimetableGenerator'));
const WeeklyLoad = lazy(() => import('./pages/admin/WeeklyLoad'));
const TeacherAvailability = lazy(() => import('./pages/admin/TeacherAvailability'));
const DefaultLoadConfig = lazy(() => import('./pages/admin/DefaultLoadConfig'));
const Students = lazy(() => import('./pages/admin/Students'));
const TeacherDetail = lazy(() => import('./pages/admin/TeacherDetail'));
const Teachers = lazy(() => import('./pages/admin/Teachers'));
const Parents = lazy(() => import('./pages/admin/Parents'));
const ParentDetail = lazy(() => import('./pages/admin/ParentDetail'));
const FeeHeads = lazy(() => import('./pages/admin/FeeHeads'));
const ClassFeePlans = lazy(() => import('./pages/admin/ClassFeePlans'));
const StudentFeeAccounts = lazy(() => import('./pages/admin/StudentFeeAccounts'));
const ClassDetail = lazy(() => import('./pages/admin/ClassDetail'));
const ExamDetail = lazy(() => import('./pages/admin/ExamDetail'));
const TimetableFullView = lazy(() => import('./pages/shared/TimetableFullView'));
const SchoolSettings = lazy(() => import('./pages/admin/SchoolSettings'));
const MessagesShared = lazy(() => import('./pages/shared/Messages'));
const MyLibraryShared = lazy(() => import('./pages/shared/MyLibrary'));
const TimetableReports = lazy(() => import('./pages/admin/TimetableReports'));
const TimetableVersionManager = lazy(() => import('./pages/admin/TimetableVersionManager'));
const SchedulingAnalytics = lazy(() => import('./pages/admin/SchedulingAnalytics'));
const SubstitutionManager = lazy(() => import('./pages/admin/SubstitutionManager'));
const SpecialSchedules = lazy(() => import('./pages/admin/SpecialSchedules'));
const SchoolTimings = lazy(() => import('./pages/admin/SchoolTimings'));
const AcademicCalendar = lazy(() => import('./pages/admin/AcademicCalendar'));
const Subjects = lazy(() => import('./pages/admin/Subjects'));
const CurriculumBuilder = lazy(() => import('./pages/admin/CurriculumBuilder'));
const Transport = lazy(() => import('./pages/admin/Transport'));
const SyllabusPlanner = lazy(() => import('./pages/admin/SyllabusPlanner'));
const CourseCoverage = lazy(() => import('./pages/admin/CourseCoverage'));
const StudentEdit = lazy(() => import('./pages/admin/StudentEdit'));
const Admissions = lazy(() => import('./pages/admin/Admissions'));
const AdmissionForm = lazy(() => import('./pages/admin/AdmissionForm'));
const AdmissionDetail = lazy(() => import('./pages/admin/AdmissionDetail'));
const PromotionDashboard = lazy(() => import('./pages/admin/PromotionDashboard'));
const StudentTranscript = lazy(() => import('./pages/admin/StudentTranscript'));
const OutstandingFees = lazy(() => import('./pages/admin/reports/OutstandingFees'));
const CollectionSummary = lazy(() => import('./pages/admin/reports/CollectionSummary'));
const DefaulterList = lazy(() => import('./pages/admin/reports/DefaulterList'));
const TestReport = lazy(() => import('./pages/admin/TestReport'));
const FeeAccountDetail = lazy(() => import('./pages/admin/FeeAccountDetail'));
const BehaviourDashboard = lazy(() => import('./pages/admin/BehaviourDashboard'));
const FaceLoginDashboard = lazy(() => import('./pages/admin/FaceLoginDashboard'));
const HostelManagement = lazy(() => import('./pages/admin/HostelManagement'));
const HostelAnalytics = lazy(() => import('./pages/admin/HostelAnalytics'));
const HostelResidents = lazy(() => import('./pages/admin/HostelResidents'));
const StudentHostelDetail = lazy(() => import('./pages/admin/StudentHostelDetail'));

// Admin Weather
const WeatherOverviewPage = lazy(() => import('./pages/weather/WeatherOverviewPage'));
const WeatherLiveCenterPage = lazy(() => import('./pages/weather/WeatherLiveCenterPage'));
const WeatherForecastPage = lazy(() => import('./pages/weather/WeatherForecastPage'));
const WeatherAQIPage = lazy(() => import('./pages/weather/WeatherAQIPage'));
const WeatherAnalyticsPage = lazy(() => import('./pages/weather/WeatherAnalyticsPage'));
const WeatherAlertsPage = lazy(() => import('./pages/weather/WeatherAlertsPage'));
const WeatherHistoryPage = lazy(() => import('./pages/weather/WeatherHistoryPage'));
const WeatherSettingsPage = lazy(() => import('./pages/weather/WeatherSettingsPage'));
const WeatherImpactAnalysisPage = lazy(() => import('./pages/weather/WeatherImpactAnalysisPage'));
const WeatherAttendanceImpactPage = lazy(() => import('./pages/weather/WeatherAttendanceImpactPage'));
const WeatherLMSImpactPage = lazy(() => import('./pages/weather/WeatherLMSImpactPage'));
const WeatherReportsPage = lazy(() => import('./pages/weather/WeatherReportsPage'));
const WeatherSystemHealthPage = lazy(() => import('./pages/weather/WeatherSystemHealthPage'));

// Admin HR/Payroll
const HRPayrollDashboard = lazy(() => import('./pages/admin/HRPayrollDashboard'));
const HRStaffDirectory = lazy(() => import('./pages/admin/HRStaffDirectory'));
const HRAttendanceCenter = lazy(() => import('./pages/admin/HRAttendanceCenter'));
const HRLeaveCenter = lazy(() => import('./pages/admin/HRLeaveCenter'));
const HRPayrollCenter = lazy(() => import('./pages/admin/HRPayrollCenter'));
const HRReportsCenter = lazy(() => import('./pages/admin/HRReportsCenter'));

// Admin Inventory
const InventoryDashboard = lazy(() => import('./pages/admin/InventoryDashboard'));
const InventoryItemsPage = lazy(() => import('./pages/admin/InventoryItemsPage'));
const InventoryProcurementPage = lazy(() => import('./pages/admin/InventoryProcurementPage'));
const InventoryStoreOpsPage = lazy(() => import('./pages/admin/InventoryStoreOpsPage'));
const InventoryMaintenancePage = lazy(() => import('./pages/admin/InventoryMaintenancePage'));
const InventoryReportsPage = lazy(() => import('./pages/admin/InventoryReportsPage'));

// Admin Operations
const AdminOperationsDashboard = lazy(() => import('./pages/admin/AdminOperationsDashboard'));
const BudgetControlPage = lazy(() => import('./pages/admin/BudgetControlPage'));
const ApprovalsWorkflowPage = lazy(() => import('./pages/admin/ApprovalsWorkflowPage'));
const ComplianceCenterPage = lazy(() => import('./pages/admin/ComplianceCenterPage'));
const ClinicOperationsPage = lazy(() => import('./pages/admin/ClinicOperationsPage'));
const SecurityOperationsPage = lazy(() => import('./pages/admin/SecurityOperationsPage'));
const StaffSelfServiceOversightPage = lazy(() => import('./pages/admin/StaffSelfServiceOversightPage'));
const ManagementBIPage = lazy(() => import('./pages/admin/ManagementBIPage'));
const PrincipalCommandPage = lazy(() => import('./pages/admin/PrincipalCommandPage'));

// Admin Accounts/Ledger
const AccountsDashboard = lazy(() => import('./pages/admin/AccountsDashboard'));
const LedgerAccountsPage = lazy(() => import('./pages/admin/LedgerAccountsPage'));
const LedgerVouchersPage = lazy(() => import('./pages/admin/LedgerVouchersPage'));
const LedgerStatementsPage = lazy(() => import('./pages/admin/LedgerStatementsPage'));

// Admin Medical Clinic
const MedicalClinicDashboard = lazy(() => import('./pages/admin/MedicalClinicDashboard'));
const MedicalProfilesPage = lazy(() => import('./pages/admin/MedicalProfilesPage'));
const MedicalVisitsPage = lazy(() => import('./pages/admin/MedicalVisitsPage'));
const MedicalMedicinesPage = lazy(() => import('./pages/admin/MedicalMedicinesPage'));

// Admin Security Gate
const SecurityGateDashboard = lazy(() => import('./pages/admin/SecurityGateDashboard'));
const SecurityVisitorsPage = lazy(() => import('./pages/admin/SecurityVisitorsPage'));
const SecurityPassesPage = lazy(() => import('./pages/admin/SecurityPassesPage'));
const SecurityVehicleLogsPage = lazy(() => import('./pages/admin/SecurityVehicleLogsPage'));
const SecurityNoticesPage = lazy(() => import('./pages/admin/SecurityNoticesPage'));

// Admin Others
const AuditCenter = lazy(() => import('./pages/admin/AuditCenter'));
const NotificationCenter = lazy(() => import('./pages/admin/NotificationCenter'));
const TransportRoster = lazy(() => import('./pages/admin/TransportRoster'));

// Documents
const DocumentDashboard = lazy(() => import('./pages/documents/DocumentDashboard'));
const TemplateBuilder = lazy(() => import('./pages/documents/TemplateBuilder'));
const IDCardGenerator = lazy(() => import('./pages/documents/IDCardGenerator'));
const CertificateGenerator = lazy(() => import('./pages/documents/CertificateGenerator'));
const FeeVoucherGenerator = lazy(() => import('./pages/documents/FeeVoucherGenerator'));
const ResultCardGenerator = lazy(() => import('./pages/documents/ResultCardGenerator'));
const AdmitCardGenerator = lazy(() => import('./pages/documents/AdmitCardGenerator'));
const OfficialLetters = lazy(() => import('./pages/documents/OfficialLetters'));
const BulkDocumentGenerator = lazy(() => import('./pages/documents/BulkDocumentGenerator'));
const DocumentRequests = lazy(() => import('./pages/documents/DocumentRequests'));
const GeneratedDocumentsList = lazy(() => import('./pages/documents/GeneratedDocumentsList'));
const PrintQueue = lazy(() => import('./pages/documents/PrintQueue'));
const VerifyDocument = lazy(() => import('./pages/documents/VerifyDocument'));

// Teacher
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherAttendance = lazy(() => import('./pages/teacher/Attendance'));
const MarksEntry = lazy(() => import('./pages/teacher/MarksEntry'));
const AssignmentsTeacher = lazy(() => import('./pages/teacher/Assignments'));
const MyClasses = lazy(() => import('./pages/teacher/MyClasses'));
const TeacherClassDetail = lazy(() => import('./pages/teacher/TeacherClassDetail'));
const TeacherLabDashboard = lazy(() => import('./pages/teacher/LabDashboard'));
const LabAttendance = lazy(() => import('./pages/teacher/LabAttendance'));
const PracticalMarksEntry = lazy(() => import('./pages/teacher/PracticalMarksEntry'));
const ProjectsTeacher = lazy(() => import('./pages/teacher/Projects'));
const ProjectSubmissions = lazy(() => import('./pages/teacher/ProjectSubmissions'));
const TeacherExams = lazy(() => import('./pages/teacher/TeacherExams'));
const ExamResults = lazy(() => import('./pages/teacher/ExamResults'));
const CreateProject = lazy(() => import('./pages/teacher/CreateProject'));
const AssignmentSubmissions = lazy(() => import('./pages/teacher/AssignmentSubmissions'));
const TeacherWeatherDashboard = lazy(() => import('./pages/teacher/TeacherWeatherDashboard'));
const TeacherWorkspaceDashboard = lazy(() => import('./pages/teacher/TeacherWorkspaceDashboard'));
const TeacherSelfServicePage = lazy(() => import('./pages/teacher/TeacherSelfServicePage'));
const LessonDeliveryTrackerPage = lazy(() => import('./pages/teacher/LessonDeliveryTrackerPage'));
const StudentInterventionTrackerPage = lazy(() => import('./pages/teacher/StudentInterventionTrackerPage'));
const PTMCenterPage = lazy(() => import('./pages/teacher/PTMCenterPage'));
const SubstitutionInvigilationPage = lazy(() => import('./pages/teacher/SubstitutionInvigilationPage'));
const LearningContinuityWorkspacePage = lazy(() => import('./pages/teacher/LearningContinuityWorkspacePage'));
const LessonPlanner = lazy(() => import('./pages/teacher/LessonPlanner'));
const MySubjects = lazy(() => import('./pages/teacher/MySubjects'));
const McqExamList = lazy(() => import('./pages/teacher/McqExamList'));
const McqExamForm = lazy(() => import('./pages/teacher/McqExamForm'));
const McqExamResults = lazy(() => import('./pages/teacher/McqExamResults'));
const BehaviourLog = lazy(() => import('./pages/teacher/BehaviourLog'));
const ActivityLog = lazy(() => import('./pages/teacher/ActivityLog'));
const ClassBehaviourReport = lazy(() => import('./pages/teacher/ClassBehaviourReport'));

// Student
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentMarks = lazy(() => import('./pages/student/Marks'));
const StudentAttendanceView = lazy(() => import('./pages/attendance/StudentAttendanceView'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const Timetable = lazy(() => import('./pages/student/Timetable'));
const StudentLabDashboard = lazy(() => import('./pages/student/LabDashboard'));
const StudentPracticalMarks = lazy(() => import('./pages/student/PracticalMarks'));
const StudentProjects = lazy(() => import('./pages/student/StudentProjects'));
const ProjectSubmit = lazy(() => import('./pages/student/ProjectSubmit'));
const StudentMySubmissions = lazy(() => import('./pages/student/MySubmissions'));
const StudentExams = lazy(() => import('./pages/student/StudentExams'));
const ReportCard = lazy(() => import('./pages/student/ReportCards'));
const SubmitAssignment = lazy(() => import('./pages/student/SubmitAssignment'));
const StudentWeatherDashboard = lazy(() => import('./pages/student/StudentWeatherDashboard'));
const StudentWorkflowDashboard = lazy(() => import('./pages/student/WorkflowDashboard'));
const StudentPTMCenter = lazy(() => import('./pages/student/PTMCenter'));
const StudentGatePassCenter = lazy(() => import('./pages/student/GatePassCenter'));
const MessMenu = lazy(() => import('./pages/student/MessMenu'));
const HostelApplication = lazy(() => import('./pages/student/HostelApplication'));
const VisitorRequest = lazy(() => import('./pages/student/VisitorRequest'));
const HostelLeave = lazy(() => import('./pages/student/HostelLeave'));
const HostelComplaints = lazy(() => import('./pages/student/HostelComplaints'));
const McqAvailable = lazy(() => import('./pages/student/McqAvailable'));
const TakeMcq = lazy(() => import('./pages/student/TakeMcq'));
const McqResult = lazy(() => import('./pages/student/McqResult'));
const MyBehaviour = lazy(() => import('./pages/student/MyBehaviour'));

// Parent
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'));
const ChildProgress = lazy(() => import('./pages/parent/ChildProgress'));
const ParentAnnouncements = lazy(() => import('./pages/parent/Announcements'));
const ChildrenList = lazy(() => import('./pages/parent/ChildrenList'));
const ParentProgress = lazy(() => import('./pages/parent/ParentProgress'));
const ParentReportCards = lazy(() => import('./pages/parent/ReportCards'));
const ParentWeatherDashboard = lazy(() => import('./pages/parent/ParentWeatherDashboard'));
const ParentWorkflowDashboard = lazy(() => import('./pages/parent/WorkflowDashboard'));
const ParentPTMCenter = lazy(() => import('./pages/parent/PTMCenter'));
const ParentSupportCenter = lazy(() => import('./pages/parent/SupportCenter'));
const ParentSecurityCenter = lazy(() => import('./pages/parent/SecurityCenter'));
const HostelOverview = lazy(() => import('./pages/parent/HostelOverview'));
const ParentAttendanceView = lazy(() => import('./pages/attendance/ParentAttendanceView'));
const ChildBehaviour = lazy(() => import('./pages/parent/ChildBehaviour'));

// Warden
const WardenDashboard = lazy(() => import('./pages/warden/Dashboard'));
const WardenWorkflowDashboard = lazy(() => import('./pages/warden/WorkflowDashboard'));
const WardenPTMCenter = lazy(() => import('./pages/warden/PTMCenter'));
const WardenSupportCenter = lazy(() => import('./pages/warden/SupportCenter'));
const WardenSecurityCenter = lazy(() => import('./pages/warden/SecurityCenter'));
const VisitorManagement = lazy(() => import('./pages/warden/VisitorManagement'));
const LeaveManagement = lazy(() => import('./pages/warden/LeaveManagement'));
const HostelAttendance = lazy(() => import('./pages/warden/HostelAttendance'));
const ComplaintManagement = lazy(() => import('./pages/warden/ComplaintManagement'));
const MessMenuManagement = lazy(() => import('./pages/warden/MessMenuManagement'));

// Librarian
const LibrarianDashboard = lazy(() => import('./pages/librarian/Dashboard'));
const LibrarianWeatherDashboard = lazy(() => import('./pages/librarian/LibrarianWeatherDashboard'));
const BookInventory = lazy(() => import('./pages/library/BookInventory'));
const LibraryDashboard = lazy(() => import('./pages/library/Dashboard'));
const IssueReturn = lazy(() => import('./pages/library/IssueReturn'));

// Transport
const TransportDashboard = lazy(() => import('./pages/transport/Dashboard'));
const TransportWeatherDashboard = lazy(() => import('./pages/transport/TransportWeatherDashboard'));
const TransportWorkflowDashboard = lazy(() => import('./pages/transport/WorkflowDashboard'));
const TransportIncidentCenter = lazy(() => import('./pages/transport/IncidentCenter'));

// Hostel Weather
const HostelWeatherDashboard = lazy(() => import('./pages/hostel/HostelWeatherDashboard'));

// Shared
const ChatPage = lazy(() => import('./pages/shared/ChatPage'));
const CalendarViewShared = lazy(() => import('./pages/shared/CalendarView'));
const FeePortalShared = lazy(() => import('./pages/shared/FeePortal'));
const MyTransportShared = lazy(() => import('./pages/shared/MyTransport'));
const NotificationInboxShared = lazy(() => import('./pages/shared/NotificationInbox'));

// Safety
const AdminSafetyDashboard = lazy(() => import('./pages/safety/AdminSafetyDashboard'));
const StudentSafetyCenter = lazy(() => import('./pages/safety/StudentSafetyCenter'));
const ParentSafetyAlerts = lazy(() => import('./pages/safety/ParentSafetyAlerts'));
const TeacherIncidentReports = lazy(() => import('./pages/safety/TeacherIncidentReports'));
const EmergencyContacts = lazy(() => import('./pages/safety/EmergencyContacts'));

// Attendance
const AdminAttendanceDashboard = lazy(() => import('./pages/attendance/AdminAttendanceDashboard'));
const TeacherAttendancePage = lazy(() => import('./pages/attendance/TeacherAttendancePage'));
const HostelAttendancePage = lazy(() => import('./pages/attendance/HostelAttendancePage'));
const TransportAttendancePage = lazy(() => import('./pages/attendance/TransportAttendancePage'));
const AttendanceReports = lazy(() => import('./pages/attendance/AttendanceReports'));

// Admin IdCardGenerator (separate lazy import to avoid conflict with documents one)
const AdminIdCardGenerator = lazy(() => import('./pages/admin/IdCardGenerator'));

// Hostel Applications (Admin)
const HostelApplications = lazy(() => import('./pages/admin/HostelApplications'));

const getRoleHomePath = (role) => (role ? `/${role}/dashboard` : '/login');

const getAttendanceHomePath = (role) => ({
  admin: '/attendance/admin',
  teacher: '/attendance/teacher',
  student: '/attendance/student',
  parent: '/attendance/parent',
  warden: '/attendance/hostel',
  transport: '/attendance/transport',
}[role] || getRoleHomePath(role));

function RoleRedirect({ to }) {
  const { user } = useAuth();
  const target = typeof to === 'function' ? to(user?.role) : to;
  return <Navigate to={target || getRoleHomePath(user?.role)} replace />;
}

function NotFoundRedirect() {
  const { user } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const currentTheme = user?.theme || 'Clinical Blue';
  
  return (
    <ThemeProvider initialTheme={currentTheme}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '16px',
            border: '1px solid rgba(118, 151, 168, 0.24)',
            background: 'rgba(255, 255, 255, 0.96)',
            color: '#183647',
            boxShadow: '0 22px 48px rgba(15, 38, 54, 0.14)',
          },
        }}
      />
      <InstallAppPrompt />
      <ErrorBoundary
        resetKey={location.pathname}
        fallbackMessage="This page ran into a problem. You can reload it or return to your dashboard."
      >
      <Routes>
        {/* Public / Auth Routes */}
        <Route path="/" element={<NotFoundRedirect />} />
        <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
        <Route path="/forgot-password" element={<SuspenseWrapper skeletonType="form"><ForgotPassword /></SuspenseWrapper>} />
        <Route path="/reset-password/:token" element={<SuspenseWrapper skeletonType="form"><ResetPassword /></SuspenseWrapper>} />
        <Route path="/face-login" element={<SuspenseWrapper><FaceLogin /></SuspenseWrapper>} />
        
        <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'parent', 'admin', 'warden']} />}>
          <Route path="/face-enrollment" element={<SuspenseWrapper skeletonType="form"><FaceEnrollment /></SuspenseWrapper>} />
        </Route>

        {/* ===== ADMIN ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
          <Route path="/admin/monitor" element={<SuspenseWrapper><AdminMonitor /></SuspenseWrapper>} />
          <Route path="/admin/weather-dashboard" element={<Navigate to="/admin/weather" replace />} />
          <Route path="/admin/weather" element={<SuspenseWrapper><WeatherOverviewPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/live" element={<SuspenseWrapper><WeatherLiveCenterPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/forecast" element={<SuspenseWrapper><WeatherForecastPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/aqi" element={<SuspenseWrapper><WeatherAQIPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/alerts" element={<SuspenseWrapper><WeatherAlertsPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/analytics" element={<SuspenseWrapper><WeatherAnalyticsPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/history" element={<SuspenseWrapper><WeatherHistoryPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/impact" element={<SuspenseWrapper><WeatherImpactAnalysisPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/attendance-impact" element={<SuspenseWrapper><WeatherAttendanceImpactPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/lms-impact" element={<SuspenseWrapper><WeatherLMSImpactPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/transport" element={<SuspenseWrapper><TransportWeatherDashboard layoutRole="admin" /></SuspenseWrapper>} />
          <Route path="/admin/weather/hostel" element={<SuspenseWrapper><HostelWeatherDashboard layoutRole="admin" /></SuspenseWrapper>} />
          <Route path="/admin/weather/reports" element={<SuspenseWrapper><WeatherReportsPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/settings" element={<SuspenseWrapper skeletonType="form"><WeatherSettingsPage /></SuspenseWrapper>} />
          <Route path="/admin/weather/system-health" element={<SuspenseWrapper><WeatherSystemHealthPage /></SuspenseWrapper>} />
          
          <Route path="/admin/notifications" element={<SuspenseWrapper><NotificationCenter /></SuspenseWrapper>} />
          <Route path="/admin/audit" element={<SuspenseWrapper><AuditCenter /></SuspenseWrapper>} />
          <Route path="/admin/attendance" element={<SuspenseWrapper><AdminAttendanceDashboard /></SuspenseWrapper>} />
          <Route path="/admin/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/admin/calendar" element={<SuspenseWrapper><AcademicCalendar /></SuspenseWrapper>} />
          
          <Route path="/admin/hr-payroll" element={<SuspenseWrapper><HRPayrollDashboard /></SuspenseWrapper>} />
          <Route path="/admin/hr-payroll/staff" element={<SuspenseWrapper skeletonType="table"><HRStaffDirectory /></SuspenseWrapper>} />
          <Route path="/admin/hr-payroll/attendance" element={<SuspenseWrapper><HRAttendanceCenter /></SuspenseWrapper>} />
          <Route path="/admin/hr-payroll/leave" element={<SuspenseWrapper><HRLeaveCenter /></SuspenseWrapper>} />
          <Route path="/admin/hr-payroll/payroll" element={<SuspenseWrapper><HRPayrollCenter /></SuspenseWrapper>} />
          <Route path="/admin/hr-payroll/reports" element={<SuspenseWrapper><HRReportsCenter /></SuspenseWrapper>} />
          
          <Route path="/admin/inventory" element={<SuspenseWrapper><InventoryDashboard /></SuspenseWrapper>} />
          <Route path="/admin/inventory/items" element={<SuspenseWrapper skeletonType="table"><InventoryItemsPage /></SuspenseWrapper>} />
          <Route path="/admin/inventory/procurement" element={<SuspenseWrapper skeletonType="table"><InventoryProcurementPage /></SuspenseWrapper>} />
          <Route path="/admin/inventory/store" element={<SuspenseWrapper><InventoryStoreOpsPage /></SuspenseWrapper>} />
          <Route path="/admin/inventory/maintenance" element={<SuspenseWrapper><InventoryMaintenancePage /></SuspenseWrapper>} />
          <Route path="/admin/inventory/reports" element={<SuspenseWrapper><InventoryReportsPage /></SuspenseWrapper>} />
          
          <Route path="/admin/operations" element={<SuspenseWrapper><AdminOperationsDashboard /></SuspenseWrapper>} />
          <Route path="/admin/operations/budgeting" element={<SuspenseWrapper><BudgetControlPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/approvals" element={<SuspenseWrapper><ApprovalsWorkflowPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/compliance" element={<SuspenseWrapper><ComplianceCenterPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/clinic" element={<SuspenseWrapper><ClinicOperationsPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/security" element={<SuspenseWrapper><SecurityOperationsPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/staff-oversight" element={<SuspenseWrapper><StaffSelfServiceOversightPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/bi-center" element={<SuspenseWrapper><ManagementBIPage /></SuspenseWrapper>} />
          <Route path="/admin/operations/principal-command" element={<SuspenseWrapper><PrincipalCommandPage /></SuspenseWrapper>} />
          
          <Route path="/admin/accounts-ledger" element={<SuspenseWrapper><AccountsDashboard /></SuspenseWrapper>} />
          <Route path="/admin/accounts-ledger/accounts" element={<SuspenseWrapper skeletonType="table"><LedgerAccountsPage /></SuspenseWrapper>} />
          <Route path="/admin/accounts-ledger/vouchers" element={<SuspenseWrapper skeletonType="table"><LedgerVouchersPage /></SuspenseWrapper>} />
          <Route path="/admin/accounts-ledger/statements" element={<SuspenseWrapper><LedgerStatementsPage /></SuspenseWrapper>} />
          
          <Route path="/admin/medical-clinic" element={<SuspenseWrapper><MedicalClinicDashboard /></SuspenseWrapper>} />
          <Route path="/admin/medical-clinic/profiles" element={<SuspenseWrapper skeletonType="table"><MedicalProfilesPage /></SuspenseWrapper>} />
          <Route path="/admin/medical-clinic/visits" element={<SuspenseWrapper skeletonType="table"><MedicalVisitsPage /></SuspenseWrapper>} />
          <Route path="/admin/medical-clinic/medicines" element={<SuspenseWrapper skeletonType="table"><MedicalMedicinesPage /></SuspenseWrapper>} />
          
          <Route path="/admin/security-gate" element={<SuspenseWrapper><SecurityGateDashboard /></SuspenseWrapper>} />
          <Route path="/admin/security-gate/visitors" element={<SuspenseWrapper skeletonType="table"><SecurityVisitorsPage /></SuspenseWrapper>} />
          <Route path="/admin/security-gate/passes" element={<SuspenseWrapper skeletonType="table"><SecurityPassesPage /></SuspenseWrapper>} />
          <Route path="/admin/security-gate/vehicles" element={<SuspenseWrapper skeletonType="table"><SecurityVehicleLogsPage /></SuspenseWrapper>} />
          <Route path="/admin/security-gate/notices" element={<SuspenseWrapper><SecurityNoticesPage /></SuspenseWrapper>} />
          
          <Route path="/admin/users" element={<SuspenseWrapper skeletonType="table"><Users /></SuspenseWrapper>} />
          <Route path="/admin/users/create" element={<SuspenseWrapper skeletonType="form"><CreateUser /></SuspenseWrapper>} />
          <Route path="/admin/students" element={<SuspenseWrapper skeletonType="table"><Students /></SuspenseWrapper>} />
          <Route path="/admin/students/:id" element={<SuspenseWrapper><StudentDetail /></SuspenseWrapper>} />
          <Route path="/admin/classes" element={<SuspenseWrapper skeletonType="table"><Classes /></SuspenseWrapper>} />
          <Route path="/admin/analytics" element={<SuspenseWrapper><Analytics /></SuspenseWrapper>} />
          <Route path="/admin/face-login" element={<SuspenseWrapper><FaceLoginDashboard /></SuspenseWrapper>} />
          <Route path="/admin/announcements" element={<SuspenseWrapper><Announcements /></SuspenseWrapper>} />
          <Route path="/admin/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
          <Route path="/admin/exams" element={<SuspenseWrapper skeletonType="table"><ExamList /></SuspenseWrapper>} />
          <Route path="/admin/labs" element={<SuspenseWrapper skeletonType="table"><Labs /></SuspenseWrapper>} />
          <Route path="/admin/lab-sessions" element={<SuspenseWrapper skeletonType="table"><LabSessions /></SuspenseWrapper>} />
          <Route path="/admin/timetable" element={<SuspenseWrapper><TimetableDesigner /></SuspenseWrapper>} />
          <Route path="/admin/timetable-designer" element={<SuspenseWrapper><TimetableDesigner /></SuspenseWrapper>} />
          <Route path="/admin/time-table-designer" element={<SuspenseWrapper><TimetableDesigner /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/timetable-designer" element={<SuspenseWrapper><TimetableDesigner /></SuspenseWrapper>} />
          <Route path="/admin/theme" element={<SuspenseWrapper><ThemeSettings /></SuspenseWrapper>} />
          <Route path="/admin/theme-settings" element={<SuspenseWrapper><ThemeSettings /></SuspenseWrapper>} />
          <Route path="/admin/timetable-conflicts" element={<SuspenseWrapper><TimetableConflictCenter /></SuspenseWrapper>} />
          <Route path="/admin/rooms" element={<SuspenseWrapper skeletonType="table"><Rooms /></SuspenseWrapper>} />
          <Route path="/admin/timetable-generator" element={<SuspenseWrapper><TimetableGenerator /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/timetable-generator" element={<SuspenseWrapper><TimetableGenerator /></SuspenseWrapper>} />
          <Route path="/admin/weekly-load" element={<SuspenseWrapper><WeeklyLoad /></SuspenseWrapper>} />
          <Route path="/admin/teacher-availability" element={<SuspenseWrapper><TeacherAvailability /></SuspenseWrapper>} />
          <Route path="/admin/default-load" element={<SuspenseWrapper><DefaultLoadConfig /></SuspenseWrapper>} />
          <Route path="/admin/default-load-config" element={<SuspenseWrapper><DefaultLoadConfig /></SuspenseWrapper>} />
          <Route path="/admin/load-config" element={<SuspenseWrapper><DefaultLoadConfig /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/default-load" element={<SuspenseWrapper><DefaultLoadConfig /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/default-load-config" element={<SuspenseWrapper><DefaultLoadConfig /></SuspenseWrapper>} />
          <Route path="/admin/teachers" element={<SuspenseWrapper skeletonType="table"><Teachers /></SuspenseWrapper>} />
          <Route path="/admin/teachers/:id" element={<SuspenseWrapper><TeacherDetail /></SuspenseWrapper>} />
          <Route path="/admin/parents" element={<SuspenseWrapper skeletonType="table"><Parents /></SuspenseWrapper>} />
          <Route path="/admin/parents/:id" element={<SuspenseWrapper><ParentDetail /></SuspenseWrapper>} />
          <Route path="/admin/fee-heads" element={<SuspenseWrapper skeletonType="table"><FeeHeads /></SuspenseWrapper>} />
          <Route path="/admin/class-fee-plans" element={<SuspenseWrapper skeletonType="table"><ClassFeePlans /></SuspenseWrapper>} />
          <Route path="/admin/student-fee-accounts" element={<SuspenseWrapper skeletonType="table"><StudentFeeAccounts /></SuspenseWrapper>} />
          <Route path="/admin/classes/:id" element={<SuspenseWrapper><ClassDetail /></SuspenseWrapper>} />
          <Route path="/admin/exams/:id" element={<SuspenseWrapper><ExamDetail /></SuspenseWrapper>} />
          <Route path="/admin/school-settings" element={<SuspenseWrapper><SchoolSettings /></SuspenseWrapper>} />
          <Route path="/admin/settings" element={<SuspenseWrapper><SchoolSettings /></SuspenseWrapper>} />
          <Route path="/admin/settings/theme" element={<SuspenseWrapper><ThemeSettings /></SuspenseWrapper>} />
          <Route path="/admin/settings/chat-analytics" element={<SuspenseWrapper><ChatAnalytics /></SuspenseWrapper>} />
          <Route path="/admin/chat-analytics" element={<SuspenseWrapper><ChatAnalytics /></SuspenseWrapper>} />
          <Route path="/admin/timetable-viewer" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/admin/full-timetable" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/admin/time-table" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/full-timetable" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/admin/timetable-reports" element={<SuspenseWrapper><TimetableReports /></SuspenseWrapper>} />
          <Route path="/admin/timetable-versions" element={<SuspenseWrapper><TimetableVersionManager /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/versions" element={<SuspenseWrapper><TimetableVersionManager /></SuspenseWrapper>} />
          <Route path="/admin/scheduling-analytics" element={<SuspenseWrapper><SchedulingAnalytics /></SuspenseWrapper>} />
          <Route path="/admin/scheduling/analytics" element={<SuspenseWrapper><SchedulingAnalytics /></SuspenseWrapper>} />
          <Route path="/admin/substitutions" element={<SuspenseWrapper><SubstitutionManager /></SuspenseWrapper>} />
          <Route path="/admin/substitution-manager" element={<SuspenseWrapper><SubstitutionManager /></SuspenseWrapper>} />
          <Route path="/admin/special-schedules" element={<SuspenseWrapper><SpecialSchedules /></SuspenseWrapper>} />
          <Route path="/admin/school-timings" element={<SuspenseWrapper><SchoolTimings /></SuspenseWrapper>} />
          <Route path="/admin/academic-calendar" element={<SuspenseWrapper><AcademicCalendar /></SuspenseWrapper>} />
          <Route path="/admin/subjects" element={<SuspenseWrapper skeletonType="table"><Subjects /></SuspenseWrapper>} />
          <Route path="/admin/curriculum" element={<SuspenseWrapper><CurriculumBuilder /></SuspenseWrapper>} />
          <Route path="/admin/curriculum-management" element={<SuspenseWrapper><CurriculumBuilder /></SuspenseWrapper>} />
          <Route path="/admin/curriculum-builder" element={<SuspenseWrapper><CurriculumBuilder /></SuspenseWrapper>} />
          <Route path="/admin/transport" element={<SuspenseWrapper><Transport /></SuspenseWrapper>} />
          <Route path="/admin/transport-roster" element={<SuspenseWrapper skeletonType="table"><TransportRoster /></SuspenseWrapper>} />
          <Route path="/admin/syllabus" element={<SuspenseWrapper><SyllabusPlanner /></SuspenseWrapper>} />
          <Route path="/admin/syllabus-planner" element={<SuspenseWrapper><SyllabusPlanner /></SuspenseWrapper>} />
          <Route path="/admin/course-coverage" element={<SuspenseWrapper><CourseCoverage /></SuspenseWrapper>} />
          <Route path="/admin/student-edit/:id" element={<SuspenseWrapper skeletonType="form"><StudentEdit /></SuspenseWrapper>} />
          <Route path="/admin/admissions" element={<SuspenseWrapper skeletonType="table"><Admissions /></SuspenseWrapper>} />
          <Route path="/admin/admissions/new" element={<SuspenseWrapper skeletonType="form"><AdmissionForm /></SuspenseWrapper>} />
          <Route path="/admin/admissions/:id" element={<SuspenseWrapper><AdmissionDetail /></SuspenseWrapper>} />
          <Route path="/admin/promotion" element={<SuspenseWrapper><PromotionDashboard /></SuspenseWrapper>} />
          <Route path="/admin/student-transcript/:id" element={<SuspenseWrapper><StudentTranscript /></SuspenseWrapper>} />
          <Route path="/admin/reports/outstanding" element={<SuspenseWrapper><OutstandingFees /></SuspenseWrapper>} />
          <Route path="/admin/reports/collection" element={<SuspenseWrapper><CollectionSummary /></SuspenseWrapper>} />
          <Route path="/admin/reports/defaulters" element={<SuspenseWrapper><DefaulterList /></SuspenseWrapper>} />
          <Route path="/admin/finance" element={<SuspenseWrapper><StudentFeeAccounts /></SuspenseWrapper>} />
          <Route path="/admin/finance/outstanding" element={<SuspenseWrapper><OutstandingFees /></SuspenseWrapper>} />
          <Route path="/admin/finance/collections" element={<SuspenseWrapper><CollectionSummary /></SuspenseWrapper>} />
          <Route path="/admin/finance/collection-summary" element={<SuspenseWrapper><CollectionSummary /></SuspenseWrapper>} />
          <Route path="/admin/finance/defaulters" element={<SuspenseWrapper><DefaulterList /></SuspenseWrapper>} />
          <Route path="/admin/outstanding-fees" element={<SuspenseWrapper><OutstandingFees /></SuspenseWrapper>} />
          <Route path="/admin/collection-summary" element={<SuspenseWrapper><CollectionSummary /></SuspenseWrapper>} />
          <Route path="/admin/defaulter-list" element={<SuspenseWrapper><DefaulterList /></SuspenseWrapper>} />
          <Route path="/admin/test-report" element={<SuspenseWrapper><TestReport /></SuspenseWrapper>} />
          <Route path="/admin/fee-account/:id" element={<SuspenseWrapper><FeeAccountDetail /></SuspenseWrapper>} />
          <Route path="/admin/behaviour" element={<SuspenseWrapper><BehaviourDashboard /></SuspenseWrapper>} />
          <Route path="/admin/hostels" element={<SuspenseWrapper><HostelManagement /></SuspenseWrapper>} />
          <Route path="/admin/hostel-applications" element={<SuspenseWrapper><HostelApplications /></SuspenseWrapper>} />
          <Route path="/admin/hostel-analytics" element={<SuspenseWrapper><HostelAnalytics /></SuspenseWrapper>} />
          <Route path="/admin/hostel-residents" element={<SuspenseWrapper skeletonType="table"><HostelResidents /></SuspenseWrapper>} />
          <Route path="/admin/hostel-residents/:id" element={<SuspenseWrapper><StudentHostelDetail /></SuspenseWrapper>} />
          <Route path="/admin/hostel-visitors" element={<SuspenseWrapper><VisitorManagement role="admin" /></SuspenseWrapper>} />
          <Route path="/admin/id-cards" element={<SuspenseWrapper><AdminIdCardGenerator /></SuspenseWrapper>} />
          <Route path="/admin/safety-dashboard" element={<SuspenseWrapper><AdminSafetyDashboard /></SuspenseWrapper>} />
          <Route path="/admin/emergency-contacts" element={<SuspenseWrapper><EmergencyContacts /></SuspenseWrapper>} />
          <Route path="/admin/documents" element={<SuspenseWrapper><DocumentDashboard /></SuspenseWrapper>} />
          <Route path="/admin/documents/dashboard" element={<SuspenseWrapper><DocumentDashboard /></SuspenseWrapper>} />
          <Route path="/admin/documents/templates" element={<SuspenseWrapper><TemplateBuilder /></SuspenseWrapper>} />
          <Route path="/admin/documents/id-card" element={<SuspenseWrapper><IDCardGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/certificates" element={<SuspenseWrapper><CertificateGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/fee-voucher" element={<SuspenseWrapper><FeeVoucherGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/result-card" element={<SuspenseWrapper><ResultCardGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/admit-card" element={<SuspenseWrapper><AdmitCardGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/official-letters" element={<SuspenseWrapper><OfficialLetters /></SuspenseWrapper>} />
          <Route path="/admin/documents/bulk" element={<SuspenseWrapper><BulkDocumentGenerator /></SuspenseWrapper>} />
          <Route path="/admin/documents/requests" element={<SuspenseWrapper><DocumentRequests /></SuspenseWrapper>} />
          <Route path="/admin/documents/generated" element={<SuspenseWrapper><GeneratedDocumentsList /></SuspenseWrapper>} />
          <Route path="/admin/documents/print" element={<SuspenseWrapper><PrintQueue /></SuspenseWrapper>} />
          <Route path="/admin/dropout-predictor" element={<SuspenseWrapper><DropoutPredictor /></SuspenseWrapper>} />
        </Route>

        {/* ===== TEACHER ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<SuspenseWrapper><TeacherDashboard /></SuspenseWrapper>} />
          <Route path="/teacher/attendance" element={<SuspenseWrapper><TeacherAttendance /></SuspenseWrapper>} />
          <Route path="/teacher/marks-entry" element={<SuspenseWrapper><MarksEntry /></SuspenseWrapper>} />
          <Route path="/teacher/assignments" element={<SuspenseWrapper><AssignmentsTeacher /></SuspenseWrapper>} />
          <Route path="/teacher/my-classes" element={<SuspenseWrapper><MyClasses /></SuspenseWrapper>} />
          <Route path="/teacher/class/:id" element={<SuspenseWrapper><TeacherClassDetail /></SuspenseWrapper>} />
          <Route path="/teacher/lab-dashboard" element={<SuspenseWrapper><TeacherLabDashboard /></SuspenseWrapper>} />
          <Route path="/teacher/lab-attendance" element={<SuspenseWrapper><LabAttendance /></SuspenseWrapper>} />
          <Route path="/teacher/practical-marks" element={<SuspenseWrapper><PracticalMarksEntry /></SuspenseWrapper>} />
          <Route path="/teacher/projects" element={<SuspenseWrapper><ProjectsTeacher /></SuspenseWrapper>} />
          <Route path="/teacher/project-submissions" element={<SuspenseWrapper><ProjectSubmissions /></SuspenseWrapper>} />
          <Route path="/teacher/exams" element={<SuspenseWrapper><TeacherExams /></SuspenseWrapper>} />
          <Route path="/teacher/exam-results" element={<SuspenseWrapper><ExamResults /></SuspenseWrapper>} />
          <Route path="/teacher/create-project" element={<SuspenseWrapper><CreateProject /></SuspenseWrapper>} />
          <Route path="/teacher/assignment-submissions" element={<SuspenseWrapper><AssignmentSubmissions /></SuspenseWrapper>} />
          <Route path="/teacher/weather" element={<SuspenseWrapper><TeacherWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/teacher/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/teacher/calendar" element={<SuspenseWrapper><CalendarViewShared /></SuspenseWrapper>} />
          <Route path="/teacher/workspace" element={<SuspenseWrapper><TeacherWorkspaceDashboard /></SuspenseWrapper>} />
          <Route path="/teacher/self-service" element={<SuspenseWrapper><TeacherSelfServicePage /></SuspenseWrapper>} />
          <Route path="/teacher/lesson-tracker" element={<SuspenseWrapper><LessonDeliveryTrackerPage /></SuspenseWrapper>} />
          <Route path="/teacher/intervention-tracker" element={<SuspenseWrapper><StudentInterventionTrackerPage /></SuspenseWrapper>} />
          <Route path="/teacher/ptm-center" element={<SuspenseWrapper><PTMCenterPage /></SuspenseWrapper>} />
          <Route path="/teacher/substitution" element={<SuspenseWrapper><SubstitutionInvigilationPage /></SuspenseWrapper>} />
          <Route path="/teacher/continuity" element={<SuspenseWrapper><LearningContinuityWorkspacePage /></SuspenseWrapper>} />
          <Route path="/teacher/lesson-planner" element={<SuspenseWrapper><LessonPlanner /></SuspenseWrapper>} />
          <Route path="/teacher/classes" element={<SuspenseWrapper><MyClasses /></SuspenseWrapper>} />
          <Route path="/teacher/my-subjects" element={<SuspenseWrapper><MySubjects /></SuspenseWrapper>} />
          <Route path="/teacher/timetable-viewer" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/teacher/marks" element={<SuspenseWrapper><MarksEntry /></SuspenseWrapper>} />
          <Route path="/teacher/lesson-delivery" element={<SuspenseWrapper><LessonDeliveryTrackerPage /></SuspenseWrapper>} />
          <Route path="/teacher/interventions" element={<SuspenseWrapper><StudentInterventionTrackerPage /></SuspenseWrapper>} />
          <Route path="/teacher/projects/create" element={<SuspenseWrapper><CreateProject /></SuspenseWrapper>} />
          <Route path="/teacher/mcq-exams" element={<SuspenseWrapper><McqExamList /></SuspenseWrapper>} />
          <Route path="/teacher/mcq-exams/new" element={<SuspenseWrapper><McqExamForm /></SuspenseWrapper>} />
          <Route path="/teacher/mcq-exams/create" element={<SuspenseWrapper><McqExamForm /></SuspenseWrapper>} />
          <Route path="/teacher/mcq-exams/:id" element={<SuspenseWrapper><McqExamForm /></SuspenseWrapper>} />
          <Route path="/teacher/mcq-results/:id" element={<SuspenseWrapper><McqExamResults /></SuspenseWrapper>} />
          <Route path="/teacher/substitutions" element={<SuspenseWrapper><SubstitutionInvigilationPage /></SuspenseWrapper>} />
          <Route path="/teacher/learning-continuity" element={<SuspenseWrapper><LearningContinuityWorkspacePage /></SuspenseWrapper>} />
          <Route path="/teacher/behaviour" element={<SuspenseWrapper><BehaviourLog /></SuspenseWrapper>} />
          <Route path="/teacher/activities" element={<SuspenseWrapper><ActivityLog /></SuspenseWrapper>} />
          <Route path="/teacher/library" element={<SuspenseWrapper><MyLibraryShared /></SuspenseWrapper>} />
          <Route path="/teacher/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
          <Route path="/teacher/behaviour-log" element={<SuspenseWrapper><BehaviourLog /></SuspenseWrapper>} />
          <Route path="/teacher/activity-log" element={<SuspenseWrapper><ActivityLog /></SuspenseWrapper>} />
          <Route path="/teacher/class-behaviour/:id" element={<SuspenseWrapper><ClassBehaviourReport /></SuspenseWrapper>} />
        </Route>

        {/* ===== STUDENT ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<SuspenseWrapper><StudentDashboard /></SuspenseWrapper>} />
          <Route path="/student/marks" element={<SuspenseWrapper><StudentMarks /></SuspenseWrapper>} />
          <Route path="/student/attendance" element={<SuspenseWrapper><StudentAttendanceView /></SuspenseWrapper>} />
          <Route path="/student/assignments" element={<SuspenseWrapper><StudentAssignments /></SuspenseWrapper>} />
          <Route path="/student/timetable" element={<SuspenseWrapper><Timetable /></SuspenseWrapper>} />
          <Route path="/student/lab-dashboard" element={<SuspenseWrapper><StudentLabDashboard /></SuspenseWrapper>} />
          <Route path="/student/practical-marks" element={<SuspenseWrapper><StudentPracticalMarks /></SuspenseWrapper>} />
          <Route path="/student/projects" element={<SuspenseWrapper><StudentProjects /></SuspenseWrapper>} />
          <Route path="/student/project-submit" element={<SuspenseWrapper><ProjectSubmit /></SuspenseWrapper>} />
          <Route path="/student/my-submissions" element={<SuspenseWrapper><StudentMySubmissions /></SuspenseWrapper>} />
          <Route path="/student/exams" element={<SuspenseWrapper><StudentExams /></SuspenseWrapper>} />
          <Route path="/student/report-cards" element={<SuspenseWrapper><ReportCard /></SuspenseWrapper>} />
          <Route path="/student/submit-assignment" element={<SuspenseWrapper><SubmitAssignment /></SuspenseWrapper>} />
          <Route path="/student/weather" element={<SuspenseWrapper><StudentWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/student/workflow" element={<SuspenseWrapper><StudentWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/student/ptm-center" element={<SuspenseWrapper><StudentPTMCenter /></SuspenseWrapper>} />
          <Route path="/student/gate-pass" element={<SuspenseWrapper><StudentGatePassCenter /></SuspenseWrapper>} />
          <Route path="/student/mess-menu" element={<SuspenseWrapper><MessMenu /></SuspenseWrapper>} />
          <Route path="/student/hostel-application" element={<SuspenseWrapper><HostelApplication /></SuspenseWrapper>} />
          <Route path="/student/visitor-request" element={<SuspenseWrapper><VisitorRequest /></SuspenseWrapper>} />
          <Route path="/student/hostel-leave" element={<SuspenseWrapper><HostelLeave /></SuspenseWrapper>} />
          <Route path="/student/hostel-complaints" element={<SuspenseWrapper><HostelComplaints /></SuspenseWrapper>} />
          <Route path="/student/mcq-available" element={<SuspenseWrapper><McqAvailable /></SuspenseWrapper>} />
          <Route path="/student/take-mcq/:id" element={<SuspenseWrapper><TakeMcq /></SuspenseWrapper>} />
          <Route path="/student/mcq-result/:id" element={<SuspenseWrapper><McqResult /></SuspenseWrapper>} />
          <Route path="/student/my-behaviour" element={<SuspenseWrapper><MyBehaviour /></SuspenseWrapper>} />
          <Route path="/student/workflows" element={<SuspenseWrapper><StudentWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/student/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/student/calendar" element={<SuspenseWrapper><CalendarViewShared /></SuspenseWrapper>} />
          <Route path="/student/report-card" element={<SuspenseWrapper><ReportCard /></SuspenseWrapper>} />
          <Route path="/student/timetable-viewer" element={<SuspenseWrapper><TimetableFullView /></SuspenseWrapper>} />
          <Route path="/student/submissions" element={<SuspenseWrapper><StudentMySubmissions /></SuspenseWrapper>} />
          <Route path="/student/mcq-exams" element={<SuspenseWrapper><McqAvailable /></SuspenseWrapper>} />
          <Route path="/student/fees" element={<SuspenseWrapper><FeePortalShared /></SuspenseWrapper>} />
          <Route path="/student/library" element={<SuspenseWrapper><MyLibraryShared /></SuspenseWrapper>} />
          <Route path="/student/transport" element={<SuspenseWrapper><MyTransportShared /></SuspenseWrapper>} />
          <Route path="/student/hostel" element={<SuspenseWrapper><HostelApplication /></SuspenseWrapper>} />
          <Route path="/student/hostel-visitor" element={<SuspenseWrapper><VisitorRequest /></SuspenseWrapper>} />
          <Route path="/student/gate-passes" element={<SuspenseWrapper><StudentGatePassCenter /></SuspenseWrapper>} />
          <Route path="/student/behaviour" element={<SuspenseWrapper><MyBehaviour /></SuspenseWrapper>} />
          <Route path="/student/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
        </Route>

        {/* ===== PARENT ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route path="/parent/dashboard" element={<SuspenseWrapper><ParentDashboard /></SuspenseWrapper>} />
          <Route path="/parent/child-progress" element={<SuspenseWrapper><ChildProgress /></SuspenseWrapper>} />
          <Route path="/parent/announcements" element={<SuspenseWrapper><ParentAnnouncements /></SuspenseWrapper>} />
          <Route path="/parent/children" element={<SuspenseWrapper><ChildrenList /></SuspenseWrapper>} />
          <Route path="/parent/progress" element={<SuspenseWrapper><ParentProgress /></SuspenseWrapper>} />
          <Route path="/parent/report-cards" element={<SuspenseWrapper><ParentReportCards /></SuspenseWrapper>} />
          <Route path="/parent/weather" element={<SuspenseWrapper><ParentWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/parent/weather-safety" element={<SuspenseWrapper><ParentWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/parent/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/parent/calendar" element={<SuspenseWrapper><CalendarViewShared /></SuspenseWrapper>} />
          <Route path="/parent/workflow" element={<SuspenseWrapper><ParentWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/parent/workflows" element={<SuspenseWrapper><ParentWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/parent/ptm-center" element={<SuspenseWrapper><ParentPTMCenter /></SuspenseWrapper>} />
          <Route path="/parent/support-center" element={<SuspenseWrapper><ParentSupportCenter /></SuspenseWrapper>} />
          <Route path="/parent/security-center" element={<SuspenseWrapper><ParentSecurityCenter /></SuspenseWrapper>} />
          <Route path="/parent/hostel-overview" element={<SuspenseWrapper><HostelOverview /></SuspenseWrapper>} />
          <Route path="/parent/attendance" element={<SuspenseWrapper><ParentAttendanceView /></SuspenseWrapper>} />
          <Route path="/parent/child-behaviour" element={<SuspenseWrapper><ChildBehaviour /></SuspenseWrapper>} />
          <Route path="/parent/fees" element={<SuspenseWrapper><FeePortalShared /></SuspenseWrapper>} />
          <Route path="/parent/library" element={<SuspenseWrapper><MyLibraryShared /></SuspenseWrapper>} />
          <Route path="/parent/transport" element={<SuspenseWrapper><MyTransportShared /></SuspenseWrapper>} />
          <Route path="/parent/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
        </Route>

        {/* ===== WARDEN ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['warden']} />}>
          <Route path="/warden/dashboard" element={<SuspenseWrapper><WardenDashboard /></SuspenseWrapper>} />
          <Route path="/warden/workflow" element={<SuspenseWrapper><WardenWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/warden/workflows" element={<SuspenseWrapper><WardenWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/warden/hostel-weather" element={<SuspenseWrapper><HostelWeatherDashboard layoutRole="warden" /></SuspenseWrapper>} />
          <Route path="/warden/hostel-residents" element={<SuspenseWrapper skeletonType="table"><HostelResidents /></SuspenseWrapper>} />
          <Route path="/warden/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
          <Route path="/warden/ptm-center" element={<SuspenseWrapper><WardenPTMCenter /></SuspenseWrapper>} />
          <Route path="/warden/support-center" element={<SuspenseWrapper><WardenSupportCenter /></SuspenseWrapper>} />
          <Route path="/warden/security-center" element={<SuspenseWrapper><WardenSecurityCenter /></SuspenseWrapper>} />
          <Route path="/warden/visitor-management" element={<SuspenseWrapper><VisitorManagement /></SuspenseWrapper>} />
          <Route path="/warden/visitors" element={<SuspenseWrapper><VisitorManagement /></SuspenseWrapper>} />
          <Route path="/warden/leave-management" element={<SuspenseWrapper><LeaveManagement /></SuspenseWrapper>} />
          <Route path="/warden/leaves" element={<SuspenseWrapper><LeaveManagement /></SuspenseWrapper>} />
          <Route path="/warden/hostel-attendance" element={<SuspenseWrapper><HostelAttendance /></SuspenseWrapper>} />
          <Route path="/warden/attendance" element={<SuspenseWrapper><HostelAttendance /></SuspenseWrapper>} />
          <Route path="/warden/complaint-management" element={<SuspenseWrapper><ComplaintManagement /></SuspenseWrapper>} />
          <Route path="/warden/complaints" element={<SuspenseWrapper><ComplaintManagement /></SuspenseWrapper>} />
          <Route path="/warden/mess-menu" element={<SuspenseWrapper><MessMenuManagement /></SuspenseWrapper>} />
        </Route>

        {/* ===== LIBRARIAN ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['librarian']} />}>
          <Route path="/librarian/dashboard" element={<SuspenseWrapper><LibrarianDashboard /></SuspenseWrapper>} />
          <Route path="/librarian/weather" element={<SuspenseWrapper><LibrarianWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/librarian/books" element={<SuspenseWrapper><BookInventory /></SuspenseWrapper>} />
          <Route path="/librarian/library-dashboard" element={<SuspenseWrapper><LibraryDashboard /></SuspenseWrapper>} />
          <Route path="/librarian/issue-return" element={<SuspenseWrapper><IssueReturn /></SuspenseWrapper>} />
          <Route path="/librarian/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
        </Route>

        {/* ===== TRANSPORT ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['transport']} />}>
          <Route path="/transport/dashboard" element={<SuspenseWrapper><TransportDashboard /></SuspenseWrapper>} />
          <Route path="/transport/weather" element={<SuspenseWrapper><TransportWeatherDashboard /></SuspenseWrapper>} />
          <Route path="/transport/workflow" element={<SuspenseWrapper><TransportWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/transport/workflows" element={<SuspenseWrapper><TransportWorkflowDashboard /></SuspenseWrapper>} />
          <Route path="/transport/incident-center" element={<SuspenseWrapper><TransportIncidentCenter /></SuspenseWrapper>} />
          <Route path="/transport/incidents" element={<SuspenseWrapper><TransportIncidentCenter /></SuspenseWrapper>} />
          <Route path="/transport/operations" element={<SuspenseWrapper><TransportDashboard /></SuspenseWrapper>} />
          <Route path="/transport/roster" element={<SuspenseWrapper skeletonType="table"><TransportRoster /></SuspenseWrapper>} />
          <Route path="/transport/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
        </Route>

        {/* ===== SHARED ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport']} />}>
          <Route path="/chat" element={<SuspenseWrapper><ChatPage /></SuspenseWrapper>} />
          <Route path="/notifications" element={<SuspenseWrapper><NotificationInboxShared /></SuspenseWrapper>} />
          <Route path="/warden/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/librarian/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/transport/messages" element={<SuspenseWrapper><MessagesShared /></SuspenseWrapper>} />
          <Route path="/fee-portal" element={<SuspenseWrapper><FeePortalShared /></SuspenseWrapper>} />
          <Route path="/my-transport" element={<SuspenseWrapper><MyTransportShared /></SuspenseWrapper>} />
          <Route path="/profile" element={<SuspenseWrapper skeletonType="profile"><ProfileShared /></SuspenseWrapper>} />
        </Route>

        {/* ===== LIBRARY ALIAS ROUTES USED BY SIDEBAR ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'librarian']} />}>
          <Route path="/library" element={<Navigate to="/library/dashboard" replace />} />
          <Route path="/library/dashboard" element={<SuspenseWrapper><LibraryDashboard /></SuspenseWrapper>} />
          <Route path="/library/books" element={<SuspenseWrapper><BookInventory /></SuspenseWrapper>} />
          <Route path="/library/issue-return" element={<SuspenseWrapper><IssueReturn /></SuspenseWrapper>} />
        </Route>

        {/* ===== DOCUMENTS ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
          <Route path="/documents" element={<Navigate to="/documents/dashboard" replace />} />
          <Route path="/documents/dashboard" element={<SuspenseWrapper><DocumentDashboard /></SuspenseWrapper>} />
          <Route path="/documents/template-builder" element={<SuspenseWrapper><TemplateBuilder /></SuspenseWrapper>} />
          <Route path="/documents/id-card-generator" element={<SuspenseWrapper><IDCardGenerator /></SuspenseWrapper>} />
          <Route path="/documents/certificate-generator" element={<SuspenseWrapper><CertificateGenerator /></SuspenseWrapper>} />
          <Route path="/documents/fee-voucher-generator" element={<SuspenseWrapper><FeeVoucherGenerator /></SuspenseWrapper>} />
          <Route path="/documents/result-card-generator" element={<SuspenseWrapper><ResultCardGenerator /></SuspenseWrapper>} />
          <Route path="/documents/admit-card-generator" element={<SuspenseWrapper><AdmitCardGenerator /></SuspenseWrapper>} />
          <Route path="/documents/official-letters" element={<SuspenseWrapper><OfficialLetters /></SuspenseWrapper>} />
          <Route path="/documents/bulk-generator" element={<SuspenseWrapper><BulkDocumentGenerator /></SuspenseWrapper>} />
          <Route path="/documents/requests" element={<SuspenseWrapper><DocumentRequests /></SuspenseWrapper>} />
          <Route path="/documents/generated" element={<SuspenseWrapper><GeneratedDocumentsList /></SuspenseWrapper>} />
          <Route path="/documents/print-queue" element={<SuspenseWrapper><PrintQueue /></SuspenseWrapper>} />
        </Route>

        {/* ===== SAFETY ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student', 'parent']} />}>
          <Route path="/safety/admin" element={<SuspenseWrapper><AdminSafetyDashboard /></SuspenseWrapper>} />
          <Route path="/safety/student" element={<SuspenseWrapper><StudentSafetyCenter /></SuspenseWrapper>} />
          <Route path="/safety/parent" element={<SuspenseWrapper><ParentSafetyAlerts /></SuspenseWrapper>} />
          <Route path="/safety/teacher" element={<SuspenseWrapper><TeacherIncidentReports /></SuspenseWrapper>} />
          <Route path="/safety/emergency-contacts" element={<SuspenseWrapper><EmergencyContacts /></SuspenseWrapper>} />
        </Route>

        {/* ===== ATTENDANCE ROUTES ===== */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student', 'parent', 'warden', 'transport']} />}>
          <Route path="/attendance" element={<RoleRedirect to={getAttendanceHomePath} />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/attendance/admin" element={<SuspenseWrapper><AdminAttendanceDashboard /></SuspenseWrapper>} />
          <Route path="/attendance/reports" element={<SuspenseWrapper><AttendanceReports /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/attendance/teacher" element={<SuspenseWrapper><TeacherAttendancePage /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/attendance/student" element={<SuspenseWrapper><StudentAttendanceView /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route path="/attendance/parent" element={<SuspenseWrapper><ParentAttendanceView /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['warden']} />}>
          <Route path="/attendance/hostel" element={<SuspenseWrapper><HostelAttendancePage /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['transport']} />}>
          <Route path="/attendance/transport" element={<SuspenseWrapper><TransportAttendancePage /></SuspenseWrapper>} />
        </Route>

        {/* Verify Document (public) */}
        <Route path="/verify/:code" element={<SuspenseWrapper><VerifyDocument /></SuspenseWrapper>} />
        <Route path="/verify" element={<SuspenseWrapper><VerifyDocument /></SuspenseWrapper>} />

        {/* Fallback */}
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
