import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { likesAPI } from '../api';
import ShareTemplateModal from './ShareTemplateModal';
import HashtagBadges from './HashtagBadges';
import { AuthContext } from '../context/AuthContext';

const ConfessionCard = ({ confession, showExpiry = false }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef(null);

  const getGradientColors = (index) => {
    const gradients = [
      'from-primary/60 to-purple-500/20',
      'from-blue-500/40 to-primary/30',
      'from-rose-500/30 to-orange-500/20',
    ];
    return gradients[index % gradients.length];
  };

  const getTimerColor = (hours) => {
    if (hours === 'Soon' || hours.includes('m')) return 'text-rose-400';
    const h = parseInt(hours);
    if (h < 3) return 'text-rose-400';
    if (h < 12) return 'text-primary';
    return 'text-blue-400';
  };

  const categoryLabel = (value) => {
    const map = {
      love: 'Love',
      career: 'Career',
      secrets: 'Secrets',
      life: 'Life',
      relationships: 'Relationships',
      'mental-health': 'Mental Health',
      other: 'Other'
    };
    return map[value] || 'Other';
  };

  const handleLike = async (e) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (liking) return;

    try {
      setLiking(true);
      const response = await likesAPI.toggle(confession._id);
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLiking(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseClean = base.replace(/\/$/, '').replace(/\/api$/, '');
    const path = image.startsWith('/') ? image : `/${image}`;
    return `${baseClean}${path}`;
  };

  const images = Array.isArray(confession.images) && confession.images.length
    ? confession.images
    : (confession.image ? [confession.image] : []);

  const handleImageScroll = (e) => {
    const el = e.currentTarget;
    const width = el.clientWidth || 1;
    const index = Math.round(el.scrollLeft / width);
    const clamped = Math.min(Math.max(index, 0), images.length - 1);
    setCurrentImageIndex(clamped);
  };

  return (
    <article className="relative group cursor-pointer" onClick={() => navigate(`/confession/${confession._id}`)}>
      {/* Outer border glow - more subtle and precise */}
      <div className={`absolute -inset-[1px] bg-gradient-to-br ${getGradientColors(0)} rounded-[24px] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[2px]`}></div>

      <div className="relative bg-white dark:bg-surface-dark rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-3 md:p-6 shadow-premium h-full flex flex-col justify-between overflow-hidden transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl border border-white/5">
        {/* Subtle inner ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>

        <div className="relative z-10 flex-grow">
          <div className="flex justify-between items-start mb-2 sm:mb-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary/60 text-sm sm:text-base select-none">format_quote</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">A WHISPER FROM</span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">{getTimeAgo(confession.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/report/${confession._id}/confession`);
              }}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              <span className="material-symbols-outlined text-xl">flag</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
            <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/10">
              {categoryLabel(confession.category)}
            </span>
            {confession.isPoll && (
              <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/10">
                Poll Active
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base md:text-lg font-bold leading-tight sm:leading-[1.6] tracking-tight text-slate-800 dark:text-gray-100 mb-3 sm:mb-4 [text-wrap:balance]">
            {confession.text.replace(/#[\w]+/gi, '').trim()}
          </p>

          {/* Hashtags Display - Only visible to creator */}
          {user && confession.userId === user._id && confession.hashtags && confession.hashtags.length > 0 && (
            <div className="mb-2 sm:mb-4">
              <HashtagBadges hashtags={confession.hashtags} size="sm" />
            </div>
          )}

          {images.length > 0 && (
            <div className="mb-3 sm:mb-4 relative group/images">
              <div
                ref={imageScrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-lg sm:rounded-2xl"
                onScroll={handleImageScroll}
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, index) => (
                  <div key={`${img}-${index}`} className="snap-center min-w-full">
                    <img
                      src={getImageUrl(img)}
                      alt={`Confession ${index + 1}`}
                      className="w-full rounded-lg sm:rounded-2xl object-cover max-h-32 sm:max-h-48 border border-white/5 shadow-lg shadow-black/20"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-black text-white bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 relative z-10">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`group/btn flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all font-bold text-[10px] sm:text-xs ring-1 ring-inset ${liked
                ? 'bg-red-500 text-white ring-red-500 shadow-lg shadow-red-500/30'
                : 'text-slate-400 ring-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:text-red-500'
                }`}
            >
              <span className={`material-symbols-outlined text-base sm:text-lg transition-transform group-hover/btn:scale-110 ${liked ? 'filled' : ''}`}>favorite</span>
              <span className="hidden sm:inline">{likeCount || 0}</span>
            </button>
            <button className="group/btn flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all font-bold text-[10px] sm:text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary">
              <span className="material-symbols-outlined text-base sm:text-lg transition-transform group-hover/btn:scale-110">forum</span>
              <span className="hidden sm:inline">{confession.replyCount || 0}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="group/btn flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-lg transition-all text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-purple-500"
            >
              <span className="material-symbols-outlined text-base sm:text-lg transition-transform group-hover/btn:rotate-12">share</span>
            </button>
          </div>

          {showExpiry && (
            <div className="bg-slate-50 dark:bg-white/[0.03] px-2 sm:px-3 py-1 sm:py-2 rounded-lg flex items-center gap-1 border border-slate-100 dark:border-white/5 shadow-sm">
              <span className={`material-symbols-outlined text-sm sm:text-base ${getTimerColor(confession.hoursRemaining)} animate-pulse`}>timer</span>
              <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${getTimerColor(confession.hoursRemaining)}/80`}>
                ENDS IN {confession.hoursRemaining}
              </span>
            </div>
          )}
        </div>
      </div>

      <ShareTemplateModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        confessionText={confession.text}
      />

    </article>
  );
};

export default ConfessionCard;
