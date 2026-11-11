import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiAward, FiBarChart2, FiBell, FiBook, FiBookOpen,
  FiCalendar, FiCheckSquare, FiChevronDown, FiClipboard, FiClock,
  FiDollarSign, FiFileText, FiFolder, FiGitBranch, FiGrid, FiHome, FiLogOut,
  FiMessageSquare, FiMonitor, FiCreditCard, FiSettings, FiUser,
  FiUserCheck, FiUsers, FiZap, FiChevronLeft, FiChevronRight,
  FiTruck, FiUserX, FiUserPlus, FiTrendingUp, FiShield, FiCoffee, FiAlertCircle,
  FiMoreHorizontal, FiSearch, FiX, FiCheckCircle, FiAlertTriangle, FiCloud, FiCamera,
  FiStar, FiBookmark, FiCommand, FiExternalLink, FiRefreshCw, FiSun, FiMoon,
  FiMaximize2, FiMinimize2, FiMenu, FiArrowRight, FiArrowLeft,
} from 'react-icons/fi';
import { FaFileInvoiceDollar, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { 
  MdOutlinePendingActions, MdSpeed, MdWorkspacePremium, MdDashboard,
  MdSchool, MdAttachMoney, MdLibraryBooks, MdLocalHospital
} from 'react-icons/md';
import { TbAlertCircle } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const SIDEBAR_WIDTHS = {
  expanded: 288,
  collapsed: 80,
  mobile: 0,
};

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1440,
};

const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
};

const STORAGE_KEYS = {
  favorites: 'sidebar_favorites',
  openGroups: 'sidebar_open_groups',
  collapsed: 'sidebar_collapsed',
  clickHistory: 'sidebar_click_history',
  theme: 'sidebar_theme',
  recentPages: 'sidebar_recent_pages',
  pinnedItems: 'sidebar_pinned_items',
  userPreferences: 'sidebar_user_preferences',
};

// ═══════════════════════════════════════════════════════════════════
// COLOR SYSTEM - Professional & Accessible
// ═══════════════════════════════════════════════════════════════════

const colorSystem = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

