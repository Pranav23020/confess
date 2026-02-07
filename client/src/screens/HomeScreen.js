import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ConfessionCard from '../components/ConfessionCard';
import EmptyState from '../components/EmptyState';
import { confessionsAPI, userAPI, blockedKeywordsAPI, exploreAPI } from '../api';

const HomeScreen = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [canPost, setCanPost] = useState(true);
  const [blockedKeywords, setBlockedKeywords] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topLiked, setTopLiked] = useState([]);
  const [topReplied, setTopReplied] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLoadMoreFallback, setShowLoadMoreFallback] = useState(false);
  const [newConfessionsCount, setNewConfessionsCount] = useState(0);
  const loadMoreRef = useRef(null);
  const feedLimit = 10;

  // Use a ref to track the latest selected category without triggering useEffect re-runs
  const categoryRef = useRef(selectedCategory);
  useEffect(() => {
    categoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    const handleNewConfession = (confession) => {
      // Only show/add if category matches or is 'all'
      if (categoryRef.current === 'all' || confession.category === categoryRef.current) {
        // If we are on the first page, we can just prepend it or show a badge
        // For simplicity and better UX when scrolled down, let's show a "New whispers" button at the top
        setNewConfessionsCount(prev => prev + 1);

        // Optionally, if we are at the very top, we could auto-inject:
        if (window.scrollY < 100 && page === 1) {
          setConfessions(prev => [confession, ...prev]);
          setNewConfessionsCount(0);
        }
      }
    };

    const socket = require('../utils/socket').default;
    socket.on('confession:new', handleNewConfession);

    return () => {
      socket.off('confession:new', handleNewConfession);
    };
  }, [page]); // Re-bind if page changes although we mostly care about page 1

  const storyChips = [
    { label: 'All', icon: 'apps', value: 'all', gradient: 'from-slate-400 to-slate-600' },
    { label: 'Love', icon: 'favorite', value: 'love', gradient: 'from-pink-400 to-rose-500' },
    { label: 'Secrets', icon: 'visibility_off', value: 'secrets', gradient: 'from-purple-400 to-indigo-500' },
    { label: 'Life', icon: 'auto_awesome', value: 'life', gradient: 'from-blue-400 to-cyan-500' },
    { label: 'Career', icon: 'work', value: 'career', gradient: 'from-amber-400 to-orange-500' },
    { label: 'Mental', icon: 'self_improvement', value: 'mental-health', gradient: 'from-emerald-400 to-green-500' },
    { label: 'Other', icon: 'more_horiz', value: 'other', gradient: 'from-slate-400 to-slate-500' }
  ];

  const fetchConfessions = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let response;
      if (selectedCategory === 'all') {
        response = await confessionsAPI.getAll(pageNum, feedLimit);
      } else {
        response = await exploreAPI.category(selectedCategory, pageNum, feedLimit);
      }

      const nextConfessions = response.data.confessions || [];
      const totalPages = response.data.pagination?.pages || pageNum;
      setConfessions(prev => append ? [...prev, ...nextConfessions] : nextConfessions);
      setHasMore(pageNum < totalPages);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError('Failed to load confessions');
      console.error(err);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedCategory, feedLimit]);

  useEffect(() => {
    fetchConfessions(1, false);
    fetchActiveCount();
    fetchBlockedKeywords();
    fetchTopToday();
    setNewConfessionsCount(0); // Reset count on category change
  }, [selectedCategory, fetchConfessions]);

  const fetchActiveCount = async () => {
    try {
      const response = await userAPI.getActiveCount();
      setActiveCount(response.data.activeCount);
      setCanPost(response.data.canPost);
    } catch (err) {
      console.error('Failed to fetch active count:', err);
    }
  };

  const fetchBlockedKeywords = async () => {
    try {
      const response = await blockedKeywordsAPI.list();
      setBlockedKeywords(response.data.keywords || []);
    } catch (err) {
      console.error('Failed to fetch blocked keywords:', err);
    }
  };

  const fetchTopToday = async () => {
    try {
      setTrendingLoading(true);
      const [likedRes, repliedRes] = await Promise.all([
        exploreAPI.topToday('likes', 5),
        exploreAPI.topToday('replies', 5)
      ]);
      setTopLiked(likedRes.data.confessions || []);
      setTopReplied(repliedRes.data.confessions || []);
    } catch (err) {
      console.error('Failed to fetch trending data:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  const filteredConfessions = useMemo(() => {
    if (!blockedKeywords.length) return confessions;
    const blocked = blockedKeywords.map(k => k.keyword);
    return confessions.filter(c => {
      const text = (c.text || '').toLowerCase();
      return !blocked.some(word => text.includes(word));
    });
  }, [confessions, blockedKeywords]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchConfessions(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchConfessions]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) {
      setShowLoadMoreFallback(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      setShowLoadMoreFallback(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasMore, loading, loadingMore]);

  const truncateText = (text, max = 60) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };

  const renderSkeletonCard = (key) => (
    <div key={key} className="relative">
      <div className="bg-white dark:bg-surface-dark rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-slate-200/60 dark:border-white/10 animate-pulse">
        <div className="h-3 sm:h-3.5 md:h-4 w-20 sm:w-24 md:w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2 sm:mb-3 md:mb-4"></div>
        <div className="h-4 sm:h-4.5 md:h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2 sm:mb-2.5 md:mb-3"></div>
        <div className="h-4 sm:h-4.5 md:h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3 sm:mb-4 md:mb-6"></div>
        <div className="h-24 sm:h-32 md:h-40 w-full bg-slate-200 dark:bg-slate-700 rounded-lg sm:rounded-xl mb-3 sm:mb-4"></div>
        <div className="flex gap-2 sm:gap-3 md:gap-4">
          <div className="h-3 sm:h-3.5 md:h-4 w-10 sm:w-11 md:w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 sm:h-3.5 md:h-4 w-8 sm:w-9 md:w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 sm:h-3.5 md:h-4 w-8 sm:w-9 md:w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-b border-slate-200/40 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 md:h-18 max-w-full">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">Confessions</h1>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {canPost ? (
              <Link
                to="/new"
                className="hidden md:flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-xl font-semibold text-xs md:text-base transition-all shadow-lg shadow-primary/25 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit_note</span>
                <span className="hidden lg:inline">New Confession</span>
              </Link>
            ) : (
              <Link
                to="/limit-reached"
                className="hidden md:flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-slate-400 dark:bg-slate-600 text-white rounded-lg md:rounded-xl font-semibold text-xs md:text-base transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">block</span>
                <span className="hidden lg:inline">Limit Reached</span>
              </Link>
            )}
            <button className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg md:rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95">
              <span className="material-symbols-outlined text-sm sm:text-base text-slate-600 dark:text-slate-300">tune</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-grow pt-16 sm:pt-18 md:pt-20 pb-32 sm:pb-36 md:pb-12 px-2 sm:px-3 md:px-4 lg:px-6 w-full">
        <div className="flex gap-4 md:gap-6 lg:gap-8 mx-auto max-w-full lg:max-w-7xl">
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* Category Chips */}
            <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 overflow-hidden -mx-2 sm:mx-0">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 px-2 sm:px-0">
                {storyChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setSelectedCategory(chip.value)}
                    className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0 group transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className={`w-11 h-11 sm:w-13 sm:h-13 md:w-16 md:h-16 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br ${chip.gradient} p-[2px] shadow-sm sm:shadow-md md:shadow-lg ${selectedCategory === chip.value ? 'shadow-glow scale-105' : 'group-hover:shadow-glow'} transition-all duration-500`}>
                      <div className={`w-full h-full rounded-[10px] sm:rounded-[14px] md:rounded-[22px] ${selectedCategory === chip.value ? 'bg-transparent' : 'bg-background-light dark:bg-background-dark'} flex items-center justify-center transition-colors group-hover:bg-transparent`}>
                        <span className={`material-symbols-outlined text-[16px] sm:text-[18px] md:text-[24px] ${selectedCategory === chip.value ? 'text-white' : 'text-slate-700 dark:text-white'} group-hover:text-white transition-colors`}>{chip.icon}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] sm:text-[9px] md:text-[11px] font-bold ${selectedCategory === chip.value ? 'text-primary' : 'text-slate-600 dark:text-slate-400'} group-hover:text-primary transition-colors tracking-wide`}>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {newConfessionsCount > 0 && (
              <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 sticky top-16 sm:top-18 md:top-20 z-30">
                <button
                  onClick={() => {
                    fetchConfessions(1, false);
                    setNewConfessionsCount(0);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/40 hover:shadow-primary/50 animate-bounce active:scale-95 transition-all text-xs sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_upward</span>
                  {newConfessionsCount} new {newConfessionsCount === 1 ? 'whisper' : 'whispers'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
                {[0, 1, 2].map(renderSkeletonCard)}
              </div>
            ) : error ? (
              <div className="p-4 sm:p-6 md:p-8 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-center text-red-500 mt-6 sm:mt-8 font-medium text-sm sm:text-base">{error}</div>
            ) : filteredConfessions.length === 0 ? (
              <EmptyState
                title="No confessions yet"
                description="The space is quiet. Be the first to share a thought in this safe haven."
              />
            ) : (
              <>
                <div className="mb-4 sm:mb-6 md:mb-8 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-5 sm:h-6 md:h-7 bg-primary rounded-full flex-shrink-0"></div>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight truncate">Recent whispers</p>
                  </div>
                  {canPost ? (
                    <Link
                      to="/new"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 text-xs sm:text-sm flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add_circle</span>
                      <span className="hidden sm:inline">New</span>
                    </Link>
                  ) : (
                    <Link
                      to="/limit-reached"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-400 dark:bg-slate-600 text-white rounded-lg md:rounded-xl font-bold transition-all text-xs sm:text-sm flex-shrink-0 opacity-80 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">block</span>
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
                  {filteredConfessions.map((confession) => (
                    <ConfessionCard key={confession._id} confession={confession} showExpiry={false} />
                  ))}
                  {loadingMore && [3, 4].map(renderSkeletonCard)}
                  <div ref={loadMoreRef} className="h-4 sm:h-6"></div>
                  {hasMore && !loadingMore && showLoadMoreFallback && (
                    <div className="flex justify-center pb-8 sm:pb-10 md:pb-12">
                      <button
                        onClick={() => fetchConfessions(page + 1, true)}
                        className="group flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl md:rounded-2xl border-2 border-slate-200 dark:border-white/5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                      >
                        Load more whispers
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px] group-hover:translate-y-0.5 transition-transform">keyboard_arrow_down</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <aside className="hidden lg:block w-72 xl:w-80 sticky top-20 h-fit">
            <div className="bg-white dark:bg-surface-dark rounded-2xl xl:rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-lg dark:shadow-black/20 transition-all duration-500 hover:border-primary/20">
              <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0"></span>
                  Trending Today
                </h3>
              </div>
              <div className="p-4 sm:p-5 md:p-6 space-y-6 md:space-y-8">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/5 rounded-lg md:rounded-2xl border border-primary/10">
                  <div className="flex flex-col min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">Online Now</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Whispering live</p>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-primary flex-shrink-0">{activeCount}</span>
                </div>
                {trendingLoading ? (
                  <div className="space-y-3 md:space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-14 sm:h-16 bg-slate-100 dark:bg-white/5 rounded-lg md:rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <span className="material-symbols-outlined text-primary text-[16px] sm:text-[18px]">favorite</span>
                        <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold">Most Hearted</p>
                      </div>
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        {topLiked.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-500 italic px-2 py-3">Silence is golden...</p>
                        ) : (
                          topLiked.map((item) => (
                            <Link
                              key={item._id}
                              to={`/confession/${item._id}`}
                              className="group block w-full text-left p-3 sm:p-4 rounded-lg md:rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-primary/[0.08] border border-transparent hover:border-primary/10 transition-all duration-300 active:scale-95"
                            >
                              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {truncateText(item.text, 80)}
                              </p>
                              <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-primary opacity-80 uppercase tracking-wider">
                                <span>{item.likeCount || 0} HEARTS</span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <span className="material-symbols-outlined text-purple-500 text-[16px] sm:text-[18px]">forum</span>
                        <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold">Most Echoed</p>
                      </div>
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        {topReplied.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-500 italic px-2 py-3">Waiting for echoes...</p>
                        ) : (
                          topReplied.map((item) => (
                            <Link
                              key={item._id}
                              to={`/confession/${item._id}`}
                              className="group block w-full text-left p-3 sm:p-4 rounded-lg md:rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-purple-500/[0.08] border border-transparent hover:border-purple-500/10 transition-all duration-300 active:scale-95"
                            >
                              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {truncateText(item.text, 80)}
                              </p>
                              <div className="mt-2 sm:mt-3 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-purple-500 opacity-80 uppercase tracking-wider">
                                <span>{item.replyCount || 0} ECHOES</span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5 md:p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-2 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                  <button type="button" className="hover:text-primary transition-colors">About</button>
                  <span className="opacity-30">/</span>
                  <button type="button" className="hover:text-primary transition-colors">Help</button>
                  <span className="opacity-30">/</span>
                  <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  <span className="opacity-30">/</span>
                  <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-500/60 dark:text-slate-600/60 mt-4 font-bold uppercase tracking-[0.1em]">© 2026</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* FAB - Mobile Only */}
      <div className="md:hidden fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50">
        {canPost ? (
          <Link
            to="/new"
            className="group flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/40 hover:shadow-primary/50 text-white transition-all duration-300 hover:scale-110 active:scale-95"
          >
           
          </Link>
        ) : (
          <Link
            to="/limit-reached"
            className="group flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 bg-slate-400 dark:bg-slate-600 rounded-2xl shadow-lg shadow-slate-400/40 text-white transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">block</span>
          </Link>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
};

export default HomeScreen;
