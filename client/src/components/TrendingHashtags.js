import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp } from 'lucide-react';
import api from '../api';

const TrendingHashtags = ({ limit = 10, className = '' }) => {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingHashtags();
  }, [limit]);

  const fetchTrendingHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/hashtags/trending', {
        params: { limit }
      });

      if (response.data.success) {
        setHashtags(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      setError('Failed to load trending hashtags');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-surface-dark rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || hashtags.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Trending Hashtags
        </h3>
      </div>

      <div className="space-y-3">
        {hashtags.map((item, index) => (
          <button
            key={item.tag}
            onClick={() => navigate(`/hashtags/${item.tag}`)}
            className="w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-lg font-bold text-primary/60 w-6 text-center">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    #{item.tag}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.count} confessions
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary/60">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold">{item.score}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/hashtags/trending')}
        className="w-full mt-6 px-4 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        See All Hashtags
      </button>
    </div>
  );
};

export default TrendingHashtags;
