import React, { useState, useEffect, useContext, useCallback } from 'react';
import { tempMessagesAPI } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Clock, Share2, Copy, RefreshCw } from 'lucide-react';

import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';

const AnonymousInboxScreen = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await tempMessagesAPI.getInbox();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (err) {
            showToast('Failed to load messages', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            await tempMessagesAPI.delete(id);
            setMessages(messages.filter(m => m.id !== id));
            showToast('Message deleted', 'success');
        } catch (err) {
            showToast('Failed to delete message', 'error');
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/u/${user?.username}`;
        navigator.clipboard.writeText(link);
        showToast('Link copied to clipboard!', 'success');
    };

    const getTimeLeft = (expiresAt) => {
        const now = Date.now();
        const diff = expiresAt - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return '< 1h left';
        return `${hours}h left`;
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Group by day just for visual clarity if needed, but linear list is fine for now

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                                Anonymous Inbox
                            </span>
                            <span className="text-sm font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full border border-pink-200 dark:border-pink-800">
                                {messages.length} messages
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Messages disappear automatically after 3 days.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            <Copy className="w-4 h-4" />
                            Copy My Link
                        </button>
                        <a
                            href={`whatsapp://send?text=Send me an anonymous message! ${window.location.origin}/u/${user?.username}`}
                            className="ml-2 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-green-500"
                            title="Share on WhatsApp"
                        >
                            <Share2 className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <RefreshCw className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                        <p className="font-medium">Loading your secrets...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            📭
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                            Share your link on Instagram, Snapchat or WhatsApp to get started!
                        </p>
                        <button
                            onClick={copyLink}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            Share Link Now
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {messages.map((item) => (
                            <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col h-full animate-fade-in-up">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                                </div>

                                <div className="mb-4 flex-grow">
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                                        "{item.message}"
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(item.created_at)}
                                        </span>
                                        <span className="text-indigo-500 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md w-fit">
                                            Expires: {getTimeLeft(item.expires_at)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Delete Message"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
            <BottomNav active="inbox" />
        </div>
    );
};

export default AnonymousInboxScreen;
