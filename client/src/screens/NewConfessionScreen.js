import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TextAreaField from '../components/TextAreaField';
import { confessionsAPI, userAPI, draftsAPI } from '../api';

const NewConfessionScreen = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [canPost, setCanPost] = useState(true);
  const [category, setCategory] = useState('other');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState([{ text: '' }, { text: '' }]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const draftTimerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    checkCanPost();
    loadDraft();
  }, []);

  const checkCanPost = async () => {
    try {
      const response = await userAPI.getActiveCount();
      setCanPost(response.data.canPost);
      if (!response.data.canPost) {
        navigate('/limit-reached');
      }
    } catch (err) {
      console.error('Failed to check posting status:', err);
    }
  };

  const loadDraft = async () => {
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
  };

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

    try {
      setPosting(true);
      setError(null);
      const payload = {
        text,
        category,
        isPoll,
        pollOptions: isPoll ? pollOptions.filter(opt => opt.text.trim().length > 0) : [],
        scheduledFor: scheduleEnabled && scheduledFor ? scheduledFor : null
      };
      await confessionsAPI.create(payload);
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
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen overflow-hidden flex justify-center w-full">
      <div className="relative flex h-full w-full max-w-[480px] md:max-w-3xl lg:max-w-4xl flex-col bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 md:px-8 pt-12 pb-4 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm sticky top-0">
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
            className="relative group flex items-center justify-center px-5 py-2 bg-primary text-white text-sm font-bold rounded-full shadow-[0_0_15px_rgba(54,23,207,0.3)] dark:shadow-[0_0_20px_rgba(54,23,207,0.5)] transition-all hover:scale-105 active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Main Input Area */}
        <main className="flex-1 flex flex-col relative px-6 md:px-12 lg:px-16 z-10 overflow-y-auto no-scrollbar">
          <div className="flex-1 py-4 md:py-8 space-y-6">
            {/* Draft status */}
            {draftStatus && (
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full w-fit">
                {draftStatus}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
              >
                <option value="love">Love</option>
                <option value="career">Career</option>
                <option value="secrets">Secrets</option>
                <option value="life">Life</option>
                <option value="relationships">Relationships</option>
                <option value="mental-health">Mental Health</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Poll Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white">Add Poll</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ask a quick question</p>
              </div>
              <button
                onClick={() => setIsPoll(!isPoll)}
                className={`w-12 h-7 rounded-full transition-colors ${isPoll ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPoll ? 'translate-x-6' : 'translate-x-1'}`}></div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-white">Schedule Post</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Post later (time capsule)</p>
              </div>
              <button
                onClick={() => setScheduleEnabled(!scheduleEnabled)}
                className={`w-12 h-7 rounded-full transition-colors ${scheduleEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${scheduleEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
              />
            )}

            <TextAreaField
              value={text}
              onChange={setText}
              placeholder="Write what you've never said…"
              maxLength={500}
              autoFocus={true}
            />
          </div>
        </main>

        {/* Footer Actions & Info */}
        <div className="flex flex-col w-full bg-background-light dark:bg-background-dark z-20 border-t border-slate-200/5 dark:border-white/5">
          {/* Ephemeral Note */}
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">hourglass_empty</span>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">This will disappear in 24 hours</p>
          </div>
          
          {/* Quick Suggestions */}
          <div className="w-full bg-slate-100 dark:bg-[#1c1c1e] pb-4 pt-2 px-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setText(text + 'I feel ')}
                className="flex-1 h-10 rounded-lg bg-white dark:bg-[#2c2c2e] shadow-sm flex items-center justify-center text-sm font-medium dark:text-white hover:bg-slate-50 dark:hover:bg-[#3a3a3c] transition-colors"
              >
                I feel
              </button>
              <button 
                onClick={() => setText(text + 'I wish ')}
                className="flex-1 h-10 rounded-lg bg-white dark:bg-[#2c2c2e] shadow-sm flex items-center justify-center text-sm font-medium dark:text-white hover:bg-slate-50 dark:hover:bg-[#3a3a3c] transition-colors"
              >
                I wish
              </button>
              <button 
                onClick={() => setText(text + 'Sometimes ')}
                className="flex-1 h-10 rounded-lg bg-white dark:bg-[#2c2c2e] shadow-sm flex items-center justify-center text-sm font-medium dark:text-white hover:bg-slate-50 dark:hover:bg-[#3a3a3c] transition-colors"
              >
                Sometimes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConfessionScreen;
