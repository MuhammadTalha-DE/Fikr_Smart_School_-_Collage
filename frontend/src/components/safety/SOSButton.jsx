import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Send, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { createAlert } from '../../services/safetyApi';
import { useAuth } from '../../context/AuthContext';

const SOSButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => setLocation('Location unavailable')
      );
    }
  }, []);

  const handleSOS = async () => {
    setSending(true);
    try {
      await createAlert({
        title: '🚨 SOS Emergency',
        message: message || 'SOS button activated',
        type: 'emergency',
        severity: 'critical',
        targetRoles: ['admin', 'teacher', 'warden'],
        location,
      });
      setSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('SOS failed:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* SOS Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 
          text-white shadow-2xl shadow-red-500/50 flex items-center justify-center
          hover:scale-110 hover:shadow-red-500/70 transition-all duration-300
          animate-pulse hover:animate-none group"
        title="SOS Emergency"
      >
        <AlertTriangle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
      </button>

      {/* SOS Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4">
            {/* Modal Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 shadow-2xl border border-red-400/30">
              {/* Close */}
              <button
                onClick={() => { setIsOpen(false); setSent(false); setMessage(''); }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {sent ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-20 h-20 text-green-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">SOS Sent!</h3>
                  <p className="text-red-100">Help is on the way. Admin has been notified.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Emergency SOS</h3>
                    <p className="text-red-100 text-sm mt-1">
                      This will send an urgent alert to school admin
                    </p>
                  </div>

                  {/* User Info */}
                  <div className="bg-white/10 rounded-xl p-3 mb-4">
                    <p className="text-white text-sm">
                      <span className="font-semibold">{user?.name}</span> ({user?.role})
                    </p>
                    {location && (
                      <p className="text-red-200 text-xs mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {location}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your emergency (optional)..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-red-200 
                      focus:outline-none focus:ring-2 focus:ring-white/40 resize-none h-24 text-sm"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSOS}
                    disabled={sending}
                    className="mt-4 w-full py-4 rounded-2xl bg-white text-red-700 font-bold text-lg
                      hover:bg-red-50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send SOS Alert
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
