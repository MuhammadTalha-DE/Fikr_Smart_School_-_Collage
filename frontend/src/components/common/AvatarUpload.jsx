import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiCamera, FiTrash2, FiLoader } from 'react-icons/fi';

const AvatarUpload = ({ currentAvatar, userName, onAvatarUpdated }) => {
  const [preview, setPreview] = useState(null);          // local object URL for preview
  const [selectedFile, setSelectedFile] = useState(null); // actual File object
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Allowed image types – wide support
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const MAX_SIZE_MB = 5;   // 5 MB

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Generate preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSelectedFile(file);

    // Clean up old blob URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const { data } = await api.put('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Assume backend returns { avatarUrl: '...' }
      if (data.avatarUrl) {
        if (onAvatarUpdated) {
          onAvatarUpdated(data.avatarUrl);   // notify parent / context
        }
        toast.success('Profile picture updated!');
        // Reset state
        setSelectedFile(null);
        setPreview(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initials = (userName || '?').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
      />

      {/* Avatar circle – shows current avatar or preview */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full border-2 border-white shadow-lg overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : currentAvatar ? (
            <img src={currentAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Hover overlay – click to change */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          title="Change photo"
        >
          <FiCamera className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Action buttons when a new file is selected */}
      {selectedFile && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <FiLoader className="animate-spin" /> Uploading…
              </>
            ) : (
              'Upload Photo'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition disabled:opacity-60 flex items-center gap-1"
          >
            <FiTrash2 /> Cancel
          </button>
        </div>
      )}

      {/* Helper text */}
      {!selectedFile && (
        <p className="text-xs text-gray-500">
          PNG, JPG, JPEG, WEBP • Max {MAX_SIZE_MB}MB
        </p>
      )}
    </div>
  );
};

export default AvatarUpload;