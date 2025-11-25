'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RichTextEditor from '../../../../components/RichTextEditor';
import MediaPicker from '../../../../components/MediaPicker';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const isNewPost = postId === 'new';

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNewPost);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerField, setMediaPickerField] = useState<'featuredImage' | 'ogImage' | 'twitterImage'>('featuredImage');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    youtubeVideoId: '',
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    metaRobotsNoindex: false,
    metaRobotsNofollow: false,
    tagIds: [] as string[],
  });

  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    loadTags();
    if (!isNewPost) {
      loadPost();
    }
  }, [postId]);

  async function loadTags() {
    try {
      const response = await fetch('http://localhost:3001/api/blog/tags/all');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async function createTag() {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      const response = await fetch('http://localhost:3001/api/blog/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTag = data.tag;
        setTags([...tags, newTag]);
        setFormData({ ...formData, tagIds: [...formData.tagIds, newTag.id] });
        setNewTagName('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  }

  async function loadPost() {
    try {
      const response = await fetch(`http://localhost:3001/api/blog/admin/post/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      const post = data.post;

      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featuredImage: post.featured_image || '',
        youtubeVideoId: post.youtube_video_id || '',
        seoTitle: post.seo_title || '',
        seoDescription: post.seo_description || '',
        focusKeyword: post.focus_keyword || '',
        canonicalUrl: post.canonical_url || '',
        ogTitle: post.og_title || '',
        ogDescription: post.og_description || '',
        ogImage: post.og_image || '',
        twitterTitle: post.twitter_title || '',
        twitterDescription: post.twitter_description || '',
        twitterImage: post.twitter_image || '',
        metaRobotsNoindex: post.meta_robots_noindex || false,
        metaRobotsNofollow: post.meta_robots_nofollow || false,
        tagIds: post.tags?.map((t: Tag) => t.id) || [],
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load post:', error);
      alert('Failed to load post');
      router.push('/admin/blog');
    }
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean = false) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      publish,
    };

    try {
      const url = isNewPost
        ? 'http://localhost:3001/api/blog/admin'
        : `http://localhost:3001/api/blog/admin/${postId}`;

      const method = isNewPost ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Post saved successfully!');
        router.push('/admin/blog');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/admin/blog')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Posts
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewPost ? 'New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter post title..."
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="leave-blank-for-auto-generation"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly version of the title. Leave blank to auto-generate.</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(html) => setFormData({ ...formData, content: html })}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Brief summary of the post..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Short description shown in post listings and previews.</p>
                </div>
              </div>

              {/* SEO Section */}
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">SEO Settings</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    maxLength={60}
                    placeholder="SEO optimized title..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seoTitle.length}/60 characters</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    maxLength={160}
                    placeholder="Meta description for search engines..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seoDescription.length}/160 characters</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.focusKeyword}
                    onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Primary keyword for this post..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonicalUrl}
                    onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/blog/post-url"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.metaRobotsNoindex}
                      onChange={(e) => setFormData({ ...formData, metaRobotsNoindex: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">No Index</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.metaRobotsNofollow}
                      onChange={(e) => setFormData({ ...formData, metaRobotsNofollow: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">No Follow</span>
                  </label>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Social Media</h2>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Open Graph (Facebook)</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">OG Title</label>
                    <input
                      type="text"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">OG Description</label>
                    <textarea
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">OG Image URL</label>
                    <input
                      type="text"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Twitter Card</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Title</label>
                    <input
                      type="text"
                      value={formData.twitterTitle}
                      onChange={(e) => setFormData({ ...formData, twitterTitle: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Description</label>
                    <textarea
                      value={formData.twitterDescription}
                      onChange={(e) => setFormData({ ...formData, twitterDescription: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Image URL</label>
                    <input
                      type="text"
                      value={formData.twitterImage}
                      onChange={(e) => setFormData({ ...formData, twitterImage: e.target.value })}
                      className="w-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Featured Image */}
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Featured Image</h2>
                {formData.featuredImage ? (
                  <div>
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-auto mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerField('featuredImage');
                          setShowMediaPicker(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 hover:bg-gray-50"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featuredImage: '' })}
                        className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerField('featuredImage');
                      setShowMediaPicker(true);
                    }}
                    className="w-full border-2 border-dashed border-gray-300 p-8 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="block text-sm text-gray-600">Click to select image</span>
                  </button>
                )}
              </div>

              {/* YouTube Video ID */}
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">YouTube Video</h2>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video ID
                </label>
                <input
                  type="text"
                  value={formData.youtubeVideoId}
                  onChange={(e) => setFormData({ ...formData, youtubeVideoId: e.target.value })}
                  placeholder="e.g., dQw4w9WgXcQ"
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the YouTube video ID (the part after "v=" in the URL). For example, if the URL is https://youtube.com/watch?v=dQw4w9WgXcQ, enter "dQw4w9WgXcQ"
                </p>
                {formData.youtubeVideoId && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="aspect-video bg-gray-100">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${formData.youtubeVideoId}`}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Tags</h2>

                {/* Create New Tag */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Tag</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          createTag();
                        }
                      }}
                      placeholder="Enter tag name..."
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={createTag}
                      disabled={creatingTag || !newTagName.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingTag ? '...' : 'Add'}
                    </button>
                  </div>
                </div>

                {/* Existing Tags */}
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tags yet. Create your first tag above.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tags.map(tag => (
                      <label key={tag.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 px-2 -mx-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tagIds: [...formData.tagIds, tag.id] });
                            } else {
                              setFormData({ ...formData, tagIds: formData.tagIds.filter(id => id !== tag.id) });
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Media Picker */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setFormData({
            ...formData,
            [mediaPickerField]: url,
          });
          setShowMediaPicker(false);
        }}
        preferredSize={mediaPickerField === 'featuredImage' ? 'hero' : 'large'}
      />
    </div>
  );
}
