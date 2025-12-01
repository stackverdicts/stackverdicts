'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import EmailSignup from '../components/EmailSignup';
import AnimatedBackground from '../components/AnimatedBackground';
import VideoModal from '../components/VideoModal';
import CustomSelect from '../components/CustomSelect';
import { getResizedImageUrl } from '../utils/image-utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  youtube_video_id?: string;
  published_at: string;
  tags?: Tag[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    loadPosts();
    loadTags();
  }, []);

  async function loadPosts() {
    try {
      const response = await fetch('http://localhost:3001/api/blog');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    try {
      const response = await fetch('http://localhost:3001/api/blog/tags/all');
      const data = await response.json();
      setAllTags(data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  // Filter tags to only show those that have at least one post
  const tagsWithPosts = useMemo(() => {
    return allTags.filter(tag =>
      posts.some(post => post.tags?.some(postTag => postTag.id === tag.id))
    );
  }, [allTags, posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (selectedTag !== 'all') {
      filtered = posts.filter(post =>
        post.tags?.some(tag => tag.id === selectedTag)
      );
    }

    // Sort by date (newest first)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return dateB - dateA;
    });
  }, [posts, selectedTag]);

  return (
    <>
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[280px] md:min-h-[320px] flex items-center overflow-hidden">
          {/* Animated Background */}
          <AnimatedBackground />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
                Blog & Resources
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-8 leading-relaxed drop-shadow-md">
                Latest articles, tutorials, and insights on developer tools and hosting platforms.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            {/* Filter Controls */}
            {!loading && posts.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                {/* Tag Dropdown Filter */}
                <CustomSelect
                  options={[
                    { value: 'all', label: 'All Topics' },
                    ...tagsWithPosts.map(tag => ({ value: tag.id, label: tag.name }))
                  ]}
                  value={selectedTag}
                  onChange={(value) => setSelectedTag(value)}
                  placeholder="Filter by topic"
                />

                {/* Results count */}
                <div className="text-sm text-gray-800">
                  Showing {filteredPosts.length} of {posts.length} articles
                  {selectedTag !== 'all' && (
                    <button
                      onClick={() => setSelectedTag('all')}
                      className="ml-2 text-indigo-900 hover:text-indigo-700 font-medium"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts published yet.</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No articles found with the selected filter.</p>
              <button
                onClick={() => setSelectedTag('all')}
                className="text-indigo-900 hover:text-indigo-700 font-medium"
              >
                Show all articles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded shadow-md overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                  {post.featured_image && (
                    <Link href={`/blog/${post.slug}`} className="block h-48 overflow-hidden">
                      <picture>
                        <source
                          media="(min-width: 768px)"
                          srcSet={getResizedImageUrl(post.featured_image, 'card-md')}
                        />
                        <img
                          src={getResizedImageUrl(post.featured_image, 'card-sm')}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </picture>
                    </Link>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-indigo-900 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-800 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    <div className="text-sm mb-4">
                      <time className="text-gray-800">
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>

                    <div className="flex items-center gap-4 mt-auto">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-800 hover:text-gray-600 font-semibold text-lg flex items-center gap-2 group"
                      >
                        Read more
                        <svg
                          className="w-5 h-5 translate-y-[1px] group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          </div>
        </section>
      </main>

      <EmailSignup />
      <Footer />

      {/* Video Modal */}
      {selectedVideoId && (
        <VideoModal
          videoId={selectedVideoId}
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
        />
      )}
    </>
  );
}
