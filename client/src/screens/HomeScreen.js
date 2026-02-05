import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ConfessionCard from '../components/ConfessionCard';
import EmptyState from '../components/EmptyState';
import { confessionsAPI, userAPI, blockedKeywordsAPI } from '../api';

const HomeScreen = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [canPost, setCanPost] = useState(true);
  const [blockedKeywords, setBlockedKeywords] = useState([]);

  useEffect(() => {
    fetchConfessions();
    fetchActiveCount();
    fetchBlockedKeywords();
  }, []);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const response = await confessionsAPI.getAll();
      setConfessions(response.data.confessions);
      setError(null);
    } catch (err) {
      setError('Failed to load confessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredConfessions = useMemo(() => {
    if (!blockedKeywords.length) return confessions;
    const blocked = blockedKeywords.map(k => k.keyword);
    return confessions.filter(c => {
      const text = (c.text || '').toLowerCase();
      return !blocked.some(word => text.includes(word));
    });
  }, [confessions, blockedKeywords]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center justify-between px-5 md:px-8 lg:px-12 h-16 max-w-md md:max-w-4xl lg:max-w-7xl mx-auto w-full">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Confessions</h1>
          <div className="flex items-center gap-4">
            {canPost ? (
              <Link 
                to="/new" 
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/25"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                New Confession
              </Link>
            ) : (
              <Link 
                to="/limit-reached" 
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-slate-400 dark:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">block</span>
                Limit Reached
              </Link>
            )}
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-slate-600 dark:text-gray-300">tune</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-grow pt-20 pb-32 md:pb-8 px-4 md:px-8 lg:px-12 w-full max-w-md md:max-w-4xl lg:max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mt-8">{error}</div>
        ) : filteredConfessions.length === 0 ? (
          <EmptyState 
            title="No confessions yet"
            description="The space is quiet. Be the first to share a thought in this safe haven."
          />
        ) : (
          <>
            <div className="mb-6 px-1 flex items-center justify-between">
              <p className="text-sm md:text-base font-medium text-slate-500 dark:text-gray-400">Recent whispers</p>
                          {canPost ? (
                            <Link 
                              to="/new" 
                              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 text-sm md:text-base"
                            >
                              <span className="material-symbols-outlined text-[18px] md:text-[20px]">add</span>
                              <span className="hidden sm:inline">New Confession</span>
                              <span className="sm:hidden">New</span>
                            </Link>
                          ) : (
                            <Link 
                              to="/limit-reached" 
                              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-slate-400 dark:bg-slate-600 text-white rounded-xl font-semibold transition-all text-sm md:text-base"
                            >
                              <span className="material-symbols-outlined text-[18px] md:text-[20px]">block</span>
                              <span className="hidden sm:inline">Limit Reached</span>
                            </Link>
                          )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filteredConfessions.map((confession) => (
                <ConfessionCard key={confession._id} confession={confession} showExpiry={false} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* FAB - Mobile Only */}
      <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        {canPost ? (
          <Link 
            to="/new" 
            className="group flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-glow text-white transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">edit_note</span>
          </Link>
        ) : (
          <Link 
            to="/limit-reached" 
            className="group flex items-center justify-center w-14 h-14 bg-slate-400 dark:bg-slate-600 rounded-full shadow-glow text-white transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">block</span>
          </Link>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
};

export default HomeScreen;
