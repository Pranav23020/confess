import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Instagram, Share2, Copy, MessageCircle } from 'lucide-react';
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
        alert('Image downloaded! Upload it to Instagram Story and paste your link.');
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
            <h2 className="text-2xl font-black">Get Messages 🚀</h2>
            <p className="text-sm text-slate-500">Share to your story to start receiving anonymous messages.</p>
          </div>

          {/* STORY PREVIEW */}
          <div className="flex justify-center">
            <div
              ref={storyRef}
              className="w-[300px] h-[533px] relative overflow-hidden rounded-[28px] flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, #ff7ad9 0%, transparent 40%), radial-gradient(circle at 80% 30%, #7aa2ff 0%, transparent 45%), linear-gradient(160deg, #5f2eea 0%, #9f44d3 50%, #ff6ec7 100%)'
              }}
            >
              {/* Glow */}
              <div className="absolute inset-0 opacity-40 animate-pulse"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25), transparent 60%)'
                }}
              />

              {/* Grain texture */}
              <div className="absolute inset-0 mix-blend-overlay opacity-20"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center px-7 text-center">

                {/* Username */}
                <div className="mb-6 px-5 py-2 rounded-full text-white text-sm font-semibold tracking-wide"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.35)'
                  }}
                >
                  @{username}
                </div>

                <h1 className="text-white font-extrabold text-[34px] leading-[1.15] tracking-tight drop-shadow-xl">
                  send me<br />anonymous<br />messages 💬
                </h1>

                {/* Fake message card */}
                <div className="mt-10 w-full rounded-3xl px-6 py-5 text-left"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
                  }}
                >
                  <p className="text-slate-800 text-[15px] font-semibold">
                    Tap the link sticker<br />
                    and tell me anything…<br />
                    I won’t know who sent it 👀
                  </p>
                </div>

                {/* Fake input */}
                <div className="mt-4 w-full rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.75)' }}
                >
                  <span className="text-slate-500 text-sm">Type something…</span>
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                </div>

                <div className="absolute bottom-7 text-white/70 text-xs tracking-[0.3em] font-bold">
                  ANON CONFESS
                </div>
              </div>
            </div>
          </div>

          {/* TIP */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-sm">
            After uploading, add the <b>Link Sticker 🔗</b> and paste:
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
                const text = `Send me anonymous messages! ${profileUrl}`;
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