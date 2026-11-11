import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiActivity, FiUsers, FiBookOpen, FiArrowRight, FiShield, FiZap, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/logo.png';
import { validateForm, getFirstValidationError } from '../../utils/validation';
import { loginSchema } from '../../utils/validationSchemas';

const Login = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    parentRating: 4.9,
  });

  const [animatedStats, setAnimatedStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    parentRating: 0,
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAssembled, setIsAssembled] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [clickRipple, setClickRipple] = useState(null);
  const heroRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/public/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    };
    fetchStats();

    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAssembled) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        teachers: Math.round(stats.teachers * easeOut),
        students: Math.round(stats.students * easeOut),
        classes: Math.round(stats.classes * easeOut),
        parentRating: +(stats.parentRating * easeOut).toFixed(1),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [stats, isAssembled]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current || !isAssembled) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAssembled]);

  const handleAssemble = useCallback((e) => {
    if (isAssembling || isAssembled) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setClickRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: Date.now(),
      });
    }

    setIsAssembling(true);

    setTimeout(() => {
      setIsAssembled(true);
      setIsAssembling(false);
    }, 2000);
  }, [isAssembling, isAssembled]);

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateForm(loginSchema, formData);
    if (!validation.isValid) {
      setError(getFirstValidationError(validation.errors));
      return;
    }

    setLoading(true);
    try {
      const user = await login({ username: formData.username, password: formData.password });
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Generate scattered particles
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.5 + 0.2,
    color: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'][Math.floor(Math.random() * 5)],
    targetX: 50 + (Math.random() - 0.5) * 30,
    targetY: 50 + (Math.random() - 0.5) * 30,
  }));

  const floatingShapes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    type: ['circle', 'square', 'triangle', 'diamond'][Math.floor(Math.random() * 4)],
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    size: Math.random() * 40 + 20,
    rotation: Math.random() * 360,
    delay: Math.random() * 3,
    duration: Math.random() * 8 + 10,
    opacity: Math.random() * 0.15 + 0.05,
  }));

  const tiltStyle = isAssembled ? {
    transform: `perspective(1000px) rotateY(${mousePosition.x * 3}deg) rotateX(${-mousePosition.y * 3}deg)`,
    transition: 'transform 0.1s ease-out',
  } : {};

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-slate-950 cursor-pointer select-none"
      onClick={handleAssemble}
    >
      {/* Deep Space Background */}
      <div className="absolute inset-0">
        {/* Nebula Effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Star Field */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Geometric Shapes - Scattered State */}
        {!isAssembled && floatingShapes.map((shape) => (
          <div
            key={`shape-${shape.id}`}
            className="absolute transition-all duration-[2000ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
              opacity: shape.opacity,
              transform: `rotate(${shape.rotation}deg) scale(${isAssembling ? 0 : 1})`,
              transitionDelay: `${shape.delay * 100}ms`,
            }}
          >
            {shape.type === 'circle' && (
              <div className="w-full h-full rounded-full border border-sky-400/30" />
            )}
            {shape.type === 'square' && (
              <div className="w-full h-full border border-indigo-400/30 rotate-45" />
            )}
            {shape.type === 'triangle' && (
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-sky-400/20" />
            )}
            {shape.type === 'diamond' && (
              <div className="w-full h-full border border-purple-400/30 rotate-45" />
            )}
          </div>
        ))}

        {/* Energy Particles */}
        {particles.map((p) => (
          <div
            key={`particle-${p.id}`}
            className="absolute rounded-full transition-all duration-[2000ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              width: p.size,
              height: p.size,
              left: isAssembled ? `${p.targetX}%` : `${p.x}%`,
              top: isAssembled ? `${p.targetY}%` : `${p.y}%`,
              backgroundColor: p.color,
              opacity: isAssembling ? 1 : p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              transform: isAssembling ? 'scale(1.5)' : 'scale(1)',
              transitionDelay: `${p.delay * 50}ms`,
              filter: isAssembling ? 'blur(0px)' : 'blur(1px)',
            }}
          />
        ))}

        {/* Connection Lines (visible during assembly) */}
        {isAssembling && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {particles.slice(0, 15).map((p, i) => {
              const nextP = particles[(i + 1) % particles.length];
              return (
                <line
                  key={`line-${i}`}
                  x1={`${p.x}%`}
                  y1={`${p.y}%`}
                  x2={`${nextP.x}%`}
                  y2={`${nextP.y}%`}
                  stroke={p.color}
                  strokeWidth="0.5"
                  opacity="0.3"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Click Ripple Effect */}
      {clickRipple && (
        <div
          key={clickRipple.id}
          className="absolute pointer-events-none"
          style={{
            left: clickRipple.x,
            top: clickRipple.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div 
            className="w-4 h-4 rounded-full bg-sky-400/80"
            style={{
              animation: 'rippleExpand 2s ease-out forwards',
            }}
          />
        </div>
      )}

      {/* Pre-Assembly Center Message */}
      {!isAssembled && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${isAssembling ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="relative">
            {/* Orbiting Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-sky-500/20 animate-[spin_8s_linear_infinite]" />
              <div className="absolute w-36 h-36 rounded-full border border-indigo-500/20 animate-[spin_6s_linear_infinite_reverse]" />
              <div className="absolute w-24 h-24 rounded-full border border-purple-500/20 animate-[spin_4s_linear_infinite]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-[0_0_60px_rgba(56,189,248,0.5)] animate-pulse">
                <img src={logo} alt="Fikr Smart School" className="h-12 w-12 rounded-2xl object-cover" />
              </div>

              <div className="text-center">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-sky-200 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                  Fikr Smart School
                </h1>
                <p className="mt-3 text-lg text-slate-400 font-light tracking-wide">
                  Click anywhere to enter
                </p>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-sky-500/50" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-sky-400"
                      style={{ animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }}
                    />
                  ))}
                </div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-sky-500/50" />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes rippleExpand {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.5); }
          100% { transform: scale(100); opacity: 0; box-shadow: 0 0 0 50px rgba(56, 189, 248, 0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .glass-panel {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(56, 189, 248, 0.15);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .glass-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card:hover {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(56, 189, 248, 0.3);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3), 0 0 30px rgba(56, 189, 248, 0.15);
        }
        .input-glow:focus {
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2), 0 0 30px rgba(56, 189, 248, 0.2);
        }
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transform: rotate(25deg);
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Main Content - Appears After Assembly */}
      <div 
        className={`relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8 transition-all duration-1000 ${isAssembled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">

          {/* Left Panel - 3D Hero */}
          <section 
            ref={heroRef}
            className={`hidden flex-col justify-between rounded-[32px] glass-panel p-8 lg:flex xl:p-10 ${isAssembled ? 'animate-slideInLeft' : ''}`}
            style={tiltStyle}
          >
            <div>
              {/* Logo & Brand */}
              <div className="mb-10 flex items-center gap-5">
                <div className="relative group">
                  <div className="flex h-18 w-18 items-center justify-center rounded-[24px] bg-gradient-to-br from-sky-500 to-indigo-600 shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all duration-500 group-hover:shadow-[0_0_60px_rgba(56,189,248,0.6)]">
                    <img src={logo} alt="Fikr Smart School" className="h-11 w-11 rounded-2xl object-cover" />
                  </div>
                  <div className="absolute -inset-2 rounded-[28px] border border-sky-400/30 animate-[pulse-ring_3s_ease-out_infinite]" />
                  <div className="absolute -inset-2 rounded-[28px] border border-sky-400/20 animate-[pulse-ring_3s_ease-out_infinite_1s]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400/80">
                    Enterprise Platform
                  </p>
                  <h1 className="mt-1 text-4xl font-bold bg-gradient-to-r from-white via-sky-100 to-slate-300 bg-clip-text text-transparent">
                    Fikr Smart School
                  </h1>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                    Next-generation educational management(ERP+LMS) with real-time analytics, 
                    secure role-based access, and immersive data visualization.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FiUsers, value: animatedStats.students, suffix: '+', label: 'Active Students', color: 'from-sky-500 to-cyan-400', glow: 'shadow-sky-500/30' },
                  { icon: FiBookOpen, value: animatedStats.classes, suffix: '', label: 'Academic Classes', color: 'from-indigo-500 to-purple-400', glow: 'shadow-indigo-500/30' },
                  { icon: FiActivity, value: animatedStats.teachers, suffix: '+', label: 'Teaching Staff', color: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/30' },
                  { icon: FiZap, value: animatedStats.parentRating, suffix: '/5', label: 'Trust Score', color: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/30' },
                ].map((stat, idx) => (
                  <div 
                    key={stat.label}
                    className={`glass-card rounded-[24px] p-5 group cursor-default ${isAssembled ? 'animate-scaleIn' : ''}`}
                    style={{ animationDelay: `${idx * 100 + 500}ms`, opacity: isAssembled ? 1 : 0 }}
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight tabular-nums">
                      {stat.value}{stat.suffix}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </p>

                    {/* Mini progress bar */}
                    <div className="mt-3 h-1 w-full rounded-full bg-slate-700/50 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                        style={{ 
                          width: isAssembled ? `${Math.min((stat.value / (stat.label === 'Trust Score' ? 5 : 1000)) * 100, 100)}%` : '0%',
                          transitionDelay: `${idx * 100 + 800}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Feature Card */}
            <div 
              className={`mt-8 rounded-[24px] border border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm ${isAssembled ? 'animate-slideUp' : ''}`}
              style={{ animationDelay: '900ms', opacity: isAssembled ? 1 : 0 }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                  <FiArrowRight className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/80">
                    Production Ready
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Built with React 18, Tailwind CSS, and enterprise-grade security. 
                    Real-time sync, offline support, and 99.9% uptime SLA.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Panel - Login Form */}
          <section className={`mx-auto flex w-full max-w-xl items-center ${isAssembled ? 'animate-slideUp' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="w-full rounded-[32px] glass-panel p-8 sm:p-10">

              {/* Form Header */}
              <div className="mb-8 text-center lg:text-left">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-sky-500 to-indigo-600 shadow-[0_0_40px_rgba(56,189,248,0.3)] lg:mx-0">
                  <img src={logo} alt="Fikr Smart School" className="h-10 w-10 rounded-2xl object-cover" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400/80">
                  Secure Authentication
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Sign in to access your personalized workspace.
                </p>
              </div>

              {/* ─── FACE LOGIN BUTTON ─────────────────────── */}
              <div className="mb-6">
               <Link
  to="/face-login"
  className="group relative w-full flex items-center justify-center gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 py-4 text-sm font-bold text-sky-400 backdrop-blur-sm transition-all duration-300 hover:from-sky-500/20 hover:to-indigo-500/20 hover:border-sky-500/50 hover:text-sky-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]"
>
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
    <FiCamera className="h-5 w-5 text-white" />
  </div>
  <span>Login with Face ID</span>
</Link>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900/80 px-4 text-slate-500 uppercase tracking-wider">
                    or continue with password
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 animate-scaleIn rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Username Field */}
                <div className="group">
                  <label className="mb-2 block text-sm font-semibold text-slate-300 transition-colors group-focus-within:text-sky-400">
                    Username
                  </label>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-300 ${focusedField === 'username' ? 'text-sky-400' : 'text-slate-500'}`}>
                      <FiMail className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="input-glow w-full rounded-2xl border border-slate-700/60 bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-sky-500/50 focus:bg-slate-800/80"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 group-focus-within:w-full rounded-b-2xl" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label className="mb-2 block text-sm font-semibold text-slate-300 transition-colors group-focus-within:text-sky-400">
                    Password
                  </label>
                  <div className="relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-sky-400' : 'text-slate-500'}`}>
                      <FiLock className="h-5 w-5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="input-glow w-full rounded-2xl border border-slate-700/60 bg-slate-800/50 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-sky-500/50 focus:bg-slate-800/80"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition-all duration-300 hover:text-sky-400"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 group-focus-within:w-full rounded-b-2xl" />
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-semibold text-sky-400 transition-all duration-300 hover:text-sky-300 hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-shine relative w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-4 text-sm font-bold text-white shadow-[0_0_40px_rgba(56,189,248,0.3)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(56,189,248,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" fill="none" stroke="currentColor" strokeWidth="4" cx="12" cy="12" r="10" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

           

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
                <FiShield className="h-3.5 w-3.5" />
                <span><h>256-bit TLS encryption · Face ID · SOC 2 compliant</h></span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
