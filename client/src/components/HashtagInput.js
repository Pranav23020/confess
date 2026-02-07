import React, { useState, useEffect } from 'react';
import { Hash, Zap } from 'lucide-react';
import api from '../api';

const HashtagInput = ({ value, onChange, onHashtagSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState([]);

  // Extract hashtags from text
  useEffect(() => {
    const hashtags = value.match(/#[\w]+/gi) || [];
    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());
    setSelectedHashtags([...new Set(cleanHashtags)]);
  }, [value]);

  // Auto-suggest hashtags as user types
  useEffect(() => {
    const lastWord = value.split(/\s+/).pop();
    
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      const searchTerm = lastWord.substring(1);
      
      const fetchSuggestions = async () => {
        try {
          const response = await api.get('/hashtags', {
            params: { search: searchTerm }
          });
          
          if (response.data.success) {
            setSuggestions(response.data.data.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching hashtag suggestions:', error);
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSuggestionClick = (tag) => {
    const lastHashtagIndex = value.lastIndexOf('#');
    const beforeHashtag = value.substring(0, lastHashtagIndex);
    const newValue = beforeHashtag + '#' + tag + ' ';
    onChange(newValue);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Textarea with Hashtagging */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your confession... (You can use #hashtags to categorize)"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          rows="6"
        />

        {/* Hashtag Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden z-20">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.tag)}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-b border-white/5 last:border-b-0"
              >
                <Hash className="w-4 h-4 text-primary" />
                <span>{suggestion.tag}</span>
                <span className="text-xs text-gray-400 ml-auto">{suggestion.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Hashtags Display */}
      {selectedHashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedHashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm"
            >
              <Hash className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hashtag Tips */}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        <Zap className="w-3 h-3" />
        <span>Use #hashtags to help others discover your confession</span>
      </div>
    </div>
  );
};

export default HashtagInput;
