import React, { useState, useEffect, useContext } from 'react';
import { repliesAPI } from '../api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Instagram-style Comments Modal
 * Slides up from bottom with comments and reply functionality
 */
const CommentsModal = ({ isOpen, onClose, confession }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch replies when modal opens
  useEffect(() => {
    if (isOpen && confession?._id) {
      fetchReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, confession?._id]);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const response = await repliesAPI.getByConfessionId(confession._id);
      setReplies(response.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async () => {
    if (!user) {
      showToast('Please login to comment', 'error');
      return;
    }

    if (replyText.trim().length < 1) return;

    try {
      setPosting(true);
      await repliesAPI.create(confession._id, replyText, null);
      setReplyText('');
      fetchReplies(); // Refresh replies
      showToast('Comment posted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostReply();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Instagram Style Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl animate-slide-up max-h-[75vh] flex flex-col">
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Comments
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-50">chat_bubble_outline</span>
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply._id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm">person</span>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Anonymous
                        </p>
                        <p className="text-sm text-slate-800 dark:text-gray-100 mt-0.5 break-words">
                          {reply.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">
                            {formatTime(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Like Button */}
                      <button className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <span className="material-symbols-outlined text-lg">favorite</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-slate-200 dark:border-white/10 p-4 bg-white dark:bg-surface-dark">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-sm">person</span>
            </div>

            {/* Input */}
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a comment..."
              disabled={posting}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-100 dark:bg-white/5 rounded-full border-none outline-none focus:ring-2 focus:ring-primary/30 text-slate-900 dark:text-white placeholder:text-slate-400"
            />

            {/* Post Button */}
            {replyText.trim().length > 0 && (
              <button
                onClick={handlePostReply}
                disabled={posting}
                className="text-primary font-semibold text-sm hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default CommentsModal;
