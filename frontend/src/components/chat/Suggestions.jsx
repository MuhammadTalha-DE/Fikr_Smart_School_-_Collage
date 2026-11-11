import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

const genericSuggestions = [
  'What is my timetable?',
  'Show my attendance',
  'How much fee is due?',
  'Tell me a joke',
];

const Suggestions = ({ onSelect }) => (
  <div className="px-6 py-2">
    <div className="flex flex-wrap gap-2">
      {genericSuggestions.map((s, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(s)}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs transition-all"
        >
          <FiChevronRight className="w-3 h-3" />
          {s}
        </motion.button>
      ))}
    </div>
  </div>
);