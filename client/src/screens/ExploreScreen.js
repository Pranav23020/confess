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
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-b border-slate-200/40 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 md:h-18 max-w-full">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight line-clamp-1">Explore</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setMode('trending')}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${mode === 'trending' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            >
              Trending
            </button>
            <button
              onClick={() => setMode('search')}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${mode === 'search' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            >
              Discover
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-18 md:pt-20 pb-32 sm:pb-36 md:pb-12 px-2 sm:px-3 md:px-4 lg:px-6 w-full max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
          {/* Confession of the Day */}
          {confessionOfDay && (
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 md:mb-4 uppercase tracking-wide">✨ Confession of the Day</p>
              <ConfessionCard confession={confessionOfDay} showExpiry={false} />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <div className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/60 dark:border-white/5 hover:border-primary/20 transition-all">
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">Active Now</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mt-1 sm:mt-2">{stats.totalActive}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/60 dark:border-white/5 hover:border-primary/20 transition-all">
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">Posted Today</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mt-1 sm:mt-2">{stats.todayCount}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/60 dark:border-white/5 hover:border-primary/20 transition-all">
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">Busiest Hour</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mt-1 sm:mt-2">{stats.busiestHour}:00</p>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          {mode === 'search' && (
            <div className="space-y-3 sm:space-y-4 sticky top-16 sm:top-18 md:top-20 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm pt-3 sm:pt-4 pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative min-w-0">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm sm:text-base bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white transition-all focus:ring-2 focus:ring-primary flex-shrink-0"
                >
                  <option value="recent">Recent</option>
                  <option value="likes">Liked</option>
                  <option value="replies">Replied</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all active:scale-95 ${category === c.value ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
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
            <div className="flex items-center justify-center h-32 sm:h-40 md:h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-slate-200 dark:border-white/10 border-t-primary"></div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading confessions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 md:p-8 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-center text-red-500 text-sm sm:text-base font-medium">{error}</div>
          ) : confessions.length === 0 ? (
            <div className="p-8 sm:p-12 md:p-16 text-center">
              <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl text-slate-300 dark:text-slate-700 mb-3 block">inbox</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">No confessions found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {confessions.map((confession) => (
                <ConfessionCard key={confession._id} confession={confession} showExpiry={false} />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav active="explore" />
    </div>
  );
};

export default ExploreScreen;
