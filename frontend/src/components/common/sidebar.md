import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiActivity, FiAward, FiBarChart2, FiBell, FiBook, FiBookOpen,
  FiCalendar, FiCheckSquare, FiChevronDown, FiClipboard, FiClock,
  FiDollarSign, FiFileText, FiFolder, FiGrid, FiHome, FiLogOut,
  FiMessageSquare, FiMonitor, FiCreditCard, FiSettings, FiUser,
  FiUserCheck, FiUsers, FiZap, FiChevronLeft, FiChevronRight,
  FiTruck, FiUserX, FiUserPlus, FiTrendingUp, FiShield, FiCoffee, FiAlertCircle,
  FiMoreHorizontal, FiSearch, FiX, FiCheckCircle, FiAlertTriangle, FiCloud,FiCamera,
} from 'react-icons/fi';
import { FaFileInvoiceDollar } from 'react-icons/fa';
import { MdOutlinePendingActions } from 'react-icons/md';
import { TbAlertCircle } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

// ═══════════════════════════════════════════════════════════════════
// PREMIUM LIGHT THEME COLOR PALETTE
// Soft whites, gentle grays, airy accents — truly professional
// ═══════════════════════════════════════════════════════════════════
const groupColors = {
  'Main':               { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-l-blue-500', dot: 'bg-blue-500' },
  'Academic Management':{ bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600', border: 'border-l-indigo-500', dot: 'bg-indigo-500' },
  'Admissions':         { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-l-amber-500', dot: 'bg-amber-500' },
  'Scheduling':         { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  'Curriculum Management':{ bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600', border: 'border-l-purple-500', dot: 'bg-purple-500' },
  'Lab & Projects':     { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600', border: 'border-l-cyan-500', dot: 'bg-cyan-500' },
  'Finance':            { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-600', border: 'border-l-rose-500', dot: 'bg-rose-500' },
  'Reports':            { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-l-violet-500', dot: 'bg-violet-500' },
  'System':             { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600', border: 'border-l-slate-500', dot: 'bg-slate-500' },
  'Library':            { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  'Transport':          { bg: 'bg-lime-50', text: 'text-lime-700', icon: 'text-lime-600', border: 'border-l-lime-500', dot: 'bg-lime-500' },
  'ID & Certificates':  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'text-fuchsia-600', border: 'border-l-fuchsia-500', dot: 'bg-fuchsia-500' },
  'Hostel Management':  { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600', border: 'border-l-yellow-500', dot: 'bg-yellow-500' },
  'Weather Intelligence': { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-600', border: 'border-l-sky-500', dot: 'bg-sky-500' },
  'HR & Payroll':      { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  'Inventory & Procurement': { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600', border: 'border-l-cyan-500', dot: 'bg-cyan-500' },
  'Admin Operations':  { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-600', border: 'border-l-teal-500', dot: 'bg-teal-500' },
  'Accounts & General Ledger': { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-600', border: 'border-l-rose-500', dot: 'bg-rose-500' },
  'Medical & Clinic':   { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-l-red-500', dot: 'bg-red-500' },
  'Gate Pass & Security': { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600', border: 'border-l-slate-500', dot: 'bg-slate-500' },
  // Role‑specific
  'Teaching':           { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600', border: 'border-l-green-500', dot: 'bg-green-500' },
  'Teacher Operations': { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-l-violet-500', dot: 'bg-violet-500' },
  'Academics':          { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-600', border: 'border-l-teal-500', dot: 'bg-teal-500' },
  'Student Workflow':   { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-l-violet-500', dot: 'bg-violet-500' },
  'Lab & Practical':    { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-600', border: 'border-l-sky-500', dot: 'bg-sky-500' },
  'My Children':        { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-600', border: 'border-l-pink-500', dot: 'bg-pink-500' },
  'Family Workflow':    { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-600', border: 'border-l-rose-500', dot: 'bg-rose-500' },
  'Account':            { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600', border: 'border-l-gray-500', dot: 'bg-gray-500' },
  'Warden':             { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-l-red-500', dot: 'bg-red-500' },
  'Resident Workflow':  { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  'Transport Workflow': { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-600', border: 'border-l-teal-500', dot: 'bg-teal-500' },
};
const getGroupColor = (title) => groupColors[title] || { 
  bg: 'bg-gray-50', 
  text: 'text-gray-700', 
  icon: 'text-gray-600', 
  border: 'border-l-gray-500', 
  dot: 'bg-gray-500' 
};

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION GROUPS (100% PRESERVED FROM ORIGINAL)
// ═══════════════════════════════════════════════════════════════════
const adminGroups = [
    {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/admin/chat-analytics', label: 'Chat Analytics', icon: FiBarChart2 },
      { to: '/admin/weather', label: 'Weather Intelligence', icon: FiCloud },
      { to: '/admin/safety-dashboard', label: 'Safety Dashboard', icon: FiAlertTriangle },
      { to: '/admin/attendance', label: 'Attendance Dashboard', icon: FiCheckSquare },
      { to: '/admin/attendance/reports', label: 'Attendance Reports', icon: FiFileText },
      { to: '/admin/attendance/transport', label: 'Transport Attendance', icon: FiTruck },
      { to: '/admin/attendance/hostel', label: 'Hostel Attendance', icon: FiHome },
      { to: '/admin/announcements', label: 'Announcements', icon: FiBell },
      { to: '/admin/messages', label: 'Messages', icon: FiMessageSquare },
      { to: '/admin/calendar', label: 'Academic Calendar', icon: FiCalendar },
      { to: '/admin/face-login', label: 'Face Login', icon: FiCamera },
     
      
      
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
    ],
      
  },
  {
    title: 'Weather Intelligence',
    icon: FiCloud,
    links: [
      { to: '/admin/weather', label: 'Admin Weather Dashboard', icon: FiHome },
      { to: '/admin/weather/live', label: 'Live Weather Center', icon: FiActivity },
      { to: '/admin/weather/forecast', label: 'Forecast Center', icon: FiCalendar },
      { to: '/admin/weather/aqi', label: 'AQI Monitoring', icon: FiAlertCircle },
      { to: '/admin/weather/alerts', label: 'Weather Alerts', icon: FiBell },
      { to: '/admin/weather/analytics', label: 'Weather Analytics', icon: FiBarChart2 },
      { to: '/admin/weather/history', label: 'Weather History', icon: FiClock },
      { to: '/admin/weather/impact', label: 'Impact Analysis', icon: FiTrendingUp },
      { to: '/admin/weather/attendance-impact', label: 'Attendance vs Weather', icon: FiCheckSquare },
      { to: '/admin/weather/lms-impact', label: 'LMS vs Weather', icon: FiBookOpen },
      { to: '/admin/weather/transport', label: 'Transport Weather', icon: FiTruck },
      { to: '/admin/weather/hostel', label: 'Hostel Weather', icon: FiHome },
      { to: '/admin/weather/reports', label: 'Weather Reports', icon: FiFileText },
      { to: '/admin/weather/settings', label: 'Weather Settings', icon: FiSettings },
      { to: '/admin/weather/system-health', label: 'System Health', icon: FiMonitor },
    ],
  },
  {
    title: 'Academic Management',
    icon: FiBookOpen,
    links: [
      { to: '/admin/classes', label: 'Classes', icon: FiBook },
      { to: '/admin/subjects', label: 'Subjects', icon: FiBook },
      { to: '/admin/students', label: 'Students', icon: FiUsers },
      { to: '/admin/teachers', label: 'Teachers', icon: FiUserCheck },
      { to: '/admin/parents', label: 'Parents', icon: FiUsers },
      { to: '/admin/promotion', label: 'Promotion', icon: FiTrendingUp },
      { to: '/admin/exams', label: 'Exams', icon: FiAward },
    ],
  },
  {
    title: 'Admissions',
    icon: FiUserPlus,
    links: [
      { to: '/admin/admissions', label: 'Admissions', icon: FiUserPlus },
    ],
  },
  {
    title: 'Scheduling',
    icon: FiClock,
    links: [
      { to: '/admin/timetable-viewer', label: 'Full Timetable', icon: FiClock },
      { to: '/admin/timetable', label: 'Timetable Designer', icon: FiClock },
      { to: '/admin/timetable-generator', label: 'Auto‑Generate', icon: FiZap },
      { to: '/admin/weekly-load', label: 'Weekly Load', icon: FiBook },
      { to: '/admin/teacher-availability', label: 'Teacher Availability', icon: FiUserCheck },
      { to: '/admin/rooms', label: 'Rooms', icon: FiHome },
      { to: '/admin/substitutions', label: 'Substitutions', icon: FiUserX },
      { to: '/admin/special-schedules', label: 'Special Schedules', icon: FiClock },
      { to: '/admin/default-load', label: 'Default Load Config', icon: FiSettings },
      { to: '/admin/timetable-reports', label: 'Timetable Reports', icon: FiFileText },
    ],
  },
  {
    title: 'Curriculum Management',
    icon: FiBookOpen,
    links: [
      { to: '/admin/curriculum-builder', label: 'Curriculum Builder', icon: FiBookOpen },
      { to: '/admin/syllabus', label: 'Syllabus Planner', icon: FiFileText },
      { to: '/admin/course-coverage', label: 'Course Coverage', icon: FiBarChart2 },
    ],
  },
  {
    title: 'Lab & Projects',
    icon: FiMonitor,
    links: [
      { to: '/admin/labs', label: 'Labs', icon: FiMonitor },
      { to: '/admin/lab-sessions', label: 'Lab Sessions', icon: FiCalendar },
    ],
  },
  {
    title: 'Library',
    icon: FiBook,
    links: [
      { to: '/library/dashboard', label: 'Library Dashboard', icon: FiHome },
      { to: '/library/books', label: 'Book Inventory', icon: FiBook },
      { to: '/library/issue-return', label: 'Issue / Return', icon: FiBook },
    ],
  },
  {
    title: 'Transport',
    icon: FiTruck,
    links: [
      { to: '/admin/transport', label: 'Transport', icon: FiTruck },
      { to: '/admin/transport-roster', label: 'Roster & Trips', icon: FiCalendar },
    ],
  },
  {
    title: 'Finance',
    icon: FiDollarSign,
    links: [
      { to: '/admin/fee-heads', label: 'Fee Heads', icon: FiDollarSign },
      { to: '/admin/class-fee-plans', label: 'Class Fee Plans', icon: FiBook },
      { to: '/admin/student-fee-accounts', label: 'Student Accounts', icon: FiUsers },
      { to: '/admin/reports/outstanding', label: 'Outstanding Fees', icon: MdOutlinePendingActions },
      { to: '/admin/reports/collection', label: 'Collection Summary', icon: FaFileInvoiceDollar },
      { to: '/admin/reports/defaulters', label: 'Defaulter List', icon: TbAlertCircle },
    ],
  },
  {
    title: 'Accounts & General Ledger',
    icon: FiCreditCard,
    links: [
      { to: '/admin/accounts-ledger', label: 'Accounts Dashboard', icon: FiHome },
      { to: '/admin/accounts-ledger/accounts', label: 'Chart of Accounts', icon: FiFolder },
      { to: '/admin/accounts-ledger/vouchers', label: 'Vouchers', icon: FiClipboard },
      { to: '/admin/accounts-ledger/statements', label: 'Statements', icon: FiFileText },
    ],
  },
  {
    title: 'HR & Payroll',
    icon: FiUserCheck,
    links: [
      { to: '/admin/hr-payroll', label: 'HR & Payroll Dashboard', icon: FiHome },
      { to: '/admin/hr-payroll/staff', label: 'Staff Directory', icon: FiUsers },
      { to: '/admin/hr-payroll/attendance', label: 'Staff Attendance', icon: FiCheckSquare },
      { to: '/admin/hr-payroll/leave', label: 'Leave Center', icon: FiCalendar },
      { to: '/admin/hr-payroll/payroll', label: 'Payroll Center', icon: FiDollarSign },
      { to: '/admin/hr-payroll/reports', label: 'HR Reports', icon: FiFileText },
    ],
  },
  {
    title: 'Inventory & Procurement',
    icon: FiClipboard,
    links: [
      { to: '/admin/inventory', label: 'Inventory Dashboard', icon: FiHome },
      { to: '/admin/inventory/items', label: 'Stock Items', icon: FiFolder },
      { to: '/admin/inventory/procurement', label: 'Vendors & Purchase', icon: FiTruck },
      { to: '/admin/inventory/store', label: 'Store Issue / Return', icon: FiActivity },
      { to: '/admin/inventory/maintenance', label: 'Maintenance Logs', icon: FiAlertTriangle },
      { to: '/admin/inventory/reports', label: 'Inventory Reports', icon: FiFileText },
    ],
  },
  {
    title: 'Admin Operations',
    icon: FiActivity,
    links: [
      { to: '/admin/operations', label: 'Operations Dashboard', icon: FiHome },
      { to: '/admin/operations/budgeting', label: 'Budget Control', icon: FiDollarSign },
      { to: '/admin/operations/approvals', label: 'Approvals Engine', icon: FiCheckSquare },
      { to: '/admin/operations/compliance', label: 'Compliance Center', icon: FiFileText },
      { to: '/admin/operations/clinic', label: 'Clinic Ops', icon: FiActivity },
      { to: '/admin/operations/security', label: 'Security Ops', icon: FiShield },
      { to: '/admin/operations/staff-oversight', label: 'Staff Oversight', icon: FiUsers },
      { to: '/admin/operations/bi-center', label: 'BI Center', icon: FiBarChart2 },
      { to: '/admin/operations/principal-command', label: 'Principal Command', icon: FiAward },
    ],
  },
  {
    title: 'Medical & Clinic',
    icon: FiActivity,
    links: [
      { to: '/admin/medical-clinic', label: 'Clinic Dashboard', icon: FiHome },
      { to: '/admin/medical-clinic/profiles', label: 'Medical Profiles', icon: FiUsers },
      { to: '/admin/medical-clinic/visits', label: 'Clinic Visits', icon: FiActivity },
      { to: '/admin/medical-clinic/medicines', label: 'Medicines & Incidents', icon: FiAlertCircle },
    ],
  },
  {
    title: 'ID & Certificates',
    icon: FiCreditCard,
    links: [
      { to: '/admin/id-cards', label: 'ID Card Generator', icon: FiCreditCard },
      { to: '/admin/certificates', label: 'Certificates', icon: FiFileText },
    ],
  },
  {
    title: 'Hostel Management',
    icon: FiHome,
    links: [
      { to: '/admin/hostels', label: 'Hostel Management', icon: FiHome },
      { to: '/admin/hostel-analytics', label: 'Hostel Command Center', icon: FiBarChart2 },
      { to: '/admin/hostel-residents', label: 'Residents', icon: FiUsers },
      { to: '/admin/hostel-applications', label: 'Applications', icon: FiUserPlus },
    ],
  },
  {
    title: 'Gate Pass & Security',
    icon: FiShield,
    links: [
      { to: '/admin/security-gate', label: 'Security Dashboard', icon: FiHome },
      { to: '/admin/security-gate/visitors', label: 'Campus Visitors', icon: FiUsers },
      { to: '/admin/security-gate/passes', label: 'Gate Passes', icon: FiCheckSquare },
      { to: '/admin/security-gate/vehicles', label: 'Vehicle Gate Logs', icon: FiTruck },
      { to: '/admin/security-gate/notices', label: 'Security Notices', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'Reports',
    icon: FiBarChart2,
    links: [
      { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
      { to: '/admin/test-report', label: 'Test Report', icon: FiDollarSign },
    ],
  },
  {
    title: 'System',
    icon: FiSettings,
    links: [
      { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
      { to: '/admin/audit', label: 'Audit Center', icon: FiActivity },
      { to: '/admin/users', label: 'User Management', icon: FiUsers },
      { to: '/admin/school-settings', label: 'School Profile', icon: FiSettings },
      { to: '/admin/school-timings', label: 'School Timings', icon: FiClock },
      { to: '/admin/behaviour', label: 'Behaviour Dashboard', icon: FiBarChart2 },
      { to: '/admin/profile', label: 'My Profile', icon: FiUser },
      { to: '/admin/theme-settings', label: 'Theme Settings', icon: FiSettings },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];const teacherGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/teacher/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/teacher/weather', label: 'Weather', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
      { to: '/teacher/messages', label: 'Messages', icon: FiMessageSquare },
      { to: '/teacher/calendar', label: 'School Calendar', icon: FiCalendar },
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
      { to: '/teacher/library', label: 'My Library', icon: FiBook },
    ],
  },
  {
    title: 'Teaching',
    icon: FiBookOpen,
    links: [
      { to: '/teacher/classes', label: 'My Classes', icon: FiBook },
      { to: '/teacher/behaviour', label: 'Behaviour Log', icon: FiClipboard },
      { to: '/teacher/timetable-viewer', label: 'Full Timetable', icon: FiClock },
      { to: '/teacher/mcq-exams', label: 'MCQ Exams', icon: FiCheckSquare },
      { to: '/teacher/attendance', label: 'Attendance', icon: FiCheckSquare },
      { to: '/teacher/marks', label: 'Marks Entry', icon: FiClipboard },
      { to: '/teacher/assignments', label: 'Assignments', icon: FiFileText },
      { to: '/teacher/exams', label: 'Exams', icon: FiAward },
      { to: '/teacher/my-subjects', label: 'My Subjects', icon: FiBook },
      { to: '/teacher/activities', label: 'Activities', icon: FiAward },
      { to: '/teacher/lesson-planner', label: 'Lesson Planner', icon: FiBookOpen },
    ],
  },
  {
    title: 'Lab & Projects',
    icon: FiMonitor,
    links: [
      { to: '/teacher/lab', label: 'Lab Dashboard', icon: FiMonitor },
      { to: '/teacher/projects', label: 'Projects', icon: FiFolder },
    ],
  },
  {
    title: 'Teacher Operations',
    icon: FiClipboard,
    links: [
      { to: '/teacher/workspace', label: 'Workspace', icon: FiHome },
      { to: '/teacher/self-service', label: 'HR Self-Service', icon: FiUserCheck },
      { to: '/teacher/lesson-delivery', label: 'Lesson Delivery', icon: FiClipboard },
      { to: '/teacher/interventions', label: 'Interventions', icon: FiAlertCircle },
      { to: '/teacher/ptm-center', label: 'PTM Center', icon: FiUsers },
      { to: '/teacher/substitutions', label: 'Substitution Center', icon: FiClock },
      { to: '/teacher/learning-continuity', label: 'Learning Continuity', icon: FiZap },
    ],
  },
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/teacher/profile', label: 'Profile', icon: FiUser },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];const studentGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/student/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/student/weather', label: 'My Weather', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
      { to: '/student/fees', label: 'My Fees', icon: FiDollarSign },
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
      { to: '/student/timetable-viewer', label: 'Full Timetable', icon: FiClock },
      { to: '/student/messages', label: 'Messages', icon: FiMessageSquare },
      { to: '/student/calendar', label: 'School Calendar', icon: FiCalendar },
      { to: '/student/library', label: 'My Library', icon: FiBook },
    ],
  },
  {
    title: 'Academics',
    icon: FiBookOpen,
    links: [
      { to: '/student/mcq-exams', label: 'MCQ Exams', icon: FiCheckSquare },
      { to: '/student/marks', label: 'Marks', icon: FiBarChart2 },
      { to: '/student/attendance', label: 'Attendance', icon: FiCalendar },
      { to: '/student/assignments', label: 'Assignments', icon: FiFileText },
      { to: '/student/exams', label: 'Exams', icon: FiAward },
      { to: '/student/timetable', label: 'My Timetable', icon: FiClock },
      { to: '/student/behaviour', label: 'My Behaviour', icon: FiAward },
      { to: '/student/report-card', label: 'Report Card', icon: FiAward },
    ],
  },
  {
    title: 'Lab & Practical',
    icon: FiMonitor,
    links: [
      { to: '/student/lab', label: 'Lab', icon: FiMonitor },
      { to: '/student/practical-marks', label: 'Practical Marks', icon: FiClipboard },
      { to: '/student/projects', label: 'Projects', icon: FiFolder },
      { to: '/student/submissions', label: 'Submissions', icon: FiFileText },
    ],
  },
  {
    title: 'Hostel',
    icon: FiHome,
    links: [
      { to: '/student/hostel', label: 'Hostel Portal', icon: FiHome },
      { to: '/student/hostel-leave', label: 'Leave', icon: FiCalendar },
      { to: '/student/hostel-complaints', label: 'Complaints', icon: FiAlertCircle },
      { to: '/student/mess-menu', label: 'Mess Menu', icon: FiCoffee },
      { to: '/student/hostel-visitor', label: 'Visitor', icon: FiUserPlus },
    ],
  },
  {
    title: 'Transport',
    icon: FiTruck,
    links: [
      { to: '/student/transport', label: 'My Transport', icon: FiTruck },
    ],
  },
  {
    title: 'Student Workflow',
    icon: FiActivity,
    links: [
      { to: '/student/workflows', label: 'Workflow Center', icon: FiHome },
      { to: '/student/ptm-center', label: 'PTM Center', icon: FiCalendar },
      { to: '/student/gate-passes', label: 'Gate Pass Tracker', icon: FiShield },
    ],
  },
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/student/profile', label: 'Profile', icon: FiUser },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];const parentGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/parent/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/parent/weather-safety', label: 'Child Weather Safety', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
      { to: '/parent/fees', label: 'My Fees', icon: FiDollarSign },
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
      { to: '/parent/timetable-viewer', label: 'Full Timetable', icon: FiClock },
      { to: '/parent/announcements', label: 'Announcements', icon: FiBell },
      { to: '/parent/messages', label: 'Messages', icon: FiMessageSquare },
      { to: '/parent/calendar', label: 'School Calendar', icon: FiCalendar },
    ],
  },
    {
    title: 'My Children',
    icon: FiUsers,
    links: [
      { to: '/parent/children', label: 'My Children', icon: FiUserCheck },
      { to: '/parent/attendance', label: 'Attendance', icon: FiCalendar },
      { to: '/parent/progress', label: 'Progress', icon: FiActivity },
      { to: '/parent/report-cards', label: 'Report Cards', icon: FiAward },
      { to: '/parent/library', label: 'My Library', icon: FiBook },
    ],
  },
  {
    title: 'Transport',
    icon: FiTruck,
    links: [
      { to: '/parent/transport', label: 'My Transport', icon: FiTruck },
    ],
  },
{
  title: 'Family Workflow',
  icon: FiActivity,
  links: [
    { to: '/parent/workflows', label: 'Workflow Center', icon: FiHome },
    { to: '/parent/ptm-center', label: 'PTM Center', icon: FiCalendar },
    { to: '/parent/support-center', label: 'Support & Clinic', icon: FiAlertCircle },
    { to: '/parent/security-center', label: 'Security Center', icon: FiShield },
  ],
},
{
  title: 'Hostel',
  icon: FiHome,
  links: [
    { to: '/parent/hostel-overview', label: 'Hostel Portal', icon: FiHome },
  ],
},
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/parent/profile', label: 'Profile', icon: FiUser },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];const librarianGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/librarian/dashboard', label: 'Library Dashboard', icon: FiHome },
      { to: '/librarian/weather', label: 'Weather', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
      { to: '/library/books', label: 'Book Inventory', icon: FiBook },
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
      { to: '/library/issue-return', label: 'Issue / Return', icon: FiBook },
    ],
  },
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/librarian/profile', label: 'My Profile', icon: FiUser },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];const wardenGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/warden/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/warden/hostel-weather', label: 'Hostel Weather', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
    ],
  },
  {
    title: 'Hostel',
    icon: FiHome,
    links: [
      { to: '/warden/attendance', label: 'Attendance', icon: FiClipboard },
      { to: '/warden/leaves', label: 'Leaves', icon: FiCalendar },
      { to: '/warden/hostel-residents', label: 'Residents', icon: FiUsers },
      { to: '/warden/complaints', label: 'Complaints', icon: FiAlertCircle },
      { to: '/warden/mess-menu', label: 'Mess Menu', icon: FiCoffee },
      { to: '/warden/visitors', label: 'Visitors', icon: FiUserPlus },
    ],
  },
  {
    title: 'Resident Workflow',
    icon: FiActivity,
    links: [
      { to: '/warden/workflows', label: 'Workflow Center', icon: FiHome },
      { to: '/warden/ptm-center', label: 'PTM View', icon: FiCalendar },
      { to: '/warden/support-center', label: 'Support & Clinic', icon: FiAlertCircle },
      { to: '/warden/security-center', label: 'Security Workflow', icon: FiShield },
    ],
  },
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/warden/profile', label: 'Profile', icon: FiUser },
      { to: '/face-enrollment', label: 'Face Setup', icon: FiCamera },
    ],
  },
];
const transportGroups = [
  {
    title: 'Main',
    icon: FiGrid,
    links: [
      { to: '/transport/dashboard', label: 'Dashboard', icon: FiHome },
      { to: '/transport/weather', label: 'Transport Weather', icon: FiCloud },
      { to: '/notifications', label: 'Notifications', icon: FiBell },
      { to: '/transport/operations', label: 'Fleet Operations', icon: FiTruck },
      { to: '/transport/roster', label: 'Roster & Trips', icon: FiCalendar },
      { to: '/chat', label: 'AI Chat', icon: FiMessageSquare },
    ],
  },
  {
    title: 'Transport',
    icon: FiTruck,
    links: [
      { to: '/transport/operations', label: 'Routes & Vehicles', icon: FiTruck },
      { to: '/transport/roster', label: 'Trip Sheet', icon: FiClipboard },
      { to: '/transport/weather', label: 'Route Weather', icon: FiCloud },
    ],
  },
  {
    title: 'Transport Workflow',
    icon: FiActivity,
    links: [
      { to: '/transport/workflows', label: 'Workflow Center', icon: FiHome },
      { to: '/transport/incidents', label: 'Incident & Delay Center', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'Account',
    icon: FiSettings,
    links: [
      { to: '/transport/profile', label: 'Profile', icon: FiUser },
    ],
  },
];
// ═══════════════════════════════════════════════════════════════════
// TOOLTIP COMPONENT — For collapsed sidebar hover states
// ═══════════════════════════════════════════════════════════════════
const SidebarTooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div
        className={`absolute z-[100] px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-xl pointer-events-none transition-all duration-200 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'
        } left-full ml-3`}
        style={{
          top: '50%',
          transform: `translateY(-50%) ${isVisible ? '' : 'translateX(4px)'}`,
        }}
      >
        {text}
        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-800 rotate-45" />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// FLOATING ACTION BUTTON — Quick access pill
// ═══════════════════════════════════════════════════════════════════
const FloatingToggle = ({ expanded, onToggle }) => (
  <button
    onClick={onToggle}
    className="absolute -right-3 top-20 hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-300 hover:shadow-lg shadow-md transition-all duration-300 z-50 group"
    title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
  >
    <div className="relative w-full h-full flex items-center justify-center">
      {expanded ? (
        <FiChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      ) : (
        <FiChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      )}
    </div>
    <div className="absolute inset-0 rounded-full bg-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </button>
);

// ═══════════════════════════════════════════════════════════════════
// USER PROFILE CARD — Premium avatar section
// ═══════════════════════════════════════════════════════════════════
const UserProfileCard = ({ user, expanded, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const avatarGradient = `bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600`;

  if (!expanded) {
    return (
      <SidebarTooltip text={`${user?.name || 'User'} — ${user?.role || 'Member'}`}>
        <div className="flex flex-col items-center gap-2 py-3">
          <button onClick={onLogout} className="relative group">
            <div className={`w-10 h-10 rounded-xl ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105`}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                avatarInitial
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          </button>
        </div>
      </SidebarTooltip>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 hover:bg-white border border-transparent hover:border-slate-200 transition-all duration-300 group shadow-sm hover:shadow-md"
      >
        <div className="relative">
          <div className={`w-11 h-11 rounded-xl ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105`}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
          <p className="text-[11px] text-slate-400 capitalize font-medium">{user?.role || 'Member'}</p>
        </div>

        <FiMoreHorizontal className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-200 ${
        isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}>
        <div className="p-2 space-y-0.5">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <FiUser className="w-4 h-4 text-slate-400" />
            Profile
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <FiSettings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// GROUP HEADER — Animated accordion header with micro-interactions
// ═══════════════════════════════════════════════════════════════════
const GroupHeader = ({ group, isOpen, isActive, onClick, expanded, linkCount }) => {
  const colors = getGroupColor(group.title);
  const [isHovered, setIsHovered] = useState(false);

  if (!expanded) {
    return (
      <SidebarTooltip text={group.title}>
        <button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative flex items-center justify-center w-full p-3 rounded-2xl transition-all duration-300 ${
            isActive 
              ? `${colors.bg} shadow-sm ring-1 ring-black/5` 
              : 'hover:bg-slate-50'
          }`}
        >
          <div className="relative">
            <group.icon 
              className={`w-6 h-6 transition-all duration-300 ${
                isActive ? colors.icon : 'text-slate-400',
                isHovered && !isActive ? 'text-slate-600 scale-110' : ''
              }`} 
            />
            {isActive && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${colors.dot} ring-2 ring-white`} />
            )}
          </div>
        </button>
      </SidebarTooltip>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center w-full px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
        isActive
          ? `${colors.bg} ${colors.text} shadow-sm ring-1 ring-black/[0.04]`
          : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800'
      }`}
    >
      {/* Active indicator line */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full transition-all duration-300 ${
        isActive ? colors.bg.replace('bg-', 'bg-').replace('50', '500') : 'bg-transparent'
      }`} />

      <div className="relative mr-3.5">
        <group.icon 
          className={`w-5 h-5 transition-all duration-300 ${
            isActive ? colors.icon : 'text-slate-400 group-hover:text-slate-600',
            isHovered && !isActive ? 'scale-110' : ''
          }`} 
        />
        {isActive && (
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.dot} ring-2 ring-white`} />
        )}
      </div>

      <span className="flex-1 text-left text-[13px] tracking-tight">{group.title}</span>

      {linkCount > 0 && (
        <span className="mr-2 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
          {linkCount}
        </span>
      )}

      <FiChevronDown 
        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════
// NAV LINK ITEM — Individual navigation link with premium styling
// ═══════════════════════════════════════════════════════════════════
const NavLinkItem = ({ link, isActive, colors, onClick, expanded }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!expanded) {
    return (
      <SidebarTooltip text={link.label}>
        <NavLink
          to={link.to}
          onClick={onClick}
          className={({ isActive: active }) =>
            `flex items-center justify-center w-full p-3 rounded-2xl transition-all duration-300 ${
              active 
                ? `${colors.bg} shadow-sm ring-1 ring-black/5` 
                : 'hover:bg-slate-50'
            }`
          }
        >
          <link.icon 
            className={`w-5 h-5 transition-all duration-300 ${
              isActive ? colors.icon : 'text-slate-400'
            }`} 
          />
        </NavLink>
      </SidebarTooltip>
    );
  }

  return (
    <NavLink
      to={link.to}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={({ isActive: active }) =>
        `relative flex items-center px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
          active
            ? `${colors.bg} ${colors.text} shadow-sm`
            : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-700'
        }`
      }
    >
      {/* Subtle left accent for active state */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full transition-all duration-300 ${
        isActive ? colors.dot : 'bg-transparent'
      }`} />

      <link.icon 
        className={`w-[18px] h-[18px] mr-3 transition-all duration-200 ${
          isActive ? colors.icon : 'text-slate-400 group-hover:text-slate-500',
          isHovered && !isActive ? 'scale-110' : ''
        }`} 
      />

      <span className="flex-1 truncate">{link.label}</span>

      {isActive && (
        <FiCheckCircle className={`w-3.5 h-3.5 ml-2 ${colors.icon} opacity-60`} />
      )}
    </NavLink>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SEARCH BAR — Quick filter for navigation items
// ═══════════════════════════════════════════════════════════════════
const SidebarSearch = ({ onSearch, expanded }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  if (!expanded) return null;

  return (
    <div className="px-3 mb-4">
      <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${
        isFocused 
          ? 'border-sky-300 bg-white shadow-sm ring-2 ring-sky-100' 
          : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300'
      }`}>
        <FiSearch className={`absolute left-3 w-4 h-4 transition-colors ${
          isFocused ? 'text-sky-500' : 'text-slate-400'
        }`} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Find menu..."
          className="w-full bg-transparent pl-9 pr-3 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 outline-none rounded-xl"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); onSearch(''); }}
            className="absolute right-2 p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <FiX className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION DIVIDER — Elegant separator with label
// ═══════════════════════════════════════════════════════════════════
const SectionDivider = ({ label, expanded }) => {
  if (!expanded) return <div className="mx-3 my-3 h-px bg-slate-200" />;

  return (
    <div className="flex items-center gap-3 px-4 my-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════
const Sidebar = ({ role, isOpen, onToggle, expanded = true, onExpandToggle, isDarkMode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navRef = useRef(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  let groups = [];
  if (role === 'admin') groups = adminGroups;
  else if (role === 'teacher') groups = teacherGroups;
  else if (role === 'student') groups = studentGroups;
  else if (role === 'parent') groups = parentGroups;
  else if (role === 'librarian') groups = librarianGroups;
  else if (role === 'warden') groups = wardenGroups;
  else if (role === 'transport') groups = transportGroups;

  // Filter groups based on search
  const filteredGroups = searchQuery 
    ? groups.map(group => ({
        ...group,
        links: group.links.filter(link => 
          link.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.links.length > 0)
    : groups;

  const activeGroup = groups.find(group =>
    group.links.some(link => link.to === location.pathname)
  );

  useEffect(() => {
    if (activeGroup && !searchQuery) {
      setOpenGroup(activeGroup.title);
    } else if (!activeGroup) {
      setOpenGroup(null);
    }
  }, [activeGroup?.title, searchQuery]);

  const handleGroupClick = (title) => {
    setOpenGroup(prev => (prev === title ? null : title));
  };

  useEffect(() => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector('.sidebar-active');
      if (activeLink) {
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  return (
    <aside
      className={`relative h-screen bg-white border-r border-slate-200/80 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        expanded ? 'w-[280px]' : 'w-[76px]'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Floating Toggle Button */}
      <FloatingToggle expanded={expanded} onToggle={onExpandToggle} />

      {/* Header / Logo Section */}
      <div className={`h-[72px] flex items-center border-b border-slate-100 transition-all duration-300 ${
        expanded ? 'px-5 gap-3' : 'px-3 justify-center'
      }`}>
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
            <img src={logo} alt="Fikr Smart" className="w-6 h-6 rounded-lg object-cover" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
        </div>

        {expanded && (
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-slate-800 tracking-tight truncate">
              Fikr Smart
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              School Management
            </p>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <SidebarSearch onSearch={setSearchQuery} expanded={expanded} />

      {/* Navigation Groups */}
      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1 custom-scrollbar">
        {filteredGroups.map((group, groupIndex) => {
          const isOpen = openGroup === group.title;
          const isActiveGroup = activeGroup?.title === group.title;
          const colors = getGroupColor(group.title);
          const hasLinks = group.links && group.links.length > 0;

          return (
            <div 
              key={group.title} 
              className="mb-1"
              style={{
                animation: `slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${groupIndex * 0.05}s both`
              }}
            >
              <GroupHeader
                group={group}
                isOpen={isOpen}
                isActive={isActiveGroup}
                onClick={() => handleGroupClick(group.title)}
                expanded={expanded}
                linkCount={group.links?.length || 0}
              />

              {/* Collapsible Links */}
              {expanded && hasLinks && (
                <div
                  className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {group.links.map((link, linkIndex) => (
                    <div
                      key={link.to}
                      style={{
                        animation: isOpen ? `slideInLeft 0.3s ease-out ${linkIndex * 0.03}s both` : 'none'
                      }}
                    >
                      <NavLinkItem
                        link={link}
                        isActive={location.pathname === link.to}
                        colors={colors}
                        onClick={onToggle}
                        expanded={expanded}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsed state: show active link tooltip */}
              {!expanded && isActiveGroup && group.links?.map(link => (
                location.pathname === link.to ? (
                  <SidebarTooltip key={link.to} text={link.label}>
                    <NavLink
                      to={link.to}
                      onClick={onToggle}
                      className="flex items-center justify-center w-full p-2.5 mt-1 rounded-xl bg-slate-50 shadow-sm ring-1 ring-black/5"
                    >
                      <link.icon className={`w-5 h-5 ${colors.icon}`} />
                    </NavLink>
                  </SidebarTooltip>
                ) : null
              ))}
            </div>
          );
        })}

        {filteredGroups.length === 0 && expanded && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FiSearch className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">No menus found</p>
            <p className="text-xs text-slate-300 mt-1">Try a different search</p>
          </div>
        )}
      </nav>

      {/* Section Divider */}
      <SectionDivider label="Account" expanded={expanded} />

      {/* User Profile */}
      <div className={`p-3 transition-all duration-300 ${
        expanded ? '' : 'flex justify-center'
      }`}>
        <UserProfileCard 
          user={user} 
          expanded={expanded} 
          onLogout={logout}
        />
      </div>

      {/* Bottom Status Bar */}
      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium">Online</span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono">v2.0.1</span>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
