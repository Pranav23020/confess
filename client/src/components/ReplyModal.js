import React, { useState, useRef } from 'react';
import { X, Download, Instagram, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const ReplyModal = ({ message, onClose, onReplySave }) => {
    const [replyText, setReplyText] = useState(message.reply || '');
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const storyRef = useRef(null);

    const handleSaveReply = async () => {
        if (replyText.trim().length < 1) return;

        setLoading(true);
        try {
            await onReplySave(message.id, replyText);
            setShowPreview(true);
        } catch (error) {
            alert('Failed to save reply');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadStory = async () => {
        if (!storyRef.current) return;

        try {
            const canvas = await html2canvas(storyRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true
            });

            const link = document.createElement('a');
            link.download = `anonconfess-story-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('Failed to generate story image');
        }
    };

    const handleShareToInstagram = () => {
        alert('Download the image and upload it to your Instagram story!');
        handleDownloadStory();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {showPreview ? '📸 Share Your Reply' : '💬 Reply to Message'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {!showPreview ? (
                    /* Reply Form */
                    <div className="p-6 space-y-6">
                        {/* Question */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">Anonymous Question:</p>
                            <p className="text-lg font-medium text-slate-800 dark:text-slate-100">"{message.message}"</p>
                        </div>

                        {/* Reply Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Your Answer:
                            </label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                maxLength={500}
                                rows={6}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none text-slate-900 dark:text-white resize-none"
                                placeholder="Type your answer here..."
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
                                {replyText.length}/500 characters
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveReply}
                                disabled={loading || replyText.trim().length < 1}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? 'Saving...' : 'Continue to Story'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Story Preview */
                    <div className="p-6 space-y-6">
                        {/* Story Card Preview */}
                        <div className="flex justify-center">
                            <div
                                ref={storyRef}
                                className="w-[360px] h-[640px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative Background */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-20 left-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl"></div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10 space-y-6">
                                    {/* Question */}
                                    <div>
                                        <p className="text-white/80 text-sm font-bold mb-3">Anonymous Question</p>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                                            <p className="text-white text-lg font-medium leading-relaxed">
                                                "{message.message}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Answer */}
                                    <div>
                                        <p className="text-white/80 text-sm font-bold mb-3">My Answer</p>
                                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30">
                                            <p className="text-white text-lg font-bold leading-relaxed">
                                                {replyText}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Branding */}
                                <div className="relative z-10 text-center">
                                    <p className="text-white/90 text-sm font-bold mb-1">Ask me anything!</p>
                                    <p className="text-white/70 text-xs">anonconfess.in</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDownloadStory}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                <Download className="w-5 h-5" />
                                Download
                            </button>
                            <button
                                onClick={handleShareToInstagram}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                            >
                                <Instagram className="w-5 h-5" />
                                Share Story
                            </button>
                        </div>

                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            Download and upload to Instagram, Snapchat, or any social media!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReplyModal;
