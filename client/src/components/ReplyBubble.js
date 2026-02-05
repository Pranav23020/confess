import React from 'react';

const ReplyBubble = ({ reply, depth = 0, onReply }) => {
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };
  
  return (
    <div
      className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/5"
      style={{ marginLeft: depth * 16 }}
    >
      <p className="text-base font-medium text-slate-800 dark:text-gray-100 mb-2">
        {reply.text}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Anonymous
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onReply?.(reply)}
            className="text-xs font-semibold text-primary hover:text-primary/80"
          >
            Reply
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatTime(reply.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReplyBubble;
