import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsAPI } from '../api';
import { useToast } from '../context/ToastContext';

const ReportScreen = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [reason, setReason] = React.useState('spam');
  const [description, setDescription] = React.useState('');
  const [reportResult, setReportResult] = React.useState(null);

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'hate-speech', label: 'Hate Speech' },
    { value: 'violence', label: 'Violence' },
    { value: 'sexual-content', label: 'Sexual Content' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'self-harm', label: 'Self-harm' },
    { value: 'bullying', label: 'Bullying' },
    { value: 'privacy-violation', label: 'Privacy Violation' },
    { value: 'scam', label: 'Scam' },
    { value: 'other', label: 'Other' }
  ];

  const handleReport = async () => {
    try {
      setSubmitting(true);
      const response = await reportsAPI.create(type, id, reason, description);
      const action = response?.data?.action || (response?.data?.hidden ? 'hidden' : 'queued');
      setReportResult(action);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to submit report', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden h-screen w-full relative">
      {/* Simulated Background Feed Content (Blurred/Dimmed) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex flex-col gap-4 p-4">
        <div className="w-full h-40 bg-gray-200 dark:bg-surface-dark rounded-xl"></div>
        <div className="w-full h-64 bg-gray-200 dark:bg-surface-dark rounded-xl"></div>
        <div className="w-full h-40 bg-gray-200 dark:bg-surface-dark rounded-xl"></div>
      </div>

      {/* Modal Backdrop */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Modal Card */}
        <div className="w-full max-w-[340px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
          {/* Icon & Header Section */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-red-500/80 dark:text-red-400 text-3xl">
                shield_with_heart
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
                {reportResult ? 'Report received' : `Report this ${type}?`}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                {reportResult
                  ? (reportResult === 'hidden'
                    ? 'Action taken: This content has been hidden from public feeds.'
                    : 'Action taken: Your report has been added to the review queue.')
                  : 'Help us keep this space safe. We will review and may hide content after enough reports.'}
              </p>
            </div>
          </div>

          {!reportResult && (
            <div className="px-6 pb-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reason</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${reason === r.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details (optional)"
                maxLength={200}
                className="mt-3 w-full px-4 py-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white"
              />
            </div>
          )}

          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 text-base font-bold transition-colors duration-200 disabled:opacity-50"
            >
              {reportResult ? 'Done' : 'Cancel'}
            </button>
            {!reportResult && (
              <button
                onClick={handleReport}
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-base font-bold transition-colors duration-200 disabled:opacity-50"
              >
                {submitting ? 'Reporting...' : 'Report'}
              </button>
            )}
          </div>
          <div className="h-2"></div>
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;
