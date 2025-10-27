import { useState } from 'react';

function NumberStepper({ value, min = 1, max = 15, onChange }) {
  const [inputValue, setInputValue] = useState(String(value));

  const clamp = (val) => Math.max(min, Math.min(max, val));

  const handleDecrement = () => {
    const newVal = clamp(value - 1);
    onChange(newVal);
    setInputValue(String(newVal));
  };

  const handleIncrement = () => {
    const newVal = clamp(value + 1);
    onChange(newVal);
    setInputValue(String(newVal));
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setInputValue(String(value));
    } else {
      const clamped = clamp(parsed);
      setInputValue(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        −
      </button>
      <input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        +
      </button>
    </div>
  );
}

export default NumberStepper;