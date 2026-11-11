import { useState } from 'react';
import { FiCamera, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const startScanning = () => {
    setScanning(true);
    // In production, use a QR scanner library like react-qr-reader
    // For now, simulate a scan after 3 seconds
    toast.success('Camera opened (simulated)');

    setTimeout(() => {
      const mockData = {
        classId: 'demo-class-id',
        date: new Date().toISOString().split('T')[0],
        teacher: 'Demo Teacher',
        type: 'attendance',
      };
      setScannedData(mockData);
      setScanning(false);
      toast.success('QR Code scanned!');
    }, 3000);
  };

  const confirmAttendance = () => {
    if (scannedData) {
      onScan?.(scannedData);
      toast.success('Attendance marked via QR!');
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          {!scanning && !scannedData ? (
            <>
              <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <FiCamera className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Position the QR code within the frame to scan
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <FiCamera className="w-4 h-4" />
                Start Scanning
              </button>
            </>
          ) : scanning ? (
            <div className="py-8">
              <div className="w-48 h-48 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-2 border-sky-500 rounded-xl animate-pulse" />
                <div className="absolute inset-4 border-2 border-dashed border-sky-300 rounded-lg" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-sky-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500" />
                Scanning...
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-green-700 mb-2">
                QR Code Scanned!
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 text-left text-sm space-y-1 mb-4">
                <p className="text-gray-600">
                  <span className="font-medium">Class:</span>{' '}
                  {scannedData?.classId || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Date:</span>{' '}
                  {scannedData?.date || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Teacher:</span>{' '}
                  {scannedData?.teacher || 'N/A'}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={confirmAttendance}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Confirm & Mark Present
                </button>
                <button
                  onClick={() => {
                    setScannedData(null);
                    startScanning();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <FiRefreshCw className="w-4 h-4" /> Scan Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
