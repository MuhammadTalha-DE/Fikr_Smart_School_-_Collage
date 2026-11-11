import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiCoffee, FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MessMenuManagement = () => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [days, setDays] = useState(DAYS.map(d => ({ day: d, breakfast: '', lunch: '', dinner: '' })));
  const [loading, setLoading] = useState(false);

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay(); // 0=Sun
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
  }

  useEffect(() => {
    // load existing menu for the week
    const fetchMenu = async () => {
      try {
        const { data } = await api.get(`/mess-menu?date=${weekStart}`);
        if (data.days?.length) {
          const existingDays = DAYS.map(d => {
            const found = data.days.find(dd => dd.day === d);
            return found || { day: d, breakfast: '', lunch: '', dinner: '' };
          });
          setDays(existingDays);
        } else {
          // reset empty
          setDays(DAYS.map(d => ({ day: d, breakfast: '', lunch: '', dinner: '' })));
        }
      } catch (err) { /* ignore */ }
    };
    fetchMenu();
  }, [weekStart]);

  const handleChange = (dayIdx, meal, value) => {
    const updated = [...days];
    updated[dayIdx][meal] = value;
    setDays(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/mess-menu', { weekStart, days });
      toast.success('Menu saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="warden">
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-950 to-black p-6 relative overflow-hidden">
        {/* Floating food emojis */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {['🍚','🍛','🍔','🥗','🍕','🍩','🍪','🥩','🥞'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -30, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-extrabold text-white mb-8 flex items-center gap-3">
            <FiCoffee className="text-yellow-400 w-12 h-12 animate-pulse" /> Mess Menu Manager
          </motion.h1>

          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 mb-6"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <label className="text-white font-semibold">Week Starting:</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                style={{ WebkitTextFillColor: 'white', colorScheme: 'dark' }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {days.map((day, idx) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02, rotateY: 2 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FiSun className="text-yellow-400" /> {day.day}
                    </h3>
                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="text-xs text-gray-300 flex items-center gap-1"><FiCoffee className="w-3 h-3" /> Breakfast</label>
                        <input
                          type="text"
                          value={day.breakfast}
                          onChange={(e) => handleChange(idx, 'breakfast', e.target.value)}
                          placeholder="e.g., Paratha, Egg"
                          className="w-full bg-white/5 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
                          style={{ WebkitTextFillColor: 'white' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300 flex items-center gap-1"><FiSun className="w-3 h-3" /> Lunch</label>
                        <input
                          type="text"
                          value={day.lunch}
                          onChange={(e) => handleChange(idx, 'lunch', e.target.value)}
                          placeholder="e.g., Rice, Curry"
                          className="w-full bg-white/5 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
                          style={{ WebkitTextFillColor: 'white' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-300 flex items-center gap-1"><FiMoon className="w-3 h-3" /> Dinner</label>
                        <input
                          type="text"
                          value={day.dinner}
                          onChange={(e) => handleChange(idx, 'dinner', e.target.value)}
                          placeholder="e.g., Chicken, Bread"
                          className="w-full bg-white/5 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
                          style={{ WebkitTextFillColor: 'white' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-400/30 hover:shadow-yellow-400/50 transition-all disabled:opacity-50"
              >
                <FiSave className="inline mr-2" /> {loading ? 'Saving...' : 'Save Weekly Menu'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default MessMenuManagement;