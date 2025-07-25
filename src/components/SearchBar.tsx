import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiClock, FiTrendingUp } from 'react-icons/fi';
import { useSearch } from '../contexts/SearchContext';

interface SearchBarProps {
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search NFTs, collections, creators...",
  showSuggestions = true,
  className = ""
}) => {
  const { filters, updateFilters, suggestions, recentSearches, getSuggestions } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(filters.query);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle input change with debounced suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 2) {
        getSuggestions(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, getSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length >= 2 && showSuggestions) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Debounced filter update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ query: inputValue });
    }, 500); // 500ms debounce for filter updates

    return () => clearTimeout(timer);
  }, [inputValue, updateFilters]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    if (showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                   bg-white text-gray-900 placeholder-gray-500
                   transition-colors duration-200"
        />
        
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                     hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg 
                   shadow-lg max-h-80 overflow-y-auto"
        >
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <FiTrendingUp className="mr-2 h-3 w-3" />
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 
                           rounded transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <FiSearch className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="truncate">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <FiClock className="mr-2 h-3 w-3" />
                Recent Searches
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 
                           rounded transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <FiClock className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="truncate">{search}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {suggestions.length === 0 && recentSearches.length === 0 && inputValue.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              <FiSearch className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for NFT names, creators, or collections
              </p>
            </div>
          )}

          {/* Empty State */}
          {suggestions.length === 0 && recentSearches.length === 0 && inputValue.length < 2 && (
            <div className="p-4 text-center text-gray-500">
              <FiSearch className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs text-gray-400 mt-1">
                Search for NFTs, collections, or creators
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
