// src/lib/api.js

const API_BASE_URL = 'http://localhost:8000';

/**
 * A helper function to handle API responses and errors.
 * @param {Response} response - The response object from fetch.
 * @returns {Promise<any>} - The JSON data from the response.
 * @throws {Error} - Throws an error if the response is not ok.
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}


export async function getSymbols(query) {
  // 1. Return early if the query is empty
  if (!query) {
    return [];
  }

  // 2. Safely create the query parameter
  const params = new URLSearchParams({ q: query });
  
  // 3. Make sure you are calling the NEW "/api/stocks/search" endpoint
  const response = await fetch(`${API_BASE_URL}/api/stocks/search?${params.toString()}`);
  
  const data = await handleResponse(response);

  // 4. IMPORTANT: Make sure you return "data.results", not "data" or "data.stocks"
  return data.results || []; 
}




/**
 * Submits a prediction request and transforms the backend response 
 * into the format expected by the frontend chart component.
 */
export async function postPredict(payload) {
  const requestBody = {
    ticker: payload.symbol,
    days_ahead: payload.daysAhead,
    period: payload.period,
  };

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await handleResponse(response);

  if (data.success && data.results) {
    const results = data.results;

    
    const all_dates = [...results.historical_dates, ...results.future_dates];

    // We pad it with 'null' for the future part so the line stops correctly.
    const actual_prices = [
      ...results.historical_prices,
      ...Array(results.future_dates.length).fill(null)
    ];

    // 3. Get the ticker from the main request payload since it's not in the results.
    const ticker = payload.symbol;

    // 4. Map the backend keys to the expected frontend keys.
    return {
      symbol: ticker,
      mae: results.mae,
      rmse: results.rmse,
      series: {
        dates: all_dates,
        actual: actual_prices,
        pred_hist: results.hist_pred_prices,
        pred_future: results.future_predictions,
        hist_pred_dates: results.hist_pred_dates, // Pass the correct dates through
      },
    };  
    // --- FIX ENDS HERE ---

  } else {
    throw new Error('Prediction failed: Invalid response format from server.');
  }
}