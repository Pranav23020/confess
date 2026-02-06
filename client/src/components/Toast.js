import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        error: 'border-red-500/20 bg-red-500/10 text-red-400',
        info: 'border-primary/20 bg-primary/10 text-primary',
        warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400'
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-auto pointer-events-none">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-auto ${colors[type]}`}>
                <span className="material-symbols-outlined text-[20px]">{icons[type]}</span>
                <p className="text-sm font-bold tracking-tight whitespace-nowrap">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-2 hover:opacity-70 transition-opacity"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
        </div>
    );
};

export default Toast;
