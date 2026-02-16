import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Download, Instagram, Share2, Copy, MessageCircle } from 'lucide-react';
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
              className="w-[300px] h-[533px] relative flex flex-col items-center justify-center overflow-hidden shadow-2xl rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', // Peachy sunset gradient like NGL
              }}
            >
              {/* Noise overlay */}
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,...")' }}></div>

              {/* Icon */}
              <div className="mb-6 relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full border-4 border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                  1
                </div>
              </div>

              {/* Text */}
              <h1 className="text-white font-black text-3xl text-center leading-tight mb-12 drop-shadow-md px-6">
                send me<br />anonymous<br />messages!
              </h1>

              {/* Fake Link Sticker Box */}
              <div className="bg-white rounded-xl px-6 py-4 shadow-xl flex items-center gap-3 transform -rotate-2 w-[80%] z-10">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                  <span className="material-icons text-xl font-bold">link</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paste your link here!</span>
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[140px]">anonconfess.in/u/...</span>
                </div>
              </div>

              {/* Arrows pointing up to the sticker */}
              <div className="mt-4 flex gap-4 opacity-80">
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
