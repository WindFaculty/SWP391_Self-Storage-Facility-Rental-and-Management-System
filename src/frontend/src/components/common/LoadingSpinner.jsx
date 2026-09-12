import React from 'react';

export const LoadingSpinner = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );
};
