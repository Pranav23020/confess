import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Instagram, Share2, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';

const ShareInboxModal = ({ isOpen, onClose, username }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const storyRef = useRef(null);
  const profileUrl = `${window.location.origin}/u/${username}`;

  if (!isOpen) return null;

  const generateImage = async () => {
    if (!storyRef.current) return null;
    try {
      const canvas = await html2canvas(storyRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate image:', error);
      return null;
    }
  };

  const handleShareToInstagram = async () => {
    setLoading(true);
    try {
      const dataUrl = await generateImage();
      if (!dataUrl) throw new Error('Failed to generate image');

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'anon-ask.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ask me anything!',
          text: `Send me anonymous messages! ${profileUrl}`
        });
        showToast('Opening Instagram...', 'success');
      } else {
        const link = document.createElement('a');
        link.download = 'anon-ask-story.png';
        link.href = dataUrl;
        link.click();

        await navigator.clipboard.writeText(profileUrl);
        alert('Image downloaded! Upload to Instagram Story and paste your link.');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      showToast('Failed to share', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    showToast('Link copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] max-w-sm w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">

          <div className="text-center">
            <h2 className="text-2xl font-black">Share Your Link</h2>
            <p className="text-sm text-slate-500">Post this to your story so people can ask anonymously.</p>
          </div>

          {/* STORY PREVIEW */}
          <div className="flex justify-center">
            <div
              ref={storyRef}
              className="w-[300px] h-[533px] relative overflow-hidden rounded-[28px] flex flex-col items-center justify-center text-center px-6"
              style={{
                background:
                  'linear-gradient(160deg, #5f2eea 0%, #9f44d3 45%, #ff6ec7 100%)'
              }}
            >

              {/* Username */}
              <div className="absolute top-8 px-5 py-2 rounded-full text-white text-sm font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.35)'
                }}
              >
                @{username}
              </div>

              {/* Main Title */}
              <h1 className="text-white font-extrabold text-[36px] leading-tight drop-shadow-xl">
                Ask me<br />anything
              </h1>

              {/* Link Box */}
              <div className="mt-10 w-full rounded-2xl px-5 py-4 text-sm font-medium"
                style={{
                  background: '#ffffff',
                  color: '#333',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
                }}
              >
                Paste link here 🔗
              </div>

              {/* Footer */}
              <div className="absolute bottom-7 text-white/70 text-xs tracking-[0.25em] font-bold">
                ANON CONFESS
              </div>
            </div>
          </div>

          {/* TIP */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-sm">
            Add a <b>Link Sticker</b> in Instagram and paste:
            <div className="mt-2 font-mono text-xs break-all">{profileUrl}</div>
          </div>

          {/* SHARE */}
          <button
            onClick={handleShareToInstagram}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Generating...' : (
              <>
                <Instagram className="w-5 h-5" />
                Share to Instagram Story
              </>
            )}
          </button>

          {/* OTHER ACTIONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyLink}
              className="py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>

            <button
              onClick={() => {
                const text = `Ask me anything ${profileUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="py-3 bg-green-50 text-green-600 font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareInboxModal;