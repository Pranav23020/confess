import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const ShareInboxModal = ({ isOpen, onClose, username }) => {
  const { showToast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const profileUrl = `${window.location.origin}/u/${username}`;
  const message = `Send me an anonymous message!`;

  const handleShare = async (platform) => {
    setIsSharing(true);
    try {
      if (platform === 'whatsapp') {
        const text = encodeURIComponent(`${message}\n\n${profileUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        showToast('Opening WhatsApp...', 'success');
      } else if (platform === 'twitter') {
        const text = encodeURIComponent(`${message}\n\n${profileUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        showToast('Opening Twitter...', 'success');
      } else if (platform === 'facebook') {
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        window.open(facebookShareUrl, '_blank', 'width=600,height=400');
        showToast('Opening Facebook...', 'success');
      } else if (platform === 'telegram') {
        const text = encodeURIComponent(`${message}\n\n${profileUrl}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${text}`, '_blank');
        showToast('Opening Telegram...', 'success');
      } else if (platform === 'instagram') {
        await navigator.clipboard.writeText(`${message}\n\n${profileUrl}`);
        showToast('Link copied! Open Instagram and paste in your story caption', 'success');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(profileUrl);
        showToast('Link copied to clipboard!', 'success');
      }
      setTimeout(() => onClose(), 500);
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Failed to share. Please try again.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Your Link</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="p-6">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Share on Your Favorite Platform</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">Let your friends send you anonymous messages by sharing your personalized link.</p>
              </div>
            </div>
          </div>

          {/* Your Link Display */}
          <div className="bg-gray-100 dark:bg-slate-700 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wider">Your Personal Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {profileUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  showToast('Copied to clipboard!', 'success');
                }}
                className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                <span className="material-icons text-lg">content_copy</span>
              </button>
            </div>
          </div>

          {/* Platform Selection Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Share to...</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'from-green-400 to-green-600' },
                { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-400 to-pink-600' },
                { id: 'twitter', name: 'Twitter', icon: '𝕏', color: 'from-gray-800 to-black' },
                { id: 'facebook', name: 'Facebook', icon: 'f', color: 'from-blue-600 to-blue-800' },
                { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'from-blue-400 to-cyan-500' },
                { id: 'copy', name: 'Copy Link', icon: '📋', color: 'from-gray-400 to-gray-600' },
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  disabled={isSharing}
                  className={`p-4 rounded-xl border-2 border-transparent transition-all hover:shadow-lg disabled:opacity-50 ${
                    isSharing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: isSharing ? '#f3f4f6' : `linear-gradient(135deg, var(--tw-gradient-stops))`
                  }}
                  onMouseEnter={(e) => {
                    const colorMap = {
                      whatsapp: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                      instagram: 'linear-gradient(135deg, #c084fc 0%, #db2777 100%)',
                      twitter: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)',
                      facebook: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                      telegram: 'linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%)',
                      copy: 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)'
                    };
                    e.currentTarget.style.background = colorMap[platform.id];
                  }}
                  onMouseLeave={(e) => {
                    if (!isSharing) {
                      e.currentTarget.style.background = `linear-gradient(135deg, var(--tw-gradient-stops))`;
                    }
                  }}
                >
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <div className="text-xs font-semibold text-white drop-shadow">{platform.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">💡 Pro Tips:</p>
            <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
              <li>• Share in your Instagram stories to get more messages</li>
              <li>• Add to your WhatsApp status for easy access</li>
              <li>• Pin the link for quick sharing with friends</li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareInboxModal;
