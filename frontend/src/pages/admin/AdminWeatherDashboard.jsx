import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, Eye, Thermometer, 
  Navigation, RefreshCw, Bell, Moon, Sun as SunIcon, Menu, X,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity,
  Database, Wifi, Zap, Shield, MapPin, Clock, ChevronRight,
  CloudLightning, CloudSnow, CloudFog, Gauge, Waves, Radio
} from 'lucide-react';

// ─── MOCK DATA GENERATORS ───────────────────────────────────────────────────

const generateHourlyData = () => {
  const hours = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);
    hours.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      temp: Math.round(24 + Math.sin((i + now.getHours()) * Math.PI / 12) * 6 + Math.random() * 2),
      wind: Math.round(8 + Math.random() * 12),
      rain: Math.random() > 0.7 ? Math.round(Math.random() * 15) : 0,
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
    });
  }
  return hours;
};

const generateWeeklyData = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (today + i) % 7;
    const baseTemp = 26 + Math.sin(i * Math.PI / 3) * 5;
    return {
      day: i === 0 ? 'Today' : days[dayIndex],
      high: Math.round(baseTemp + 4 + Math.random() * 3),
      low: Math.round(baseTemp - 3 - Math.random() * 2),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 5)],
      humidity: Math.round(45 + Math.random() * 40),
      wind: Math.round(5 + Math.random() * 15)
    };
  });
};

const generateChartData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }),
      temperature: Math.round(25 + Math.sin((24 - i) * Math.PI / 12) * 5 + Math.random() * 2),
      humidity: Math.round(50 + Math.cos((24 - i) * Math.PI / 8) * 20 + Math.random() * 5),
      aqi: Math.round(80 + Math.sin((24 - i) * Math.PI / 6) * 30 + Math.random() * 10),
      wind: Math.round(10 + Math.sin((24 - i) * Math.PI / 10) * 8 + Math.random() * 3)
    });
  }
  return data;
};

const generateAQIData = () => ({
  aqi: Math.round(85 + Math.random() * 40),
  pm25: Math.round(35 + Math.random() * 25),
  pm10: Math.round(55 + Math.random() * 35),
  o3: Math.round(40 + Math.random() * 30),
  no2: Math.round(20 + Math.random() * 20),
  so2: Math.round(10 + Math.random() * 15),
  co: (0.5 + Math.random() * 0.8).toFixed(2)
});

const generateAlerts = () => [
  { id: 1, type: 'rain', severity: 'warning', message: 'Heavy rainfall expected after 5 PM', time: '2 min ago', icon: CloudRain },
  { id: 2, type: 'heat', severity: 'info', message: 'High UV exposure detected — SPF 30+ recommended', time: '15 min ago', icon: Sun },
  { id: 3, type: 'wind', severity: 'warning', message: 'Wind speeds exceeding 25 km/h this evening', time: '32 min ago', icon: Wind },
  { id: 4, type: 'aqi', severity: 'danger', message: 'AQI levels rising — sensitive groups advised indoors', time: '1 hr ago', icon: AlertTriangle },
  { id: 5, type: 'storm', severity: 'danger', message: 'Thunderstorm warning issued for Malakand region', time: '2 hrs ago', icon: CloudLightning }
];

// ─── UTILITY COMPONENTS ─────────────────────────────────────────────────────

