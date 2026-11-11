import { motion } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';

const ChatButton = ({ onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label="Open Fikr AI chatbot"
    title="Open Fikr AI"
    className="chat-float-btn fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-[calc(env(safe-area-inset-right)+1.5rem)] md:bottom-[calc(env(safe-area-inset-bottom)+2rem)] md:right-[calc(env(safe-area-inset-right)+2rem)] z-[9998] w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-indigo-500/30"
    whileHover={{ rotate: [0, -15, 15, 0] }}
  >
    <FiMessageSquare className="w-7 h-7" />
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
  </motion.button>
);

export default ChatButton;
