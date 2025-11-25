'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import VideoModal from '../components/VideoModal';
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
  const [loading, setLoading] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  useEffect(() => {
    loadPosts();
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

  return (
    <>
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[400px] md:min-h-[500px] flex items-center overflow-hidden">
          {/* Animated Background */}
          <AnimatedBackground />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
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
            {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No posts published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded shadow-md overflow-hidden hover:shadow-xl transition-all group">
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

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <time className="text-gray-500">
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/blog/tag/${tag.slug}`}
                              className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-sm text-xs hover:bg-indigo-200 transition-colors"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
                      >
                        Read more
                        <svg
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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

                      {post.youtube_video_id && (
                        <button
                          onClick={() => {
                            setSelectedVideoId(post.youtube_video_id!);
                            setVideoModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium transition-colors rounded-sm"
                          title="Watch video"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Video
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          </div>
        </section>
      </main>

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
