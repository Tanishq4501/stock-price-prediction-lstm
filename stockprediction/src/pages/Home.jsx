import { useState } from 'react';
import TickerSearch from '../components/TickerSearch';
import NumberStepper from '../components/NumberStepper';
import PeriodSelect from '../components/PeriodSelect';
import Tip from '../components/Tip';
import PredictionChart from '../components/PredictionChart';
import { postPredict } from '../lib/api';
import ForecastTable from '../components/ForecastTable'; 
import MetricDisplay from '../components/MetricDisplay';


function Home() {
  const [tickerInput, setTickerInput] = useState('');
  const [symbol, setSymbol] = useState(null); 
  const [daysAhead, setDaysAhead] = useState(7);
  const [period, setPeriod] = useState('5y');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  const handleTickerSelect = (item) => {
    setSymbol(item);
    setTickerInput(`${item.symbol} — ${item.name}`);
  };

  const handleRunPrediction = async () => {
    if (!symbol) {
      setError('Please select a stock symbol');
      return;
    }

    if (daysAhead < 1 || daysAhead > 15) {
      setError('Days ahead must be between 1 and 15');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await postPredict({
        symbol: symbol.symbol,
        daysAhead,
        period,
      });

      setChartData({
        symbol: response.symbol,
        mae: response.mae, // Add mae
        rmse: response.rmse,
        dates: response.series.dates,
        actual: response.series.actual,
        pred_hist: response.series.pred_hist,
        pred_future: response.series.pred_future,
        hist_pred_dates: response.series.hist_pred_dates,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleRunPrediction();
  };

  console.log('Current Ticker Input in Home:', tickerInput);

return (
  <div className="min-h-screen bg-[#0A0A0A] text-gray-200 p-4 md:p-8 font-sans">
    {/* Header */}
    <header className="py-8 text-center animate-fade-in">
      <h1
        className="text-4xl md:text-6xl font-extrabold tracking-wider uppercase
                   bg-gradient-to-b from-gray-100 to-gray-400 bg-clip-text text-transparent
                   drop-shadow-[0_1px_3px_rgba(255,255,255,0.05)]"
      >
        Stock Prediction
      </h1>
    </header>

    {/* Main Card */}
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-900/50 rounded-xl p-6 md:p-8 border border-gray-800 mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-6 text-white">Train & Forecast</h2>

          {!isLoading && chartData && (
            <MetricDisplay mae={chartData.mae} rmse={chartData.rmse} />
          )}


        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Ticker Symbol, Days Ahead, History Period sections */}
          {/* Note: The components like TickerSearch will inherit the professional look if their internal styles are consistent */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ticker Symbol
            </label>
            <TickerSearch
              value={tickerInput}
              onChange={setTickerInput}
              onSelect={handleTickerSelect}
              placeholder="Search e.g., AAPL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Days Ahead
            </label>
            <NumberStepper
              value={daysAhead}
              min={1}
              max={15}
              onChange={setDaysAhead}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              History Period
            </label>
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Tip */}
        <div className="mb-6">
          <Tip>
            For Indian stocks on NSE, append .NS (e.g., HDFCBANK.NS)
          </Tip>
        </div>

        {/* Error Banner */}
        {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600/30 rounded-lg flex items-start justify-between">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="text-sm text-red-300 hover:text-red-100 underline ml-4"
              >
                Retry
              </button>
            </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleRunPrediction}
          disabled={isLoading || !symbol}
          className="w-full py-3 bg-white text-black font-semibold rounded-lg transition-colors
                     hover:bg-gray-200 active:bg-gray-300
                     disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : "Run Prediction"}
        </button>
      </div>

      {/* Chart & Table Section */}
      <div className="max-w-6xl mx-auto">
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading prediction...</p>
              </div>
            </div>
          ) : (
            <PredictionChart
              symbol={chartData?.symbol}
              dates={chartData?.dates}
              actual={chartData?.actual}
              pred_hist={chartData?.pred_hist}
              pred_future={chartData?.pred_future}
              hist_pred_dates={chartData?.hist_pred_dates}
            />
          )}
        </div>
        {!isLoading && chartData && (
          <ForecastTable
            dates={chartData.dates.slice(-chartData.pred_future.length)}
            prices={chartData.pred_future}
          />
        )}
      </div>
    </div>
    
    {/* The <style> tag can be removed if you have defined the fade-in animation in your tailwind.config.js */}
    <style>{`@keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in 1.0s ease-out}`}</style>
  </div>
);
}

export default Home;