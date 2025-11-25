'use client';

import { useEffect, useState } from 'react';
import MediaPicker from '../../components/MediaPicker';

interface MarketingPopup {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  display_frequency: 'once_per_session' | 'every_page_view' | 'once_per_day' | 'once_per_week';
  is_active: boolean;
  delay_seconds: number;
  cookie_expiration_days: number;
  created_at?: string;
  updated_at?: string;
}

const defaultPopup: Omit<MarketingPopup, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  content: '',
  image_url: '',
  display_frequency: 'once_per_session',
  is_active: false,
  delay_seconds: 0,
  cookie_expiration_days: 7,
};

export default function MarketingPopupsPage() {
  const [popup, setPopup] = useState<MarketingPopup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState(defaultPopup);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    loadPopup();
  }, []);

  async function loadPopup() {
    try {
      const response = await fetch('http://localhost:3001/api/marketing-popups/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      // Only take the first popup if any exist
      setPopup(data.popups && data.popups.length > 0 ? data.popups[0] : null);
    } catch (error) {
      console.error('Failed to load popup:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    if (popup) {
      setFormData({
        title: popup.title,
        content: popup.content,
        image_url: popup.image_url || '',
        display_frequency: popup.display_frequency,
        is_active: popup.is_active,
        delay_seconds: popup.delay_seconds,
        cookie_expiration_days: popup.cookie_expiration_days || 7,
      });
    } else {
      setFormData(defaultPopup);
    }
    setShowEditor(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);

    try {
      const url = popup
        ? `http://localhost:3001/api/marketing-popups/admin/${popup.id}`
        : 'http://localhost:3001/api/marketing-popups/admin';

      const response = await fetch(url, {
        method: popup ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowEditor(false);
        loadPopup();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save popup');
      }
    } catch (error) {
      console.error('Failed to save popup:', error);
      alert('Failed to save popup');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!popup) return;
    if (!confirm('Are you sure you want to delete this popup?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/marketing-popups/admin/${popup.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        loadPopup();
      } else {
        alert('Failed to delete popup');
      }
    } catch (error) {
      console.error('Failed to delete popup:', error);
      alert('Failed to delete popup');
    }
  }

  async function handleToggleActive() {
    if (!popup) return;

    try {
      const response = await fetch(`http://localhost:3001/api/marketing-popups/admin/${popup.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        loadPopup();
      } else {
        alert('Failed to toggle popup status');
      }
    } catch (error) {
      console.error('Failed to toggle popup:', error);
      alert('Failed to toggle popup status');
    }
  }

  const frequencyLabels: Record<string, string> = {
    once_per_session: 'Once per session',
    every_page_view: 'Every page view',
    once_per_day: 'Once per day',
    once_per_week: 'Once per week',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketing Popup</h1>
          <p className="text-gray-500 mt-1">Manage your site-wide marketing popup</p>
        </div>
        <div className="flex items-center gap-4">
          {popup && (
            <>
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Popup Status:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popup.is_active}
                    onChange={handleToggleActive}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {popup.is_active ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              <button
                onClick={handleEdit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 transition-colors rounded"
              >
                Edit Popup
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {popup ? 'Edit Popup' : 'Create Popup'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter popup title"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter popup content/message"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Image URL"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                    >
                      Browse Media
                    </button>
                  </div>
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="max-w-xs h-auto rounded border"
                      />
                    </div>
                  )}
                </div>

                {/* Display Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Frequency
                  </label>
                  <select
                    value={formData.display_frequency}
                    onChange={(e) => setFormData({ ...formData, display_frequency: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="once_per_session">Once per session</option>
                    <option value="every_page_view">Every page view</option>
                    <option value="once_per_day">Once per day</option>
                    <option value="once_per_week">Once per week</option>
                  </select>
                </div>

                {/* Delay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.delay_seconds}
                    onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How many seconds to wait before showing the popup
                  </p>
                </div>

                {/* Cookie Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cookie Expiration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.cookie_expiration_days}
                    onChange={(e) => setFormData({ ...formData, cookie_expiration_days: parseInt(e.target.value) || 7 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="7"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How many days before showing the popup again to the same visitor (1-365 days)
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Enable popup (show to visitors)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Popup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading popup...</p>
        </div>
      ) : !popup ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-600 mb-4">No marketing popup created yet.</p>
          <button
            onClick={handleEdit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded font-medium"
          >
            Create Popup
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl mx-auto">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{popup.title}</h2>
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      popup.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {popup.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {frequencyLabels[popup.display_frequency]}
                  {popup.delay_seconds > 0 && ` • ${popup.delay_seconds}s delay`}
                  {` • Cookie expires in ${popup.cookie_expiration_days} day${popup.cookie_expiration_days !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 text-lg">{popup.content}</p>
            </div>

            {popup.image_url && (
              <div className="mb-6">
                <img
                  src={popup.image_url}
                  alt=""
                  className="w-full rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={handleEdit}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Edit Popup
              </button>
              <button
                onClick={handleToggleActive}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  popup.is_active
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {popup.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setFormData({ ...formData, image_url: url });
          setShowMediaPicker(false);
        }}
        preferredSize="large"
      />
    </div>
  );
}
