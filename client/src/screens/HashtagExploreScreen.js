import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, TrendingUp, Zap } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ConfessionCard from '../components/ConfessionCard';
import EmptyState from '../components/EmptyState';
import api from '../api';

const HashtagExploreScreen = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const fetchHashtagConfessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/hashtags/search', {
        params: {
          tag: tag,
          page: page,
          limit: 20
        }
      });

      if (response.data.success) {
        setConfessions(response.data.data);
        setTotalCount(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching hashtag confessions:', err);
      setError('Failed to load confessions');
    } finally {
      setLoading(false);
    }
  }, [tag, page]);

  useEffect(() => {
    fetchHashtagConfessions();
  }, [fetchHashtagConfessions]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            ← Back
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Hash className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              {tag}
            </h1>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{totalCount || 0} confessions</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <EmptyState
            icon="error"
            title="Error Loading Confessions"
            description={error}
            action={() => window.location.reload()}
            actionLabel="Retry"
          />
        ) : confessions.length === 0 ? (
          <EmptyState
            icon="search"
            title={`No confessions with #${tag} yet`}
            description="Be the first to post a confession with this hashtag!"
            action={() => navigate('/new')}
            actionLabel="Create Confession"
          />
        ) : (
          <>
            {/* Confessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {confessions.map((confession) => (
                <ConfessionCard
                  key={confession._id}
                  confession={confession}
                  showExpiry={false}
                />
              ))}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors flex items-center gap-2 mx-auto"
                >
                  <Zap className="w-4 h-4" />
                  Load More Confessions
                </button>
              </div>
            )}

            {/* Page Info */}
            <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HashtagExploreScreen;
