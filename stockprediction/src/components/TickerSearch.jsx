import { useState, useEffect } from 'react'; 
import { getSymbols } from '../lib/api';
import useDebounce from '../lib/useDebounce';

function TickerSearch({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedValue = useDebounce(value, 1);

   console.log('TickerSearch received value prop:', value);
  console.log('Debounced value is:', debouncedValue);

 useEffect(() => { 
  // This code will now run every time debouncedValue changes
  if (debouncedValue.trim()) {
    setIsLoading(true);
    getSymbols(debouncedValue)
      .then(data => {
        console.log("Data received inside TickerSearch component:", data); 
        setSuggestions(data);
        setIsOpen(true);
        setActiveIndex(-1);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setIsLoading(false));
  } else {
    setSuggestions([]);
    setIsOpen(false);
  }
}, [debouncedValue]); 

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="suggestions-list"
        aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="suggestions-list"
          className="absolute z-50 w-full mt-2 max-h-60 overflow-auto bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl"
        >
          {suggestions.map((item, index) => (
            <li
              key={`${item.symbol}-${index}`}
              id={`suggestion-${index}`}
              onClick={() => handleSelect(item)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === activeIndex ? 'bg-blue-500/20' : 'hover:bg-white/5'
              }`}
            >
              <span className="font-bold text-white">{item.symbol}</span>
              <span className="text-gray-400 ml-2">— {item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TickerSearch;