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

      // Convert DataURL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'anon-ask.png', { type: 'image/png' });

      // Check if Web Share API supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ask me anything!',
          text: `Send me anonymous messages! ${profileUrl}`
        });
        showToast('Opening Instagram...', 'success');
      } else {
        // Fallback: Download image
        const link = document.createElement('a');
        link.download = 'anon-ask-story.png';
        link.href = dataUrl;
        link.click();

        // Also copy link
        await navigator.clipboard.writeText(profileUrl);
        alert('Image downloaded! 1. Open Instagram Story 2. Upload image 3. Paste the link!');
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Get Messages!</h2>
            <p className="text-slate-500 text-sm">Share this to your story to start receiving anonymous messages.</p>
          </div>

          {/* Story Preview Container */}
          <div className="flex justify-center">
            {/* 
                This is the actual element converted to image. 
                Exact dimensions: Aspect Ratio 9:16 approx or just card style.
                Instagram Story is 1080x1920. We'll make a scaled version.
            */}
            <div
              ref={storyRef}
              className="w-[300px] h-[533px] relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              }}
            >
              {/* Glass blur overlay */}
              <div className="absolute inset-0" style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(100px)',
              }}></div>

              {/* Floating glass orbs for depth */}
              <div className="absolute top-10 right-8 w-32 h-32 rounded-full" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                filter: 'blur(40px)',
              }}></div>
              <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                filter: 'blur(50px)',
              }}></div>

              {/* Content container with glass effect */}
              <div className="relative z-10 flex flex-col items-center w-full px-6">

                {/* Glass icon container */}
                <div className="mb-8 relative">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                    }}
                  >
                    <MessageCircle className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2} />
                  </div>
                  {/* Notification badge - also glass */}
                  <div
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    1
                  </div>
                </div>

                {/* Text with glass background */}
                <div
                  className="mb-10 px-8 py-6 rounded-3xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                  }}
                >
                  <h1 className="text-white font-black text-3xl text-center leading-tight" style={{
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    letterSpacing: '-0.02em'
                  }}>
                    send me<br />anonymous<br />messages!
                  </h1>
                </div>

                {/* Glass link sticker */}
                <div
                  className="px-6 py-4 rounded-2xl flex items-center gap-4 w-[90%] transform -rotate-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-black tracking-widest mb-1" style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      PASTE YOUR LINK HERE!
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate">anonconfess.in/u/...</span>
                  </div>
                </div>

                {/* Subtle animated arrows */}
                <div className="mt-6 flex gap-4 opacity-60">
                  <div className="animate-bounce delay-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  </div>
                  <div className="animate-bounce delay-200">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  </div>
                  <div className="animate-bounce delay-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  </div>
                </div>

                {/* Bottom Branding */}
                <div className="absolute bottom-8 text-white/60 font-bold text-sm tracking-widest uppercase">
                  Anon Confess
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <button
            onClick={handleShareToInstagram}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Generating...</span>
            ) : (
              <>
                <Instagram className="w-5 h-5" />
                Share to Instagram Story
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyLink}
              className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => {
                const text = `Send me anonymous messages! ${profileUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="py-3 bg-green-50 text-green-600 font-bold rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
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
