import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HashtagInput from '../components/HashtagInput';
import { confessionsAPI, userAPI, draftsAPI } from '../api';
import { AuthContext } from '../context/AuthContext';

const NewConfessionScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('other');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState([{ text: '' }, { text: '' }]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [toxicityWarning, setToxicityWarning] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const draftTimerRef = useRef(null);
  const toxicityTimerRef = useRef(null);
  const initializedRef = useRef(false);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);

  const commonEmojis = ['❤️', '💔', '😭', '😊', '🙏', '💪', '🎉', '😔', '🤔', '😱', '🥺', '👏', '🔥', '💯', '✨', '🌟'];

  useEffect(() => {
    if (!text.trim() || text.length < 10) {
      setToxicityWarning(null);
      return;
    }

    if (toxicityTimerRef.current) clearTimeout(toxicityTimerRef.current);

    toxicityTimerRef.current = setTimeout(async () => {
      try {
        const response = await confessionsAPI.validate({ text });
        if (response.data.success && response.data.isToxic) {
          setToxicityWarning('This content might be flagged as toxic or disrespectful. Please keep the space safe.');
        } else {
          setToxicityWarning(null);
        }
      } catch (err) {
        console.error('Validation failed:', err);
      }
    }, 1000);

    return () => clearTimeout(toxicityTimerRef.current);
  }, [text]);

  const checkCanPost = useCallback(async () => {
    try {
      const response = await userAPI.getActiveCount();
      if (!response.data.canPost) {
        navigate('/limit-reached');
      }
    } catch (err) {
      console.error('Failed to check posting status:', err);
    }
  }, [navigate]);

  const loadDraft = useCallback(async () => {
    try {
      const response = await draftsAPI.get();
      const draft = response.data?.draft;
      if (draft) {
        setText(draft.text || '');
        setCategory(draft.category || 'other');
        setIsPoll(!!draft.isPoll);
        setPollOptions(
          Array.isArray(draft.pollOptions) && draft.pollOptions.length > 0
            ? draft.pollOptions.map(opt => ({ text: opt.text || opt }))
            : [{ text: '' }, { text: '' }]
        );
        if (draft.scheduledFor) {
          setScheduleEnabled(true);
          setScheduledFor(new Date(draft.scheduledFor).toISOString().slice(0, 16));
        }
        setDraftStatus('Draft restored');
        setTimeout(() => setDraftStatus(''), 2000);
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    } finally {
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkCanPost();
    loadDraft();
  }, [user, navigate, checkCanPost, loadDraft]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    draftTimerRef.current = setTimeout(async () => {
      try {
        const hasContent = text.trim().length > 0 || isPoll || scheduleEnabled || category !== 'other';
        if (!hasContent) {
          await draftsAPI.delete();
          return;
        }

        const payload = {
          text,
          category,
          isPoll,
          pollOptions: isPoll ? pollOptions.filter(opt => opt.text.trim().length > 0) : [],
          scheduledFor: scheduleEnabled && scheduledFor ? scheduledFor : null
        };

        await draftsAPI.save(payload);
        setDraftStatus('Saved');
        setTimeout(() => setDraftStatus(''), 1500);
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }, 800);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [text, category, isPoll, pollOptions, scheduleEnabled, scheduledFor]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setError('You can upload up to 5 images');
      return;
    }
    const nextFiles = files.slice(0, remainingSlots);
    const oversize = nextFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversize) {
      setError('Each image must be less than 5MB');
      return;
    }
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...nextFiles]);
    setImagePreviews((prev) => [...prev, ...nextPreviews]);
    setError(null);
  };

  const handleRemoveImage = (index) => {
    const nextImages = images.filter((_, i) => i !== index);
    const nextPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(nextImages);
    setImagePreviews(nextPreviews);
    if (nextImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handlePost = async () => {
    if (text.trim().length < 10) {
      setError('Confession must be at least 10 characters');
      return;
    }

    if (text.length > 500) {
      setError('Confession must be less than 500 characters');
      return;
    }

    if (isPoll) {
      const filledOptions = pollOptions.filter(opt => opt.text.trim().length > 0);
      if (filledOptions.length < 2) {
        setError('Poll must have at least 2 options');
        return;
      }
    }

    if (scheduleEnabled && !scheduledFor) {
      setError('Please choose a schedule time');
      return;
    }

    // Handle Offline
    if (isOffline) {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-posts');
          setError('You are offline. Your confession has been queued and will be posted automatically when you are back online!');
          return;
        } catch (err) {
          console.error('Background sync failed:', err);
        }
      }
      setError('You are offline. Please reconnect to post your confession.');
      return;
    }

    try {
      setPosting(true);
      setError(null);

      const formData = new FormData();
      formData.append('text', text);
      formData.append('category', category);
      formData.append('isPoll', isPoll);

      if (isPoll) {
        pollOptions.filter(opt => opt.text.trim().length > 0).forEach((opt, index) => {
          formData.append(`pollOptions[${index}][text]`, opt.text);
        });
      }

      if (scheduleEnabled && scheduledFor) {
        formData.append('scheduledFor', scheduledFor);
      }

      if (images.length > 0) {
        images.forEach((file) => formData.append('images', file));
      }

      await confessionsAPI.create(formData);
      await draftsAPI.delete();
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to post confession';
      setError(errorMsg);

      if (err.response?.data?.error?.code === 'MAX_CONFESSIONS_REACHED') {
        setTimeout(() => navigate('/limit-reached'), 1500);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen md:pt-20 overflow-hidden flex justify-center w-full">
      <div className="relative flex h-full w-full max-w-[480px] md:max-w-3xl lg:max-w-4xl flex-col bg-background-light dark:bg-background-dark shadow-2xl">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-5 md:px-8 py-6 z-30 bg-background-light dark:bg-background-dark border-b border-slate-200/50 dark:border-white/5">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
          <h1 className="text-base md:text-lg font-bold tracking-tight opacity-90">New Confession</h1>
          <button
            onClick={handlePost}
            disabled={posting || text.trim().length < 10}
            className="relative group flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-full shadow-[0_0_15px_rgba(54,23,207,0.3)] dark:shadow-[0_0_20px_rgba(54,23,207,0.5)] transition-all hover:scale-105 active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors"></div>
            <span className="relative z-10">{posting ? 'Posting...' : 'Post'}</span>
          </button>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Toxicity Warning */}
        {toxicityWarning && (
          <div className="mx-6 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-1">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">warning</span>
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium leading-tight">
              {toxicityWarning}
            </p>
          </div>
        )}

        {/* Main Input Area */}
        <main className="flex-1 flex flex-col px-6 md:px-12 lg:px-16 overflow-y-auto no-scrollbar">
          <div className="py-6 space-y-6">
            {/* Draft status */}
            {draftStatus && (
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full w-fit">
                {draftStatus}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full px-4 py-3.5 rounded-xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="love">❤️ Love</option>
                <option value="career">💼 Career</option>
                <option value="secrets">🤫 Secrets</option>
                <option value="life">✨ Life</option>
                <option value="relationships">👥 Relationships</option>
                <option value="mental-health">🧠 Mental Health</option>
                <option value="other">📝 Other</option>
              </select>
            </div>

            {/* Poll Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/30 transition-all">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Add Poll</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ask a quick question</p>
              </div>
              <button
                onClick={() => setIsPoll(!isPoll)}
                className={`relative w-14 h-8 rounded-full transition-all shadow-inner ${isPoll ? 'bg-primary shadow-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${isPoll ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {isPoll && (
              <div className="space-y-3">
                {pollOptions.map((opt, index) => (
                  <input
                    key={index}
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[index].text = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, { text: '' }])}
                    className="text-sm font-semibold text-primary"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* Schedule */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/30 transition-all">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Schedule Post</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Post later (time capsule)</p>
              </div>
              <button
                onClick={() => setScheduleEnabled(!scheduleEnabled)}
                className={`relative w-14 h-8 rounded-full transition-all shadow-inner ${scheduleEnabled ? 'bg-primary shadow-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${scheduleEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            )}

            {/* Text Area with Toolbar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your Confession</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    title="Add emoji"
                  >
                    <span className="text-xl">😊</span>
                  </button>
                </div>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-wrap gap-2">
                    {commonEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <HashtagInput
                value={text}
                onChange={setText}
              />

              {/* Enhanced Character Counter */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 dark:text-slate-400">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {readingTime} min read
                  </span>
                </div>
                <span className={`font-medium ${
                  text.length > 450 ? 'text-red-500' : text.length > 400 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {text.length}/500
                </span>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                Add Photos (Optional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />

              {imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {images.length < 5 && (
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-surface-dark border border-dashed border-slate-300 dark:border-white/10 hover:border-primary cursor-pointer transition-colors text-sm text-slate-600 dark:text-slate-400"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                      Add more (max 5)
                    </label>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-8 rounded-xl bg-slate-50 dark:bg-surface-dark border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-primary cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Click to add images (max 5)</span>
                </label>
              )}
            </div>
          </div>
        </main>

        {/* Footer Actions & Info */}
        <div className="flex-shrink-0 flex flex-col w-full bg-background-light dark:bg-background-dark border-t border-slate-200/50 dark:border-white/5 py-4 px-6">
          {/* Stats Bar */}
          {text.trim().length > 0 && (
            <div className="flex items-center justify-around mb-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">article</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{wordCount} words</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{readingTime} min</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">visibility_off</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Anonymous</span>
              </div>
            </div>
          )}

          {/* Ephemeral Note */}
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">hourglass_empty</span>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">This will disappear in 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConfessionScreen;
