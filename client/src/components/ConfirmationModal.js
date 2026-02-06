import React from 'react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    isDanger = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 text-center">
                    {/* Icon Area */}
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined text-[32px]">
                            {isDanger ? 'delete_forever' : 'info'}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${isDanger
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
