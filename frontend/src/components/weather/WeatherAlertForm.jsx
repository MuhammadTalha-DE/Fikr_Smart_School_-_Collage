import { useState } from 'react';
import { Send, X } from 'lucide-react';

const ALERT_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'rain', label: 'Rain' },
  { value: 'heat', label: 'Heat' },
  { value: 'fog', label: 'Fog' },
  { value: 'storm', label: 'Storm' },
  { value: 'aqi', label: 'AQI' },
  { value: 'wind', label: 'Wind' },
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const TARGET_ROLES = ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'];

const WeatherAlertForm = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'manual',
    severity: 'medium',
    targetRoles: ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'],
    expiresInHours: 24,
  });

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Create Weather Alert</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Alert Title</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Heavy Rain Warning"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Message</label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Describe the alert details..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {ALERT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Severity</label>
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {SEVERITIES.map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Expires After (hours)</label>
          <input
            type="number"
            min={1}
            max={168}
            value={form.expiresInHours}
            onChange={(e) => setForm({ ...form, expiresInHours: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Target Roles</label>
        <div className="flex flex-wrap gap-2">
          {TARGET_ROLES.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                form.targetRoles.includes(role)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Send className="w-4 h-4" />
          Create Alert
        </button>
      </div>
    </form>
  );
};

export default WeatherAlertForm;
