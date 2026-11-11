


import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
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
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';

const LayoutContext = createContext(null);
export const useLayout = () => useContext(LayoutContext);

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1)
    .map((segment, idx, arr) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      path: '/' + arr.slice(0, idx + 1).join('/'),
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
        setUserDropdownOpen(false);
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullscreen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <LayoutContext.Provider value={{ sidebarExpanded, isDarkMode, toggleSidebar: () => setSidebarExpanded((value) => !value) }}>
      <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`hidden flex-shrink-0 transition-all duration-500 lg:block ${sidebarExpanded ? 'w-72' : 'w-20'}`}>
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
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 animate-slide-in-left">
              <Sidebar role={role} isOpen expanded onToggle={() => setSidebarOpen(false)} isDarkMode={isDarkMode} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isDarkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'}`}>
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden">
                  <FiMenu className="h-5 w-5" />
                </button>
                <button onClick={() => setSidebarExpanded((value) => !value)} className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:flex">
                  {sidebarExpanded ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                </button>
                <div className="hidden md:block">
                  <Breadcrumbs items={breadcrumbs} onNavigate={(path) => navigate(path)} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 sm:flex"
                >
                  <FiSearch className="h-4 w-4" />
                  Search...
                  <kbd className="ml-2 text-gray-400">Ctrl+K</kbd>
                </button>
                <button onClick={() => setIsDarkMode((value) => !value)} className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-500">
                  {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                </button>
                <button onClick={toggleFullscreen} className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:block">
                  {isFullscreen ? <FiMinimize className="h-4 w-4" /> : <FiMaximize className="h-4 w-4" />}
                </button>
                <NotificationBell />
                <button onClick={() => setUserDropdownOpen((value) => !value)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 hover:bg-gray-50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <FiChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <UserDropdown
                  isOpen={userDropdownOpen}
                  onClose={() => setUserDropdownOpen(false)}
                  role={role}
                  user={user}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          <main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="mx-auto max-w-7xl p-6">
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
                {children}
              </div>
            </div>
          </main>
        </div>

        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} role={role} />

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
