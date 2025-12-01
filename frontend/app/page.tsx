'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import EmailSignup from './components/EmailSignup';
import AnimatedBackground from './components/AnimatedBackground';
import VideoModal from './components/VideoModal';
import { getResizedImageUrl } from './utils/image-utils';
import CustomSelect from './components/CustomSelect';

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

export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

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

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = posts.filter(post =>
        post.tags?.some(tag => tag.id === selectedTag)
      );
    }

    // Sort by date (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return dateB - dateA;
    });

    return sorted;
  }, [posts, selectedTag]);

  const visiblePosts = useMemo(() => {
    return filteredAndSortedPosts.slice(0, visibleCount);
  }, [filteredAndSortedPosts, visibleCount]);

  const hasMorePosts = visibleCount < filteredAndSortedPosts.length;

  async function handleLoadMore() {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setVisibleCount(prev => prev + 6);
    setLoadingMore(false);
  }

  return (
    <>
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[400px] md:min-h-[450px] flex items-center overflow-hidden">
          {/* Animated Background */}
          <AnimatedBackground />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-16 sm:px-6 lg:px-16 py-12 md:py-16 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
                Developer Tools & Hosting{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                  Reviews
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed drop-shadow-md">
                Honest, in-depth reviews of the best developer tools, hosting platforms, and tech services to power your projects.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center bg-emerald-500 text-white px-8 py-3 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  Read Latest Posts
                </Link>
                <a
                  href="https://www.youtube.com/@Stackverdicts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3 hover:bg-white/20 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Watch Videos
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Feed Section */}
        <section id="blog-feed" className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Latest Articles
              </h2>
              <p className="text-xl text-gray-800 max-w-2xl mx-auto">
                Stay updated with the latest guides, tutorials, and insights on development tools and hosting platforms.
              </p>
            </div>

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
                  onChange={(value) => {
                    setSelectedTag(value);
                    setVisibleCount(6);
                  }}
                  placeholder="Filter by topic"
                />

                {/* Results count */}
                <div className="text-sm text-gray-800">
                  Showing {visiblePosts.length} of {filteredAndSortedPosts.length} articles
                  {selectedTag !== 'all' && (
                    <button
                      onClick={() => {
                        setSelectedTag('all');
                        setVisibleCount(6);
                      }}
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
                <p className="mt-4 text-gray-600">Loading articles...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No posts available yet.</p>
              </div>
            ) : filteredAndSortedPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No articles found with the selected filter.</p>
                <button
                  onClick={() => {
                    setSelectedTag('all');
                    setVisibleCount(6);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Show all articles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visiblePosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded shadow-md overflow-hidden hover:shadow-xl transition-all group flex flex-col"
                  >
                    {post.featured_image && (
                      <div className="h-48 overflow-hidden">
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
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-indigo-900 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </h3>

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
                              strokeWidth={2.5}
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

            {/* Load More Button */}
            {hasMorePosts && (
              <div className="text-center mt-12">
                {loadingMore ? (
                  <div className="inline-flex items-center justify-center">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-indigo-200"></div>
                      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className="inline-block bg-emerald-600 text-white px-8 py-3 hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    Load More Articles
                  </button>
                )}
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
