import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api';

const LimitReachedScreen = () => {
  const navigate = useNavigate();
  const [myConfessions, setMyConfessions] = useState([]);

  useEffect(() => {
    fetchMyConfessions();
  }, []);

  const fetchMyConfessions = async () => {
    try {
      const response = await userAPI.getMyConfessions();
      setMyConfessions(response.data.confessions);
    } catch (err) {
      console.error('Failed to fetch confessions:', err);
    }
  };

  const getHoursRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Soon';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-500 text-5xl">
              schedule
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            You've reached your limit
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            You can have a maximum of 2 active confessions at a time. Wait for one to expire before posting a new one.
          </p>
        </div>

        {/* Active Confessions */}
        {myConfessions.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-card mb-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
              Your Active Confessions
            </h3>
            <div className="space-y-3">
              {myConfessions.map((confession) => (
                <div 
                  key={confession._id}
                  className="flex items-start justify-between gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 flex-1">
                    {confession.text}
                  </p>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-surface-dark rounded-full shrink-0">
                    <span className="material-symbols-outlined text-[12px] text-primary">timer</span>
                    <span className="text-xs font-semibold text-primary">
                      {getHoursRemaining(confession.expiresAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mb-6 border border-blue-100 dark:border-blue-800/30">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-blue-500 text-2xl shrink-0">
              info
            </span>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Why the limit?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                This helps maintain quality and prevents spam, keeping the community safe and meaningful.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg shadow-primary/25"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default LimitReachedScreen;
