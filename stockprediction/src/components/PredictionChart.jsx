// src/components/PredictionChart.jsx
import React from 'react';
import Plot from 'react-plotly.js'; // Import the real Plotly component

function PredictionChart({ symbol, dates, actual, pred_hist, pred_future }) {
  if (!dates || dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-lg">Run a prediction to see the chart</p>
      </div>
    );
  }

  // Find where future starts
  const futureStartIdx = actual.findIndex(v => v === null);
  const futureStartDate = futureStartIdx >= 0 ? dates[futureStartIdx] : null;

  const traces = [
    {
      x: dates,
      y: actual,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Historical',
      line: { color: '#3b82f6', width: 2 },
    },
/*     {
      x: dates.slice(0, pred_hist.length),
      y: pred_hist,
      type: 'scatter',
      mode: 'lines',
      name: 'Historical Prediction',
      line: { color: '#10b981', width: 2, dash: 'dot' },
    }, */
    {
      x: dates.slice(-pred_future.length),
      y: pred_future,
      type: 'scatter',
      mode: 'lines',
      name: 'Future Forecast',
      line: { color: '#f59e0b', width: 2, dash: 'dash' },
    },
  ];

  const layout = {
    title: {
      text: `${symbol} Stock Forecast & Model Fit`,
      font: { color: '#fff', size: 20 },
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(255,255,255,0.02)',
    xaxis: {
      title: 'Date',
      color: '#9ca3af',
      gridcolor: 'rgba(255,255,255,0.05)',
    },
    yaxis: {
      title: 'Price (USD)',
      color: '#9ca3af',
      gridcolor: 'rgba(255,255,255,0.05)',
    },
    legend: {
      x: 0,
      y: 1.1,
      orientation: 'h',
      bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#fff' },
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#111827', // A dark background for the tooltip
      bordercolor: 'rgba(255,255,255,0.2)',
      font: {
        color: '#e5e7eb' // A light gray font color for readability
      }
    },
    margin: { t: 60, r: 40, b: 60, l: 60 },
    shapes: futureStartDate ? [{
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: futureStartDate,
      x1: dates[dates.length - 1],
      y0: 0,
      y1: 1,
      fillcolor: 'rgba(245, 158, 11, 0.1)',
      line: { width: 0 },
    }] : [],
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        useResizeHandler={true}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

export default PredictionChart;