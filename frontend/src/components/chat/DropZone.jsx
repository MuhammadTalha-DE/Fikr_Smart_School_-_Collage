import { useState, useCallback } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DropZone = ({ onFile, disabled }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      onFile(file);
    }
  }, [onFile]);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      onFile(file);
    }
  };

  const clearPreview = () => setPreview(null);

  return (
    <motion.div
      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
        dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/20'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
    >
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="max-h-40 rounded-lg" />
          <button onClick={clearPreview} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div className="text-white/60">
          <FiUpload className="mx-auto text-2xl mb-1" />
          <p className="text-xs">Drag & drop an image or <label className="text-indigo-400 cursor-pointer hover:underline">browse</label></p>
          <input type="file" accept="image/*" onChange={handleChange} className="hidden" id="file-upload" />
        </div>
      )}
    </motion.div>
  );
};

export default DropZone;