import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { userAPI, confessionsAPI, blockedKeywordsAPI } from '../api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, confessions, replies
  const [myConfessions, setMyConfessions] = useState([]);
  const [myReplies, setMyReplies] = useState([]);
  const [blockedKeywords, setBlockedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [notifyReplies, setNotifyReplies] = useState(() => {
    return localStorage.getItem('notifyReplies') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confessionToDelete, setConfessionToDelete] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, activityRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getMyActivity('all')
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.user);
      }

      if (activityRes.data.success) {
        setMyConfessions(activityRes.data.confessions || []);
        setMyReplies(activityRes.data.replies || []);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchBlockedKeywords = useCallback(async () => {
    try {
      const response = await blockedKeywordsAPI.list();
      setBlockedKeywords(response.data.keywords || []);
    } catch (err) {
      console.error('Failed to fetch blocked keywords:', err);
    }
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchUserProfile();
      fetchBlockedKeywords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-fetch when user changes, not on callback changes

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

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDelete = async () => {
    if (!confessionToDelete) return;
    try {
      await confessionsAPI.delete(confessionToDelete);
      setMyConfessions(myConfessions.filter(c => c._id !== confessionToDelete));
      showToast('Whisper deleted');
      setProfile((prev) => {
        if (!prev?.stats) return prev;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalConfessions: Math.max(0, (prev.stats.totalConfessions || 0) - 1),
            activeConfessions: Math.max(0, (prev.stats.activeConfessions || 0) - 1)
          }
        };
      });
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete confession', 'error');
      console.error(err);
    } finally {
      setShowDeleteModal(false);
      setConfessionToDelete(null);
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
      showToast(err.response?.data?.error?.message || 'Failed to add keyword', 'error');
    }
  };

  const handleRemoveKeyword = async (id) => {
    try {
      await blockedKeywordsAPI.remove(id);
      setBlockedKeywords(blockedKeywords.filter(k => k._id !== id));
    } catch (err) {
      showToast('Failed to remove keyword', 'error');
    }
  };

  const handleToggleNotifications = () => {
    const next = !notifyReplies;
    setNotifyReplies(next);
    localStorage.setItem('notifyReplies', String(next));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-200 dark:border-white/10 border-t-primary"></div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl sm:text-6xl text-slate-300 dark:text-slate-700 mb-4 block">account_circle</span>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">Please login to view your profile</p>
          <button onClick={() => navigate('/login')} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-xl font-semibold text-sm sm:text-base transition-all active:scale-95">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-b border-slate-200/40 dark:border-white/5 transition-all duration-300">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 md:h-18 max-w-full">
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight line-clamp-1">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg md:rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] md:text-[20px]">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
        {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-18 md:pt-20 pb-32 sm:pb-36 md:pb-12 px-2 sm:px-3 md:px-4 lg:px-6 w-full max-w-7xl mx-auto">
        <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
          {/* Profile Header Card */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/5 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-primary/20">
            <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
              {/* Avatar */}
              <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-base sm:text-lg md:text-2xl lg:text-3xl font-bold">
                    {profile.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                  {profile.username}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5 break-all line-clamp-2">
                  {profile.email}
                </p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-slate-500">
                  Member since {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 md:mt-6 pt-3 sm:pt-4 md:pt-5 border-t border-primary/20">
              <div className="text-center">
                <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                  {profile.stats?.totalConfessions || 0}
                </p>
                <p className="text-[8px] sm:text-[9px] md:text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Confessions
                </p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                  {profile.stats?.totalReplies || 0}
                </p>
                <p className="text-[8px] sm:text-[9px] md:text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Replies
                </p>
              </div>
              <div className="text-center">
                <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                  {profile.stats?.activeConfessions || 0}
                </p>
                <p className="text-[8px] sm:text-[9px] md:text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Active
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('confessions')}
              className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${activeTab === 'confessions' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            >
              Confessions <span className="hidden sm:inline">({myConfessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${activeTab === 'replies' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
            >
              Replies <span className="hidden sm:inline">({myReplies.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Content Filters */}
              <div className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-white/5">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wide">
                  Content Filters
                </h3>
                <div className="flex gap-2 mb-3 sm:mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add word to block..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg md:rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {blockedKeywords.length === 0 ? (
                    <span className="text-xs text-slate-400 py-2">No blocked keywords yet</span>
                  ) : (
                    blockedKeywords.map((k) => (
                      <button
                        key={k._id}
                        onClick={() => handleRemoveKeyword(k._id)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95"
                      >
                        {k.keyword} ×
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 dark:text-white">
                      Reply Notifications
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">Get alerts when someone replies</p>
                  </div>
                  <button
                    onClick={handleToggleNotifications}
                    className={`w-12 h-7 rounded-full transition-all flex-shrink-0 ${notifyReplies ? 'bg-primary shadow-lg shadow-primary/25' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${notifyReplies ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-100 dark:border-blue-800/30">
                <div className="flex gap-2 sm:gap-3 md:gap-4">
                  <span className="material-symbols-outlined text-blue-500 text-lg sm:text-2xl md:text-3xl shrink-0 mt-0.5">
                    shield
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Your Data is Secured
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                      We store your confessions and replies linked to your account. Only you can see which posts are yours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'confessions' && (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {myConfessions.length === 0 ? (
                <div className="text-center py-12 sm:py-16 md:py-20 bg-white dark:bg-surface-dark rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <span className="material-symbols-outlined text-4 sm:text-5xl md:text-6xl text-slate-400 mb-3 block">
                    chat_bubble_outline
                  </span>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">No confessions yet</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">Start sharing your thoughts</p>
                </div>
              ) : (
                myConfessions.map((confession) => (
                  <div
                    key={confession._id}
                    className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/60 dark:border-white/5 hover:shadow-md dark:hover:shadow-black/20 transition-all cursor-pointer active:scale-95"
                    onClick={() => navigate(`/confession/${confession._id}`)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                      <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-[9px] sm:text-xs font-semibold uppercase tracking-wide flex-shrink-0">
                        {confession.category}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {confession.expiresAt && new Date(confession.expiresAt) > new Date() && (
                          <div className="flex items-center gap-1 text-[9px] sm:text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full">
                            <span className="material-symbols-outlined text-[12px] sm:text-[14px]">timer</span>
                            {getHoursRemaining(confession.expiresAt)}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfessionToDelete(confession._id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                          title="Delete confession"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-gray-100 mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                      {confession.text}
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                        {confession.replyCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">favorite</span>
                        {confession.likeCount || 0}
                      </span>
                      <span>{formatDate(confession.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'replies' && (
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {myReplies.length === 0 ? (
                <div className="text-center py-12 sm:py-16 md:py-20 bg-white dark:bg-surface-dark rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <span className="material-symbols-outlined text-4 sm:text-5xl md:text-6xl text-slate-400 mb-3 block">
                    forum
                  </span>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">No replies yet</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">Join the conversation</p>
                </div>
              ) : (
                myReplies.map((reply) => (
                  <div
                    key={reply._id}
                    className="bg-white dark:bg-surface-dark rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-200/60 dark:border-white/5 hover:shadow-md dark:hover:shadow-black/20 transition-all cursor-pointer active:scale-95"
                    onClick={() => reply.confessionId?._id && navigate(`/confession/${reply.confessionId._id}`)}
                  >
                    <p className="text-[9px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2 font-medium">
                      Reply to: <span className="font-bold text-slate-700 dark:text-slate-300">"{reply.confessionId?.text?.substring(0, 40)}..."</span>
                    </p>
                    <p className="text-xs sm:text-sm md:text-base font-medium text-slate-800 dark:text-gray-100 mb-2 sm:mb-3 leading-relaxed line-clamp-3">
                      {reply.text}
                    </p>
                    <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">{formatDate(reply.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav active="me" />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConfessionToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Whisper?"
        message="This will permanently remove your whisper. This action cannot be undone."
      />
    </div>
  );
};

export default ProfileScreen;
