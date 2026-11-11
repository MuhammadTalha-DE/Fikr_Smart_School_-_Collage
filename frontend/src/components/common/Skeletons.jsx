import { 
  LayoutDashboard, Table, CreditCard, FormInput, 
  List, BarChart3, Layout as LayoutIcon 
} from 'lucide-react';

// ============================================================
// 🦴 Loading Skeletons
// 
// Professional skeleton components for every common page layout.
// Each skeleton matches the dimensions and structure of the real
// content it's replacing, providing a smooth loading experience.
//
// Usage:
//   <DashboardSkeleton />
//   <TableSkeleton rows={10} />
//   <CardSkeleton count={6} />
//   <FormSkeleton fields={8} />
//   <ListSkeleton items={5} />
//   <ChartSkeleton type="bar" />
//   <PageSkeleton />   // auto-detects layout
// ============================================================

// ─── Utility: shimmer animation ───
const shimmer = `animate-shimmer`;

// ─── Reusable bar pieces ───
const Bar = ({ width = '100%', height = '16px', className = '' }) => (
  <div
    className={`rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer} ${className}`}
    style={{ width, height }}
  />
);

const Circle = ({ size = '40px' }) => (
  <div
    className={`rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`}
    style={{ width: size, height: size }}
  />
);

// ─── 1. Dashboard Layout Skeleton ───
export function DashboardSkeleton({ cards = 6 }) {
  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Circle size="48px" />
        <div className="space-y-2 flex-1">
          <Bar width="240px" height="28px" />
          <Bar width="320px" height="16px" />
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <Bar width="160px" height="20px" className="mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} width={`${70 + Math.random() * 30}%`} height="12px" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <Bar width="140px" height="20px" className="mb-6" />
          <div className="flex items-end gap-3 h-40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-lg bg-gradient-to-t from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] ${shimmer}`}
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Bar width="140px" height="20px" className="mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Circle size="36px" />
              <div className="flex-1 space-y-2">
                <Bar width="60%" height="12px" />
                <Bar width="40%" height="10px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Table Skeleton ───
export function TableSkeleton({ rows = 8, columns = 5, hasCheckbox = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      {/* Table Header */}
      <div className="grid grid-cols-1 p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {hasCheckbox && <div className={`w-5 h-5 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />}
          {Array.from({ length: columns }).map((_, i) => (
            <Bar key={i} width={`${60 + Math.random() * 40}%`} height="14px" className="flex-1" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-1 p-4">
            <div className="flex items-center gap-4">
              {hasCheckbox && <div className={`w-5 h-5 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />}
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Bar
                  key={colIdx}
                  width={`${50 + Math.random() * 50}%`}
                  height="12px"
                  className="flex-1"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100">
        <Bar width="160px" height="14px" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Card Skeleton (Stat Card) ───
export function CardSkeleton() {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${shimmer} animate-fadeIn`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Bar width="80px" height="12px" />
          <Bar width="120px" height="28px" />
        </div>
        <Circle size="44px" />
      </div>
      <div className="flex items-center gap-2">
        <Bar width="60px" height="10px" />
        <Bar width="40px" height="10px" />
      </div>
    </div>
  );
}

// ─── 4. Form Skeleton ───
export function FormSkeleton({ fields = 6, columns = 1 }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-fadeIn">
      {/* Form Title */}
      <Bar width="200px" height="24px" className="mb-8" />

      {/* Form Fields */}
      <div className={`grid grid-cols-1 ${columns > 1 ? `md:grid-cols-${columns}` : ''} gap-6`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bar width="120px" height="12px" />
            <div className={`h-10 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />
            <Bar width="80%" height="10px" />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
        <div className={`h-12 w-32 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />
        <div className={`h-12 w-32 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />
      </div>
    </div>
  );
}

// ─── 5. List Skeleton (Feed / Activity) ───
export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-start gap-4">
            <Circle size="44px" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Bar width="160px" height="16px" />
                <Bar width="80px" height="12px" />
              </div>
              <Bar width="90%" height="12px" />
              <Bar width="60%" height="12px" />
              <div className="flex items-center gap-3 pt-2">
                <Bar width="80px" height="28px" className="rounded-full" />
                <Bar width="100px" height="28px" className="rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 6. Chart Skeleton ───
export function ChartSkeleton({ type = 'bar' }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <Bar width="160px" height="20px" />
        <div className="flex items-center gap-2">
          <Circle size="32px" />
          <Circle size="32px" />
        </div>
      </div>

      {/* Chart Body */}
      {type === 'bar' && (
        <div className="flex items-end gap-3 h-52">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-lg bg-gradient-to-t from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] ${shimmer}`}
              style={{ height: `${20 + Math.random() * 80}%` }}
            />
          ))}
        </div>
      )}

      {type === 'line' && (
        <div className="relative h-52">
          <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
            <path
              d="M0,100 C30,80 60,120 90,60 C120,20 150,90 180,50 C210,10 240,70 270,40 C300,20 300,20 300,20"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
              className={shimmer}
            />
            {Array.from({ length: 7 }).map((_, i) => (
              <circle
                key={i}
                cx={i * 50}
                cy={100 - Math.sin(i * 1.2) * 40 - 20}
                r="4"
                fill="#f3f4f6"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
      )}

      {type === 'pie' && (
        <div className="flex items-center justify-center h-52">
          <Circle size="160px" />
        </div>
      )}

      {type === 'doughnut' && (
        <div className="flex items-center justify-center h-52">
          <div
            className={`rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`}
            style={{ width: '160px', height: '160px' }}
          >
            <div className="w-20 h-20 bg-white rounded-full mx-auto mt-10" />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />
            <Bar width="60px" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. Sidebar Skeleton ───
export function SidebarSkeleton() {
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 p-4 space-y-6 animate-fadeIn">
      {/* Logo */}
      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
        <Circle size="36px" />
        <Bar width="120px" height="20px" />
      </div>

      {/* Nav Items */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <div className={`w-5 h-5 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${shimmer}`} />
            <Bar width={`${50 + Math.random() * 40}%`} height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 8. Profile Skeleton ───
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fadeIn">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center">
        <Circle size="96px" />
        <div className="space-y-2 mt-4">
          <Bar width="180px" height="24px" />
          <Bar width="140px" height="14px" />
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Bar width="100px" height="14px" />
            <Bar width="160px" height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 9. PageSkeleton (Auto-detect layout type) ───
export function PageSkeleton({ type = 'dashboard', ...props }) {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton {...props} />;
    case 'table':
      return <TableSkeleton {...props} />;
    case 'card':
    case 'cards':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {Array.from({ length: props.count || 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    case 'form':
      return <FormSkeleton {...props} />;
    case 'list':
      return <ListSkeleton {...props} />;
    case 'chart':
      return <ChartSkeleton {...props} />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'sidebar':
      return <SidebarSkeleton />;
    default:
      return <DashboardSkeleton {...props} />;
  }
}

// Add CSS keyframes for shimmer animation
const styleId = 'skeleton-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      animation: shimmer 1.8s ease-in-out infinite;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.4s ease-out;
    }
  `;
  document.head.appendChild(style);
}

export default PageSkeleton;
