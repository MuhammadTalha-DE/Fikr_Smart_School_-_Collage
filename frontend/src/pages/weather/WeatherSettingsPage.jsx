import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { getWeatherSettings, updateWeatherSettings } from '../../services/weatherService';
import WeatherSettingsForm from '../../components/weather/WeatherSettingsForm';
import WeatherSkeleton from '../../components/weather/WeatherSkeleton';
import WeatherEmptyState from '../../components/weather/WeatherEmptyState';

const WeatherSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await getWeatherSettings();
        setSettings(res.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (data) => {
    try {
      const res = await updateWeatherSettings(data);
      setSettings(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return (
    <Layout role="admin"><div className="p-6">
      <WeatherSkeleton />
    </div></Layout>
  );

  if (error) return (
    <Layout role="admin"><div className="p-6">
      <WeatherEmptyState message={error} onRetry={() => window.location.reload()} />
    </div></Layout>
  );

  if (!settings) return (
    <Layout role="admin"><div className="p-6">
      <WeatherEmptyState message="No settings found" subtitle="Default settings will be created automatically." />
    </div></Layout>
  );

  return (
    <Layout role="admin">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weather Settings</h1>
            <p className="text-sm text-gray-500">Configure weather monitoring and alerts</p>
          </div>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            Settings saved!
          </div>
        )}
      </div>

      <WeatherSettingsForm
        settings={settings}
        onSave={handleSave}
        loading={loading}
      />

      {/* System Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Current Location: </span>
            <span className="font-medium">{settings.locationName}</span>
          </div>
          <div>
            <span className="text-gray-500">Coordinates: </span>
            <span className="font-medium">{settings.latitude}, {settings.longitude}</span>
          </div>
          <div>
            <span className="text-gray-500">Auto Alerts: </span>
            <span className={`font-medium ${settings.autoAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
              {settings.autoAlertsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default WeatherSettingsPage;
