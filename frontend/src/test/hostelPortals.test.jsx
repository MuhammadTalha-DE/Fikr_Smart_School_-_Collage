import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HostelAnalytics from '../pages/admin/HostelAnalytics';
import HostelApplication from '../pages/student/HostelApplication';
import HostelOverview from '../pages/parent/HostelOverview';

const mocks = vi.hoisted(() => ({
  getAdminHostelOverview: vi.fn(),
  getStudentHostelOverview: vi.fn(),
  getParentHostelOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../services/hostelPortalService', () => ({
  getAdminHostelOverview: mocks.getAdminHostelOverview,
  getStudentHostelOverview: mocks.getStudentHostelOverview,
  getParentHostelOverview: mocks.getParentHostelOverview,
}));

const renderPage = (page) => render(<MemoryRouter>{page}</MemoryRouter>);

describe('hostel portal pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin hostel command center', async () => {
    mocks.getAdminHostelOverview.mockResolvedValue({
      data: {
        data: {
          hostels: [{ _id: 'hostel-1', name: 'Iqbal Hostel', occupancyRate: 78, activeResidents: 62, occupiedBeds: 62, availableBeds: 18, roomCount: 20, status: 'active', wardenId: { name: 'Warden A' } }],
          summary: { totalHostels: 1, activeHostels: 1, activeResidents: 62, availableBeds: 18, pendingApplications: 4, pendingLeaves: 2, pendingVisitors: 1, openComplaints: 3, attendanceRate: 92 },
          feeSummary: { totalAmount: 240000, paidAmount: 180000, dueAmount: 60000, paidRate: 75 },
          recentApplications: [],
          recentLeaves: [],
          recentVisitors: [],
          recentComplaints: [],
        },
      },
    });

    renderPage(<HostelAnalytics />);

    await waitFor(() => expect(screen.getByText('Hostel Command Center')).toBeInTheDocument());
    expect(screen.getByText('Hostel Portfolio')).toBeInTheDocument();
  });

  it('renders the student hostel portal with residency data', async () => {
    mocks.getStudentHostelOverview.mockResolvedValue({
      data: {
        data: {
          student: { _id: 'student-1', name: 'Ali', className: 'Grade 8', admissionNumber: 'ADM-1' },
          resident: {
            _id: 'resident-1',
            hostelId: { _id: 'hostel-1', name: 'Iqbal Hostel', type: 'Boys Hostel' },
            roomId: { _id: 'room-1', roomNumber: 'A-12', roomType: 'Shared' },
            bedId: { _id: 'bed-1', bedNumber: 'B2' },
          },
          attendance: { totalDays: 20, present: 18, absent: 1, onLeave: 1, attendanceRate: 90, recent: [] },
          leaves: [],
          visitors: [],
          complaints: [],
          applications: [],
          latestApplication: null,
          feeSummary: { totalAmount: 120000, paidAmount: 90000, dueAmount: 30000, paidRate: 75 },
          actionSummary: { pendingLeaves: 0, pendingVisitors: 0, openComplaints: 0 },
        },
      },
    });

    renderPage(<HostelApplication />);

    await waitFor(() => expect(screen.getByText('Hostel Portal')).toBeInTheDocument());
    expect(screen.getByText('Room and Residency Status')).toBeInTheDocument();
    expect(screen.getAllByText('Iqbal Hostel').length).toBeGreaterThan(0);
  });

  it('renders the parent hostel portal with child switching', async () => {
    mocks.getParentHostelOverview.mockResolvedValue({
      data: {
        data: {
          children: [{ _id: 'child-1', name: 'Ayesha', className: 'Grade 6', admissionNumber: 'ADM-22' }],
          selectedChildId: 'child-1',
          childOverview: {
            child: { _id: 'child-1', name: 'Ayesha', className: 'Grade 6', admissionNumber: 'ADM-22' },
            resident: {
              _id: 'resident-2',
              hostelId: { _id: 'hostel-2', name: 'Fatima Hostel', type: 'Girls Hostel' },
              roomId: { _id: 'room-4', roomNumber: 'C-7', roomType: 'Shared' },
              bedId: { _id: 'bed-3', bedNumber: '1' },
            },
            attendance: { totalDays: 16, present: 15, absent: 0, onLeave: 1, attendanceRate: 94 },
            leaves: [],
            visitors: [],
            complaints: [],
            latestApplication: null,
            feeSummary: { totalAmount: 90000, paidAmount: 70000, dueAmount: 20000, paidRate: 78 },
            actionSummary: { pendingLeaves: 1, pendingVisitors: 0, openComplaints: 0 },
          },
        },
      },
    });

    renderPage(<HostelOverview />);

    await waitFor(() => expect(screen.getByText('Child Hostel Portal')).toBeInTheDocument());
    expect(screen.getByText('Select Child')).toBeInTheDocument();
    expect(screen.getAllByText('Ayesha').length).toBeGreaterThan(0);
    expect(screen.getByText('Fatima Hostel')).toBeInTheDocument();
  });
});
