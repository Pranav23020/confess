import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { TEMPLATE_TYPES, TEMPLATES, getTemplatePreview, downloadTemplate } from '../utils/templateGenerator';

const ShareTemplateModal = ({ isOpen, onClose, confessionText }) => {
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_TYPES.INSTAGRAM);
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [step, setStep] = useState('template'); // 'template' or 'platform'

  const generatePreview = useCallback(async (templateType) => {
    setIsGenerating(true);
    try {
      const previewUrl = await getTemplatePreview(confessionText, templateType);
      setPreview(previewUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [confessionText]);

  useEffect(() => {
    if (isOpen && confessionText) {
      generatePreview(selectedTemplate);
    }
  }, [isOpen, selectedTemplate, confessionText, generatePreview]);

  const handleShare = async (platform) => {
    setIsSharing(true);
    try {
      const blob = await downloadTemplate(confessionText, selectedTemplate);
      
      if (platform === 'copy') {
        // Copy text to clipboard
        await navigator.clipboard.writeText(`"${confessionText}"\n\nanonconfess.in`);
        showToast('Copied to clipboard!', 'success');
        onClose();
      } else if (platform === 'download') {
        // Download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `confession-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Image downloaded!', 'success');
        onClose();
      } else if (platform === 'whatsapp') {
        // Share to WhatsApp
        const text = encodeURIComponent(`"${confessionText}"\n\nCheck out anonconfess.in`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        showToast('Opening WhatsApp...', 'success');
        setTimeout(() => onClose(), 500);
      } else if (platform === 'twitter') {
        // Share to Twitter
        const text = encodeURIComponent(`"${confessionText}"\n\nanonconfess.in`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://anonconfess.in`, '_blank');
        showToast('Opening Twitter...', 'success');
        setTimeout(() => onClose(), 500);
      } else if (platform === 'facebook') {
        // Share to Facebook
        const url = 'https://anonconfess.in';
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookShareUrl, '_blank', 'width=600,height=400');
        showToast('Opening Facebook...', 'success');
        setTimeout(() => onClose(), 500);
      } else if (platform === 'instagram') {
        // Instagram doesn't support direct sharing via URL
        showToast('Save the image and upload it to Instagram manually', 'info');
        // Download automatically
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `confession-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (platform === 'telegram') {
        // Share to Telegram
        const text = encodeURIComponent(`"${confessionText}"\n\nanonconfess.in`);
        window.open(`https://t.me/share/url?url=https://anonconfess.in&text=${text}`, '_blank');
        showToast('Opening Telegram...', 'success');
        setTimeout(() => onClose(), 500);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Failed to share. Please try again.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Share as Story</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="p-6">
          {/* Template Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedTemplate === key
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                    }`}
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{template.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[400px]">
              {isGenerating ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-2"></div>
                  <p className="text-gray-600">Generating preview...</p>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt="Template Preview"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '500px' }}
                />
              ) : (
                <p className="text-gray-500">No preview available</p>
              )}
            </div>
          </div>

          {/* Share Tips */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <span className="material-icons text-purple-600 mr-2">info</span>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-1">Sharing Tips</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Perfect for Instagram & WhatsApp stories (9:16 ratio)</li>
                  <li>• You can also send directly to friends</li>
                  <li>• Image will be saved to your device</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {step === 'template' && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('platform')}
                disabled={isGenerating}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-icons">arrow_forward</span>
                Next: Choose Platform
              </button>
            </div>
          )}

          {step === 'platform' && (
            <>
              {/* Platform Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Share to...</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'from-green-400 to-green-600' },
                    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'from-purple-400 to-pink-600' },
                    { id: 'twitter', name: 'Twitter', icon: '𝕏', color: 'from-gray-800 to-black' },
                    { id: 'facebook', name: 'Facebook', icon: 'f', color: 'from-blue-600 to-blue-800' },
                    { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'from-blue-400 to-cyan-500' },
                    { id: 'copy', name: 'Copy Text', icon: '📋', color: 'from-gray-400 to-gray-600' },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handleShare(platform.id)}
                      disabled={isSharing}
                      className={`p-4 rounded-xl border-2 border-transparent transition-all hover:shadow-lg disabled:opacity-50 ${
                        isSharing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{
                        background: isSharing ? '#f3f4f6' : `linear-gradient(135deg, ${platform.color.split('to')[1]})`
                      }}
                    >
                      <div className="text-3xl mb-2">{platform.icon}</div>
                      <div className="text-xs font-semibold text-white drop-shadow">{platform.name}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => handleShare('download')}
                    disabled={isSharing}
                    className={`p-4 rounded-xl border-2 border-gray-300 transition-all hover:shadow-lg disabled:opacity-50 ${
                      isSharing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">⬇️</div>
                    <div className="text-xs font-semibold text-gray-700">Download</div>
                  </button>
                </div>
              </div>

              {/* Back Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('template')}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons">arrow_back</span>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareTemplateModal;
