// src/lib/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value.
 * @param {any} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
function useDebounce(value, delay) {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Set up a timer that will update the debounced value after the specified delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // This is the cleanup function that will be called if 'value' or 'delay' changes
      // before the timer has finished. It prevents the old timer from firing.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-run the effect if value or delay changes
  );

  return debouncedValue;
}

export default useDebounce;