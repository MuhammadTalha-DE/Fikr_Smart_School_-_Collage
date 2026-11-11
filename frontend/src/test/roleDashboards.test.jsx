import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeacherDashboard from '../pages/teacher/Dashboard';
import ParentDashboard from '../pages/parent/Dashboard';
import WardenDashboard from '../pages/warden/Dashboard';
import LibrarianDashboard from '../pages/librarian/Dashboard';
import TransportDashboard from '../pages/transport/Dashboard';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getTeacherAttendanceStats: vi.fn(),
  getTeacherWeatherSummary: vi.fn(),
  getParentWeatherSummary: vi.fn(),
  getHostelWeatherSummary: vi.fn(),
  getTransportWeatherSummary: vi.fn(),
  getWardenHostelOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../components/weather/WeatherMiniWidget', () => ({
  default: () => <div data-testid="weather-widget">Weather widget</div>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test Teacher',
      role: 'teacher',
    },
  }),
}));

vi.mock('../services/api', () => ({
  default: {
    get: mocks.apiGet,
  },
}));

vi.mock('../services/attendanceApi', () => ({
  getTeacherAttendanceStats: mocks.getTeacherAttendanceStats,
}));

vi.mock('../services/weatherService', () => ({
  getTeacherWeatherSummary: mocks.getTeacherWeatherSummary,
  getParentWeatherSummary: mocks.getParentWeatherSummary,
  getHostelWeatherSummary: mocks.getHostelWeatherSummary,
  getTransportWeatherSummary: mocks.getTransportWeatherSummary,
}));

vi.mock('../services/hostelPortalService', () => ({
  getWardenHostelOverview: mocks.getWardenHostelOverview,
}));

const renderPage = (page) => render(<MemoryRouter>{page}</MemoryRouter>);

describe('role dashboard smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the teacher dashboard with live data sections', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/classes/my-classes') return Promise.resolve({ data: [{ _id: 'class-1', students: [{ _id: 'student-1' }] }] });
      if (url === '/announcements') return Promise.resolve({ data: [{ _id: 'a1', title: 'Faculty note', targetRole: 'teacher' }] });
      if (url === '/teachers/schedule') return Promise.resolve({ data: [] });
      if (url === '/teacher/pending-assignments') return Promise.resolve({ data: { count: 2 } });
      if (url === '/teacher/upcoming-exams') return Promise.resolve({ data: [] });
      if (url === '/teacher/recent-lessons') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    mocks.getTeacherAttendanceStats.mockResolvedValue({ data: { percentage: 94, present: 22 } });
    mocks.getTeacherWeatherSummary.mockResolvedValue({ data: { data: { advice: [], alerts: [] } } });

    renderPage(<TeacherDashboard />);

    await waitFor(() => expect(screen.getByText('Welcome back, Test Teacher')).toBeInTheDocument());
    expect(screen.getAllByText('Teacher Workspace').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('weather-widget')).toHaveLength(1);
  });

  it('renders the parent dashboard family overview', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/users/profile') {
        return Promise.resolve({
          data: {
            parent: {
              children: [{ _id: 'child-1', classId: { _id: 'class-1' }, userId: { name: 'Child One' } }],
            },
          },
        });
      }
      if (url === '/announcements') return Promise.resolve({ data: [] });
      if (url === '/timetables/class-1') return Promise.resolve({ data: { slots: [] } });
      if (url === '/students/child-1/attendance') return Promise.resolve({ data: { percentage: 91 } });
      if (url === '/students/child-1/marks') return Promise.resolve({ data: { subjectAverages: [{ average: 78 }] } });
      if (url === '/behaviour/child/child-1/summary') return Promise.resolve({ data: { summary: { totalPoints: 12 } } });
      if (url === '/fee-accounts/parent') return Promise.resolve({ data: { accounts: [{ dueAmount: 1500 }] } });
      return Promise.resolve({ data: [] });
    });
    mocks.getParentWeatherSummary.mockResolvedValue({ data: { data: { advice: [], alerts: [] } } });

    renderPage(<ParentDashboard />);

    await waitFor(() => expect(screen.getByText('Family progress at a glance')).toBeInTheDocument());
    expect(screen.getByText('Parent Overview')).toBeInTheDocument();
  });

  it('renders the warden dashboard occupancy view', async () => {
    mocks.getWardenHostelOverview.mockResolvedValue({
      data: {
        data: {
          hostel: { _id: 'hostel-1', name: 'Assigned Hostel' },
          occupancy: { totalBeds: 120, occupiedBeds: 96, availableBeds: 24, occupancyRate: 80, activeResidents: 96, roomCount: 32 },
          todayAttendance: { present: 90, absent: 6, onLeave: 3, total: 99 },
          residentPreview: [],
          queues: { pendingLeaves: 1, pendingVisitors: 1, openComplaints: 3 },
          recentLeaves: [],
          recentVisitors: [],
          recentComplaints: [],
          feeSummary: { totalAmount: 250000, paidAmount: 180000, dueAmount: 70000, paidRate: 72 },
        },
      },
    });

    renderPage(<WardenDashboard />);

    await waitFor(() => expect(screen.getByText('Assigned Hostel')).toBeInTheDocument());
    expect(screen.getByText('Hostel Operations')).toBeInTheDocument();
  });

  it('renders the librarian dashboard circulation summary', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/library/dashboard-stats') return Promise.resolve({ data: { totalBooks: 2400, totalIssued: 120, overdue: 7, recentLoans: [] } });
      if (url === '/library/loans') return Promise.resolve({ data: { loans: [] } });
      return Promise.resolve({ data: [] });
    });

    renderPage(<LibrarianDashboard />);

    await waitFor(() => expect(screen.getByText('Librarian Command Desk')).toBeInTheDocument());
    expect(screen.getByText('Library Operations')).toBeInTheDocument();
  });

  it('renders the transport dashboard with route and alert data', async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === '/transport/dashboard/overview') {
        return Promise.resolve({
          data: {
            data: {
              summary: { activeRoutes: 4, totalRoutes: 5, activeVehicles: 3, totalVehicles: 4, activeAllocations: 48, feeEnabledAllocations: 30 },
              transportRisk: { overallRisk: 'medium', suggestedAction: 'Notify drivers and parents', risks: [] },
              latestWeather: { condition: 'Rain', visibility: 4, windSpeed: 18 },
              fleet: [{ _id: 'vehicle-1', registrationNumber: 'BUS-101', capacity: 40, isActive: true }],
              rosterPreview: [],
            },
          },
        });
      }
      if (url === '/transport/delay-alerts') {
        return Promise.resolve({ data: { data: [{ _id: 'alert-1', title: 'Transport delay', message: 'Delayed by 10 minutes', severity: 'medium' }] } });
      }
      return Promise.resolve({ data: [] });
    });
    mocks.getTransportWeatherSummary.mockResolvedValue({ data: { data: { advice: [{ text: 'Drive carefully on wet roads.' }], alerts: [] } } });

    renderPage(<TransportDashboard />);

    await waitFor(() => expect(screen.getByText('Transport Command Center')).toBeInTheDocument());
    expect(screen.getByText('Transport Operations')).toBeInTheDocument();
    expect(screen.getByText('Recent Transport Alerts')).toBeInTheDocument();
  });
});
