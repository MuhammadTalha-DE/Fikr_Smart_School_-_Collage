import { Cloud, User, Shield } from 'lucide-react';

const roleConfig = {
  student: { label: 'Student Weather', color: 'from-blue-500 to-blue-700', icon: User },
  teacher: { label: 'Teacher Weather', color: 'from-emerald-500 to-emerald-700', icon: User },
  parent: { label: 'Parent Weather', color: 'from-purple-500 to-purple-700', icon: User },
  hostel: { label: 'Hostel Weather', color: 'from-amber-500 to-amber-700', icon: Shield },
  transport: { label: 'Transport Weather', color: 'from-rose-500 to-rose-700', icon: Shield },
  admin: { label: 'Weather Command Center', color: 'from-indigo-500 to-indigo-700', icon: Cloud },
};

const WeatherRoleHeader = ({ role = 'admin', title, subtitle }) => {
  const config = roleConfig[role] || roleConfig.admin;
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-xl">
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title || config.label}</h1>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
          {!subtitle && (
            <p className="text-white/70 text-sm mt-1">
              Real-time weather information for your role
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherRoleHeader;
