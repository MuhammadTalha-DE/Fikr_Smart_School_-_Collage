import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const SafetyStatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'text-blue-400', 
  bgColor = 'bg-blue-500/10',
  trend, 
  trendValue,
  subtitle,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl
        hover:bg-white/10 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
        {trend === 'stable' && <Activity className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {trendValue && (
          <p className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {trendValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default SafetyStatsCard;
