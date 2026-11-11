import { useState } from 'react';
import { FiMail, FiKey, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RecoveryForm = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/face/recovery', { email });
      toast.success('Recovery code sent! Check your email.');
      setStep('otp');
    } catch {
      toast.error('Failed to send recovery code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error('Please enter the 6-digit code');
    setLoading(true);
    try {
      const { data } = await api.post('/face/recovery/verify', { email, otp });
      toast.success('Access recovered!');
      onSuccess(data);
    } catch {
      toast.error('Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h3 className="text-lg font-bold text-white text-center">Account Recovery</h3>

      {step === 'email' ? (
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ WebkitTextFillColor: 'white' }}
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition">
            {loading ? 'Sending...' : 'Send Recovery Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-3">
          <div className="relative">
            <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="000000" maxLength={6} required
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={{ WebkitTextFillColor: 'white' }}
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition">
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      )}

      <button onClick={onBack}
        className="w-full text-gray-400 hover:text-white text-sm transition flex items-center justify-center gap-1">
        <FiArrowLeft className="w-4 h-4" /> Back to Face Login
      </button>
    </motion.div>
  );
};

export default RecoveryForm;