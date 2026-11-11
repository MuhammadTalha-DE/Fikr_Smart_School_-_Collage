import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiCamera, FiRefreshCw, FiCheck, FiArrowRight,
  FiShield, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const enrollmentSteps = [
  { id: 'front', label: 'Front Face', icon: '🧑', message: 'Look straight at the camera' },
  { id: 'left', label: 'Left Profile', icon: '👈', message: 'Slowly turn your head to the left' },
  { id: 'right', label: 'Right Profile', icon: '👉', message: 'Slowly turn your head to the right' },
  { id: 'smile', label: 'Smile', icon: '😊', message: 'Give a natural smile' },
  { id: 'up', label: 'Looking Up', icon: '👆', message: 'Tilt your head slightly upward' },
];

const FaceEnrollment = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // ─── Start Camera ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    setCameraError('');

    try {
      // Clean up any existing stream FIRST
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setCameraStatus('ready');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraStatus('error');

      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Click the lock icon in your address bar and allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.');
      } else {
        setCameraError('Could not access camera. Please check your device settings.');
      }
    }
  }, []);

  // ─── Stop Camera ──────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  }, []);

  // ─── Capture Image ────────────────────────────────────────
  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // ─── Handle Capture ───────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (cameraStatus !== 'ready') return;

    setCountdown(3);
    setIsCapturing(true);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);

        const image = captureImage();
        if (image) {
          setCapturedImages(prev => [...prev, image]);
          toast.success(`Image ${capturedImages.length + 1} of ${enrollmentSteps.length} captured!`);

          if (currentStep < enrollmentSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            setShowCompletion(true);
          }
        } else {
          toast.error('Failed to capture. Please try again.');
        }
        setIsCapturing(false);
      }
    }, 1000);
  }, [cameraStatus, currentStep, capturedImages.length, captureImage]);

  // ─── Submit Enrollment ────────────────────────────────────
  const handleSubmit = async () => {
    if (capturedImages.length < 3) {
      toast.error('At least 3 images are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/face/enroll', { images: capturedImages });
      toast.success(data.message || 'Face enrolled successfully!');
      stopCamera();
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Reset & Retake ─────────────────────────────────────── ✅ FIXED
  const handleReset = async () => {
    // Clear captured images and reset step
    setCapturedImages([]);
    setCurrentStep(0);
    setShowCompletion(false);
    setCountdown(null);
    setIsCapturing(false);
    setCameraError('');

    // Restart camera fresh
    stopCamera();
    
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  // ─── Lifecycle ────────────────────────────────────────────
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ─── RENDER: Completion Screen ────────────────────────────
  if (showCompletion) {
    return (
      <Layout role="admin">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <FiCheck className="text-white text-4xl" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">Ready to Enroll!</h2>
              <p className="text-gray-300 mb-1">{capturedImages.length} images captured</p>
              <p className="text-gray-400 text-sm mb-6">Your face profile will be used for secure login</p>

              {/* Thumbnails */}
              <div className="flex gap-2 justify-center mb-8 flex-wrap">
                {capturedImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="relative"
                  >
                    <img
                      src={img}
                      alt={`Capture ${idx + 1}`}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <FiCheck className="text-white text-xs" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><FiLoader className="animate-spin" /> Saving...</>
                  ) : (
                    <><FiShield /> Enroll Face Profile</>
                  )}
                </motion.button>

                {/* ✅ Retake button - now properly restarts camera */}
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
                >
                  <FiRefreshCw /> Retake Images
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // ─── RENDER: Main Enrollment Screen ───────────────────────
  return (
    <Layout role="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-black p-4 md:p-6">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
              <FiShield className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Face Enrollment</h1>
            <p className="text-gray-400 mt-1">Step {currentStep + 1} of {enrollmentSteps.length}</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {enrollmentSteps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      idx < capturedImages.length
                        ? 'bg-green-500 text-white'
                        : idx === currentStep
                        ? 'bg-indigo-500 text-white scale-110'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {idx < capturedImages.length ? <FiCheck /> : idx + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 hidden sm:block">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                animate={{ width: `${(capturedImages.length / enrollmentSteps.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>

          {/* Camera View */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40 mb-6 aspect-[4/3]"
          >
            <canvas ref={canvasRef} className="hidden" />

            {/* Error State */}
            {cameraStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <FiAlertCircle className="text-red-400 text-4xl mb-3" />
                <p className="text-red-300 text-sm mb-4 max-w-xs">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center gap-2 transition text-sm"
                >
                  <FiRefreshCw /> Retry Camera
                </button>
              </div>
            )}

            {/* Loading State */}
            {cameraStatus === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white text-sm">Accessing camera...</p>
              </div>
            )}

            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStatus === 'ready' ? '' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Live Badge */}
            {cameraStatus === 'ready' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Live</span>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <span className="text-7xl font-extrabold text-white">{countdown}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Instruction */}
          {cameraStatus === 'ready' && !isCapturing && (
            <motion.div
              key={currentStep}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-6"
            >
              <div className="text-4xl mb-2">{enrollmentSteps[currentStep].icon}</div>
              <h3 className="text-lg font-bold text-white">{enrollmentSteps[currentStep].label}</h3>
              <p className="text-gray-400 text-sm">{enrollmentSteps[currentStep].message}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          {cameraStatus === 'ready' && (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl transition shadow-xl shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {isCapturing ? (
                  <><FiLoader className="animate-spin" /> Capturing...</>
                ) : (
                  <><FiCamera /> Capture {enrollmentSteps[currentStep].label}</>
                )}
              </motion.button>

              {capturedImages.length >= 3 && (
                <button
                  onClick={() => setShowCompletion(true)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition text-sm flex items-center justify-center gap-1"
                >
                  I'm done — finish now <FiArrowRight />
                </button>
              )}
            </div>
          )}

          {/* Captured count + Reset */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-500 text-xs">
              {capturedImages.length} of {enrollmentSteps.length} captured
            </p>
            {capturedImages.length > 0 && (
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition"
              >
                <FiRefreshCw className="w-3 h-3" /> Reset All
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FaceEnrollment;