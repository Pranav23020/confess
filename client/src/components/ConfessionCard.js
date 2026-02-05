import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { likesAPI } from '../api';
import ShareTemplateModal from './ShareTemplateModal';

const ConfessionCard = ({ confession, showExpiry = false }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(confession.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
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
    if (liking) return;
    
    try {
      setLiking(true);
      const response = await likesAPI.toggle(confession._id);
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
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
  
  return (
    <article className="relative group cursor-pointer" onClick={() => navigate(`/confession/${confession._id}`)}>
      <div className={`absolute -inset-[1px] bg-gradient-to-br ${getGradientColors(0)} rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]`}></div>
      <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-card h-full flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary/40 text-4xl select-none">format_quote</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Posted {getTimeAgo(confession.createdAt)}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/report/${confession._id}/confession`);
              }} 
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
              {categoryLabel(confession.category)}
            </span>
            {confession.isPoll && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500">
                Poll
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl font-medium leading-relaxed tracking-wide text-slate-800 dark:text-gray-100 mb-6">
            {confession.text}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2 relative z-10">
          <div className="flex gap-3">
            <button 
              onClick={handleLike}
              disabled={liking}
              className={`transition-colors flex items-center gap-1 text-xs font-semibold ${
                liked ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${liked ? 'filled' : ''}`}>favorite</span> 
              {likeCount || 0}
            </button>
            <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span> 
              {confession.replyCount || 0}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="text-slate-400 hover:text-purple-500 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
          </div>
          {showExpiry && (
            <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className={`material-symbols-outlined text-[14px] ${getTimerColor(confession.hoursRemaining)}`}>timer</span>
              <span className={`text-xs font-semibold ${getTimerColor(confession.hoursRemaining)}/90`}>
                Expires in {confession.hoursRemaining}
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
