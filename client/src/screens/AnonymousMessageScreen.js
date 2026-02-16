import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tempMessagesAPI } from '../api';
import { Send, CheckCircle, Shield, AlertCircle } from 'lucide-react';

const AnonymousMessageScreen = () => {
    const { username } = useParams();
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>

                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Message Sent!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                        Your anonymous message has been delivered to <span className="font-bold text-indigo-600 dark:text-indigo-400">@{username}</span>.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                            Want to receive anonymous messages too?
                        </p>
                        <Link
                            to="/"
                            className="block w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl"
                        >
                            Create Your Own Link
                        </Link>
                    </div>

                    <button
                        onClick={() => setStatus('idle')}
                        className="mt-6 text-indigo-500 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        Send another message
                    </button>

                    <p className="mt-8 text-xs text-slate-400">
                        This message will automatically disappear in 72 hours.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Header Pattern */}
                <div className="h-32 bg-slate-900 dark:bg-black relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>

                    <div className="relative z-10 h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-2 shadow-inner ring-1 ring-white/30">
                            <span className="text-3xl">🤫</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-6 relative">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Send Anonymous Message</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            to <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">@{username}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Say something nice (or spicy)..."
                                className="w-full h-48 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                                maxLength={500}
                                required
                            />
                            <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 bg-white/80 dark:bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                                {message.length}/500
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'sending' || message.trim().length < 5}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]
                                ${status === 'sending' || message.trim().length < 5
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                    : 'bg-black dark:bg-white text-white dark:text-black hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white'
                                }`}
                        >
                            {status === 'sending' ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Anonymously
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                        <Shield className="w-3 h-3" />
                        <span>Your IP is hidden but hashed for safety</span>
                    </div>
                </div>

                {/* Footer Gradient Line */}
                <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-full"></div>
            </div>

            <div className="fixed bottom-4 text-white/50 text-xs font-medium">
                © {new Date().getFullYear()} AnonConfess
            </div>
        </div>
    );
};

export default AnonymousMessageScreen;
