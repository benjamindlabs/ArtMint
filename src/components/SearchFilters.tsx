import React, { useState } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useSearch } from '../contexts/SearchContext';

interface SearchFiltersProps {
  className?: string;
  showMobileToggle?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  className = "",
  showMobileToggle = true
}) => {
  const { filters, updateFilters, clearFilters } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    type: true,
    attributes: false
  });

  const categories = [
    { value: 'art', label: 'Art' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'music', label: 'Music' },
    { value: 'photography', label: 'Photography' },
    { value: 'sports', label: 'Sports' },
    { value: 'virtual-worlds', label: 'Virtual Worlds' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'utility', label: 'Utility' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Recently Created' },
    { value: 'price', label: 'Price' },
    { value: 'name', label: 'Name' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'views', label: 'Most Viewed' }
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = () => {
    return filters.category || 
           filters.priceMin || 
           filters.priceMax || 
           filters.creator || 
           filters.isAuction !== null ||
           filters.attributes.length > 0;
  };

  const FilterSection: React.FC<{
    title: string;
    section: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, section, children }) => (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
      >
        {title}
        {expandedSections[section] ? (
          <FiChevronUp className="h-4 w-4" />
        ) : (
          <FiChevronDown className="h-4 w-4" />
        )}
      </button>
      {expandedSections[section] && children}
    </div>
  );

  const filtersContent = (
    <div className="space-y-4">
      {/* Sort By */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <div className="flex space-x-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <FilterSection title="Price Range (ETH)" section="price">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => updateFilters({ priceMin: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            step="0.01"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => updateFilters({ priceMax: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            step="0.01"
            min="0"
          />
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" section="category">
        <div className="space-y-2">
          <button
            onClick={() => updateFilters({ category: '' })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              !filters.category 
                ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => updateFilters({ category: category.value })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                filters.category === category.value 
                  ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sale Type */}
      <FilterSection title="Sale Type" section="type">
        <div className="space-y-2">
          <button
            onClick={() => updateFilters({ isAuction: null })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              filters.isAuction === null 
                ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => updateFilters({ isAuction: false })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              filters.isAuction === false 
                ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            Fixed Price
          </button>
          <button
            onClick={() => updateFilters({ isAuction: true })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              filters.isAuction === true 
                ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            Auctions
          </button>
        </div>
      </FilterSection>

      {/* Creator Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Creator
        </label>
        <input
          type="text"
          placeholder="Search by creator name..."
          value={filters.creator}
          onChange={(e) => updateFilters({ creator: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters() && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiX className="mr-2 h-4 w-4" />
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      {showMobileToggle && (
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters() && (
              <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                {[
                  filters.category,
                  filters.priceMin,
                  filters.priceMax,
                  filters.creator,
                  filters.isAuction !== null ? 'type' : null
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {hasActiveFilters() && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                {[
                  filters.category,
                  filters.priceMin,
                  filters.priceMax,
                  filters.creator,
                  filters.isAuction !== null ? 'type' : null
                ].filter(Boolean).length}
              </span>
            )}
          </div>
          {filtersContent}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                {filtersContent}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchFilters;
