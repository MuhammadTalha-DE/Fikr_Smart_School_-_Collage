import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MedicalClinicDashboard from '../pages/admin/MedicalClinicDashboard';

const mocks = vi.hoisted(() => ({
  getMedicalClinicOverview: vi.fn(),
}));

vi.mock('../components/common/Layout', () => ({
  default: ({ children }) => <div data-testid="layout-shell">{children}</div>,
}));

vi.mock('../services/medicalClinicService', () => ({
  getMedicalClinicOverview: mocks.getMedicalClinicOverview,
}));

describe('MedicalClinicDashboard', () => {
  it('renders the dedicated medical and clinic command center', async () => {
    mocks.getMedicalClinicOverview.mockResolvedValue({
      data: {
        data: {
          summary: { profiles: 140, clinicVisits: 18, medicineLogs: 11, openIncidents: 2, parentAlerts: 5, hostelHealthIncidents: 1 },
          recentVisits: [{ _id: 'visit-1', studentId: { userId: { name: 'Ayesha Khan' } }, symptoms: 'Fever', disposition: 'Observation' }],
          incidents: [{ _id: 'incident-1', studentId: { userId: { name: 'Ali Raza' } }, incidentType: 'allergy', details: 'Mild food allergy', status: 'open' }],
        },
      },
    });

    render(
      <MemoryRouter>
        <MedicalClinicDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Medical & Clinic Command Center')).toBeInTheDocument());
    expect(screen.getByText('Recent Clinic Visits')).toBeInTheDocument();
    expect(screen.getByText('Health Incidents')).toBeInTheDocument();
  });
});
