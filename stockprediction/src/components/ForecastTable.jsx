// src/components/ForecastTable.jsx
import React from 'react';

function ForecastTable({ dates = [], prices = [] }) {
  if (dates.length === 0 || prices.length === 0) {
    return null; // Don't render anything if there's no data
  }

  // Combine dates and prices into a single array for easier mapping
  const forecastData = dates.map((date, index) => ({
    date,
    price: prices[index],
  }));

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">{dates.length}-Day Forecast</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-gray-300">Date</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Predicted Price (USD)</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((item) => (
                <tr key={item.date} className="border-b border-white/10 last:border-b-0">
                  <td className="p-4 text-white">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  <td className="p-4 text-white font-mono text-right">${item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ForecastTable;