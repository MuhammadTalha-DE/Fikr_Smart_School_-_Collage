import { useState } from 'react';
import { FiRefreshCw, FiCopy, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QRGenerator = ({ classId, className, date, teacherName, onRegenerate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrData, setQrData] = useState(null);

  const generateQR = () => {
    setIsGenerating(true);
    // In production, call API to generate QR
    const data = {
      classId,
      date,
      teacher: teacherName,
      timestamp: Date.now(),
      type: 'attendance',
    };

    // Generate a QR code string (in production, use a QR library like qrcode.react)
    const qrString = JSON.stringify(data);
    setQrData({
      id: `QR-${Date.now().toString(36)}`,
      string: qrString,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    setIsGenerating(false);
    toast.success('QR Code generated!');
  };

  const copyToClipboard = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData.string);
      toast.success('QR data copied to clipboard');
    }
  };

  const downloadQR = () => {
    if (qrData) {
      // In production, download actual QR image
      toast.success('QR Code downloaded (simulated)');
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            QR Attendance
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Generate a QR code for students to scan
          </p>
        </div>
        {className && (
          <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium">
            {className}
          </span>
        )}
      </div>

      {!qrData ? (
        <div className="text-center py-8">
          <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">QR Code Preview</p>
          </div>
          <button
            onClick={generateQR}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center border-2 shadow-lg">
            {/* In production, render actual QR code using qrcode.react */}
            <div className="text-center">
              <div className="grid grid-cols-5 gap-1 w-32 h-32 mx-auto">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[8px] text-gray-400 mt-1">Scan me</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs text-gray-500">
              ID: {qrData.id} · Expires:{' '}
              {new Date(qrData.expiresAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <FiCopy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={downloadQR}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <FiDownload className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => {
                generateQR();
                onRegenerate?.();
              }}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <FiRefreshCw className="w-4 h-4" /> Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
