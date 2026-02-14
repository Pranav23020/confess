import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BottomNav from '../components/BottomNav';
import ConfessionCard from '../components/ConfessionCard';
import EmptyState from '../components/EmptyState';
import { confessionsAPI, userAPI, blockedKeywordsAPI, exploreAPI } from '../api';
import { logger } from '../utils/logger';

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
  const [newConfessionsCount, setNewConfessionsCount] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [draggedDistance, setDraggedDistance] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const feedLimit = 1000;

  // Use a ref to track the latest selected category without triggering useEffect re-runs
  const categoryRef = useRef(selectedCategory);
  const swipeRef = useRef(null);
  useEffect(() => {
    categoryRef.current = selectedCategory;
    setCurrentCardIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    const socket = require('../utils/socket').default;

    // Handle new confessions
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

    // Handle confession deletions
    const handleConfessionDeleted = (data) => {
      const { confessionId } = data;
      logger.log(`🗑️ Confession deleted: ${confessionId}, removing from feed`);

      // Remove the deleted confession from the list
      setConfessions(prev => prev.filter(c => c._id !== confessionId));

      // If we're currently viewing the deleted confession, move to the next/previous
      setCurrentCardIndex(prevIndex => {
        const newLength = confessions.length - 1;
        if (newLength === 0) return 0;
        if (prevIndex >= newLength) return newLength - 1;
        return prevIndex;
      });
    };

    socket.on('confession:new', handleNewConfession);
    socket.on('confession:deleted', handleConfessionDeleted);

    return () => {
      socket.off('confession:new', handleNewConfession);
      socket.off('confession:deleted', handleConfessionDeleted);
    };
  }, [page, confessions.length]); // Re-bind if page changes or confessions length changes

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

  // Auto-load more confessions when near the end
  useEffect(() => {
    if (currentCardIndex >= confessions.length - 3 && hasMore && !loadingMore && !loading) {
      fetchConfessions(page + 1, true);
    }
  }, [currentCardIndex, confessions.length, hasMore, loadingMore, loading, page, fetchConfessions]);

  // Memoized card navigation functions
  const handleNextCard = useCallback(() => {
    if (currentCardIndex < filteredConfessions.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('left');
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        setSlideDirection('');
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }
  }, [currentCardIndex, filteredConfessions.length, isTransitioning]);

  const handlePrevCard = useCallback(() => {
    if (currentCardIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('right');
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setSlideDirection('');
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }
  }, [currentCardIndex, isTransitioning]);

  // Global mouse move/up handlers for proper drag detection
  useEffect(() => {
    if (dragStart === null) return;

    const handleMouseMove = (e) => {
      setDraggedDistance(e.clientX - dragStart);
    };

    const handleMouseUp = () => {
      const threshold = 35; // More responsive for desktop
      if (draggedDistance > threshold) {
        handlePrevCard();
      } else if (draggedDistance < -threshold) {
        handleNextCard();
      }
      setDragStart(null);
      setDraggedDistance(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, draggedDistance, handleNextCard, handlePrevCard]);

  // Swipe handlers
  const handleMouseDown = (e) => {
    setDragStart(e.clientX);
  };

  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (dragStart === null) return;
    setDraggedDistance(e.touches[0].clientX - dragStart);
  };

  const handleTouchEnd = () => {
    if (dragStart === null) return;
    const threshold = 50;
    if (draggedDistance > threshold) {
      handlePrevCard();
    } else if (draggedDistance < -threshold) {
      handleNextCard();
    }
    setDragStart(null);
    setDraggedDistance(0);
  };



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
      <Helmet>
        <title>AnonConfess - Share Your Secrets Anonymously</title>
        <meta name="description" content="A safe space to confess your secrets, love, and thoughts anonymously. Your confessions expire in 24 hours." />
        <meta property="og:title" content="AnonConfess - Share Your Secrets Anonymously" />
        <meta property="og:description" content="A safe space to confess your secrets, love, and thoughts anonymously. Your confessions expire in 24 hours." />
        <meta property="og:url" content="https://www.anonconfess.in/" />
      </Helmet>

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
                {/* Single Card Swiper */}
                <div
                  ref={swipeRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative w-full max-w-md sm:max-w-lg mx-auto mb-6 sm:mb-8 h-[600px] sm:h-[650px] flex items-center justify-center overflow-hidden"
                >
                  {/* Card Container */}
                  <div
                    className={`w-full transition-all duration-300 ease-out ${dragStart ? 'cursor-grabbing' : 'cursor-grab'
                      } ${slideDirection === 'left' ? 'animate-slide-out-left' :
                        slideDirection === 'right' ? 'animate-slide-out-right' :
                          'animate-slide-in'
                      }`}
                    style={{
                      transform: dragStart ? `translateX(${draggedDistance}px)` : 'translateX(0)',
                      opacity: slideDirection ? 0 : 1,
                    }}
                  >
                    {loading ? (
                      renderSkeletonCard('loading')
                    ) : (
                      <ConfessionCard key={filteredConfessions[currentCardIndex]._id} confession={filteredConfessions[currentCardIndex]} showExpiry={false} />
                    )}
                  </div>

                  {/* Left Arrow */}
                  {currentCardIndex > 0 && (
                    <button
                      onClick={handlePrevCard}
                      className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 -translate-x-12 sm:-translate-x-16 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-surface-dark shadow-lg hover:scale-110 transition-transform border border-slate-200 dark:border-white/10"
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-900 dark:text-white">chevron_left</span>
                    </button>
                  )}

                  {/* Right Arrow */}
                  {currentCardIndex < filteredConfessions.length - 1 && (
                    <button
                      onClick={handleNextCard}
                      className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 translate-x-12 sm:translate-x-16 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-surface-dark shadow-lg hover:scale-110 transition-transform border border-slate-200 dark:border-white/10"
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-900 dark:text-white">chevron_right</span>
                    </button>
                  )}
                </div>

                {/* Card Counter */}
                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
                  <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400">
                    {currentCardIndex + 1} / {filteredConfessions.length}
                  </span>
                  {loadingMore && (
                    <span className="text-xs text-slate-500 dark:text-slate-500 animate-pulse">Loading more...</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-3xl mx-auto h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-6 sm:mb-8">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
                    style={{ width: `${(currentCardIndex + 1) / filteredConfessions.length * 100}%` }}
                  />
                </div>
              </>
            )}
          </div>

          <aside className="hidden xl:block w-72 xl:w-80 sticky top-20 h-fit">
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
