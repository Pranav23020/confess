import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tempMessagesAPI } from '../api';
import { Send, CheckCircle, Shield, AlertCircle, MessageCircle } from 'lucide-react';

const AnonymousMessageScreen = () => {
    const { username } = useParams();
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (message.trim().length < 5) {
            setErrorMsg('Message must be at least 5 characters.');
            return;
        }

        setStatus('sending');
        setErrorMsg('');

        try {
            await tempMessagesAPI.send(username, message);
            setStatus('success');
            setMessage('');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.error?.message || 'Failed to send message.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Success Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-card overflow-hidden">
                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                        <div className="p-8 flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-primary" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                Message Sent!
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                                Your anonymous message was delivered to{' '}
                                <span className="font-bold text-primary">@{username}</span>.
                            </p>

                            {/* CTA box */}
                            <div className="w-full bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/5 p-5 mb-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 uppercase tracking-widest">
                                    Want messages like this?
                                </p>
                                <Link
                                    to="/"
                                    className="block w-full py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-glow"
                                >
                                    Create Your Own Inbox
                                </Link>
                            </div>

                            <button
                                onClick={() => setStatus('idle')}
                                className="text-sm text-primary dark:text-primary font-semibold hover:underline"
                            >
                                Send another message
                            </button>

                            <p className="mt-6 text-[11px] text-slate-400 dark:text-slate-600 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" />
                                Message disappears in 72 hours
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 mb-4 shadow-glow">
                        <MessageCircle className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">
                        Anonymous Message
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Send to <span className="text-primary">@{username}</span>
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-card overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Textarea */}
                            <div className="relative">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Say something nice (or spicy)... 🤫"
                                    className="w-full h-44 p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed"
                                    maxLength={500}
                                    required
                                />
                                <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                                    {message.length}/500
                                </div>
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={status === 'sending' || message.trim().length < 5}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                    ${status === 'sending' || message.trim().length < 5
                                        ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90 text-white shadow-glow hover:shadow-premium active:scale-[0.98]'
                                    }`}
                            >
                                {status === 'sending' ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Anonymously
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Privacy notice */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-600 font-medium">
                            <Shield className="w-3 h-3" />
                            <span>Your identity stays completely anonymous</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center mt-4 text-[11px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
                    © {new Date().getFullYear()} AnonConfess
                </p>
            </div>
        </div>
    );
};

export default AnonymousMessageScreen;
