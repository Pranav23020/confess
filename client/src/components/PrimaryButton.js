import React from 'react';

const PrimaryButton = ({ children, onClick, disabled, loading, icon, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 rounded-xl shadow-lg shadow-primary/25 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors"></div>
      {icon && <span className="material-symbols-outlined text-white text-[20px] relative z-10">{icon}</span>}
      <span className="text-white text-base font-bold tracking-wide relative z-10">
        {loading ? 'Loading...' : children}
      </span>
    </button>
  );
};

export default PrimaryButton;
