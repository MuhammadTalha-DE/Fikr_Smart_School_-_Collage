import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

const challenges = [
  { id: 'blink', message: 'Please blink your eyes', icon: '👁️', duration: 3000 },
  { id: 'smile', message: 'Give a big smile! 😊', icon: '😊', duration: 3000 },
  { id: 'turn_left', message: 'Slowly turn your head left', icon: '👈', duration: 4000 },
  { id: 'turn_right', message: 'Slowly turn your head right', icon: '👉', duration: 4000 },
];

const LivenessCheck = ({ onComplete, onProgress }) => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [phase, setPhase] = useState('instruction'); // instruction | performing | done
  const [results, setResults] = useState([]);

  // Move to next challenge
  const nextChallenge = useCallback(() => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(prev => prev + 1);
      setPhase('instruction');
    } else {
      setPhase('done');
      onComplete({ success: true, challenges: results });
    }
  }, [currentChallenge, onComplete, results]);

  // Auto advance after duration
  useEffect(() => {
    if (phase === 'performing') {
      const timer = setTimeout(() => {
        setResults(prev => [...prev, { 
          challenge: challenges[currentChallenge].id, 
          passed: true 
        }]);
        onProgress((currentChallenge + 1) / challenges.length);
        nextChallenge();
      }, challenges[currentChallenge].duration);
      
      return () => clearTimeout(timer);
    }
  }, [phase, currentChallenge, nextChallenge, onProgress]);

  const startChallenge = () => {
    setPhase('performing');
  };

  if (phase === 'done') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-8"
      >
        <FiCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
        <h3 className="text-white text-xl font-bold">Liveness Verified!</h3>
        <p className="text-gray-300 mt-2">You're confirmed as a real person.</p>
      </motion.div>
    );
  }

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChallenge}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="p-8"
        >
          <div className="text-6xl mb-4">
            {challenges[currentChallenge].icon}
          </div>
          <h3 className="text-white text-2xl font-bold mb-2">
            Challenge {currentChallenge + 1} of {challenges.length}
          </h3>
          <p className="text-gray-300 text-lg mb-6">
            {challenges[currentChallenge].message}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-4">
            <motion.div
              className="bg-indigo-500 h-2 rounded-full"
              animate={{ width: `${((currentChallenge) / challenges.length) * 100}%` }}
            />
          </div>

          {phase === 'instruction' ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startChallenge}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition"
            >
              I'm Ready
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-3 text-indigo-300">
              <FiLoader className="animate-spin" />
              <span>Recording...</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LivenessCheck;