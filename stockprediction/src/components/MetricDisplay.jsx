// src/components/MetricDisplay.jsx
import React from 'react';

function MetricDisplay({ mae, rmse }) {
  // Format the numbers to be more readable
  const formattedMae = mae ? (mae * 100).toFixed(2) + '%' : 'N/A';
  const formattedRmse = rmse ? (rmse * 100).toFixed(2) + '%' : 'N/A';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Model Fit (MAE)</p>
        <p className="text-2xl font-semibold text-white">{formattedMae}</p>
        <p className="text-xs text-gray-500">Mean Absolute Error on historical test data.</p>
      </div>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Model Fit (RMSE)</p>
        <p className="text-2xl font-semibold text-white">{formattedRmse}</p>
        <p className="text-xs text-gray-500">Root Mean Squared Error on historical test data.</p>
      </div>
    </div>
  );
}

export default MetricDisplay;