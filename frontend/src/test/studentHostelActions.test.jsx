import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HostelLeave from '../pages/student/HostelLeave';
import VisitorRequest from '../pages/student/VisitorRequest';
import HostelComplaints from '../pages/student/HostelComplaints';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  default: {
    get: apiMocks.get,
    post: apiMocks.post,
  },
}));

const renderPage = (page) => render(<MemoryRouter>{page}</MemoryRouter>);

describe('student hostel action pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modern hostel leave center', async () => {
    apiMocks.get.mockResolvedValueOnce({
      data: [{ _id: 'leave-1', leaveType: 'weekend', fromDate: '2026-06-10', toDate: '2026-06-11', reason: 'Family visit', status: 'approved' }],
    });

    renderPage(<HostelLeave />);

    await waitFor(() => expect(screen.getByText('Hostel Leave Center')).toBeInTheDocument());
    expect(screen.getByText('Leave History')).toBeInTheDocument();
    expect(screen.getByText('Approval Readiness')).toBeInTheDocument();
  });

  it('renders the modern visitor request center', async () => {
    apiMocks.get.mockResolvedValueOnce({
      data: [{ _id: 'visitor-1', visitorName: 'Mrs. Khan', relation: 'Mother', purpose: 'Check-in', checkIn: '2026-06-13T10:00:00.000Z', checkOut: null, status: 'approved' }],
    });

    renderPage(<VisitorRequest />);

    await waitFor(() => expect(screen.getByText('Visitor Request Center')).toBeInTheDocument());
    expect(screen.getByText('Request a Visitor')).toBeInTheDocument();
    expect(screen.getByText('Visitor History')).toBeInTheDocument();
  });

  it('renders the modern hostel complaints center', async () => {
    apiMocks.get.mockResolvedValueOnce({
      data: [{ _id: 'complaint-1', category: 'electrical', description: 'Tube light not working', priority: 'high', status: 'open', createdAt: '2026-06-13T09:00:00.000Z' }],
    });

    renderPage(<HostelComplaints />);

    await waitFor(() => expect(screen.getByText('Hostel Complaints Center')).toBeInTheDocument());
    expect(screen.getByText('Lodge a Complaint')).toBeInTheDocument();
    expect(screen.getByText('Complaint Tracker')).toBeInTheDocument();
  });
});
