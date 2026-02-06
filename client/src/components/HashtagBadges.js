import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash } from 'lucide-react';

const HashtagBadges = ({ hashtags = [], size = 'sm', clickable = true }) => {
  const navigate = useNavigate();

  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const handleHashtagClick = (tag) => {
    if (clickable) {
      navigate(`/hashtags/${tag}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {hashtags.map((tag, index) => (
        <button
          key={index}
          onClick={() => handleHashtagClick(tag)}
          disabled={!clickable}
          className={`
            inline-flex items-center gap-1 rounded-full font-medium transition-all
            ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            ${sizeClasses[size]}
            bg-gradient-to-r from-purple-500/20 to-pink-500/20
            border border-purple-300/30
            text-purple-300 hover:text-purple-200
            hover:border-purple-300/50
          `}
        >
          <Hash className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>{tag}</span>
        </button>
      ))}
    </div>
  );
};

export default HashtagBadges;