const groupColorMap = {
  'Main': {
    light: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', accent: 'bg-blue-500', border: 'border-blue-500', hover: 'hover:bg-blue-100', ring: 'ring-blue-200' },
    dark: { bg: 'bg-blue-900/20', text: 'text-blue-300', icon: 'text-blue-400', accent: 'bg-blue-400', border: 'border-blue-400', hover: 'hover:bg-blue-900/30', ring: 'ring-blue-800' },
    gradient: 'from-blue-500 to-indigo-500',
    badge: 'bg-blue-500',
  },
  'Academic Management': {
    light: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600', accent: 'bg-indigo-500', border: 'border-indigo-500', hover: 'hover:bg-indigo-100', ring: 'ring-indigo-200' },
    dark: { bg: 'bg-indigo-900/20', text: 'text-indigo-300', icon: 'text-indigo-400', accent: 'bg-indigo-400', border: 'border-indigo-400', hover: 'hover:bg-indigo-900/30', ring: 'ring-indigo-800' },
    gradient: 'from-indigo-500 to-purple-500',
    badge: 'bg-indigo-500',
  },
  'Admissions': {
    light: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', accent: 'bg-amber-500', border: 'border-amber-500', hover: 'hover:bg-amber-100', ring: 'ring-amber-200' },
    dark: { bg: 'bg-amber-900/20', text: 'text-amber-300', icon: 'text-amber-400', accent: 'bg-amber-400', border: 'border-amber-400', hover: 'hover:bg-amber-900/30', ring: 'ring-amber-800' },
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500',
  },
  'Scheduling': {
    light: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', accent: 'bg-emerald-500', border: 'border-emerald-500', hover: 'hover:bg-emerald-100', ring: 'ring-emerald-200' },
    dark: { bg: 'bg-emerald-900/20', text: 'text-emerald-300', icon: 'text-emerald-400', accent: 'bg-emerald-400', border: 'border-emerald-400', hover: 'hover:bg-emerald-900/30', ring: 'ring-emerald-800' },
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500',
  },
  'Finance': {
    light: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-600', accent: 'bg-rose-500', border: 'border-rose-500', hover: 'hover:bg-rose-100', ring: 'ring-rose-200' },
    dark: { bg: 'bg-rose-900/20', text: 'text-rose-300', icon: 'text-rose-400', accent: 'bg-rose-400', border: 'border-rose-400', hover: 'hover:bg-rose-900/30', ring: 'ring-rose-800' },
    gradient: 'from-rose-500 to-red-500',
    badge: 'bg-rose-500',
  },
  'System': {
    light: { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600', accent: 'bg-slate-500', border: 'border-slate-500', hover: 'hover:bg-slate-100', ring: 'ring-slate-200' },
    dark: { bg: 'bg-slate-900/20', text: 'text-slate-300', icon: 'text-slate-400', accent: 'bg-slate-400', border: 'border-slate-400', hover: 'hover:bg-slate-900/30', ring: 'ring-slate-800' },
    gradient: 'from-slate-500 to-gray-500',
    badge: 'bg-slate-500',
  },
};

const getGroupColorConfig = (title) => {
  const config = groupColorMap[title];
  if (config) return config.light;
  return groupColorMap['System'].light;
};

const getGroupGradient = (title) => {
  const config = groupColorMap[title];
  return config?.gradient || groupColorMap['System'].gradient;
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const fuzzySearch = (text, query) => {
  if (!query || !text) return true;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  if (normalizedText.includes(normalizedQuery)) return true;
  
  let queryIndex = 0;
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === normalizedQuery.length;
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
};

const formatBadgeCount = (count) => {
  if (!count) return null;
  if (count > 999) return '999+';
  if (count > 99) return '99+';
  return count.toString();
};

const getBadgeSeverity = (count, type) => {
  if (type === 'urgent') return 'danger';
  if (type === 'warning' || count > 20) return 'warning';
  if (type === 'action' || count > 10) return 'info';
  return 'success';
};

const normalizeRoutePath = (path) => {
  if (!path) return '/';
  const normalized = path.replace(/\/+$/, '');
  return normalized || '/';
};

const isRouteActive = (pathname, targetPath) => {
  const current = normalizeRoutePath(pathname);
  const target = normalizeRoutePath(targetPath);

  if (target === '/') return current === target;
  return current === target || current.startsWith(`${target}/`);
};

const getBestActiveLink = (links, pathname) => {
  return links
    .filter(link => isRouteActive(pathname, link.to))
    .sort((a, b) => normalizeRoutePath(b.to).length - normalizeRoutePath(a.to).length)[0];
};

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION DATA - Complete Module Structure
// ═══════════════════════════════════════════════════════════════════

const navigationData = {
  admin: {
    sections: [
      {
        id: 'dashboard',
        label: 'DASHBOARD',
        groups: [
          {
            id: 'main',
            title: 'Main',
            icon: 'FiGrid',
            iconComponent: FiGrid,
            description: 'Primary navigation and overview',
            links: [
              { id: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: FiHome, description: 'School overview and statistics', badge: null, keywords: ['home', 'overview', 'stats'] },
              { id: 'system-monitor', to: '/admin/monitor', label: 'System Monitor', icon: FiMonitor, description: 'Monitor school modules, activity, and system connectivity', badge: null, keywords: ['monitor', 'health', 'status', 'operations'] },
               { id: 'dropout-predictor', to: '/admin/dropout-predictor', label: 'Dropout Predictor', icon: FiActivity, description: 'ML-powered student dropout risk prediction', badge: null, keywords: ['dropout', 'prediction', 'risk', 'ML', 'AI'] },
              { id: 'weather', to: '/admin/weather', label: 'Weather Intelligence', icon: FiCloud, description: 'Weather monitoring and alerts', badge: { count: 2, type: 'warning' }, keywords: ['climate', 'forecast', 'rain'] },
              { id: 'safety', to: '/admin/safety-dashboard', label: 'Safety Dashboard', icon: FiAlertTriangle, description: 'Safety incidents and reports', badge: { count: 1, type: 'urgent' }, keywords: ['emergency', 'incident', 'security'] },
              { id: 'attendance', to: '/admin/attendance', label: 'Attendance Dashboard', icon: FiCheckSquare, description: 'Daily attendance overview', badge: null, keywords: ['present', 'absent', 'roll'] },
              { id: 'analytics', to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2, description: 'School analytics and insights', badge: null, keywords: ['insights', 'reports', 'metrics'] },
              { id: 'announcements', to: '/admin/announcements', label: 'Announcements', icon: FiBell, description: 'School-wide announcements', badge: { count: 5, type: 'info' }, keywords: ['news', 'notice', 'circular'] },
              { id: 'messages', to: '/admin/messages', label: 'Messages', icon: FiMessageSquare, description: 'Internal messaging system', badge: { count: 12, type: 'urgent' }, keywords: ['chat', 'inbox', 'communication'] },
              { id: 'calendar', to: '/admin/calendar', label: 'Academic Calendar', icon: FiCalendar, description: 'School events and holidays', badge: null, keywords: ['events', 'schedule', 'holiday'] },
              { id: 'ai-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'Intelligent AI helper', badge: null, keywords: ['assistant', 'help', 'support'] },

            ],
          },
        ],
      },
      {
        id: 'academics',
        label: 'ACADEMICS',
        groups: [
          {
            id: 'academic-management',
            title: 'Academic Management',
            icon: 'FiBookOpen',
            iconComponent: FiBookOpen,
            description: 'Core academic operations',
            links: [
              { id: 'classes', to: '/admin/classes', label: 'Classes', icon: FiBook, description: 'Manage classes and sections', badge: null, keywords: ['sections', 'rooms', 'grade'] },
              { id: 'subjects', to: '/admin/subjects', label: 'Subjects', icon: FiBookOpen, description: 'Subject management', badge: null, keywords: ['courses', 'curriculum', 'topics'] },
              { id: 'students', to: '/admin/students', label: 'Students', icon: FiUsers, description: 'Student directory and profiles', badge: null, keywords: ['pupils', 'enrollment', 'records'] },
              { id: 'teachers', to: '/admin/teachers', label: 'Teachers', icon: FaChalkboardTeacher, description: 'Teacher management', badge: null, keywords: ['staff', 'faculty', 'instructor'] },
              { id: 'parents', to: '/admin/parents', label: 'Parents', icon: FiUserCheck, description: 'Parent directory', badge: null, keywords: ['guardians', 'family', 'contacts'] },
              { id: 'promotion', to: '/admin/promotion', label: 'Student Promotion', icon: FiTrendingUp, description: 'Promote students to next grade', badge: { count: 15, type: 'info' }, keywords: ['upgrade', 'advance', 'progress'] },
            ],
          },
          {
            id: 'scheduling',
            title: 'Scheduling',
            icon: 'FiClock',
            iconComponent: FiClock,
            description: 'Timetable and schedule management',
            links: [
              { id: 'timetable-viewer', to: '/admin/timetable-viewer', label: 'Full Timetable', icon: FiClock, description: 'View complete school timetable', badge: null, keywords: ['schedule', 'periods', 'slots'] },
              { id: 'timetable-designer', to: '/admin/timetable', label: 'Timetable Designer', icon: FiGrid, description: 'Design and manage timetables', badge: null, keywords: ['create', 'edit', 'arrange'] },
              { id: 'auto-generate', to: '/admin/timetable-generator', label: 'Auto-Generate', icon: FiZap, description: 'Automatic timetable generation', badge: null, keywords: ['automatic', 'smart', 'optimize'] },
              { id: 'timetable-conflicts', to: '/admin/timetable-conflicts', label: 'Conflict Center', icon: FiAlertTriangle, description: 'Resolve timetable conflicts', badge: null, keywords: ['conflict', 'clash', 'resolve'] },
              { id: 'weekly-load', to: '/admin/weekly-load', label: 'Weekly Load', icon: FiBarChart2, description: 'Teacher and class weekly load', badge: null, keywords: ['workload', 'periods', 'allocation'] },
              { id: 'teacher-availability', to: '/admin/teacher-availability', label: 'Teacher Availability', icon: FiUserCheck, description: 'Availability windows and constraints', badge: null, keywords: ['availability', 'slots', 'free'] },
              { id: 'default-load', to: '/admin/default-load', label: 'Default Load Config', icon: FiSettings, description: 'Default weekly load settings', badge: null, keywords: ['configuration', 'load', 'rules'] },
              { id: 'rooms', to: '/admin/rooms', label: 'Rooms & Venues', icon: FiHome, description: 'Room allocation and management', badge: null, keywords: ['classroom', 'hall', 'lab'] },
              { id: 'scheduling-analytics', to: '/admin/scheduling-analytics', label: 'Scheduling Analytics', icon: FiBarChart2, description: 'Room use and teacher heatmaps', badge: null, keywords: ['utilization', 'heatmap', 'analytics'] },
              { id: 'substitutions', to: '/admin/substitutions', label: 'Substitutions', icon: FiRefreshCw, description: 'Teacher substitution management', badge: null, keywords: ['replace', 'cover', 'stand-in'] },
              { id: 'special-schedules', to: '/admin/special-schedules', label: 'Special Schedules', icon: FiCalendar, description: 'Event and alternate schedules', badge: null, keywords: ['event', 'alternate', 'special'] },
              { id: 'timetable-reports', to: '/admin/timetable-reports', label: 'Timetable Reports', icon: FiFileText, description: 'Timetable reporting center', badge: null, keywords: ['reports', 'export', 'analysis'] },
              { id: 'timetable-versions', to: '/admin/timetable-versions', label: 'Versions & Templates', icon: FiGitBranch, description: 'Compare rollback import export', badge: null, keywords: ['versions', 'rollback', 'templates'] },
            ],
          },
          {
            id: 'assessments-labs',
            title: 'Assessments & Labs',
            icon: 'FiAward',
            iconComponent: FiAward,
            description: 'Exams, labs, and performance records',
            links: [
              { id: 'exams', to: '/admin/exams', label: 'Examinations', icon: FiAward, description: 'Exam management and results', badge: null, keywords: ['tests', 'assessment', 'grades'] },
              { id: 'labs', to: '/admin/labs', label: 'Labs', icon: FiMonitor, description: 'Lab rooms and resources', badge: null, keywords: ['laboratory', 'practical', 'science'] },
              { id: 'lab-sessions', to: '/admin/lab-sessions', label: 'Lab Sessions', icon: FiClipboard, description: 'Practical lab sessions', badge: null, keywords: ['practical', 'attendance', 'marks'] },
              { id: 'test-report', to: '/admin/test-report', label: 'Test Report', icon: FiFileText, description: 'Assessment reports', badge: null, keywords: ['test', 'report', 'results'] },
            ],
          },
          {
            id: 'curriculum',
            title: 'Curriculum Management',
            icon: 'FiBook',
            iconComponent: FiBook,
            description: 'Curriculum planning and coverage',
            links: [
              { id: 'curriculum-builder', to: '/admin/curriculum-builder', label: 'Curriculum Builder', icon: FiBookOpen, description: 'Build and manage curriculum', badge: null, keywords: ['syllabus', 'plan', 'design'] },
              { id: 'syllabus', to: '/admin/syllabus', label: 'Syllabus Planner', icon: FiFileText, description: 'Plan and track syllabus coverage', badge: null, keywords: ['coverage', 'topics', 'chapters'] },
              { id: 'course-coverage', to: '/admin/course-coverage', label: 'Course Coverage', icon: FiBarChart2, description: 'Monitor course completion status', badge: null, keywords: ['progress', 'completion', 'tracking'] },
            ],
          },
        ],
      },
      {
        id: 'administration',
        label: 'ADMINISTRATION',
        groups: [
          {
            id: 'admissions',
            title: 'Admissions',
            icon: 'FiUserPlus',
            iconComponent: FiUserPlus,
            description: 'Student admission management',
            links: [
              { id: 'admissions-main', to: '/admin/admissions', label: 'Admissions Dashboard', icon: FiUserPlus, description: 'Admission applications and processing', badge: { count: 8, type: 'urgent' }, keywords: ['enrollment', 'application', 'new'] },
              { id: 'admissions-new', to: '/admin/admissions/new', label: 'New Admission', icon: FiUserPlus, description: 'Create a new admission application', badge: null, keywords: ['apply', 'form', 'candidate'] },
            ],
          },
          {
            id: 'hr-payroll',
            title: 'HR & Payroll',
            icon: 'FiUserCheck',
            iconComponent: FiUserCheck,
            description: 'Human resources and payroll',
            links: [
              { id: 'hr-dashboard', to: '/admin/hr-payroll', label: 'HR Dashboard', icon: FiHome, description: 'HR overview and statistics', badge: null, keywords: ['human', 'resources', 'staff'] },
              { id: 'staff-directory', to: '/admin/hr-payroll/staff', label: 'Staff Directory', icon: FiUsers, description: 'All staff members', badge: null, keywords: ['employees', 'personnel', 'team'] },
              { id: 'staff-attendance', to: '/admin/hr-payroll/attendance', label: 'Staff Attendance', icon: FiCheckSquare, description: 'Track staff attendance', badge: null, keywords: ['presence', 'absent', 'tracking'] },
              { id: 'leave-center', to: '/admin/hr-payroll/leave', label: 'Leave Center', icon: FiCalendar, description: 'Manage leave requests', badge: { count: 6, type: 'action' }, keywords: ['vacation', 'sick', 'absence'] },
              { id: 'payroll', to: '/admin/hr-payroll/payroll', label: 'Payroll Center', icon: FiDollarSign, description: 'Salary and payroll management', badge: null, keywords: ['salary', 'wages', 'compensation'] },
              { id: 'hr-reports', to: '/admin/hr-payroll/reports', label: 'HR Reports', icon: FiFileText, description: 'HR analytics and reports', badge: null, keywords: ['analytics', 'statistics', 'data'] },
            ],
          },
          {
            id: 'admin-operations',
            title: 'Admin Operations',
            icon: 'FiActivity',
            iconComponent: FiActivity,
            description: 'Core administrative operations',
            links: [
              { id: 'ops-dashboard', to: '/admin/operations', label: 'Operations Dashboard', icon: FiHome, description: 'Operations overview', badge: null, keywords: ['management', 'control', 'oversight'] },
              { id: 'budgeting', to: '/admin/operations/budgeting', label: 'Budget Control', icon: FiDollarSign, description: 'Budget planning and tracking', badge: null, keywords: ['finance', 'planning', 'expenses'] },
              { id: 'approvals', to: '/admin/operations/approvals', label: 'Approvals Engine', icon: FiCheckSquare, description: 'Pending approval requests', badge: { count: 9, type: 'warning' }, keywords: ['authorize', 'sign', 'confirm'] },
              { id: 'compliance', to: '/admin/operations/compliance', label: 'Compliance Center', icon: FiFileText, description: 'Regulatory compliance tracking', badge: null, keywords: ['regulations', 'standards', 'audit'] },
              { id: 'clinic-ops', to: '/admin/operations/clinic', label: 'Clinic Operations', icon: MdLocalHospital, description: 'Clinic operational oversight', badge: null, keywords: ['medical', 'clinic', 'health'] },
              { id: 'security-ops', to: '/admin/operations/security', label: 'Security Operations', icon: FiShield, description: 'Security operations oversight', badge: null, keywords: ['gate', 'risk', 'security'] },
              { id: 'staff-oversight', to: '/admin/operations/staff-oversight', label: 'Staff Self-Service', icon: FiUserCheck, description: 'Staff self-service oversight', badge: null, keywords: ['staff', 'requests', 'service'] },
              { id: 'bi-center', to: '/admin/operations/bi-center', label: 'BI Center', icon: FiBarChart2, description: 'Business intelligence analytics', badge: null, keywords: ['analytics', 'insights', 'data'] },
              { id: 'principal-command', to: '/admin/operations/principal-command', label: 'Principal Command', icon: FiAward, description: 'Principal dashboard and controls', badge: null, keywords: ['head', 'director', 'leader'] },
            ],
          },
        ],
      },
      {
        id: 'finance',
        label: 'FINANCE & ACCOUNTS',
        groups: [
          {
            id: 'finance',
            title: 'Finance',
            icon: 'FiDollarSign',
            iconComponent: FiDollarSign,
            description: 'Financial management',
            links: [
              { id: 'fee-heads', to: '/admin/fee-heads', label: 'Fee Heads', icon: FiDollarSign, description: 'Define fee categories', badge: null, keywords: ['charges', 'categories', 'types'] },
              { id: 'class-fee-plans', to: '/admin/class-fee-plans', label: 'Class Fee Plans', icon: FiBook, description: 'Fee plans by class', badge: null, keywords: ['plans', 'structure', 'amount'] },
              { id: 'student-accounts', to: '/admin/student-fee-accounts', label: 'Student Accounts', icon: FiUsers, description: 'Individual student fee accounts', badge: null, keywords: ['individual', 'ledger', 'balance'] },
              { id: 'outstanding', to: '/admin/reports/outstanding', label: 'Outstanding Fees', icon: MdOutlinePendingActions, description: 'Pending fee collections', badge: { count: 25, type: 'urgent' }, keywords: ['pending', 'due', 'overdue'] },
              { id: 'collection', to: '/admin/reports/collection', label: 'Collection Summary', icon: FaFileInvoiceDollar, description: 'Fee collection reports', badge: null, keywords: ['summary', 'collected', 'receipts'] },
              { id: 'defaulters', to: '/admin/reports/defaulters', label: 'Defaulter List', icon: TbAlertCircle, description: 'Students with overdue fees', badge: { count: 18, type: 'urgent' }, keywords: ['non-payment', 'overdue', 'pending'] },
            ],
          },
          {
            id: 'accounts-ledger',
            title: 'Accounts & General Ledger',
            icon: 'FiCreditCard',
            iconComponent: FiCreditCard,
            description: 'Accounting and bookkeeping',
            links: [
              { id: 'accounts-dashboard', to: '/admin/accounts-ledger', label: 'Accounts Dashboard', icon: FiHome, description: 'Accounting overview', badge: null, keywords: ['bookkeeping', 'accounting', 'finance'] },
              { id: 'chart-of-accounts', to: '/admin/accounts-ledger/accounts', label: 'Chart of Accounts', icon: FiFolder, description: 'Account categories', badge: null, keywords: ['ledger', 'categories', 'groups'] },
              { id: 'vouchers', to: '/admin/accounts-ledger/vouchers', label: 'Vouchers', icon: FiClipboard, description: 'Accounting vouchers', badge: { count: 7, type: 'action' }, keywords: ['entries', 'journal', 'transactions'] },
              { id: 'statements', to: '/admin/accounts-ledger/statements', label: 'Statements', icon: FiFileText, description: 'Financial statements', badge: null, keywords: ['reports', 'balance', 'profit'] },
            ],
          },
        ],
      },
      {
        id: 'resources',
        label: 'RESOURCES & FACILITIES',
        groups: [
          {
            id: 'library',
            title: 'Library',
            icon: 'FiBook',
            iconComponent: FiBook,
            description: 'Library management system',
            links: [
              { id: 'library-dashboard', to: '/library/dashboard', label: 'Library Dashboard', icon: FiHome, description: 'Library overview', badge: null, keywords: ['books', 'reading', 'resource'] },
              { id: 'book-inventory', to: '/library/books', label: 'Book Inventory', icon: FiBook, description: 'Manage book collection', badge: null, keywords: ['catalog', 'collection', 'titles'] },
              { id: 'issue-return', to: '/library/issue-return', label: 'Issue / Return', icon: FiBookmark, description: 'Book issuance and returns', badge: { count: 4, type: 'action' }, keywords: ['borrow', 'lend', 'checkout'] },
            ],
          },
          {
            id: 'transport',
            title: 'Transport',
            icon: 'FiTruck',
            iconComponent: FiTruck,
            description: 'Transport management',
            links: [
              { id: 'transport-main', to: '/admin/transport', label: 'Transport Dashboard', icon: FiTruck, description: 'Fleet and route management', badge: null, keywords: ['bus', 'vehicle', 'route'] },
              { id: 'roster', to: '/admin/transport-roster', label: 'Roster & Trips', icon: FiCalendar, description: 'Trip scheduling and roster', badge: null, keywords: ['schedule', 'trip', 'driver'] },
              { id: 'transport-weather', to: '/admin/weather/transport', label: 'Transport Weather', icon: FiCloud, description: 'Route risk and weather advisories', badge: null, keywords: ['weather', 'route', 'visibility'] },
            ],
          },
          {
            id: 'hostel',
            title: 'Hostel Management',
            icon: 'FiHome',
            iconComponent: FiHome,
            description: 'Hostel and dormitory management',
            links: [
              { id: 'hostel-main', to: '/admin/hostels', label: 'Hostel Dashboard', icon: FiHome, description: 'Hostel overview', badge: null, keywords: ['dormitory', 'residence', 'boarding'] },
              { id: 'hostel-analytics', to: '/admin/hostel-analytics', label: 'Hostel Analytics', icon: FiBarChart2, description: 'Hostel statistics and reports', badge: null, keywords: ['stats', 'occupancy', 'analytics'] },
              { id: 'hostel-residents', to: '/admin/hostel-residents', label: 'Residents', icon: FiUsers, description: 'Hostel resident management', badge: null, keywords: ['boarders', 'occupants', 'students'] },
              { id: 'hostel-applications', to: '/admin/hostel-applications', label: 'Applications', icon: FiUserPlus, description: 'Hostel admission applications', badge: { count: 3, type: 'info' }, keywords: ['apply', 'request', 'allotment'] },
              { id: 'hostel-visitors', to: '/admin/hostel-visitors', label: 'Visitors', icon: FiUserPlus, description: 'Hostel visitor approvals', badge: null, keywords: ['visitor', 'approval', 'gate'] },
              { id: 'hostel-weather', to: '/admin/weather/hostel', label: 'Hostel Weather', icon: FiCloud, description: 'Comfort and night-safety conditions', badge: null, keywords: ['weather', 'comfort', 'humidity'] },
            ],
          },
          {
            id: 'inventory',
            title: 'Inventory & Procurement',
            icon: 'FiFolder',
            iconComponent: FiFolder,
            description: 'Inventory, stores, procurement, and maintenance',
            links: [
              { id: 'inventory-dashboard', to: '/admin/inventory', label: 'Inventory Dashboard', icon: FiHome, description: 'Inventory overview', badge: null, keywords: ['stock', 'assets', 'stores'] },
              { id: 'inventory-items', to: '/admin/inventory/items', label: 'Items & Assets', icon: FiFolder, description: 'Item catalog and asset records', badge: null, keywords: ['items', 'assets', 'catalog'] },
              { id: 'inventory-procurement', to: '/admin/inventory/procurement', label: 'Procurement', icon: FiClipboard, description: 'Purchase and procurement workflow', badge: null, keywords: ['purchase', 'vendor', 'orders'] },
              { id: 'inventory-store', to: '/admin/inventory/store', label: 'Store Operations', icon: FiGrid, description: 'Issue, receive, and store movement', badge: null, keywords: ['store', 'issue', 'receive'] },
              { id: 'inventory-maintenance', to: '/admin/inventory/maintenance', label: 'Maintenance', icon: FiSettings, description: 'Maintenance tickets and schedules', badge: null, keywords: ['repair', 'service', 'maintenance'] },
              { id: 'inventory-reports', to: '/admin/inventory/reports', label: 'Inventory Reports', icon: FiFileText, description: 'Inventory reporting center', badge: null, keywords: ['report', 'stock', 'analysis'] },
            ],
          },
          {
            id: 'medical',
            title: 'Medical & Clinic',
            icon: 'FiActivity',
            iconComponent: FiActivity,
            description: 'Medical and clinic management',
            links: [
              { id: 'clinic-dashboard', to: '/admin/medical-clinic', label: 'Clinic Dashboard', icon: FiHome, description: 'Clinic overview', badge: null, keywords: ['health', 'medical', 'infirmary'] },
              { id: 'medical-profiles', to: '/admin/medical-clinic/profiles', label: 'Medical Profiles', icon: FiUsers, description: 'Student health records', badge: null, keywords: ['health', 'records', 'history'] },
              { id: 'clinic-visits', to: '/admin/medical-clinic/visits', label: 'Clinic Visits', icon: FiActivity, description: 'Visit log and tracking', badge: null, keywords: ['appointments', 'checkups', 'treatment'] },
              { id: 'medicines', to: '/admin/medical-clinic/medicines', label: 'Medicines & Incidents', icon: FiAlertCircle, description: 'Medicine inventory and incidents', badge: null, keywords: ['drugs', 'pharmacy', 'accidents'] },
            ],
          },
        ],
      },
      {
        id: 'security',
        label: 'SECURITY & COMPLIANCE',
        groups: [
          {
            id: 'gate-pass',
            title: 'Gate Pass & Security',
            icon: 'FiShield',
            iconComponent: FiShield,
            description: 'Security and gate management',
            links: [
              { id: 'security-dashboard', to: '/admin/security-gate', label: 'Security Dashboard', icon: FiHome, description: 'Security overview', badge: null, keywords: ['guard', 'safety', 'monitoring'] },
              { id: 'visitors', to: '/admin/security-gate/visitors', label: 'Campus Visitors', icon: FiUsers, description: 'Visitor management', badge: null, keywords: ['guest', 'entry', 'visitor'] },
              { id: 'gate-passes', to: '/admin/security-gate/passes', label: 'Gate Passes', icon: FiCheckSquare, description: 'Gate pass approvals', badge: { count: 11, type: 'warning' }, keywords: ['exit', 'entry', 'permission'] },
              { id: 'vehicles', to: '/admin/security-gate/vehicles', label: 'Vehicle Gate Logs', icon: FiTruck, description: 'Vehicle entry/exit logs', badge: null, keywords: ['car', 'parking', 'entry'] },
              { id: 'security-notices', to: '/admin/security-gate/notices', label: 'Security Notices', icon: FiAlertTriangle, description: 'Security alerts and notices', badge: null, keywords: ['alert', 'warning', 'notice'] },
              { id: 'emergency-contacts', to: '/admin/emergency-contacts', label: 'Emergency Contacts', icon: FiUserCheck, description: 'Emergency contact directory', badge: null, keywords: ['emergency', 'contacts', 'safety'] },
            ],
          },
          {
            id: 'documents',
            title: 'Documents & Certificates',
            icon: 'FiFileText',
            iconComponent: FiFileText,
            description: 'Smart documents, cards, certificates, and print queue',
            links: [
              { id: 'documents-dashboard', to: '/admin/documents', label: 'Document Dashboard', icon: FiHome, description: 'Document center overview', badge: null, keywords: ['documents', 'certificates', 'letters'] },
              { id: 'document-templates', to: '/admin/documents/templates', label: 'Template Builder', icon: FiGrid, description: 'Build reusable document templates', badge: null, keywords: ['template', 'builder', 'design'] },
              { id: 'document-id-card', to: '/admin/documents/id-card', label: 'ID Card Generator', icon: FiCreditCard, description: 'Generate student and staff ID cards', badge: null, keywords: ['id', 'card', 'identity'] },
              { id: 'document-certificates', to: '/admin/documents/certificates', label: 'Certificates', icon: FiAward, description: 'Generate certificates', badge: null, keywords: ['certificate', 'award', 'proof'] },
              { id: 'document-fee-voucher', to: '/admin/documents/fee-voucher', label: 'Fee Vouchers', icon: FaFileInvoiceDollar, description: 'Generate fee vouchers', badge: null, keywords: ['fee', 'voucher', 'invoice'] },
              { id: 'document-result-card', to: '/admin/documents/result-card', label: 'Result Cards', icon: FiFileText, description: 'Generate result cards', badge: null, keywords: ['result', 'marks', 'report'] },
              { id: 'document-admit-card', to: '/admin/documents/admit-card', label: 'Admit Cards', icon: FiCreditCard, description: 'Generate exam admit cards', badge: null, keywords: ['admit', 'exam', 'card'] },
              { id: 'document-letters', to: '/admin/documents/official-letters', label: 'Official Letters', icon: FiMessageSquare, description: 'Generate official letters', badge: null, keywords: ['letter', 'official', 'communication'] },
              { id: 'document-bulk', to: '/admin/documents/bulk', label: 'Bulk Generator', icon: FiZap, description: 'Generate documents in bulk', badge: null, keywords: ['bulk', 'batch', 'generate'] },
              { id: 'document-requests', to: '/admin/documents/requests', label: 'Document Requests', icon: MdOutlinePendingActions, description: 'Manage document requests', badge: null, keywords: ['request', 'pending', 'approval'] },
              { id: 'document-generated', to: '/admin/documents/generated', label: 'Generated Documents', icon: FiFolder, description: 'Generated document archive', badge: null, keywords: ['archive', 'generated', 'history'] },
              { id: 'document-print', to: '/admin/documents/print', label: 'Print Queue', icon: FiExternalLink, description: 'Print and dispatch queue', badge: null, keywords: ['print', 'queue', 'dispatch'] },
            ],
          },
        ],
      },
      {
        id: 'settings',
        label: 'SETTINGS & SYSTEM',
        groups: [
          {
            id: 'system',
            title: 'System',
            icon: 'FiSettings',
            iconComponent: FiSettings,
            description: 'System configuration',
            links: [
              { id: 'notifications', to: '/admin/notifications', label: 'Notifications', icon: FiBell, description: 'System notifications', badge: { count: 23, type: 'info' }, keywords: ['alerts', 'messages', 'updates'] },
              { id: 'audit', to: '/admin/audit', label: 'Audit Center', icon: FiActivity, description: 'Activity audit logs', badge: null, keywords: ['logs', 'history', 'tracking'] },
              { id: 'users', to: '/admin/users', label: 'User Management', icon: FiUsers, description: 'Manage system users', badge: null, keywords: ['accounts', 'access', 'roles'] },
              { id: 'create-user', to: '/admin/users/create', label: 'Create User', icon: FiUserPlus, description: 'Create a new user account', badge: null, keywords: ['new', 'account', 'user'] },
              { id: 'school-settings', to: '/admin/school-settings', label: 'School Profile', icon: MdSchool, description: 'School information and settings', badge: null, keywords: ['profile', 'info', 'details'] },
              { id: 'timings', to: '/admin/school-timings', label: 'School Timings', icon: FiClock, description: 'School hours and periods', badge: null, keywords: ['hours', 'schedule', 'timing'] },
              { id: 'behaviour', to: '/admin/behaviour', label: 'Behaviour Dashboard', icon: FiBarChart2, description: 'Student behaviour tracking', badge: null, keywords: ['discipline', 'conduct', 'behavior'] },
              { id: 'chat-analytics', to: '/admin/chat-analytics', label: 'Chat Analytics', icon: FiMessageSquare, description: 'AI and messaging analytics', badge: null, keywords: ['chat', 'analytics', 'ai'] },
              { id: 'face-login-admin', to: '/admin/face-login', label: 'Face Login Center', icon: FiCamera, description: 'Face login administration', badge: null, keywords: ['face', 'login', 'biometric'] },
              { id: 'profile', to: '/admin/profile', label: 'My Profile', icon: FiUser, description: 'Your personal profile', badge: null, keywords: ['account', 'personal', 'settings'] },
              { id: 'theme', to: '/admin/theme-settings', label: 'Theme Settings', icon: FiSun, description: 'Customize appearance', badge: null, keywords: ['appearance', 'color', 'dark'] },
              { id: 'face-setup', to: '/face-enrollment', label: 'Face Setup', icon: FiCamera, description: 'Face recognition setup', badge: null, keywords: ['biometric', 'facial', 'recognition'] },
            ],
          },
        ],
      },
    ],
  },
  teacher: {
    sections: [
      {
        id: 'workspace',
        label: 'TEACHER WORKSPACE',
        groups: [
          {
            id: 'teacher-main',
            title: 'Main',
            icon: 'FiGrid',
            iconComponent: FiGrid,
            description: 'Teacher command center',
            links: [
              { id: 'teacher-dashboard', to: '/teacher/dashboard', label: 'Dashboard', icon: FiHome, description: 'Teacher overview', badge: null, keywords: ['home', 'overview'] },
              { id: 'teacher-workspace', to: '/teacher/workspace', label: 'Workspace', icon: MdWorkspacePremium, description: 'Daily teaching workspace', badge: null, keywords: ['workspace', 'tasks'] },
              { id: 'teacher-weather', to: '/teacher/weather', label: 'Weather', icon: FiCloud, description: 'Class weather guidance', badge: null, keywords: ['weather', 'outdoor'] },
              { id: 'teacher-messages', to: '/teacher/messages', label: 'Messages', icon: FiMessageSquare, description: 'School messaging', badge: null, keywords: ['chat', 'inbox'] },
              { id: 'teacher-calendar', to: '/teacher/calendar', label: 'Calendar', icon: FiCalendar, description: 'Academic calendar', badge: null, keywords: ['events', 'schedule'] },
              { id: 'teacher-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['ai', 'assistant'] },
            ],
          },
          {
            id: 'teacher-academics',
            title: 'Teaching & Academics',
            icon: 'FiBookOpen',
            iconComponent: FiBookOpen,
            description: 'Classes, lessons, attendance, and marks',
            links: [
              { id: 'teacher-classes', to: '/teacher/classes', label: 'My Classes', icon: FiUsers, description: 'Assigned classes', badge: null, keywords: ['classes', 'sections'] },
              { id: 'teacher-subjects', to: '/teacher/my-subjects', label: 'My Subjects', icon: FiBookOpen, description: 'Assigned subjects', badge: null, keywords: ['subjects', 'courses'] },
              { id: 'teacher-timetable', to: '/teacher/timetable-viewer', label: 'Timetable', icon: FiClock, description: 'Teaching timetable', badge: null, keywords: ['schedule', 'periods'] },
              { id: 'teacher-attendance', to: '/teacher/attendance', label: 'Attendance', icon: FiCheckSquare, description: 'Mark class attendance', badge: null, keywords: ['present', 'absent'] },
              { id: 'teacher-marks', to: '/teacher/marks', label: 'Marks Entry', icon: FiAward, description: 'Enter student marks', badge: null, keywords: ['marks', 'grades'] },
              { id: 'teacher-lesson-planner', to: '/teacher/lesson-planner', label: 'Lesson Planner', icon: FiClipboard, description: 'Plan lessons', badge: null, keywords: ['lesson', 'plan'] },
              { id: 'teacher-lesson-delivery', to: '/teacher/lesson-delivery', label: 'Lesson Delivery', icon: FiTrendingUp, description: 'Track lesson delivery', badge: null, keywords: ['delivery', 'coverage'] },
              { id: 'teacher-interventions', to: '/teacher/interventions', label: 'Student Interventions', icon: FiUserCheck, description: 'Intervention tracking', badge: null, keywords: ['intervention', 'support'] },
            ],
          },
          {
            id: 'teacher-assessments',
            title: 'Assignments & Exams',
            icon: 'FiAward',
            iconComponent: FiAward,
            description: 'Assignments, projects, exams, and MCQs',
            links: [
              { id: 'teacher-assignments', to: '/teacher/assignments', label: 'Assignments', icon: FiFileText, description: 'Assignment management', badge: null, keywords: ['homework', 'tasks'] },
              { id: 'teacher-projects', to: '/teacher/projects', label: 'Projects', icon: FiFolder, description: 'Project work', badge: null, keywords: ['projects', 'submissions'] },
              { id: 'teacher-project-create', to: '/teacher/projects/create', label: 'Create Project', icon: FiUserPlus, description: 'Create a project', badge: null, keywords: ['new', 'project'] },
              { id: 'teacher-exams', to: '/teacher/exams', label: 'Exams', icon: FiAward, description: 'Exam management', badge: null, keywords: ['tests', 'results'] },
              { id: 'teacher-mcq', to: '/teacher/mcq-exams', label: 'MCQ Exams', icon: FiCheckSquare, description: 'MCQ exam list', badge: null, keywords: ['mcq', 'quiz'] },
              { id: 'teacher-mcq-create', to: '/teacher/mcq-exams/create', label: 'Create MCQ Exam', icon: FiZap, description: 'Create MCQ exam', badge: null, keywords: ['quiz', 'create'] },
            ],
          },
          {
            id: 'teacher-operations',
            title: 'Operations',
            icon: 'FiActivity',
            iconComponent: FiActivity,
            description: 'Teacher services and support workflows',
            links: [
              { id: 'teacher-self-service', to: '/teacher/self-service', label: 'Self-Service', icon: FiUser, description: 'Teacher self-service', badge: null, keywords: ['profile', 'service'] },
              { id: 'teacher-ptm', to: '/teacher/ptm-center', label: 'PTM Center', icon: FiUsers, description: 'Parent teacher meetings', badge: null, keywords: ['ptm', 'parents'] },
              { id: 'teacher-substitution', to: '/teacher/substitutions', label: 'Substitution Duties', icon: FiRefreshCw, description: 'Substitution and invigilation', badge: null, keywords: ['substitution', 'invigilation'] },
              { id: 'teacher-continuity', to: '/teacher/learning-continuity', label: 'Learning Continuity', icon: FiActivity, description: 'Continuity workspace', badge: null, keywords: ['continuity', 'recovery'] },
              { id: 'teacher-behaviour', to: '/teacher/behaviour', label: 'Behaviour Log', icon: FiAlertCircle, description: 'Student behaviour log', badge: null, keywords: ['behaviour', 'discipline'] },
              { id: 'teacher-activities', to: '/teacher/activities', label: 'Activity Log', icon: FiClock, description: 'Teacher activity log', badge: null, keywords: ['activity', 'history'] },
              { id: 'teacher-library', to: '/teacher/library', label: 'My Library', icon: FiBook, description: 'Library access', badge: null, keywords: ['books', 'library'] },
              { id: 'teacher-profile', to: '/teacher/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
            ],
          },
        ],
      },
    ],
  },
  student: {
    sections: [
      {
        id: 'student-life',
        label: 'STUDENT PORTAL',
        groups: [
          {
            id: 'student-main',
            title: 'Main',
            icon: 'FiGrid',
            iconComponent: FiGrid,
            description: 'Student overview and daily tools',
            links: [
              { id: 'student-dashboard', to: '/student/dashboard', label: 'Dashboard', icon: FiHome, description: 'Student overview', badge: null, keywords: ['home', 'overview'] },
              { id: 'student-workflows', to: '/student/workflows', label: 'Workflow Center', icon: FiActivity, description: 'Student workflows', badge: null, keywords: ['workflow', 'tasks'] },
              { id: 'student-weather', to: '/student/weather', label: 'Weather', icon: FiCloud, description: 'Weather and AQI guidance', badge: null, keywords: ['weather', 'aqi'] },
              { id: 'student-messages', to: '/student/messages', label: 'Messages', icon: FiMessageSquare, description: 'School messaging', badge: null, keywords: ['chat', 'inbox'] },
              { id: 'student-calendar', to: '/student/calendar', label: 'Calendar', icon: FiCalendar, description: 'Academic calendar', badge: null, keywords: ['events', 'schedule'] },
              { id: 'student-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['assistant', 'help'] },
            ],
          },
          {
            id: 'student-academics',
            title: 'Academics',
            icon: 'FiBookOpen',
            iconComponent: FiBookOpen,
            description: 'Classes, marks, exams, and learning work',
            links: [
              { id: 'student-attendance', to: '/student/attendance', label: 'Attendance', icon: FiCheckSquare, description: 'Attendance record', badge: null, keywords: ['present', 'absent'] },
              { id: 'student-marks', to: '/student/marks', label: 'Marks', icon: FiAward, description: 'Marks and grades', badge: null, keywords: ['grades', 'results'] },
              { id: 'student-report-card', to: '/student/report-card', label: 'Report Cards', icon: FiFileText, description: 'Report cards', badge: null, keywords: ['report', 'card'] },
              { id: 'student-timetable', to: '/student/timetable', label: 'Timetable', icon: FiClock, description: 'Class timetable', badge: null, keywords: ['schedule', 'periods'] },
              { id: 'student-full-timetable', to: '/student/timetable-viewer', label: 'Full Timetable', icon: FiCalendar, description: 'Full timetable view', badge: null, keywords: ['timetable', 'viewer'] },
              { id: 'student-assignments', to: '/student/assignments', label: 'Assignments', icon: FiFileText, description: 'Assignments', badge: null, keywords: ['homework', 'submit'] },
              { id: 'student-projects', to: '/student/projects', label: 'Projects', icon: FiFolder, description: 'Student projects', badge: null, keywords: ['projects', 'submit'] },
              { id: 'student-submissions', to: '/student/submissions', label: 'My Submissions', icon: FiClipboard, description: 'Submitted work', badge: null, keywords: ['submissions', 'history'] },
              { id: 'student-exams', to: '/student/exams', label: 'Exams', icon: FiAward, description: 'Exam schedule and results', badge: null, keywords: ['exam', 'tests'] },
              { id: 'student-mcq', to: '/student/mcq-exams', label: 'MCQ Exams', icon: FiCheckSquare, description: 'Available MCQ exams', badge: null, keywords: ['mcq', 'quiz'] },
            ],
          },
          {
            id: 'student-campus',
            title: 'Campus Services',
            icon: 'FiHome',
            iconComponent: FiHome,
            description: 'Hostel, transport, fees, library, and support',
            links: [
              { id: 'student-fees', to: '/student/fees', label: 'Fee Portal', icon: FiDollarSign, description: 'Fees and vouchers', badge: null, keywords: ['fees', 'payment'] },
              { id: 'student-library', to: '/student/library', label: 'My Library', icon: FiBook, description: 'Library account', badge: null, keywords: ['books', 'library'] },
              { id: 'student-transport', to: '/student/transport', label: 'My Transport', icon: FiTruck, description: 'Transport details', badge: null, keywords: ['bus', 'route'] },
              { id: 'student-hostel', to: '/student/hostel', label: 'Hostel Application', icon: FiHome, description: 'Hostel application', badge: null, keywords: ['hostel', 'apply'] },
              { id: 'student-hostel-leave', to: '/student/hostel-leave', label: 'Hostel Leave', icon: FiCalendar, description: 'Hostel leave requests', badge: null, keywords: ['leave', 'hostel'] },
              { id: 'student-hostel-visitor', to: '/student/hostel-visitor', label: 'Visitor Request', icon: FiUserPlus, description: 'Visitor requests', badge: null, keywords: ['visitor', 'hostel'] },
              { id: 'student-hostel-complaints', to: '/student/hostel-complaints', label: 'Hostel Complaints', icon: FiAlertCircle, description: 'Hostel complaint center', badge: null, keywords: ['complaints', 'hostel'] },
              { id: 'student-mess-menu', to: '/student/mess-menu', label: 'Mess Menu', icon: FiCoffee, description: 'Hostel mess menu', badge: null, keywords: ['mess', 'food'] },
              { id: 'student-gate-passes', to: '/student/gate-passes', label: 'Gate Passes', icon: FiShield, description: 'Gate pass tracker', badge: null, keywords: ['gate', 'pass'] },
              { id: 'student-ptm', to: '/student/ptm-center', label: 'PTM Center', icon: FiUsers, description: 'Parent teacher meetings', badge: null, keywords: ['ptm', 'parents'] },
              { id: 'student-behaviour', to: '/student/behaviour', label: 'My Behaviour', icon: FiAlertTriangle, description: 'Behaviour record', badge: null, keywords: ['discipline', 'behaviour'] },
              { id: 'student-profile', to: '/student/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
            ],
          },
        ],
      },
    ],
  },
  parent: {
    sections: [
      {
        id: 'family',
        label: 'FAMILY PORTAL',
        groups: [
          {
            id: 'parent-main',
            title: 'Main',
            icon: 'FiGrid',
            iconComponent: FiGrid,
            description: 'Family overview and communication',
            links: [
              { id: 'parent-dashboard', to: '/parent/dashboard', label: 'Dashboard', icon: FiHome, description: 'Parent overview', badge: null, keywords: ['home', 'overview'] },
              { id: 'parent-workflows', to: '/parent/workflows', label: 'Workflow Center', icon: FiActivity, description: 'Family workflow center', badge: null, keywords: ['workflow', 'requests'] },
              { id: 'parent-weather', to: '/parent/weather-safety', label: 'Weather Safety', icon: FiCloud, description: 'Child weather safety', badge: null, keywords: ['weather', 'safety'] },
              { id: 'parent-announcements', to: '/parent/announcements', label: 'Announcements', icon: FiBell, description: 'School announcements', badge: null, keywords: ['notices', 'news'] },
              { id: 'parent-messages', to: '/parent/messages', label: 'Messages', icon: FiMessageSquare, description: 'School messaging', badge: null, keywords: ['chat', 'inbox'] },
              { id: 'parent-calendar', to: '/parent/calendar', label: 'Calendar', icon: FiCalendar, description: 'Academic calendar', badge: null, keywords: ['events', 'schedule'] },
              { id: 'parent-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['ai', 'assistant'] },
            ],
          },
          {
            id: 'parent-child',
            title: 'Child Progress',
            icon: 'FiUsers',
            iconComponent: FiUsers,
            description: 'Children, progress, attendance, and reports',
            links: [
              { id: 'parent-children', to: '/parent/children', label: 'Children', icon: FiUsers, description: 'Children list', badge: null, keywords: ['children', 'students'] },
              { id: 'parent-progress', to: '/parent/progress', label: 'Progress', icon: FiTrendingUp, description: 'Academic progress', badge: null, keywords: ['progress', 'marks'] },
              { id: 'parent-attendance', to: '/parent/attendance', label: 'Attendance', icon: FiCheckSquare, description: 'Attendance overview', badge: null, keywords: ['attendance', 'absent'] },
              { id: 'parent-report-cards', to: '/parent/report-cards', label: 'Report Cards', icon: FiFileText, description: 'Report cards', badge: null, keywords: ['reports', 'grades'] },
              { id: 'parent-ptm', to: '/parent/ptm-center', label: 'PTM Center', icon: FiUsers, description: 'Parent teacher meetings', badge: null, keywords: ['ptm', 'meetings'] },
            ],
          },
          {
            id: 'parent-services',
            title: 'Services & Support',
            icon: 'FiShield',
            iconComponent: FiShield,
            description: 'Fees, hostel, security, transport, and support',
            links: [
              { id: 'parent-fees', to: '/parent/fees', label: 'Fee Portal', icon: FiDollarSign, description: 'Fees and payments', badge: null, keywords: ['fees', 'payment'] },
              { id: 'parent-library', to: '/parent/library', label: 'Library', icon: FiBook, description: 'Library account', badge: null, keywords: ['books', 'library'] },
              { id: 'parent-transport', to: '/parent/transport', label: 'Transport', icon: FiTruck, description: 'Transport details', badge: null, keywords: ['bus', 'route'] },
              { id: 'parent-hostel', to: '/parent/hostel-overview', label: 'Hostel Overview', icon: FiHome, description: 'Hostel details', badge: null, keywords: ['hostel', 'boarding'] },
              { id: 'parent-support', to: '/parent/support-center', label: 'Support Center', icon: FiMessageSquare, description: 'Support requests', badge: null, keywords: ['support', 'help'] },
              { id: 'parent-security', to: '/parent/security-center', label: 'Security Center', icon: FiShield, description: 'Security workflow', badge: null, keywords: ['security', 'gate'] },
              { id: 'parent-profile', to: '/parent/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
            ],
          },
        ],
      },
    ],
  },
  warden: {
    sections: [
      {
        id: 'hostel-ops',
        label: 'HOSTEL OPERATIONS',
        groups: [
          {
            id: 'warden-main',
            title: 'Main',
            icon: 'FiGrid',
            iconComponent: FiGrid,
            description: 'Hostel command center',
            links: [
              { id: 'warden-dashboard', to: '/warden/dashboard', label: 'Dashboard', icon: FiHome, description: 'Hostel overview', badge: null, keywords: ['home', 'overview'] },
              { id: 'warden-workflows', to: '/warden/workflows', label: 'Workflow Center', icon: FiActivity, description: 'Resident workflows', badge: null, keywords: ['workflow', 'requests'] },
              { id: 'warden-weather', to: '/warden/hostel-weather', label: 'Hostel Weather', icon: FiCloud, description: 'Hostel weather safety', badge: null, keywords: ['weather', 'comfort'] },
              { id: 'warden-residents', to: '/warden/hostel-residents', label: 'Residents', icon: FiUsers, description: 'Hostel resident list', badge: null, keywords: ['residents', 'students'] },
              { id: 'warden-profile', to: '/warden/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
            ],
          },
          {
            id: 'warden-resident-services',
            title: 'Resident Services',
            icon: 'FiHome',
            iconComponent: FiHome,
            description: 'Attendance, leave, visitors, mess, and complaints',
            links: [
              { id: 'warden-attendance', to: '/warden/attendance', label: 'Hostel Attendance', icon: FiCheckSquare, description: 'Hostel attendance', badge: null, keywords: ['attendance', 'roll'] },
              { id: 'warden-leaves', to: '/warden/leaves', label: 'Leave Management', icon: FiCalendar, description: 'Resident leave requests', badge: null, keywords: ['leave', 'requests'] },
              { id: 'warden-visitors', to: '/warden/visitors', label: 'Visitor Management', icon: FiUserPlus, description: 'Resident visitor management', badge: null, keywords: ['visitors', 'gate'] },
              { id: 'warden-complaints', to: '/warden/complaints', label: 'Complaints', icon: FiAlertCircle, description: 'Complaint management', badge: null, keywords: ['complaints', 'issues'] },
              { id: 'warden-mess', to: '/warden/mess-menu', label: 'Mess Menu', icon: FiCoffee, description: 'Mess menu management', badge: null, keywords: ['mess', 'food'] },
            ],
          },
          {
            id: 'warden-support',
            title: 'Support & Safety',
            icon: 'FiShield',
            iconComponent: FiShield,
            description: 'PTM, support, safety, and communication',
            links: [
              { id: 'warden-ptm', to: '/warden/ptm-center', label: 'PTM Center', icon: FiUsers, description: 'Parent teacher meetings', badge: null, keywords: ['ptm', 'parents'] },
              { id: 'warden-support-center', to: '/warden/support-center', label: 'Support Center', icon: FiMessageSquare, description: 'Support workflow', badge: null, keywords: ['support', 'help'] },
              { id: 'warden-security', to: '/warden/security-center', label: 'Security Center', icon: FiShield, description: 'Security workflow', badge: null, keywords: ['security', 'gate'] },
              { id: 'warden-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['ai', 'assistant'] },
            ],
          },
        ],
      },
    ],
  },
  librarian: {
    sections: [
      {
        id: 'library-ops',
        label: 'LIBRARY OPERATIONS',
        groups: [
          {
            id: 'librarian-main',
            title: 'Main',
            icon: 'FiBook',
            iconComponent: FiBook,
            description: 'Library workspace',
            links: [
              { id: 'librarian-dashboard', to: '/librarian/dashboard', label: 'Dashboard', icon: FiHome, description: 'Librarian overview', badge: null, keywords: ['home', 'overview'] },
              { id: 'librarian-weather', to: '/librarian/weather', label: 'Weather', icon: FiCloud, description: 'Weather guidance', badge: null, keywords: ['weather'] },
              { id: 'library-dashboard', to: '/library/dashboard', label: 'Library Dashboard', icon: FiBook, description: 'Library overview', badge: null, keywords: ['library', 'books'] },
              { id: 'library-books', to: '/library/books', label: 'Book Inventory', icon: FiFolder, description: 'Book inventory', badge: null, keywords: ['catalog', 'books'] },
              { id: 'library-issue-return', to: '/library/issue-return', label: 'Issue / Return', icon: FiBookmark, description: 'Issue and return books', badge: null, keywords: ['issue', 'return'] },
              { id: 'librarian-profile', to: '/librarian/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
              { id: 'librarian-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['ai', 'assistant'] },
            ],
          },
        ],
      },
    ],
  },
  transport: {
    sections: [
      {
        id: 'transport-ops',
        label: 'TRANSPORT OPERATIONS',
        groups: [
          {
            id: 'transport-main',
            title: 'Main',
            icon: 'FiTruck',
            iconComponent: FiTruck,
            description: 'Transport command center',
            links: [
              { id: 'transport-dashboard', to: '/transport/dashboard', label: 'Dashboard', icon: FiHome, description: 'Transport overview', badge: null, keywords: ['home', 'fleet'] },
              { id: 'transport-workflows', to: '/transport/workflows', label: 'Workflow Center', icon: FiActivity, description: 'Transport workflows', badge: null, keywords: ['workflow', 'requests'] },
              { id: 'transport-incidents', to: '/transport/incidents', label: 'Incident Center', icon: FiAlertTriangle, description: 'Transport incidents', badge: null, keywords: ['incidents', 'safety'] },
              { id: 'transport-weather', to: '/transport/weather', label: 'Weather', icon: FiCloud, description: 'Route weather guidance', badge: null, keywords: ['weather', 'visibility'] },
              { id: 'transport-operations', to: '/transport/operations', label: 'Operations', icon: FiTruck, description: 'Fleet operations', badge: null, keywords: ['fleet', 'routes'] },
              { id: 'transport-roster', to: '/transport/roster', label: 'Roster & Trips', icon: FiCalendar, description: 'Roster and trips', badge: null, keywords: ['roster', 'trips'] },
              { id: 'transport-profile', to: '/transport/profile', label: 'Profile', icon: FiUser, description: 'Profile settings', badge: null, keywords: ['account', 'profile'] },
              { id: 'transport-chat', to: '/chat', label: 'AI Chat Assistant', icon: FiCommand, description: 'AI helper', badge: null, keywords: ['ai', 'assistant'] },
            ],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
};

const useClickHistory = () => {
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.clickHistory, {});

  const recordClick = useCallback((linkId) => {
    setHistory(prev => ({
      ...prev,
      [linkId]: (prev[linkId] || 0) + 1,
      _lastUpdated: Date.now(),
    }));
  }, [setHistory]);

  const getClickCount = useCallback((linkId) => history[linkId] || 0, [history]);

  const getMostClicked = useCallback((limit = 5) => {
    return Object.entries(history)
      .filter(([key]) => key !== '_lastUpdated')
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => key);
  }, [history]);

  return { history, recordClick, getClickCount, getMostClicked };
};

const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = throttle(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

const useKeyboardShortcut = (key, callback, modifiers = {}) => {
  useEffect(() => {
    const handler = (e) => {
      const { ctrl = false, meta = false, shift = false } = modifiers;
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrl &&
        e.metaKey === meta &&
        e.shiftKey === shift
      ) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
};

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const Badge = memo(({ count, type = 'info', size = 'sm' }) => {
  if (!count || count <= 0) return null;

  const displayCount = formatBadgeCount(count);
  const severity = getBadgeSeverity(count, type);

  const sizeClasses = {
    xs: 'min-w-[16px] h-4 px-1 text-[9px]',
    sm: 'min-w-[20px] h-5 px-1.5 text-[10px]',
    md: 'min-w-[24px] h-6 px-2 text-[11px]',
  };

  const severityClasses = {
    danger: 'bg-red-500 text-white shadow-red-500/30',
    warning: 'bg-amber-500 text-white shadow-amber-500/30',
    info: 'bg-blue-500 text-white shadow-blue-500/30',
    success: 'bg-emerald-500 text-white shadow-emerald-500/30',
  };

  return (
    <span className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full font-bold ${severityClasses[severity]} shadow-lg`}>
      {displayCount}
    </span>
  );
});

Badge.displayName = 'Badge';

const Tooltip = memo(({ content, children, position = 'right', delay = 300 }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <div
        className={`absolute z-[200] px-3 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap shadow-2xl pointer-events-none transition-all duration-200 ${positionClasses[position]} ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {content}
        <div className={`absolute w-2 h-2 bg-slate-900/95 rotate-45 ${
          position === 'right' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2' :
          position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2' :
          position === 'top' ? 'bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2' :
          'top-0 left-1/2 -translate-y-1/2 -translate-x-1/2'
        }`} />
      </div>
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

const SearchInput = memo(({ value, onChange, placeholder = 'Search...', expanded }) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useKeyboardShortcut('k', () => {
    inputRef.current?.focus();
  }, { meta: true });

  useKeyboardShortcut('k', () => {
    inputRef.current?.focus();
  }, { ctrl: true });

  if (!expanded) return null;

  return (
    <div className="px-3 mb-3">
      <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
        focused
          ? 'border-blue-400 bg-white shadow-lg shadow-blue-500/10 ring-4 ring-blue-50'
          : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300'
      }`}>
        <FiSearch className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 ${focused ? 'text-blue-500' : 'text-slate-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-10 pr-16 py-2.5 text-[13px] font-medium text-slate-700 placeholder-slate-400 outline-none rounded-xl"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value ? (
            <button
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="px-2 py-1 text-[10px] font-bold bg-slate-200/80 text-slate-500 rounded-md border border-slate-300 font-mono">
              ⌘K
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

const UserAvatar = memo(({ user, size = 'md', showStatus = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusSizeClasses = {
    sm: 'w-2 h-2 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-[3px]',
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const avatarSrc = user?.avatar || user?.avatarUrl || user?.photo || user?.profilePhoto || user?.profileImage || user?.image;

  return (
    <div className="relative inline-flex">
      <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 overflow-hidden ring-1 ring-white/70`}>
        {avatarSrc ? (
          <img src={avatarSrc} alt={user?.name || 'User avatar'} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {showStatus && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${statusSizeClasses[size]} rounded-full bg-emerald-400 border-white shadow-sm animate-pulse`} />
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

const GroupHeader = memo(({ group, isOpen, isActive, onClick, expanded, totalLinks }) => {
  const [hovered, setHovered] = useState(false);
  const colors = getGroupColorConfig(group.title);

  if (!expanded) {
    return (
      <Tooltip content={`${group.title} (${totalLinks} items)`}>
        <button
          onClick={onClick}
          className={`relative flex items-center justify-center w-full p-3 rounded-2xl transition-all duration-200 ${
            isActive ? `${colors.bg} shadow-sm ring-1 ring-black/5` : 'hover:bg-slate-50'
          }`}
        >
          <group.iconComponent className={`w-6 h-6 transition-all duration-200 ${isActive ? colors.icon : 'text-slate-400'} ${hovered && !isActive ? 'scale-110' : ''}`} />
          {totalLinks > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-600 text-white text-[8px] flex items-center justify-center font-bold">
              {totalLinks > 99 ? '99+' : totalLinks}
            </span>
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
        isActive
          ? `${colors.bg} ${colors.text} shadow-sm ring-1 ring-black/[0.04]`
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full transition-all duration-300 ${
        isActive ? colors.accent : 'bg-transparent'
      }`} />

      <div className="relative mr-3.5">
        <group.iconComponent className={`w-5 h-5 transition-all duration-200 ${isActive ? colors.icon : 'text-slate-400 group-hover:text-slate-600'} ${hovered && !isActive ? 'scale-110' : ''}`} />
        {isActive && (
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.accent} ring-2 ring-white`} />
        )}
      </div>

      <span className="flex-1 text-left text-[13px] tracking-tight truncate">{group.title}</span>

      {totalLinks > 0 && (
        <span className="mr-2 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
          {totalLinks}
        </span>
      )}

      <FiChevronDown className={`w-4 h-4 text-slate-400 transition-all duration-300 ${isOpen ? 'rotate-180' : ''} ${hovered || isOpen ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
});

GroupHeader.displayName = 'GroupHeader';

const NavLinkItem = memo(({ link, isActive, colors, onClick, expanded, onFavorite, isFavorited }) => {
  const [hovered, setHovered] = useState(false);

  if (!expanded) {
    return (
      <Tooltip content={link.label}>
        <NavLink
          to={link.to}
          onClick={onClick}
          data-active={isActive}
          className={({ isActive: active }) =>
            `relative flex items-center justify-center w-full p-3 rounded-2xl transition-all duration-200 ${
              active || isActive ? `${colors.bg} shadow-sm ring-1 ring-black/5` : 'hover:bg-slate-50'
            }`
          }
        >
          <link.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? colors.icon : 'text-slate-400'}`} />
          {link.badge && (
            <span className="absolute -top-0.5 -right-0.5">
              <Badge count={link.badge.count} type={link.badge.type} size="xs" />
            </span>
          )}
        </NavLink>
      </Tooltip>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group/item"
    >
      <NavLink
        to={link.to}
        onClick={onClick}
        data-active={isActive}
        className={({ isActive: active }) =>
          `relative flex items-center px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            active || isActive
              ? `${colors.bg} ${colors.text} shadow-sm`
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`
        }
      >
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full transition-all duration-300 ${
          isActive ? colors.accent : 'bg-transparent'
        }`} />

        <link.icon className={`w-4 h-4 mr-3 transition-all duration-200 ${isActive ? colors.icon : 'text-slate-400 group-hover/item:text-slate-500'} ${hovered && !isActive ? 'scale-110' : ''}`} />

        <span className="flex-1 truncate">{link.label}</span>

        {link.badge && <Badge count={link.badge.count} type={link.badge.type} size="xs" />}

        {isActive && <FiCheckCircle className={`w-3.5 h-3.5 ml-2 ${colors.icon} opacity-60`} />}

        {hovered && onFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(link); }}
            className={`ml-2 p-1 rounded-md transition-all duration-200 ${isFavorited ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
          >
            <FiStar className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        )}
      </NavLink>
    </div>
  );
});

NavLinkItem.displayName = 'NavLinkItem';

const SectionHeader = memo(({ label, expanded }) => {
  if (!expanded) return <div className="mx-3 my-2 h-px bg-slate-200" />;

  return (
    <div className="px-4 py-2 mt-3 first:mt-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 select-none">
          {label}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

const UserMenu = memo(({ user, expanded, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const role = user?.role || 'admin';
  const profilePath = `/${role}/profile`;
  const settingsPath = role === 'admin' ? '/admin/theme-settings' : profilePath;
  const notificationPath = role === 'admin' ? '/admin/notifications' : '/notifications';
  const userInitials = user?.name
    ? user.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!expanded) {
    return (
      <Tooltip content={`${user?.name || 'User'} - ${user?.role || 'Member'}`}>
        <button
          onClick={() => navigate(profilePath)}
          className="rounded-2xl p-2 transition hover:bg-slate-100"
        >
          <UserAvatar user={user} size="md" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <div className="rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="shrink-0 rounded-2xl transition hover:scale-[1.03]"
            title="Open profile"
          >
            <UserAvatar user={user} size="lg" />
          </button>
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-black leading-tight text-slate-900">{user?.name || 'User'}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {user?.role || 'Member'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${
              open
                ? 'border-blue-200 bg-blue-50 text-blue-600 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-700'
            }`}
            title="Account menu"
            aria-label="Open account menu"
            aria-expanded={open}
          >
            <FiMoreHorizontal className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ID</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-700">{userInitials}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Status</p>
            <p className="mt-1 text-xs font-bold text-emerald-700">Online</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Access</p>
            <p className="mt-1 text-xs font-bold text-blue-700">Live</p>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-full left-0 right-0 z-[80] mb-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl transition-all duration-200 ${
        open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
      }`}>
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Account</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">{user?.email || user?.username || 'Signed in user'}</p>
        </div>
        <div className="space-y-1 p-2">
          <button onClick={() => { navigate(profilePath); setOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <FiUser className="h-4 w-4 text-blue-500" /> My Profile
          </button>
          <button onClick={() => { navigate(settingsPath); setOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <FiSettings className="h-4 w-4 text-slate-500" /> {role === 'admin' ? 'Theme Settings' : 'Account Settings'}
          </button>
          <button onClick={() => { navigate(notificationPath); setOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <FiBell className="h-4 w-4 text-amber-500" /> Notifications
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50">
            <FiLogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

const SystemStatusBar = memo(({ expanded }) => {
  if (!expanded) return null;

  return (
    <div className="px-4 py-3 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-[11px] font-bold text-slate-600">System Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MdSpeed className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600">99.9%</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">Response Time</span>
        <span className="text-[10px] font-bold text-slate-500 font-mono">~32ms</span>
      </div>
    </div>
  );
});

SystemStatusBar.displayName = 'SystemStatusBar';

// ═══════════════════════════════════════════════════════════════════
// MAIN SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════

const Sidebar = ({ 
  role = 'admin', 
  isOpen = true, 
  onToggle, 
  expanded: controlledExpanded, 
  onExpandToggle,
  id,
}) => {
  // Context & Router
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Window size
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < BREAKPOINTS.mobile;
  const isTablet = windowSize.width < BREAKPOINTS.tablet;

  // State
  const [openGroups, setOpenGroups] = useLocalStorage(STORAGE_KEYS.openGroups, {});
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.favorites, []);
  const [expanded, setExpanded] = useState(controlledExpanded ?? !isTablet);
  const [manualToggle, setManualToggle] = useState(false);

  // Click history for smart sorting
  const { recordClick, getClickCount } = useClickHistory();

  // Sync controlled expanded prop
  useEffect(() => {
    if (controlledExpanded !== undefined) {
      setExpanded(controlledExpanded);
    }
  }, [controlledExpanded]);

  // Auto-collapse on small screens
  useEffect(() => {
    if (controlledExpanded !== undefined || manualToggle) return;
    setExpanded(!(isMobile || isTablet));
  }, [isMobile, isTablet, manualToggle, controlledExpanded]);

  // Get navigation data
  const navData = navigationData[role] || navigationData.admin;

  // Flatten all links for search
  const allLinks = useMemo(() => {
    return navData.sections.flatMap(section =>
      section.groups.flatMap(group =>
        group.links.map(link => ({
          ...link,
          groupTitle: group.title,
          sectionLabel: section.label,
        }))
      )
    );
  }, [navData]);

  const bestActiveLink = useMemo(
    () => getBestActiveLink(allLinks, location.pathname),
    [allLinks, location.pathname]
  );

  // Filter groups based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery) return navData.sections;

    return navData.sections.map(section => ({
      ...section,
      groups: section.groups.map(group => ({
        ...group,
        links: group.links.filter(link =>
          fuzzySearch(link.label, searchQuery) ||
          link.keywords?.some(kw => fuzzySearch(kw, searchQuery))
        )
      })).filter(group => group.links.length > 0)
    })).filter(section => section.groups.length > 0);
  }, [navData, searchQuery]);

  // Sort groups by click frequency when not searching
  const sortedSections = useMemo(() => {
    if (searchQuery) return filteredSections;

    return filteredSections.map(section => ({
      ...section,
      groups: [...section.groups].sort((a, b) => {
        const aClicks = a.links.reduce((sum, l) => sum + getClickCount(l.id), 0);
        const bClicks = b.links.reduce((sum, l) => sum + getClickCount(l.id), 0);
        return bClicks - aClicks;
      })
    }));
  }, [filteredSections, searchQuery, getClickCount]);

  // Find active group
  const activeGroup = useMemo(() => {
    if (!bestActiveLink) return null;

    for (const section of navData.sections) {
      for (const group of section.groups) {
        if (group.links.some(link => link.id === bestActiveLink.id)) {
          return group;
        }
      }
    }
    return null;
  }, [navData, bestActiveLink]);

  // Auto-open active group
  useEffect(() => {
    if (activeGroup && !searchQuery) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [activeGroup?.id, searchQuery]);

  // Record clicks
  useEffect(() => {
    const currentLink = getBestActiveLink(allLinks, location.pathname);
    if (currentLink) {
      recordClick(currentLink.id);
    }
  }, [location.pathname, allLinks, recordClick]);

  // Scroll to active link
  useEffect(() => {
    if (navRef.current) {
      const activeEl = navRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [location.pathname]);

  // Handlers
  const handleGroupToggle = useCallback((groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, [setOpenGroups]);

  const handleExpandToggle = useCallback(() => {
    setManualToggle(true);
    const newState = !expanded;
    setExpanded(newState);
    onExpandToggle?.(newState);
  }, [expanded, onExpandToggle]);

  const handleFavoriteToggle = useCallback((link) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === link.id);
      if (exists) {
        return prev.filter(f => f.id !== link.id);
      }
      return [...prev, { id: link.id, to: link.to, label: link.label, icon: link.icon, groupTitle: link.groupTitle }];
    });
  }, [setFavorites]);

  // Keyboard shortcuts
  useKeyboardShortcut('b', handleExpandToggle, { meta: true });
  useKeyboardShortcut('b', handleExpandToggle, { ctrl: true });

  // Favorite links that exist in current role
  const validFavorites = useMemo(() => {
    return favorites.filter(fav => allLinks.some(l => l.id === fav.id));
  }, [favorites, allLinks]);

  return (
    <aside
      id={id}
      aria-label={`${role} navigation`}
      className={`relative flex h-screen min-h-0 max-w-[calc(100vw-1rem)] flex-col border-r border-slate-200 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        expanded ? 'w-72' : 'w-20'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{
        width: expanded ? SIDEBAR_WIDTHS.expanded : SIDEBAR_WIDTHS.collapsed,
        height: '100dvh',
      }}
    >
      {/* Expand/Collapse Toggle */}
      <button
        onClick={handleExpandToggle}
        className="absolute -right-3 top-20 hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-200 z-50"
        title={`${expanded ? 'Collapse' : 'Expand'} sidebar (⌘B)`}
      >
        {expanded ? <FiChevronLeft className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div className={`flex h-[68px] flex-shrink-0 items-center border-b border-slate-100 ${expanded ? 'gap-3 px-4 sm:px-5' : 'justify-center px-3'}`}>
        <div
          onClick={() => navigate('/')}
          className="relative group cursor-pointer flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-200 group-hover:shadow-xl group-hover:scale-105">
            <img src={logo} alt="Fikr Smart School and College" className="w-6 h-6 rounded-lg object-cover" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
        </div>
        {expanded && (
          <div className="min-w-0">
            <h1 className="text-[13px] font-black text-slate-800 tracking-tight truncate">Fikr Smart School & College</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Advanced System</p>
          </div>
        )}
        {id && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Close navigation menu"
            className="ml-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        expanded={expanded}
        placeholder="Search modules, pages..."
      />

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1 custom-scrollbar"
      >
        {/* Favorites Section */}
        {validFavorites.length > 0 && expanded && (
          <div className="mb-3">
            <SectionHeader label="FAVORITES" expanded={expanded} />
            {validFavorites.map((fav) => {
              const originalLink = allLinks.find(l => l.id === fav.id);
              if (!originalLink) return null;
              const parentGroup = navData.sections
                .flatMap(s => s.groups)
                .find(g => g.links.some(l => l.id === fav.id));
              const colors = getGroupColorConfig(parentGroup?.title || 'System');
              const favoriteActive = bestActiveLink?.id === fav.id;

              return (
                <NavLink
                  key={fav.id}
                  to={fav.to}
                  onClick={onToggle}
                  data-active={favoriteActive}
                  className={`relative flex items-center px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    favoriteActive
                      ? `${colors.bg} ${colors.text} shadow-sm`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <originalLink.icon className={`w-4 h-4 mr-3 ${favoriteActive ? colors.icon : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{fav.label}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFavoriteToggle({ id: fav.id, to: fav.to, label: fav.label });
                    }}
                    className="p-1 rounded-md text-amber-400 hover:text-amber-500"
                  >
                    <FiStar className="w-3.5 h-3.5 fill-current" />
                  </button>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Navigation Sections */}
        {sortedSections.map((section) => (
          <div key={section.id}>
            <SectionHeader label={section.label} expanded={expanded} />
            {section.groups.map((group) => {
              const isOpen = searchQuery ? true : openGroups[group.id] || false;
              const isActive = activeGroup?.id === group.id;
              const colors = getGroupColorConfig(group.title);

              return (
                <div key={group.id} className="mb-0.5">
                  <GroupHeader
                    group={group}
                    isOpen={isOpen}
                    isActive={isActive}
                    onClick={() => handleGroupToggle(group.id)}
                    expanded={expanded}
                    totalLinks={group.links.length}
                  />

                  {/* Sub-menu items */}
                  {expanded && group.links.length > 0 && (
                    <div
                      className={`ml-2 pl-3 border-l-2 border-slate-100 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[3000px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {group.links.map((link) => (
                      <NavLinkItem
                          key={link.id}
                          link={link}
                          isActive={bestActiveLink?.id === link.id}
                          colors={colors}
                          onClick={onToggle}
                          expanded={expanded}
                          onFavorite={handleFavoriteToggle}
                          isFavorited={validFavorites.some(f => f.id === link.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Empty state */}
        {sortedSections.length === 0 && expanded && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FiSearch className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">No results found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className={`p-3 border-t border-slate-100 flex-shrink-0 ${!expanded && 'flex justify-center'}`}>
        <UserMenu user={user} expanded={expanded} onLogout={logout} />
      </div>

      {/* Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';

export default Sidebar;
export { navigationData, Badge, Tooltip, SearchInput, UserAvatar, GroupHeader, NavLinkItem, SectionHeader, UserMenu, SystemStatusBar };
