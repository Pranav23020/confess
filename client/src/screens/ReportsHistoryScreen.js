import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { reportsAPI } from '../api';
import EmptyState from '../components/EmptyState';

export default function ReportsHistoryScreen() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getMyReports();
      setReports(data.reports || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'hidden':
        return 'bg-red-100 text-red-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'hidden':
        return 'Hidden from Public';
      case 'queued':
        return 'Under Review';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Submitted';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading your reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="mb-6 text-purple-400 hover:text-purple-300 flex items-center gap-2"
          >
            ← Back to Profile
          </button>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-white">
            <p className="font-semibold mb-2">Error Loading Reports</p>
            <p className="text-sm text-red-100">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 pt-20 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="mb-4 text-purple-400 hover:text-purple-300 flex items-center gap-2"
        >
          ← Back to Profile
        </button>
        <h1 className="text-3xl font-bold text-white">Report History</h1>
        <p className="text-slate-300 mt-2">
          You have submitted {reports.length} {reports.length === 1 ? 'report' : 'reports'}
        </p>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <EmptyState
          title="No Reports Yet"
          description="You haven't submitted any reports. When you report inappropriate content, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-slate-700 rounded-lg p-5 border border-slate-600 hover:border-purple-500 transition-colors"
            >
              {/* Header with Badge */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm text-slate-300">
                    {report.type === 'confession' ? 'Confession' : 'Reply'} Report
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(report.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getActionBadgeColor(
                    report.action
                  )}`}
                >
                  {getActionLabel(report.action)}
                </span>
              </div>

              {/* Report Reason */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-200">Reason</p>
                <p className="text-slate-300 text-sm mt-1">{report.reason}</p>
              </div>

              {/* Description if available */}
              {report.description && (
                <div className="mb-3 pb-3 border-b border-slate-600">
                  <p className="text-sm font-semibold text-slate-200">Description</p>
                  <p className="text-slate-300 text-sm mt-1">{report.description}</p>
                </div>
              )}

              {/* Status Explanation */}
              <div className="bg-slate-600 rounded p-3">
                <p className="text-xs font-semibold text-slate-300 mb-1">STATUS</p>
                {report.action === 'hidden' && (
                  <p className="text-xs text-slate-200">
                    ✓ This content was automatically hidden from public feeds after receiving multiple reports.
                  </p>
                )}
                {report.action === 'queued' && (
                  <p className="text-xs text-slate-200">
                    ⏱ This report is under review by our moderation team. You'll be notified of any actions taken.
                  </p>
                )}
                {report.action === 'resolved' && (
                  <p className="text-xs text-slate-200">
                    ✓ This report has been reviewed and appropriate action has been taken.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <p className="text-xs text-slate-300">
          <span className="font-semibold">📋 How Reports Work:</span><br/>
          When content receives 5+ reports, it's automatically hidden. Other reports go to our moderation team for review. Thank you for helping keep our community safe!
        </p>
      </div>
    </div>
  );
}
