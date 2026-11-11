import { FiMenu, FiSearch, FiBell } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick, heading }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center px-4">
      {/* Mobile hamburger */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 mr-2">
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Page heading (optional, could be passed as prop) */}
      <div className="flex-1">
        {heading && <h1 className="text-lg font-semibold text-slate-800">{heading}</h1>}
      </div>

      {/* Search bar */}
      <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 mr-4">
        <FiSearch className="text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none ml-2 text-sm text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Notification icon */}
      <button className="p-2 rounded-md text-slate-500 hover:bg-slate-100 mr-2">
        <FiBell className="w-5 h-5" />
      </button>

      {/* Profile dropdown (simplified) */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <span className="hidden md:block text-sm font-medium text-slate-700">{user?.name}</span>
      </div>
    </header>
  );
};

export default Navbar;