import React, { forwardRef } from 'react';

const TextAreaField = forwardRef(({
  value,
  onChange,
  placeholder,
  maxLength = 500,
  minHeight = '200px',
  autoFocus = false
}, ref) => {
  return (
    <div className="flex-1 flex flex-col">
      <textarea
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full h-full bg-transparent border-none p-0 text-xl md:text-2xl leading-relaxed font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400/60 dark:placeholder:text-slate-600 focus:ring-0 resize-none caret-primary"
        style={{ minHeight }}
        placeholder={placeholder}
      />
    </div>
  );
});

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;
