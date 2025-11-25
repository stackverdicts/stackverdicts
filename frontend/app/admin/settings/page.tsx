'use client';

import { useEffect, useState } from 'react';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  is_encrypted: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SettingsByCategory {
  [category: string]: Setting[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('integrations');
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { id: 'integrations', name: 'Integrations', icon: '🔌' },
    { id: 'marketing', name: 'Pop-up', icon: '💬' },
    { id: 'general', name: 'General', icon: '⚙️' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      const data = await response.json();
      setSettings(data.settings);

      // Initialize form data
      const initialFormData: { [key: string]: any } = {};
      Object.values(data.settings).flat().forEach((setting: any) => {
        initialFormData[setting.setting_key] = setting.setting_value;
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Get current category settings
      const categorySettings = settings[activeCategory] || [];
      const updates = categorySettings.map((setting) => ({
        key: setting.setting_key,
        value: formData[setting.setting_key],
      }));

      const response = await fetch('http://localhost:3001/api/settings/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload settings to get updated timestamps
      await loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage('Failed to save settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(key: string, value: any) {
    setFormData({
      ...formData,
      [key]: value,
    });
  }

  function renderInput(setting: Setting) {
    const value = formData[setting.setting_key] ?? '';
    const isPassword = setting.is_encrypted || setting.setting_key.includes('password') || setting.setting_key.includes('api_key');

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={setting.setting_key}
              checked={value === true || value === 'true'}
              onChange={(e) => handleInputChange(setting.setting_key, e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor={setting.setting_key} className="ml-2 block text-sm text-gray-700">
              {setting.description || setting.setting_key}
            </label>
          </div>
        );

      case 'number':
        return (
          <div>
            <label htmlFor={setting.setting_key} className="block text-sm font-medium text-gray-700 mb-1">
              {setting.description || setting.setting_key}
            </label>
            <input
              type="number"
              id={setting.setting_key}
              value={value}
              onChange={(e) => handleInputChange(setting.setting_key, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        );

      case 'json':
        return (
          <div>
            <label htmlFor={setting.setting_key} className="block text-sm font-medium text-gray-700 mb-1">
              {setting.description || setting.setting_key}
            </label>
            <textarea
              id={setting.setting_key}
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange(setting.setting_key, parsed);
                } catch {
                  handleInputChange(setting.setting_key, e.target.value);
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        );

      case 'string':
      default:
        return (
          <div>
            <label htmlFor={setting.setting_key} className="block text-sm font-medium text-gray-700 mb-1">
              {setting.description || setting.setting_key}
            </label>
            <input
              type={isPassword ? 'password' : 'text'}
              id={setting.setting_key}
              value={value}
              onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={isPassword ? '••••••••' : ''}
            />
          </div>
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const currentSettings = settings[activeCategory] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500 mt-1">Configure your application settings</p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {/* Category Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeCategory === category.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Form */}
          <div className="p-6">
            {currentSettings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No settings found for this category</p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentSettings.map((setting) => (
                  <div key={setting.id}>
                    {renderInput(setting)}
                  </div>
                ))}

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Settings Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Changes are saved immediately when you click "Save Settings"</li>
            <li>• Sensitive credentials are stored securely in the database</li>
            <li>• API keys are required for integrations to function properly</li>
            <li>• Automation settings control auto-publishing behavior</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
