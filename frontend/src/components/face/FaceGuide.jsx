import { motion } from 'framer-motion';

const FaceGuide = ({ position = 'center', message = 'Position your face in the oval' }) => {
  return (
    <div className="relative">
      {/* Oval guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      >
        <div className="w-64 h-80 border-4 border-indigo-400/60 rounded-[50%] animate-pulse" />
      </motion.div>

      {/* Instruction message */}
      <motion.p
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-5 py-2 text-white text-sm font-medium z-10"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default FaceGuide;