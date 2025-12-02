'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getResizedImageUrl } from '../../../utils/image-utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  tags?: Tag[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function TagArchivePage() {
  const params = useParams();
  const tagSlug = params.slug as string;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tagName, setTagName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (tagSlug) {
      loadPosts();
    }
  }, [tagSlug]);

  async function loadPosts() {
    try {
      const response = await fetch(`http://localhost:3001/api/blog/tag/${tagSlug}`);

      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      setPosts(data.posts || []);

      // Get tag name from first post if available
      if (data.posts && data.posts.length > 0 && data.posts[0].tags) {
        const tag = data.posts[0].tags.find((t: Tag) => t.slug === tagSlug);
        if (tag) {
          setTagName(tag.name);
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-gray-600 mb-8">The tag you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          href="/blog"
          className="inline-block mb-8 text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Blog
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Posts tagged: {tagName || tagSlug}
          </h1>
          <p className="text-gray-600">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found with this tag.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow group">
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

                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:underline decoration-2 underline-offset-2 transition-all"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-gray-800 group-hover:text-emerald-600 font-medium flex items-center gap-2 mt-4 transition-colors"
                  >
                    Read more
                    <svg
                      className="w-5 h-5 translate-y-[1px] group-hover:translate-x-1 group-hover:text-emerald-600 transition-all"
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
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
