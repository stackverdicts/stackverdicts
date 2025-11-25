'use client';

import { useState, useEffect, useCallback } from 'react';

interface MediaVariant {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  file_size?: number;
}

interface Media {
  id: string;
  filename: string;
  title?: string;
  alt_text?: string;
  caption?: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  variants?: MediaVariant[];
  created_at: string;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  preferredSize?: 'thumbnail' | 'medium' | 'large' | 'hero' | 'card' | 'full';
}

export default function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  preferredSize = 'full',
}: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadMedia();
    }
  }, [isOpen, page, search, activeTab]);

  async function loadMedia() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`http://localhost:3001/api/media?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setMedia(data.media || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load media:', error);
      alert('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: FileList) {
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        await fetch('http://localhost:3001/api/media', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
      }

      // Switch to library tab and reload
      setActiveTab('library');
      setPage(1);
      await loadMedia();
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }

  function handleSelectMedia(mediaItem: Media) {
    // Find preferred size variant
    let selectedUrl = '';

    if (mediaItem.variants) {
      const preferredVariant = mediaItem.variants.find(v => v.name === preferredSize);
      if (preferredVariant) {
        selectedUrl = preferredVariant.url;
      } else {
        // Fallback to full size
        const fullVariant = mediaItem.variants.find(v => v.name === 'full');
        selectedUrl = fullVariant?.url || '';
      }
    }

    if (selectedUrl) {
      onSelect(`http://localhost:3000${selectedUrl}`);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'library'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' ? (
            <>
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search media..."
                  className="w-full border rounded px-4 py-2"
                />
              </div>

              {/* Media Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading media...</p>
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No media found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {media.map((item) => {
                      const thumbnailVariant = item.variants?.find(v => v.name === 'thumbnail');
                      const thumbnailUrl = thumbnailVariant?.url || item.variants?.[0]?.url || '';

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectMedia(item)}
                          className="relative aspect-square border rounded overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all group"
                        >
                          <img
                            src={`http://localhost:3000${thumbnailUrl}`}
                            alt={item.alt_text || item.title || item.filename}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              Select
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs truncate">
                            {item.title || item.filename}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* Upload Tab */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition-colors"
            >
              {uploading ? (
                <div>
                  <p className="text-lg font-medium mb-2">Uploading...</p>
                  <p className="text-gray-600">Please wait while files are being uploaded</p>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">Drop files here</p>
                  <p className="text-gray-600 mb-4">or</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <span className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 cursor-pointer inline-block">
                      Choose Files
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Supported: JPG, PNG, GIF, WebP (max 15MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
