import { useState } from 'react';
import { FiSettings } from 'react-icons/fi';

export const ChatSettings = ({ currentModel, currentTemperature, onSave, onClose }) => {
  const [model, setModel] = useState(currentModel || 'llama3-8b-8192');
  const [temperature, setTemperature] = useState(currentTemperature ?? 0.7);

  const handleSave = () => {
    localStorage.setItem('chatModel', model);
    localStorage.setItem('chatTemp', temperature);
    if (onSave) onSave(model, temperature);
  };

  return (
    <div className="absolute top-16 right-4 z-50 glass-card rounded-xl p-5 w-64 animate-scale-in">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
        <FiSettings className="text-sm" /> Chat Settings
      </h3>
      <label className="block text-xs text-white/70 mb-1">Model</label>
      <select
  value={model}
  onChange={e => setModel(e.target.value)}
  className="w-full bg-white/10 border border-white/30 rounded-lg p-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  style={{ WebkitTextFillColor: 'white' }}
>
  <option value="llama-3.1-8b-instant" className="bg-gray-900">Llama 3.1 8B Instant (Fast)</option>
  <option value="llama-3.3-70b-versatile" className="bg-gray-900">Llama 3.3 70B Versatile (Powerful)</option>
  <option value="deepseek-v4-flash">DeepSeek V4 Flash (Cheap · 1M ctx)</option>
<option value="deepseek-v4-pro">DeepSeek V4 Pro (Powerful · 1M ctx)</option>
  <option value="meta-llama/llama-4-scout-17b-16e-instruct" className="bg-gray-900">Llama 4 Scout 17B</option>

</select>
      <label className="block text-xs text-white/70 mb-1">Temperature: {temperature}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={temperature}
        onChange={e => setTemperature(parseFloat(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onClose} className="text-xs text-white/60 hover:text-white px-3 py-1 rounded-lg">
          Cancel
        </button>
        <button onClick={handleSave} className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-600">
          Save
        </button>
      </div>
    </div>
  );
};