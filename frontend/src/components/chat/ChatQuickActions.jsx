import { motion } from 'framer-motion';
import { FiCalendar, FiDollarSign, FiBook, FiHome, FiUser } from 'react-icons/fi';

const actions = {
  general: [
    { icon: FiUser, label: 'Who are you?', query: 'Who are you?' },
    { icon: FiBook, label: 'Tell me a joke', query: 'Tell me a school-related joke' },
    { icon: FiCalendar, label: 'Today\'s date', query: 'What is today\'s date?' },
  ],
  system: [
    { icon: FiCalendar, label: 'My attendance', query: 'What is my attendance this week?' },
    { icon: FiBook, label: 'My timetable', query: 'Show my timetable for today' },
    { icon: FiDollarSign, label: 'Fee status', query: 'What is my fee status?' },
    { icon: FiHome, label: 'Hostel info', query: 'Give me my hostel details' },
    { icon: FiUser, label: 'My profile', query: 'Show my profile' },
  ],
};

const ChatQuickActions = ({ onAction, mode }) => (
  <div className="px-6 py-4">
    <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Quick Actions</p>
    <div className="flex flex-wrap gap-2">
      {actions[mode].map((act, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(act.query)}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition-all"
        >
          <act.icon className="w-4 h-4" />
          {act.label}
        </motion.button>
      ))}
    </div>
  </div>
);

export default ChatQuickActions;