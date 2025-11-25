'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ========== INTERFACES ==========

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  youtube_video_id?: string;
  published_at?: string;
}

interface ScheduledPost {
  id: string;
  post_id: string;
  post_title: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  youtube_video_id?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: ScheduledPost[];
}

// ========== COMPONENT ==========

export default function YouTubeCalendarPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleNotes, setScheduleNotes] = useState('');

  useEffect(() => {
    loadPosts();
    loadScheduledPosts();
  }, [selectedMonth]);

  async function loadPosts() {
    try {
      const response = await fetch('http://localhost:3001/api/blog');
      const data = await response.json();
      // Filter posts that have youtube_video_id
      const postsWithVideo = (data.posts || []).filter((p: BlogPost) => p.youtube_video_id);
      setPosts(postsWithVideo);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadScheduledPosts() {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const response = await fetch(`http://localhost:3001/api/youtube-schedule?year=${year}&month=${month}`);
      const data = await response.json();
      setScheduledPosts(data.scheduled || []);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
      setScheduledPosts([]);
    }
  }

  async function schedulePost() {
    if (!selectedPost || !scheduleDate) return;

    try {
      await fetch('http://localhost:3001/api/youtube-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: selectedPost.id,
          scheduled_date: scheduleDate,
          scheduled_time: scheduleTime,
          notes: scheduleNotes,
        }),
      });

      setShowScheduleModal(false);
      setSelectedPost(null);
      setScheduleDate('');
      setScheduleTime('10:00');
      setScheduleNotes('');
      loadScheduledPosts();
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Failed to schedule post');
    }
  }

  async function deleteScheduledPost(id: string) {
    if (!confirm('Remove this post from the schedule?')) return;

    try {
      await fetch(`http://localhost:3001/api/youtube-schedule/${id}`, {
        method: 'DELETE',
      });
      loadScheduledPosts();
    } catch (error) {
      console.error('Failed to delete scheduled post:', error);
    }
  }

  function getCalendarDays(): CalendarDay[] {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) { // 6 weeks
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateStr = currentDate.toISOString().split('T')[0];
      const dayPosts = scheduledPosts.filter(p => p.scheduled_date === dateStr);

      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        posts: dayPosts,
      });
    }

    return days;
  }

  function openScheduleModal(date?: Date) {
    if (date) {
      setScheduleDate(date.toISOString().split('T')[0]);
    }
    setShowScheduleModal(true);
  }

  const calendarDays = getCalendarDays();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post Schedule</h1>
              <p className="text-gray-500 mt-1">
                Schedule posts with YouTube videos for publishing
              </p>
            </div>
            <button
              onClick={() => openScheduleModal()}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
            >
              + Schedule Post
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Navigation */}
        <div className="bg-white rounded shadow p-4 mb-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${day.isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => openScheduleModal(day.date)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  !day.isCurrentMonth ? 'text-gray-400' : day.isToday ? 'text-blue-600 font-bold' : 'text-gray-700'
                }`}>
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {day.posts.map((post) => (
                    <div
                      key={post.id}
                      className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded truncate hover:bg-indigo-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/blog/edit/${post.post_id}`);
                      }}
                      title={post.post_title}
                    >
                      <div className="flex items-center gap-1">
                        <span>🎥</span>
                        <span className="truncate">{post.scheduled_time} - {post.post_title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Schedule List */}
        {scheduledPosts.length > 0 && (
          <div className="mt-8 bg-white rounded shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Scheduled Posts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {scheduledPosts
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .slice(0, 10)
                .map((post) => (
                  <div key={post.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{post.post_title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>📅 {new Date(post.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>🕐 {post.scheduled_time}</span>
                        {post.youtube_video_id && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Has Video</span>
                        )}
                      </div>
                      {post.notes && (
                        <p className="text-sm text-gray-500 mt-1">{post.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/blog/edit/${post.post_id}`)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        Edit Post
                      </button>
                      <button
                        onClick={() => deleteScheduledPost(post.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Schedule Post</h2>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedPost(null);
                    setScheduleDate('');
                    setScheduleTime('10:00');
                    setScheduleNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Post
                </label>
                <select
                  value={selectedPost?.id || ''}
                  onChange={(e) => {
                    const post = posts.find(p => p.id === e.target.value);
                    setSelectedPost(post || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Choose a post...</option>
                  {posts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title} {post.youtube_video_id ? '🎥' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Only posts with YouTube videos are shown</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publish Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this scheduled post..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedPost(null);
                  setScheduleDate('');
                  setScheduleTime('10:00');
                  setScheduleNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={schedulePost}
                disabled={!selectedPost || !scheduleDate}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
