'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import VideoModal from '../../components/VideoModal';
import { getResizedImageUrl } from '../../utils/image-utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  youtube_video_id?: string;
  published_at: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  tags?: Tag[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  async function loadPost() {
    try {
      const response = await fetch(`http://localhost:3001/api/blog/${slug}`);

      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      setPost(data.post);

      // Update document title and meta tags
      if (data.post) {
        document.title = data.post.seo_title || data.post.title || 'Blog Post';
      }
    } catch (error) {
      console.error('Failed to load post:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <>
      <Head>
        {/* Basic SEO */}
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.seo_description || post.excerpt || ''} />
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.og_title || post.seo_title || post.title} />
        <meta property="og:description" content={post.og_description || post.seo_description || post.excerpt || ''} />
        <meta property="og:url" content={postUrl} />
        {(post.og_image || post.featured_image) && (
          <meta property="og:image" content={post.og_image || post.featured_image || ''} />
        )}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.twitter_title || post.og_title || post.seo_title || post.title} />
        <meta name="twitter:description" content={post.twitter_description || post.og_description || post.seo_description || post.excerpt || ''} />
        {(post.twitter_image || post.og_image || post.featured_image) && (
          <meta name="twitter:image" content={post.twitter_image || post.og_image || post.featured_image || ''} />
        )}

        {/* Article metadata */}
        <meta property="article:published_time" content={post.published_at} />
      </Head>

      <Navigation />

      {/* Back to Blog Link (above hero) */}
      {post.featured_image && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 md:px-8 py-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </div>
      )}

      <article className="min-h-screen">
        {/* Hero Section with Overlay */}
        {post.featured_image && (
          <div className="w-full h-[70vh] md:h-[80vh] relative overflow-hidden">
            {/* Background Image */}
            <picture>
              <source
                media="(min-width: 1920px)"
                srcSet={post.featured_image.startsWith('http') ? post.featured_image.replace('w=800', 'w=2560') : getResizedImageUrl(post.featured_image, 'hero-xl')}
              />
              <source
                media="(min-width: 1024px)"
                srcSet={post.featured_image.startsWith('http') ? post.featured_image.replace('w=800', 'w=1920') : getResizedImageUrl(post.featured_image, 'hero-desktop')}
              />
              <source
                media="(min-width: 640px)"
                srcSet={post.featured_image.startsWith('http') ? post.featured_image.replace('w=800', 'w=1400') : getResizedImageUrl(post.featured_image, 'hero-tablet')}
              />
              <img
                src={post.featured_image.startsWith('http') ? post.featured_image.replace('w=800', 'w=1024') : getResizedImageUrl(post.featured_image, 'hero-mobile')}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </picture>

            {/* Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-4xl mx-auto w-full px-6 md:px-8 text-center">
                {/* Post Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
                  {post.title}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center justify-center gap-4 text-white/90 mb-6">
                  <time className="text-lg">
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Watch Video Button */}
                {post.youtube_video_id && (
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#10b981] hover:bg-[#059669] text-white font-semibold transition-colors shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Watch on YouTube
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">
          {/* Post Header (for posts without featured image) */}
          {!post.featured_image && (
            <>
              {/* Back button */}
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Blog
              </Link>

              <header className="mb-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                  {post.title}
                </h1>

                <div className="flex items-center gap-4 text-gray-600 mb-6">
                  <time className="text-lg">
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-sm hover:bg-indigo-200 transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Watch Video Button */}
                {post.youtube_video_id && (
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="mt-6 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Watch Video
                  </button>
                )}
              </header>
            </>
          )}

          {/* Excerpt (for posts with featured image) */}
          {post.featured_image && post.excerpt && (
            <div className="mb-12">
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed border-l-4 border-indigo-600 pl-6 py-2">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Post Content */}
          <div
            className="prose prose-lg md:prose-xl max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
              prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
              prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:text-indigo-700 hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-gray-700 prose-li:mb-2
              prose-blockquote:border-l-4 prose-blockquote:border-indigo-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
              prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:overflow-x-auto
              prose-img:w-full prose-img:h-auto prose-img:my-8"
          >
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Tags at bottom */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-sm hover:bg-gray-200 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <Footer />

      {/* Video Modal */}
      {post.youtube_video_id && (
        <VideoModal
          videoId={post.youtube_video_id}
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />
      )}
    </>
  );
}
