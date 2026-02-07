import React, { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import ConfessionCard from '../components/ConfessionCard';
import { exploreAPI } from '../api';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'love', label: 'Love' },
  { value: 'career', label: 'Career' },
  { value: 'secrets', label: 'Secrets' },
  { value: 'life', label: 'Life' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'other', label: 'Other' }
];

const ExploreScreen = () => {
  const [mode, setMode] = useState('trending');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confessionOfDay, setConfessionOfDay] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cotdRes, statsRes] = await Promise.all([
          exploreAPI.confessionOfDay().catch(() => null),
          exploreAPI.stats().catch(() => null)
        ]);

        if (cotdRes?.data?.confession) setConfessionOfDay(cotdRes.data.confession);
        if (statsRes?.data?.stats) setStats(statsRes.data.stats);
      } catch (err) {
        console.error('Failed to load explore meta:', err);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    let timer = null;
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);

        if (mode === 'trending') {
          const response = await exploreAPI.trending();
          setConfessions(response.data.confessions || []);
        } else {
          const response = await exploreAPI.search({ q: query, category, sortBy });
          setConfessions(response.data.confessions || []);
        }
      } catch (err) {
        setError('Failed to load explore results');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'search') {
      timer = setTimeout(fetchList, 400);
    } else {
      fetchList();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [mode, query, category, sortBy]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen">
      <div className="relative w-full max-w-md md:max-w-4xl lg:max-w-7xl mx-auto pb-28 sm:pb-24 md:pb-8 px-3 sm:px-5 md:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 md:pb-8 sticky top-0 bg-background-light dark:bg-background-dark z-20">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Explore</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('trending')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold ${mode === 'trending' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'
                }`}
            >
              Trending
            </button>
            <button
              onClick={() => setMode('search')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold ${mode === 'search' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'
                }`}
            >
              Discover
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-8 space-y-6 sm:space-y-8">
          {/* Confession of the Day */}
          {confessionOfDay && (
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Confession of the Day</p>
              <ConfessionCard confession={confessionOfDay} showExpiry={false} />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Active Now</p>
                <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{stats.totalActive}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Posted Today</p>
                <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{stats.todayCount}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Busiest Hour</p>
                <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{stats.busiestHour}:00</p>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          {mode === 'search' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search confessions..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                >
                  <option value="recent">Recent</option>
                  <option value="likes">Most Liked</option>
                  <option value="replies">Most Replied</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold ${category === c.value ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 text-sm">{error}</div>
          ) : confessions.length === 0 ? (
            <div className="text-center text-slate-400 text-sm">No confessions found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {confessions.map((confession) => (
                <ConfessionCard key={confession._id} confession={confession} showExpiry={false} />
              ))}
            </div>
          )}
        </main>

        <BottomNav active="explore" />
      </div>
    </div>
  );
};

export default ExploreScreen;
