import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Clock3,
  Library,
  ScanLine,
  Users,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import WeatherMiniWidget from '../../components/weather/WeatherMiniWidget';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardHero,
  DashboardProgressBar,
  DashboardQuickLink,
  DashboardSectionHeader,
  DashboardStatCard,
} from '../../components/common/RoleDashboardUI';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatDate = (value) => {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalIssued: 0,
    overdue: 0,
    recentLoans: [],
  });
  const [activeLoans, setActiveLoans] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      const [statsRes, activeLoansRes] = await Promise.allSettled([
        api.get('/library/dashboard-stats'),
        api.get('/library/loans', { params: { status: 'issued' } }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || { totalBooks: 0, totalIssued: 0, overdue: 0, recentLoans: [] });
      if (activeLoansRes.status === 'fulfilled') setActiveLoans(activeLoansRes.value.data?.loans || []);

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const activeBorrowers = useMemo(
    () => new Set(activeLoans.map((item) => item.user?._id).filter(Boolean)).size,
    [activeLoans]
  );
  const overdueRate = stats.totalIssued ? Math.round((Number(stats.overdue || 0) / Number(stats.totalIssued || 1)) * 100) : 0;
  const dueSoonLoans = useMemo(
    () => [...activeLoans]
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .slice(0, 5),
    [activeLoans]
  );

  if (loading) {
    return (
      <Layout role={user?.role}>
        <div className="p-6 text-center text-slate-500">Loading library dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout role={user?.role}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <DashboardHero
          eyebrow="Library Operations"
          title="Librarian Command Desk"
          subtitle="Monitor circulation, overdue pressure, and recent borrowing activity in a calmer, more visible dashboard built for daily library work."
          meta={[
            `${stats.totalBooks || 0} catalog books`,
            `${stats.totalIssued || 0} active issues`,
            `${stats.overdue || 0} overdue loans`,
            `${activeBorrowers} active borrowers`,
          ]}
          actions={
            <>
              <DashboardQuickLink icon={Library} label="Inventory" to="/library/books" tone="blue" />
              <DashboardQuickLink icon={ArrowRightLeft} label="Issue / Return" to="/library/issue-return" tone="emerald" />
            </>
          }
        />

        <WeatherMiniWidget role="librarian" compact />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={BookOpen} label="Books" value={stats.totalBooks || 0} helper="Registered library inventory" tone="blue" />
          <DashboardStatCard icon={Users} label="Issued" value={stats.totalIssued || 0} helper={`${activeBorrowers} borrowers currently active`} tone="indigo" />
          <DashboardStatCard icon={AlertTriangle} label="Overdue" value={stats.overdue || 0} helper={`${overdueRate}% of issued stock is overdue`} tone="amber" />
          <DashboardStatCard icon={Clock3} label="Recent Activity" value={stats.recentLoans?.length || 0} helper="Latest transaction feed items" tone="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader
                icon={ArrowRightLeft}
                title="Recent Transactions"
                subtitle="Latest borrowing and return movement"
                tone="blue"
                action={<Link to="/library/issue-return" className="text-xs font-bold text-blue-700 hover:text-blue-900">Manage</Link>}
              />

              {stats.recentLoans?.length ? (
                <div className="space-y-3">
                  {stats.recentLoans.map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{loan.book?.title || 'Untitled book'}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {loan.user?.name || 'Unknown borrower'} - {loan.user?.role || 'member'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          loan.status === 'issued'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {loan.status}
                        </span>
                        <p className="mt-2 text-xs text-slate-500">
                          {loan.fine > 0 ? `Fine: PKR ${loan.fine}` : 'No fine'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={ArrowRightLeft} title="No recent transactions" subtitle="Borrowing and return activity will appear here once circulation starts." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={ScanLine} title="Loan Pressure" subtitle="How much of the currently issued stock is overdue" tone="amber" />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Overdue ratio</span>
                  <span>{overdueRate}%</span>
                </div>
                <DashboardProgressBar value={overdueRate} tone="amber" />
              </div>
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Clock3} title="Due Soon Queue" subtitle="Active issued books with the nearest due dates" tone="emerald" />
              {dueSoonLoans.length ? (
                <div className="space-y-3">
                  {dueSoonLoans.map((loan) => (
                    <div key={loan._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{loan.book?.title || 'Untitled book'}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{loan.user?.name || 'Unknown borrower'}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          {formatDate(loan.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState icon={Clock3} title="No active issue queue" subtitle="Issued books with due dates will appear here once circulation is active." />
              )}
            </DashboardCard>

            <DashboardCard className="p-5 md:p-6">
              <DashboardSectionHeader icon={Library} title="Librarian Actions" subtitle="Fast access to the most used circulation tools" tone="violet" />
              <div className="flex flex-wrap gap-2">
                <DashboardQuickLink icon={Library} label="Inventory" to="/library/books" tone="blue" />
                <DashboardQuickLink icon={ArrowRightLeft} label="Issue / Return" to="/library/issue-return" tone="emerald" />
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LibrarianDashboard;
