import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { FiCamera, FiCameraOff, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CameraCapture = forwardRef(({ onReady, className = '' }, ref) => {
  const {
    videoRef,
    canvasRef,
    isReady,
    error,
    cameras,
    activeCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capture,
  } = useCamera();

  // Expose capture method to parent
  useImperativeHandle(ref, () => ({
    capture,
    isReady,
    startCamera,
    stopCamera,
  }));

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (onReady) onReady(isReady);
  }, [isReady]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-center">
        <FiCameraOff className="text-red-400 text-4xl mb-3" />
        <p className="text-white font-medium">{error}</p>
        <button
          onClick={() => startCamera()}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          <FiRefreshCw className="inline mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera feed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto rounded-2xl"
          style={{ transform: 'scaleX(-1)', minHeight: '300px' }}
        />

        {/* Recording indicator */}
        {isReady && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Live</span>
          </div>
        )}

        {/* Camera switch button */}
        {cameras.length > 1 && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => {
                const nextCam = cameras.find(c => c.deviceId !== activeCamera);
                if (nextCam) switchCamera(nextCam.deviceId);
              }}
              className="bg-black/50 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/70 transition"
              title="Switch camera"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">Starting camera...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

CameraCapture.displayName = 'CameraCapture';
export default CameraCapture;