import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { userAPI, confessionsAPI, blockedKeywordsAPI } from '../api';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [activeCount, setActiveCount] = useState(0);
  const [myConfessions, setMyConfessions] = useState([]);
  const [blockedKeywords, setBlockedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [notifyReplies, setNotifyReplies] = useState(() => {
    return localStorage.getItem('notifyReplies') === 'true';
  });

  useEffect(() => {
    fetchUserData();
    fetchBlockedKeywords();
  }, []);

  const fetchUserData = async () => {
    try {
      const [countRes, confessionsRes] = await Promise.all([
        userAPI.getActiveCount(),
        userAPI.getMyConfessions()
      ]);
      setActiveCount(countRes.data.activeCount);
      setMyConfessions(confessionsRes.data.confessions);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
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

  const getHoursRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Soon';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDelete = async (confessionId) => {
    if (window.confirm('Are you sure you want to delete this confession?')) {
      try {
        await confessionsAPI.delete(confessionId);
        setMyConfessions(myConfessions.filter(c => c._id !== confessionId));
        setActiveCount(activeCount - 1);
      } catch (err) {
        alert('Failed to delete confession');
        console.error(err);
      }
    }
  };

  const handleAddKeyword = async () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;
    try {
      const response = await blockedKeywordsAPI.add(keyword);
      setBlockedKeywords([...blockedKeywords, response.data.keyword]);
      setKeywordInput('');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add keyword');
    }
  };

  const handleRemoveKeyword = async (id) => {
    try {
      await blockedKeywordsAPI.remove(id);
      setBlockedKeywords(blockedKeywords.filter(k => k._id !== id));
    } catch (err) {
      alert('Failed to remove keyword');
    }
  };

  const handleToggleNotifications = () => {
    const next = !notifyReplies;
    setNotifyReplies(next);
    localStorage.setItem('notifyReplies', String(next));
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen overflow-x-hidden">
      <div className="relative w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto pb-24 md:pb-8 px-5 md:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between pt-20 md:pt-24 pb-6 md:pb-8 sticky top-0 bg-background-light dark:bg-background-dark z-20">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Space</h1>
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm md:text-base font-semibold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 md:px-8 lg:px-12 overflow-y-auto">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/5 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-1">Active Confessions</p>
                <p className="text-4xl md:text-5xl font-bold text-primary">{activeCount}/2</p>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl md:text-4xl">person</span>
              </div>
            </div>
            <div className="pt-4 border-t border-primary/20">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {activeCount < 2 
                  ? `You can post ${2 - activeCount} more ${activeCount === 1 ? 'confession' : 'confessions'}`
                  : 'You have reached your limit. Wait for one to expire.'}
              </p>
            </div>
          </div>

          {/* My Confessions */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">My Confessions</h2>
            {myConfessions.length === 0 ? (
              <div className="text-center py-16 md:py-20 bg-white dark:bg-surface-dark rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700/50">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-slate-400 mb-3 block">chat_bubble_outline</span>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">No active confessions</p>
                <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">Post your first anonymous thought</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {myConfessions.map((confession) => (
                  <div 
                    key={confession._id}
                    className="bg-white dark:bg-surface-dark rounded-2xl p-5 md:p-6 shadow-card border border-slate-100 dark:border-white/5 hover:shadow-xl transition-shadow relative group"
                  >
                    <p className="text-base md:text-lg font-medium text-slate-800 dark:text-gray-100 mb-4 leading-relaxed line-clamp-3">
                      {confession.text}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                        <span className="text-xs font-semibold">{confession.replyCount || 0} replies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[12px] text-primary">timer</span>
                          <span className="text-xs font-semibold text-primary">
                            {getHoursRemaining(confession.expiresAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(confession._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 hover:text-red-600"
                          title="Delete confession"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Filters */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-white/5 mb-6">
            <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">Content Filters</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Block keyword"
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedKeywords.length === 0 ? (
                <span className="text-xs text-slate-400">No blocked keywords</span>
              ) : (
                blockedKeywords.map((k) => (
                  <button
                    key={k._id}
                    onClick={() => handleRemoveKeyword(k._id)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {k.keyword} ×
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-white/5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">Reply Notifications</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get alerts when someone replies</p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-12 h-7 rounded-full transition-colors ${notifyReplies ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notifyReplies ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-blue-100 dark:border-blue-800/30">
            <div className="flex gap-3 md:gap-4">
              <span className="material-symbols-outlined text-blue-500 text-2xl md:text-3xl shrink-0">shield</span>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-blue-900 dark:text-blue-300 mb-1.5">
                  Privacy First
                </h3>
                <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                  Your confessions are completely anonymous. We don't store any personal information, only a secure device identifier.
                </p>
              </div>
            </div>
          </div>
        </main>

        <BottomNav active="me" />
      </div>
    </div>
  );
};

export default ProfileScreen;
