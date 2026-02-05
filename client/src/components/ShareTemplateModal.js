import React, { useState, useEffect } from 'react';
import { TEMPLATE_TYPES, TEMPLATES, getTemplatePreview, shareTemplate } from '../utils/templateGenerator';

const ShareTemplateModal = ({ isOpen, onClose, confessionText }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_TYPES.GRADIENT);
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen && confessionText) {
      generatePreview(selectedTemplate);
    }
  }, [isOpen, selectedTemplate, confessionText]);

  const generatePreview = async (templateType) => {
    setIsGenerating(true);
    try {
      const previewUrl = await getTemplatePreview(confessionText, templateType);
      setPreview(previewUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await shareTemplate(confessionText, selectedTemplate);
      if (result.success) {
        if (result.downloaded) {
          alert('Image downloaded! You can now share it on your stories.');
        }
        onClose();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
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
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === key
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
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing || isGenerating}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <span className="material-icons">share</span>
                  Share Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareTemplateModal;
