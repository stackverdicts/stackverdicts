'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  published_at?: string | null;
  tags?: Tag[];
  children?: BlogPost[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'tags'>('posts');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Tag management states
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');

  useEffect(() => {
    loadPosts();
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const response = await fetch('http://localhost:3001/api/blog/tags/all');
      const data = await response.json();
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(post =>
        statusFilter === 'published' ? post.published_at : !post.published_at
      );
    }

    // Tag filter
    if (tagFilter !== 'all') {
      result = result.filter(post =>
        post.tags?.some(tag => tag.id === tagFilter)
      );
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'date') {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'status') {
        comparison = (a.published_at ? 1 : 0) - (b.published_at ? 1 : 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [posts, searchQuery, statusFilter, tagFilter, sortBy, sortOrder]);

  async function loadPosts() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/blog/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      alert('Failed to load posts. Please check if you are logged in.');
    } finally {
      setLoading(false);
    }
  }


  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/blog/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        loadPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  }

  // Tag management functions
  async function handleCreateTag() {
    if (!newTagName.trim()) {
      alert('Please enter a tag name');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/blog/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newTagName,
          slug: newTagSlug || undefined,
        }),
      });

      if (response.ok) {
        setNewTagName('');
        setNewTagSlug('');
        loadTags();
      } else {
        alert('Failed to create tag');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    }
  }

  async function handleUpdateTag(tag: Tag) {
    if (!editingTag) return;

    try {
      const response = await fetch(`http://localhost:3001/api/blog/admin/tags/${tag.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: editingTag.name,
          slug: editingTag.slug,
        }),
      });

      if (response.ok) {
        setEditingTag(null);
        loadTags();
      } else {
        alert('Failed to update tag');
      }
    } catch (error) {
      console.error('Failed to update tag:', error);
      alert('Failed to update tag');
    }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/blog/admin/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        loadTags();
        loadPosts(); // Refresh posts to update tag associations
      } else {
        alert('Failed to delete tag');
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Post Management</h1>
        {activeTab === 'posts' && (
          <button
            onClick={() => router.push('/admin/blog/edit/new')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded transition-colors"
          >
            + New Post
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tags'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tags
          </button>
        </nav>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, slug, or tag..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'date' | 'status')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                sortOrder === 'desc'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Descending
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                sortOrder === 'asc'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ascending
            </button>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>

          {(searchQuery || statusFilter !== 'all' || tagFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTagFilter('all');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded shadow p-12 text-center">
            {posts.length === 0 ? (
              <>
                <p className="text-gray-600 mb-4">No posts yet.</p>
                <button
                  onClick={() => router.push('/admin/blog/edit/new')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first post
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">No posts match your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTagFilter('all');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    <button
                      onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                      className="text-gray-900 hover:text-indigo-600 transition-colors text-left"
                    >
                      {post.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{post.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      post.published_at
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.published_at ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {post.tags && post.tags.length > 0 ? (
                        post.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs"
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Tag */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Tag</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                  <span className="text-gray-500 text-xs ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newTagSlug}
                  onChange={(e) => setNewTagSlug(e.target.value)}
                  placeholder="tag-slug"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to auto-generate from name
                </p>
              </div>
              <button
                onClick={handleCreateTag}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
              >
                Add New Tag
              </button>
            </div>
          </div>

          {/* Tags List */}
          <div className="lg:col-span-2 bg-white rounded shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Tags ({allTags.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allTags.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No tags created yet. Add your first tag!
                </div>
              ) : (
                allTags.map((tag) => (
                  <div key={tag.id} className="p-4 hover:bg-gray-50">
                    {editingTag?.id === tag.id ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editingTag.name}
                            onChange={(e) =>
                              setEditingTag({ ...editingTag, name: e.target.value })
                            }
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={editingTag.slug}
                            onChange={(e) =>
                              setEditingTag({ ...editingTag, slug: e.target.value })
                            }
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateTag(tag)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tag.name}</div>
                          <div className="text-sm text-gray-500 font-mono">{tag.slug}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingTag(tag)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
