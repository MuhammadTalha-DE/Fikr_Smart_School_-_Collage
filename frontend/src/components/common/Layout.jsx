


import { useState, useEffect, useRef, useCallback, createContext, useContext, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu,
  FiSearch,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiMaximize,
  FiMinimize,
  FiSun,
  FiMoon,
  FiHelpCircle,
  FiMessageSquare,
  FiBarChart2,
  FiChevronDown,
  FiZap,
  FiShield,
  FiMessageCircle,
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';

const LayoutContext = createContext(null);
export const useLayout = () => useContext(LayoutContext);
const FikrAIChatbot = lazy(() => import('../chat/ChatAI'));

const roleThemes = {
  admin: {
    label: 'Admin Command',
    accent: 'from-sky-500 via-cyan-500 to-emerald-500',
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    ring: 'ring-sky-100',
  },
  teacher: {
    label: 'Teacher Workspace',
    accent: 'from-emerald-500 via-teal-500 to-sky-500',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ring: 'ring-emerald-100',
  },
  student: {
    label: 'Student Portal',
    accent: 'from-indigo-500 via-sky-500 to-emerald-500',
    chip: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    ring: 'ring-indigo-100',
  },
  parent: {
    label: 'Parent Portal',
    accent: 'from-amber-500 via-orange-400 to-sky-500',
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    ring: 'ring-amber-100',
  },
  warden: {
    label: 'Warden Desk',
    accent: 'from-teal-500 via-emerald-500 to-lime-500',
    chip: 'border-teal-200 bg-teal-50 text-teal-700',
    ring: 'ring-teal-100',
  },
  librarian: {
    label: 'Library Desk',
    accent: 'from-violet-500 via-indigo-500 to-sky-500',
    chip: 'border-violet-200 bg-violet-50 text-violet-700',
    ring: 'ring-violet-100',
  },
  transport: {
    label: 'Transport Ops',
    accent: 'from-slate-600 via-blue-500 to-cyan-500',
    chip: 'border-slate-200 bg-slate-100 text-slate-700',
    ring: 'ring-slate-100',
  },
};

const formatSegment = (segment = '') => segment
  .split('-')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const getRoleTheme = (role) => roleThemes[role] || {
  label: formatSegment(role || 'Workspace'),
  accent: 'from-sky-500 via-cyan-500 to-emerald-500',
  chip: 'border-slate-200 bg-slate-100 text-slate-700',
  ring: 'ring-slate-100',
};

const getRoleSettingsPath = (role) => {
  if (role === 'admin') return '/admin/theme-settings';
  return `/${role}/profile`;
};

const Breadcrumbs = ({ items, onNavigate }) => (
  <nav className="flex items-center gap-1.5 text-sm">
    <button
      onClick={() => onNavigate('/')}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
    >
      <FiHome className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Home</span>
    </button>
    {items.map((item, idx) => (
      <div key={item.path} className="flex items-center gap-1.5">
        <FiChevronRight className="h-3 w-3 text-gray-300" />
        {idx === items.length - 1 ? (
          <span className="px-2 py-1 font-semibold text-sky-600">{item.label}</span>
        ) : (
          <button
            onClick={() => onNavigate(item.path)}
            className="rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-sky-50 hover:text-sky-600"
          >
            {item.label}
          </button>
        )}
      </div>
    ))}
  </nav>
);

const SearchOverlay = ({ isOpen, onClose, role }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const searchItems = [
    { label: 'Dashboard', path: `/${role}/dashboard`, icon: FiHome },
    { label: 'Profile', path: `/${role}/profile`, icon: FiUser },
    { label: 'Notifications', path: role === 'admin' ? '/admin/notifications' : '/notifications', icon: FiMessageSquare },
    { label: 'Settings', path: getRoleSettingsPath(role), icon: FiSettings },
    { label: 'Analytics', path: `/${role}/analytics`, icon: FiBarChart2 },
    { label: 'Messages', path: `/${role}/messages`, icon: FiMessageSquare },
    { label: 'Help Center', path: '/help', icon: FiHelpCircle },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(searchItems.slice(0, 6));
      return;
    }

    const filtered = searchItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, role]);

  const handleKeyDown = (event) => {
    if (!results.length) {
      if (event.key === 'Escape') onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      onClose();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative mx-4 w-full max-w-2xl animate-scaleIn" onClick={(event) => event.stopPropagation()}>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <FiSearch className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent text-lg text-gray-800 placeholder-gray-400 outline-none"
            />
            <kbd className="hidden items-center rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 sm:flex">ESC</kbd>
          </div>
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {results.length ? results.map((item, idx) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 px-5 py-3 transition-colors ${
                  idx === selectedIndex ? 'bg-sky-50 text-sky-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`h-4 w-4 ${idx === selectedIndex ? 'text-sky-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                <span className="text-xs text-gray-400">{item.path}</span>
              </button>
            )) : (
              <div className="px-5 py-8 text-center text-gray-400">
                <FiSearch className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <p>No results for "{query}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDropdown = ({ isOpen, onClose, role, user, onLogout }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const items = [
    { label: 'Profile', icon: FiUser, path: `/${role}/profile` },
    { label: role === 'admin' ? 'Theme Settings' : 'Account', icon: FiSettings, path: getRoleSettingsPath(role) },
  ];

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-scaleIn rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
            <p className="text-xs capitalize text-gray-500">{role}</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <item.icon className="h-4 w-4 text-gray-400" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
        >
          <FiLogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children, role }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const roleTheme = getRoleTheme(role);
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const roleSegment = pathSegments[0] || role;
  const activeRole = role || user?.role || roleSegment || 'admin';
  const contentSegments = pathSegments.slice(1);
  const currentPageTitle = contentSegments.length
    ? formatSegment(contentSegments[contentSegments.length - 1])
    : 'Dashboard';

  const breadcrumbs = contentSegments
    .map((segment, idx, arr) => ({
      label: formatSegment(segment),
      path: '/' + [roleSegment, ...arr.slice(0, idx + 1)].join('/'),
    }));

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'k') {
          event.preventDefault();
          setSearchOpen((value) => !value);
        } else if (event.key === 'b') {
          event.preventDefault();
          setSidebarExpanded((value) => !value);
        } else if (event.key === 'f') {
          event.preventDefault();
          toggleFullscreen();
        } else if (event.key === 't') {
          event.preventDefault();
          setIsDarkMode((value) => !value);
        }
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullscreen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openFikrAI = () => {
    window.dispatchEvent(new Event('fikr-ai:open'));
  };

  return (
    <LayoutContext.Provider value={{ sidebarExpanded, isDarkMode, toggleSidebar: () => setSidebarExpanded((value) => !value) }}>
      <div
        className={`flex h-screen w-full min-w-0 overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[linear-gradient(135deg,#f8fafc_0%,#edf7ff_42%,#f4fbf4_100%)] text-slate-900'}`}
        style={{ height: '100dvh' }}
      >
        <div className={`hidden flex-shrink-0 border-r transition-all duration-500 lg:block ${sidebarExpanded ? 'w-72' : 'w-20'} ${isDarkMode ? 'border-slate-800' : 'border-white/70'}`}>
          <Sidebar
            role={role}
            isOpen
            onToggle={() => {}}
            expanded={sidebarExpanded}
            onExpandToggle={() => setSidebarExpanded((value) => !value)}
            isDarkMode={isDarkMode}
          />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden" role="presentation">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div
              id="mobile-navigation-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`${role} navigation menu`}
              className="relative z-50 h-dvh w-72 max-w-[calc(100vw-1rem)] animate-slide-in-left overflow-hidden shadow-2xl"
            >
              <Sidebar id="mobile-navigation" role={role} isOpen expanded onToggle={() => setSidebarOpen(false)} isDarkMode={isDarkMode} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className={`sticky top-0 z-40 border-b shadow-sm backdrop-blur-2xl ${isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-white/70 bg-white/78'}`}>
            <div className={`h-1 w-full bg-gradient-to-r ${roleTheme.accent}`} />
            <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2.5 sm:min-h-[76px] sm:gap-4 sm:px-4 sm:py-3 lg:px-7">
              <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="mobile-navigation-dialog"
                  className={`flex-shrink-0 rounded-xl border p-2 transition lg:hidden ${isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <FiMenu className="h-5 w-5" />
                </button>
                <button onClick={() => setSidebarExpanded((value) => !value)} className={`hidden rounded-xl border p-2 transition lg:flex ${isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                  {sidebarExpanded ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${roleTheme.chip}`}>
                      <FiShield className="h-3.5 w-3.5" />
                      {roleTheme.label}
                    </span>
                    <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
                      Online
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h1 className={`truncate text-lg font-black tracking-tight sm:text-xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                      {currentPageTitle}
                    </h1>
                    <div className="hidden md:block">
                      <Breadcrumbs items={breadcrumbs} onNavigate={(path) => navigate(path)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className={`hidden min-w-[180px] items-center gap-2 rounded-xl border px-3 py-2 text-xs transition sm:flex ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800' : 'border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:bg-slate-50'}`}
                >
                  <FiSearch className="h-4 w-4" />
                  <span className="flex-1 text-left">Search pages</span>
                  <kbd className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Ctrl+K</kbd>
                </button>
                <button onClick={() => setSearchOpen(true)} className={`rounded-xl border p-2 transition sm:hidden ${isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <FiSearch className="h-4 w-4" />
                </button>
                <div className="hidden items-center gap-2 lg:flex">
                  <button
                    type="button"
                    onClick={() => navigate(`/${activeRole}/messages`)}
                    className={`group relative overflow-hidden rounded-2xl border px-3.5 py-2 text-xs font-black transition-all duration-200 ${
                      isDarkMode
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100 shadow-lg shadow-emerald-950/30 hover:bg-emerald-400/15'
                        : 'border-emerald-200 bg-white text-slate-800 shadow-lg shadow-emerald-100/70 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-emerald-200/80'
                    }`}
                    title="Open messages"
                    aria-label="Open messages"
                  >
                    <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
                    <span className="relative flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                        <FiMessageCircle className="h-4 w-4" />
                      </span>
                      <span className="hidden xl:block text-left leading-tight">
                        <span className="block">Messages</span>
                        <span className={`block text-[9px] font-bold uppercase tracking-[0.14em] ${isDarkMode ? 'text-emerald-200/70' : 'text-emerald-600'}`}>Quick Chat</span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={openFikrAI}
                    className={`group relative overflow-hidden rounded-2xl border px-3.5 py-2 text-xs font-black transition-all duration-200 ${
                      isDarkMode
                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/30 hover:bg-cyan-400/15'
                        : 'border-cyan-200 bg-white text-slate-800 shadow-lg shadow-cyan-100/70 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-cyan-200/80'
                    }`}
                    title="Open Fikr AI assistant"
                    aria-label="Open Fikr AI assistant"
                  >
                    <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500" />
                    <span className="relative flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
                        <FiZap className="h-4 w-4" />
                      </span>
                      <span className="hidden xl:block text-left leading-tight">
                        <span className="block">Fikr AI</span>
                        <span className={`block text-[9px] font-bold uppercase tracking-[0.14em] ${isDarkMode ? 'text-cyan-200/70' : 'text-cyan-600'}`}>Assistant</span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className={`group relative overflow-hidden rounded-2xl border px-3.5 py-2 text-xs font-black transition-all duration-200 ${
                      isDarkMode
                        ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-100 shadow-lg shadow-indigo-950/30 hover:bg-indigo-400/15'
                        : 'border-indigo-200 bg-white text-slate-800 shadow-lg shadow-indigo-100/70 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-indigo-200/80'
                    }`}
                    title="Open EduBot page"
                    aria-label="Open EduBot page"
                  >
                    <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />
                    <span className="relative flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25">
                        <FiMessageSquare className="h-4 w-4" />
                      </span>
                      <span className="hidden xl:block text-left leading-tight">
                        <span className="block">EduBot</span>
                        <span className={`block text-[9px] font-bold uppercase tracking-[0.14em] ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600'}`}>AI Page</span>
                      </span>
                    </span>
                  </button>
                </div>
                <button onClick={() => setIsDarkMode((value) => !value)} className={`rounded-xl border p-2 transition ${isDarkMode ? 'border-slate-800 text-amber-300 hover:bg-slate-900' : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-amber-50 hover:text-amber-500'}`}>
                  {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                </button>
                <button onClick={toggleFullscreen} className={`hidden rounded-xl border p-2 transition lg:block ${isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700'}`}>
                  {isFullscreen ? <FiMinimize className="h-4 w-4" /> : <FiMaximize className="h-4 w-4" />}
                </button>
                <NotificationBell />
              </div>
            </div>
          </header>

          <main className={`min-w-0 flex-1 overflow-auto ${isDarkMode ? 'bg-slate-950' : 'bg-transparent'}`}>
            <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-32 lg:px-8">
              <div className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>
                {children}
              </div>
            </div>
          </main>
        </div>

        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} role={role} />
        <Suspense fallback={null}>
          <FikrAIChatbot />
        </Suspense>

        <style>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
          .animate-slide-in-left { animation: slideInLeft 0.3s ease-out forwards; }
        `}</style>
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout;
