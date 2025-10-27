import React from 'react';

function Tip({ children }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
      <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-blue-200">{children}</p>
    </div>
  );
}

export default Tip;