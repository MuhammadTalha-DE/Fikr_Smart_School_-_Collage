import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiLock, FiRefreshCw, FiCheckCircle, FiCamera,
  FiAlertCircle, FiLoader, FiShield,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/* ================================================================
   FACE LOGIN — Production‑Ready Biometric Authentication
   ================================================================ */

const FaceLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ─── Refs (survive re‑renders) ──────────────────
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const scanningRef = useRef(false);

  // ─── State ──────────────────────────────────────
  const [step, setStep] = useState('loading');     // loading | idle | scanning | identifying | success | error
  const [error, setError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // ─── Cleanup on unmount ────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ─── Redirect if already logged in ──────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  /* ================================================================
     CAPTURE + IDENTIFY
     ================================================================ */

  const identifyUser = async () => {
    // Prevent concurrent scans
    if (scanningRef.current) return;
    if (!videoRef.current) return;
    if (!mountedRef.current) return;

    scanningRef.current = true;
    setStep('scanning');
    setError('');
    setScanProgress(0);

    // ── Animated progress ──────────────────────────
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setScanProgress(prev => (prev >= 90 ? 90 : prev + 4));
      }
    }, 120);

    // Give the user a moment to position their face
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearInterval(interval);
    if (!mountedRef.current) return;

    try {
      // ── Capture frame from video ──────────────────
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('Camera stream is not ready. Please wait.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Mirror the image (front‑facing camera shows a mirrored preview)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL('image/jpeg', 0.85);

      setScanProgress(100);
      setStep('identifying');

      // ── Send to backend ───────────────────────────
      const { data } = await api.post('/face/identify', { image });

      if (!mountedRef.current) return;

      // ── Success ───────────────────────────────────
      if (data && data.token && data.role) {
        // Store user via context (also sets localStorage)
        await login(data);

        setStep('success');

        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        toast.success(`Welcome back, ${data.name || 'User'}! 👋`);

        // Redirect to dashboard
        setTimeout(() => {
          if (mountedRef.current) {
            navigate(`/${data.role}/dashboard`, { replace: true });
          }
        }, 800);
        return;   // ✅ EXIT — NO retries
      }

      // ── No match ──────────────────────────────────
      throw new Error(data?.message || 'Face not recognized.');
    } catch (err) {
      if (!mountedRef.current) return;

      scanningRef.current = false;
      const message =
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message ||
        'Face recognition failed. Please try again.';

      console.error('Face identify error:', message);
      setError(message);
      setStep('error');
      setRetryCount(prev => prev + 1);
    }
  };

  /* ================================================================
     START CAMERA
     ================================================================ */

  useEffect(() => {
    let stream = null;
    let autoScanTimer = null;

    const startCamera = async () => {
      setStep('loading');
      setError('');

      try {
        // ── Release any previous stream ───────────────
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Small delay for hardware release
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!mountedRef.current) return;

        // ── Request camera ────────────────────────────
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video metadata
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
          });

          if (!mountedRef.current) return;

          // Play video
          await videoRef.current.play();

          setStep('idle');

          // ── Auto‑scan after 1.5 seconds ──────────────
          autoScanTimer = setTimeout(() => {
            if (mountedRef.current) {
              identifyUser();
            }
          }, 1500);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        let message = 'Could not access your camera.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Camera permission denied. Click the lock icon in the address bar → Camera → Allow → refresh.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No camera found. Please connect a webcam.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera is in use by another app. Close all other apps and try again.';
        } else if (err.message === 'Video load timeout') {
          message = 'Camera timed out. Please refresh the page.';
        }

        setError(message);
        setStep('error');
      }
    };

    startCamera();

    return () => {
      mountedRef.current = false;
      if (autoScanTimer) clearTimeout(autoScanTimer);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================================================
     RETRY HANDLER
     ================================================================ */

  const handleRetry = () => {
    scanningRef.current = false;
    setError('');
    setStep('loading');
    setScanProgress(0);

    // Small delay then re‑initialize camera
    setTimeout(() => {
      if (mountedRef.current) {
        window.location.reload();   // cleanest way to reset everything
      }
    }, 300);
  };

  /* ================================================================
     RENDER
     ================================================================ */

  const stepMessages = {
    loading: 'Starting camera…',
    idle: 'Position your face in the frame',
    scanning: 'Scanning your face…',
    identifying: 'Identifying you…',
    success: 'Access granted! Redirecting…',
    error: 'Verification failed',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl"
      >
        {/* ── Header ──────────────────────────────── */}
        <div className="text-center mb-6">
          <motion.div
            animate={step === 'scanning' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20 border-2 border-white/20"
          >
            {step === 'loading' && <FiLoader className="text-white text-4xl animate-spin" />}
            {step === 'identifying' && <FiLoader className="text-white text-4xl animate-spin" />}
            {step === 'success' && <FiCheckCircle className="text-green-400 text-4xl" />}
            {step === 'error' && <FiAlertCircle className="text-amber-400 text-4xl" />}
            {(step === 'idle' || step === 'scanning') && <FiCamera className="text-white text-4xl" />}
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white">Face ID</h1>
          <p className="text-gray-400 mt-1 text-sm">{stepMessages[step] || 'Please wait…'}</p>
        </div>

        {/* ── Camera View ──────────────────────────── */}
        {!error && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black/40 aspect-[4/3] mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Loading overlay */}
            {step === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Scanning progress bar */}
            {step === 'scanning' && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Identifying spinner */}
            {step === 'identifying' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Success checkmark */}
            {step === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              >
                <FiCheckCircle className="text-green-400 text-7xl drop-shadow-lg" />
              </motion.div>
            )}

            {/* Live badge */}
            {step === 'idle' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Live</span>
              </div>
            )}
          </div>
        )}

        {/* ── Error Panel ──────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4"
            >
              <div className="flex items-start gap-3 mb-4">
                <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 text-sm font-semibold">Verification Failed</p>
                  <p className="text-red-300/80 text-xs mt-1">{error}</p>
                  {retryCount > 1 && (
                    <p className="text-gray-500 text-xs mt-2">
                      Multiple attempts failed. Try using password login instead.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <FiRefreshCw className="w-4 h-4" /> Retry
                </button>
                <Link
                  to="/login"
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <FiLock className="w-4 h-4" /> Password
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fallback Link (shown when no error) ──── */}
        {!error && (
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
            >
              <FiLock className="w-4 h-4" /> Login with Password
            </Link>
          </div>
        )}

        {/* ── Security Badge ───────────────────────── */}
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <FiShield className="w-3 h-3" />
          <span>Biometric authentication · End‑to‑end encrypted</span>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceLogin;