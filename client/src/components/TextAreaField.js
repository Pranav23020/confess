import React from 'react';

const TextAreaField = ({ 
  value, 
  onChange, 
  placeholder, 
  maxLength = 500,
  minHeight = '200px',
  autoFocus = false 
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <textarea
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full h-full bg-transparent border-none p-0 text-xl md:text-2xl leading-relaxed font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400/60 dark:placeholder:text-slate-600 focus:ring-0 resize-none caret-primary"
        style={{ minHeight }}
        placeholder={placeholder}
      />
      <div className="flex justify-end pb-2 mt-2">
        <span className={`text-xs font-semibold tracking-wide transition-colors ${value.length > maxLength ? 'text-red-500' : 'text-slate-400 dark:text-slate-600'}`}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default TextAreaField;
