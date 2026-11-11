import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import { FiCoffee, FiSun, FiMoon, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const dayIcons = { Breakfast: <FiCoffee />, Lunch: <FiSun />, Dinner: <FiMoon /> };

const MessMenu = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get('/mess-menu/current');
        setMenu(data);
      } catch (err) { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <Layout role="student">
        <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-950 to-black p-6 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl">🍽️</motion.div>
        </div>
      </Layout>
    );
  }

  if (!menu || !menu.days || menu.days.length === 0) {
    return (
      <Layout role="student">
        <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-950 to-black p-6 flex items-center justify-center">
          <div className="text-center text-white/70">
            <p className="text-4xl mb-4">🍲</p>
            <p className="text-xl font-semibold">No mess menu available for this week.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-950 to-black p-6 relative overflow-hidden">
        {/* Floating food background */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          {['🍚','🍛','🍔','🥗','🍕','🍩','🍪'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-5xl"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-extrabold text-white mb-8 flex items-center gap-3">
            <FiCalendar className="text-yellow-400 w-12 h-12 animate-pulse" /> Weekly Mess Menu
          </motion.h1>

          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {menu.days.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: index * 0.08, type: 'spring' }}
                whileHover={{ scale: 1.04, rotateY: 3 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-5 text-white shadow-xl transform transition-all"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">{day.day}</h2>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-yellow-200 mb-1 text-sm font-medium">
                      <FiCoffee /> Breakfast
                    </div>
                    <p className="text-lg">{day.breakfast || '—'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-orange-200 mb-1 text-sm font-medium">
                      <FiSun /> Lunch
                    </div>
                    <p className="text-lg">{day.lunch || '—'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-indigo-200 mb-1 text-sm font-medium">
                      <FiMoon /> Dinner
                    </div>
                    <p className="text-lg">{day.dinner || '—'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default MessMenu;