const GlassCard = ({ children, className = '', hover = true }) => (
  <div className={`
    relative overflow-hidden rounded-2xl border border-white/10 
    bg-white/5 backdrop-blur-xl shadow-xl
    ${hover ? 'transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1' : ''}
    ${className}
  `}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

const AnimatedNumber = ({ value, suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 1000;
    const start = display;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</span>;
};

const WeatherIcon = ({ condition, className = '', animated = false }) => {
  const iconMap = {
    'Sunny': Sun,
    'Clear': Sun,
    'Partly Cloudy': Cloud,
    'Cloudy': Cloud,
    'Rainy': CloudRain,
    'Stormy': CloudLightning,
    'Snowy': CloudSnow,
    'Foggy': CloudFog
  };
  const Icon = iconMap[condition] || Cloud;
  return (
    <div className={`${animated ? 'animate-pulse' : ''} ${className}`}>
      <Icon className="w-full h-full" />
    </div>
  );
};

const getAQIColor = (aqi) => {
  if (aqi <= 50) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Good', gradient: 'from-emerald-500/20 to-emerald-500/5' };
  if (aqi <= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Moderate', gradient: 'from-yellow-500/20 to-yellow-500/5' };
  if (aqi <= 150) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Unhealthy for Sensitive', gradient: 'from-orange-500/20 to-orange-500/5' };
  if (aqi <= 200) return { bg: 'bg-red-500', text: 'text-red-400', label: 'Unhealthy', gradient: 'from-red-500/20 to-red-500/5' };
  if (aqi <= 300) return { bg: 'bg-purple-500', text: 'text-purple-400', label: 'Very Unhealthy', gradient: 'from-purple-500/20 to-purple-500/5' };
  return { bg: 'bg-rose-900', text: 'text-rose-400', label: 'Hazardous', gradient: 'from-rose-900/20 to-rose-900/5' };
};

const getSeverityStyles = (severity) => {
  switch (severity) {
    case 'danger': return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'info': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
  }
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const AdminWeatherDashboard = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [currentWeather, setCurrentWeather] = useState({
    temp: 29,
    feelsLike: 31,
    condition: 'Cloudy',
    humidity: 68,
    windSpeed: 14,
    pressure: 1013,
    visibility: 10,
    uvIndex: 6,
    rainfall: 2.4,
    cloudCoverage: 78
  });

  const [hourlyData, setHourlyData] = useState(generateHourlyData());
  const [weeklyData, setWeeklyData] = useState(generateWeeklyData());
  const [chartData, setChartData] = useState(generateChartData());
  const [aqiData, setAqiData] = useState(generateAQIData());
  const [alerts, setAlerts] = useState(generateAlerts());

  // System health
  const [systemHealth, setSystemHealth] = useState({
    apiStatus: 'operational',
    websocketStatus: 'connected',
    lastSync: '2 sec ago',
    refreshRate: '5000ms',
    dbWrites: 1247,
    uptime: '99.98%'
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setCurrentWeather(prev => ({
        ...prev,
        temp: Math.round(28 + Math.random() * 4),
        feelsLike: Math.round(30 + Math.random() * 3),
        humidity: Math.min(100, Math.max(30, prev.humidity + (Math.random() - 0.5) * 4)),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 3),
        pressure: Math.round(1010 + Math.random() * 8),
        uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 2)),
        cloudCoverage: Math.min(100, Math.max(0, prev.cloudCoverage + (Math.random() - 0.5) * 10))
      }));

      setLastUpdated(new Date());
      setAqiData(generateAQIData());
      setSystemHealth(prev => ({
        ...prev,
        lastSync: 'Just now',
        dbWrites: prev.dbWrites + Math.floor(Math.random() * 3)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setHourlyData(generateHourlyData());
      setWeeklyData(generateWeeklyData());
      setChartData(generateChartData());
      setAqiData(generateAQIData());
      setAlerts(generateAlerts());
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 1200);
  }, []);

  const themeClass = darkMode ? 'dark' : '';
  const bgClass = darkMode 
    ? 'bg-slate-950 text-white' 
    : 'bg-slate-50 text-slate-900';

  const metrics = [
    { icon: Droplets, label: 'Humidity', value: currentWeather.humidity, suffix: '%', color: 'text-cyan-400', trend: 'up' },
    { icon: Wind, label: 'Wind Speed', value: currentWeather.windSpeed, suffix: ' km/h', color: 'text-sky-400', trend: 'down' },
    { icon: Gauge, label: 'Pressure', value: currentWeather.pressure, suffix: ' hPa', color: 'text-violet-400', trend: 'stable' },
    { icon: Eye, label: 'Visibility', value: currentWeather.visibility, suffix: ' km', color: 'text-emerald-400', trend: 'up' },
    { icon: Sun, label: 'UV Index', value: currentWeather.uvIndex, suffix: '', color: 'text-amber-400', trend: 'up' },
    { icon: CloudRain, label: 'Rainfall', value: currentWeather.rainfall, suffix: ' mm', color: 'text-blue-400', trend: 'stable' },
    { icon: Cloud, label: 'Cloud Cover', value: currentWeather.cloudCoverage, suffix: '%', color: 'text-gray-400', trend: 'up' },
    { icon: Waves, label: 'Dew Point', value: 22, suffix: '°C', color: 'text-teal-400', trend: 'stable' }
  ];

  const aqiBreakdown = [
    { name: 'PM2.5', value: aqiData.pm25, fullMark: 100 },
    { name: 'PM10', value: aqiData.pm10, fullMark: 150 },
    { name: 'O₃', value: aqiData.o3, fullMark: 100 },
    { name: 'NO₂', value: aqiData.no2, fullMark: 80 },
    { name: 'SO₂', value: aqiData.so2, fullMark: 50 }
  ];

  const aqiColorInfo = getAQIColor(aqiData.aqi);

  return (
    <div className={`${themeClass} ${bgClass} min-h-screen transition-colors duration-500`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

        {/* ─── NAVBAR ───────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    <Cloud className="relative w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">Fikr Weather Intelligence</h1>
                    <p className="text-xs text-slate-400 hidden sm:block">Smart Environmental Monitoring Center</p>
                  </div>
                </div>
              </div>

              {/* Center - Live Status */}
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-400">LIVE DATA STREAM</span>
                <span className="text-xs text-slate-500">|</span>
                <span className="text-xs text-slate-400">{lastUpdated.toLocaleTimeString()}</span>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  className={`p-2.5 rounded-xl hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5 text-slate-300" />
                </button>
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`p-2.5 rounded-xl transition-all ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-slate-400'}`}
                  title={isLive ? 'Pause Updates' : 'Resume Updates'}
                >
                  <Radio className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-all"
                >
                  {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-300" />}
                </button>
                <button className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all">
                  <Bell className="w-5 h-5 text-slate-300" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>
                <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-slate-400">System Architect</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-bold">
                    AU
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* HERO WEATHER CARD */}
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Zoormandi, Malakand, KPK</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">Campus Zone</span>
                  </div>

                  <div className="flex items-end gap-6">
                    <div>
                      <div className="text-8xl font-bold tracking-tighter bg-gradient-to-br from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                        <AnimatedNumber value={currentWeather.temp} suffix="°" />
                      </div>
                      <p className="text-xl text-slate-400 mt-1">Feels like {Math.round(currentWeather.feelsLike)}°C</p>
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <WeatherIcon condition={currentWeather.condition} className="w-12 h-12 text-blue-400" animated />
                        <span className="text-2xl font-semibold">{currentWeather.condition}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-red-400" /> H: 32°</span>
                        <span className="flex items-center gap-1"><TrendingDown className="w-4 h-4 text-cyan-400" /> L: 23°</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Updated {Math.floor((new Date() - lastUpdated) / 1000)}s ago</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Next significant weather</p>
                    <p className="text-lg font-medium text-amber-400">Rain expected at 17:00</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* LIVE METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <GlassCard key={idx} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-white/5 ${metric.color}`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                  {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {metric.trend === 'stable' && <Activity className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    <AnimatedNumber value={metric.value} suffix={metric.suffix} decimals={metric.suffix === ' mm' ? 1 : 0} />
                  </p>
                  <p className="text-sm text-slate-400">{metric.label}</p>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* HOURLY FORECAST */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                24-Hour Forecast
              </h3>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                View Full Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {hourlyData.map((hour, idx) => (
                <div 
                  key={idx} 
                  className={`flex-shrink-0 w-24 p-4 rounded-xl border transition-all ${
                    idx === 0 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs text-slate-400 text-center mb-2">{hour.time}</p>
                  <div className="flex justify-center mb-2">
                    <WeatherIcon condition={hour.condition} className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-center">{hour.temp}°</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 text-center">
                    <p className="flex items-center justify-center gap-1"><Wind className="w-3 h-3" /> {hour.wind}</p>
                    {hour.rain > 0 && <p className="flex items-center justify-center gap-1 text-blue-400"><CloudRain className="w-3 h-3" /> {hour.rain}mm</p>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* WEEKLY FORECAST */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-violet-400" />
              7-Day Forecast
            </h3>
            <div className="space-y-3">
              {weeklyData.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4 w-32">
                    <span className="font-medium">{day.day}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <WeatherIcon condition={day.condition} className="w-8 h-8 text-blue-400" />
                    <span className="text-sm text-slate-400 hidden sm:block">{day.condition}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {day.humidity}%</span>
                      <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {day.wind} km/h</span>
                    </div>
                    <div className="flex items-center gap-3 w-24 justify-end">
                      <span className="font-bold">{day.high}°</span>
                      <span className="text-slate-500">{day.low}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* ANALYTICS CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Temperature Trend */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-red-400" />
                Temperature Trend (24h)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={2} fill="url(#tempGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Humidity Trend */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                Humidity Trend (24h)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="humidity" stroke="#22d3ee" strokeWidth={2} fill="url(#humidityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* AQI Trend */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-orange-400" />
                Air Quality Index (24h)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="aqi" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Wind Trend */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-sky-400" />
                Wind Speed Trend (24h)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="wind" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* AQI & ENVIRONMENTAL INSIGHTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main AQI Card */}
            <GlassCard className="p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Air Quality Index
              </h3>
              <div className="flex flex-col items-center">
                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center bg-gradient-to-br ${aqiColorInfo.gradient} border-2 border-white/10`}>
                  <div className="text-center">
                    <p className="text-5xl font-bold">{aqiData.aqi}</p>
                    <p className={`text-sm font-medium mt-1 ${aqiColorInfo.text}`}>{aqiColorInfo.label}</p>
                  </div>
                </div>
                <div className="w-full mt-6 space-y-3">
                  {aqiBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{item.name}</span>
                        <span className="font-medium">{item.value} µg/m³</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                          style={{ width: `${Math.min((item.value / item.fullMark) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Pollutant Breakdown */}
            <GlassCard className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Pollutant Composition
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={aqiBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {aqiBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#22d3ee', '#818cf8', '#fbbf24', '#f87171', '#a78bfa'][index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-1">Primary Pollutant</p>
                    <p className="text-xl font-bold text-amber-400">PM2.5 Particulate Matter</p>
                    <p className="text-xs text-slate-500 mt-1">Concentration: {aqiData.pm25} µg/m³</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-1">Health Recommendation</p>
                    <p className="text-sm">Sensitive individuals should limit prolonged outdoor exertion. General public is unlikely to be affected.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400 mb-1">Visibility Impact</p>
                    <p className="text-sm">Haze may reduce visibility to 8-10 km during peak hours.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* SMART ALERTS */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Smart Weather Alerts
              </h3>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
                {alerts.length} Active
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getSeverityStyles(alert.severity)}`}
                >
                  <div className="p-2 rounded-lg bg-white/5">
                    <alert.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-1">{alert.time}</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SYSTEM HEALTH */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              System Health Monitor
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: Database, label: 'API Status', value: systemHealth.apiStatus, status: 'operational', color: 'text-emerald-400' },
                { icon: Wifi, label: 'WebSocket', value: systemHealth.websocketStatus, status: 'connected', color: 'text-emerald-400' },
                { icon: Clock, label: 'Last Sync', value: systemHealth.lastSync, status: 'recent', color: 'text-blue-400' },
                { icon: RefreshCw, label: 'Refresh Rate', value: systemHealth.refreshRate, status: 'optimal', color: 'text-cyan-400' },
                { icon: Database, label: 'DB Writes', value: systemHealth.dbWrites.toLocaleString(), status: 'active', color: 'text-violet-400' },
                { icon: Shield, label: 'Uptime', value: systemHealth.uptime, status: 'excellent', color: 'text-emerald-400' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                  <item.icon className={`w-6 h-6 mx-auto ${item.color}`} />
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm font-bold">{item.value}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${item.color} bg-white/5`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Connection Flow */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-slate-400 mb-3">Data Pipeline Flow</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {['OpenWeather API', 'Node.js Backend', 'Weather Service', 'Socket.IO Server', 'React Dashboard', 'Charts + Widgets'].map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {step}
                    </span>
                    {idx < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* FOOTER */}
          <div className="text-center py-8 text-sm text-slate-500">
            <p>Fikr Smart School System — Environmental Intelligence Module v2.4.1</p>
            <p className="mt-1">Powered by MERN Stack + Socket.IO + Recharts</p>
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper icon component for calendar
const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default AdminWeatherDashboard;
