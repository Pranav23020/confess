import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import LikeButton from '../components/LikeButton';
import ReplyBubble from '../components/ReplyBubble';
import { confessionsAPI, repliesAPI, pollsAPI } from '../api';
import ShareTemplateModal from '../components/ShareTemplateModal';
import ConfirmationModal from '../components/ConfirmationModal';
import HashtagBadges from '../components/HashtagBadges';
import { useLike } from '../hooks/useLike';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ConfessionDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [confession, setConfession] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the custom hook for like management
  const { liked, likeCount, isLoading: liking, toggleLike } = useLike(id, 0, false);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [pollResults, setPollResults] = useState([]);
  const [pollMeta, setPollMeta] = useState({ totalVotes: 0, hasVoted: false, votedOption: null });
  const [pollLoading, setPollLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCenterHeart, setShowCenterHeart] = useState(false);
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Double-tap detection ref
  const lastTapTimeRef = useRef(0);
  const isProcessingActionRef = useRef(false);

  const fetchPollResults = useCallback(async () => {
    try {
      setPollLoading(true);
      const res = await pollsAPI.results(id);
      setPollResults(res.data.pollResults || []);
      setPollMeta({
        totalVotes: res.data.totalVotes || 0,
        hasVoted: res.data.hasVoted,
        votedOption: res.data.votedOption
      });
    } catch (err) {
      console.error('Failed to fetch poll results:', err);
    } finally {
      setPollLoading(false);
    }
  }, [id]);

  const fetchConfession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await confessionsAPI.getById(id);
      setConfession(response.data.confession);
      setReplies(response.data.replies);

      if (response.data.confession.isPoll) {
        await fetchPollResults();
      }

      setError(null);
    } catch (err) {
      setError('Confession not found or expired');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, fetchPollResults]);

  useEffect(() => {
    fetchConfession();

    const handleEngagement = (data) => {
      if (data.confessionId === id) {
        setConfession(prev => prev ? { ...prev, replyCount: data.replyCount } : prev);
      }
    };

    const socket = require('../utils/socket').default;
    socket.on('confession:engagement', handleEngagement);

    return () => {
      socket.off('confession:engagement', handleEngagement);
    };
  }, [id, fetchConfession]);

  const handleVote = async (optionIndex) => {
    try {
      setPollLoading(true);
      const res = await pollsAPI.vote(id, optionIndex);
      setPollResults(res.data.pollResults || []);
      setPollMeta({
        totalVotes: res.data.totalVotes || 0,
        hasVoted: true,
        votedOption: res.data.votedOption
      });
    } catch (err) {
      showToast('Failed to vote', 'error');
    } finally {
      setPollLoading(false);
    }
  };

  const handleLike = useCallback(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleLike();
  }, [user, navigate, toggleLike]);

  /**
   * Handle double-tap on confession content (Instagram-style)
   */
  const handleDoubleTap = useCallback((e) => {
    // Prevent multiple rapid double-taps
    if (isProcessingActionRef.current || liking) {
      return;
    }

    // Don't trigger if clicking buttons or interactive elements
    const target = e.target;
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('.no-double-tap')
    ) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    // Only like if not already liked (Instagram behavior)
    if (!liked && !liking) {
      isProcessingActionRef.current = true;

      // Show center heart animation
      setShowCenterHeart(true);
      setTimeout(() => setShowCenterHeart(false), 800);

      // Trigger like
      toggleLike();

      // Reset flag after request completes
      setTimeout(() => {
        isProcessingActionRef.current = false;
      }, 1000);
    }
  }, [user, liked, liking, navigate, toggleLike]);

  /**
   * Touch/Click handler for double-tap detection
   * Detects double-tap within 250ms window
   */
  const handleContentTap = useCallback((e) => {
    // Don't process if already processing or loading
    if (isProcessingActionRef.current || liking) {
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Double-tap detected (within 250ms)
    if (timeSinceLastTap < 250 && timeSinceLastTap > 0) {
      e.preventDefault();
      e.stopPropagation();
      handleDoubleTap(e);
      lastTapTimeRef.current = 0; // Reset
    } else {
      lastTapTimeRef.current = now;
    }
  }, [handleDoubleTap, liking]);

  /**
   * Desktop double-click handler
   */
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDoubleTap(e);
  }, [handleDoubleTap]);

  const handlePostReply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (replyText.trim().length < 1) return;

    try {
      setPosting(true);
      await repliesAPI.create(id, replyText, replyTo?._id || null);
      setReplyText('');
      setReplyTo(null);
      fetchConfession(); // Refresh to get new reply
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      showToast(err.response?.data?.error?.message || 'Failed to post reply', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await confessionsAPI.delete(id);
      showToast('Whisper deleted successfully');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete confession', 'error');
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getTimerColor = (hours) => {
    if (hours === 'Soon' || hours.includes('m')) return 'text-rose-400';
    const h = parseInt(hours);
    if (h < 3) return 'text-rose-400';
    if (h < 12) return 'text-primary';
    return 'text-blue-400';
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseClean = base.replace(/\/$/, '').replace(/\/api$/, '');
    const path = image.startsWith('/') ? image : `/${image}`;
    return `${baseClean}${path}`;
  };

  const images = confession?.images?.length
    ? confession.images
    : (confession?.image ? [confession.image] : []);

  const openImageModal = (index = 0) => {
    if (!images.length) return;
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!showImageModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeImageModal();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showImageModal, closeImageModal, goPrev, goNext]);

  const buildReplyTree = (list) => {
    const map = {};
    list.forEach(r => {
      map[r._id] = { ...r, children: [] };
    });
    const roots = [];
    list.forEach(r => {
      if (r.parentReplyId && map[r.parentReplyId]) {
        map[r.parentReplyId].children.push(map[r._id]);
      } else {
        roots.push(map[r._id]);
      }
    });
    return roots;
  };

  const renderReplies = (list, depth = 0) => (
    list.map(reply => (
      <div key={reply._id} className="space-y-2">
        <ReplyBubble reply={reply} depth={depth} onReply={setReplyTo} />
        {reply.children?.length > 0 && (
          <div className="space-y-2">
            {renderReplies(reply.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !confession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark px-6">
        <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confession Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-2">
          This confession may have expired or been removed.
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6">
          Confessions automatically expire after 24 hours.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between px-3 sm:px-5 h-14 sm:h-16 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">Confession</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            {confession?.isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-red-500"
                title="Delete Confession"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
            <button
              onClick={() => navigate(`/report/${id}/confession`)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-600 dark:text-gray-300">flag</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-14 sm:pt-20 pb-24 sm:pb-28 md:pb-24 px-2 sm:px-4 md:px-8 lg:px-12 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto overflow-y-auto">
        {/* Confession */}
        <div className="relative group mb-4 sm:mb-5 md:mb-6">
          <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/60 to-purple-500/20 rounded-xl sm:rounded-2xl opacity-70 blur-[1px]"></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-8 shadow-card overflow-hidden double-tap-container">
            {/* Instagram-style center heart animation */}
            {showCenterHeart && (
              <div className="instagram-large-heart instagram-center-heart">
                <span className="material-symbols-outlined filled" style={{ fontSize: 'inherit' }}>
                  favorite
                </span>
              </div>
            )}
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-primary/40 text-3xl sm:text-4xl md:text-5xl mb-3 select-none block">format_quote</span>
              
              {/* Double-tap area for text */}
              <div 
                onClick={handleContentTap}
                onDoubleClick={handleDoubleClick}
                className="cursor-pointer select-none"
              >
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed text-slate-800 dark:text-gray-100 mb-4 sm:mb-5 md:mb-6">
                  {confession.text.replace(/#[\w]+/gi, '').trim()}
                </p>
              </div>
              
              {user && confession.userId === user._id && confession.hashtags && confession.hashtags.length > 0 && (
                <div className="mb-6">
                  <HashtagBadges hashtags={confession.hashtags} size="md" />
                </div>
              )}
              {images.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={(e) => {
                      handleContentTap(e);
                      openImageModal(0);
                    }}
                    onDoubleClick={handleDoubleClick}
                  >
                    <img
                      src={getImageUrl(images[0])}
                      alt="Confession"
                      className="w-full rounded-lg sm:rounded-xl object-cover max-h-48 sm:max-h-64 border border-slate-200 dark:border-white/10 select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="px-3 py-1.5 text-xs font-semibold text-white bg-black/40 rounded-full">View photo</span>
                    </div>
                    {images.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 text-xs font-semibold text-white bg-black/40 rounded-full pointer-events-none">
                        1 / {images.length}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {confession.isPoll && (
                <div className="space-y-3 mb-6 no-double-tap">
                  {pollLoading && pollResults.length === 0 ? (
                    <div className="text-sm text-slate-400">Loading poll...</div>
                  ) : (
                    pollResults.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        disabled={pollLoading}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${pollMeta.votedOption === idx
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 dark:border-white/10'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{opt.text}</span>
                          <span className="text-xs text-slate-500">{opt.percentage}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${opt.percentage}%` }}></div>
                        </div>
                      </button>
                    ))
                  )}
                  <div className="text-xs text-slate-400">{pollMeta.totalVotes} votes</div>
                </div>
              )}
              <div className="flex items-center justify-between no-double-tap">
                <div className="flex gap-3">
                  <LikeButton
                    liked={liked}
                    likeCount={likeCount}
                    onLike={handleLike}
                    isLoading={liking}
                    compact={false}
                    onNavigateLogin={() => navigate('/login')}
                    isAuthenticated={!!user}
                  />
                  <div className="text-slate-400 flex items-center gap-1 text-sm font-semibold">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    {confession.replyCount || 0}
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="text-slate-400 hover:text-purple-500 transition-colors flex items-center gap-1 text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[14px] ${getTimerColor(confession.hoursRemaining)}`}>timer</span>
                  <span className={`text-xs font-semibold ${getTimerColor(confession.hoursRemaining)}/90`}>
                    Expires in {confession.hoursRemaining}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4 px-1">
            Replies ({replies.length})
          </h3>
          {replies.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">chat_bubble_outline</span>
              <p className="text-sm">No replies yet. Be the first to respond.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {renderReplies(buildReplyTree(replies))}
            </div>
          )}
        </div>
      </main>

      {/* Reply Input - Fixed at bottom */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-white/5 p-4 md:p-6 z-30">
        <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col gap-2 md:gap-3">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              Replying to: {replyTo.text?.slice(0, 40)}
              <button
                onClick={() => setReplyTo(null)}
                className="text-primary"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2 md:gap-3">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePostReply()}
              placeholder="Write a reply..."
              maxLength={300}
              className="flex-1 px-4 md:px-5 py-3 md:py-4 text-base md:text-lg bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
            />
            <button
              onClick={handlePostReply}
              disabled={posting || replyText.trim().length < 1}
              className="px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-xl text-base md:text-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <BottomNav active="home" />

      {showImageModal && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeImageModal();
            }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 md:left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}
          <img
            src={getImageUrl(images[currentImageIndex])}
            alt="Confession full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 md:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-6 text-xs text-white/80">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      <ShareTemplateModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        confessionText={confession.text}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Whisper?"
        message="This will permanently remove your whisper. This action cannot be undone."
      />
    </div>
  );
};

export default ConfessionDetailScreen;
