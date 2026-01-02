import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ReportFilters } from '../types';

interface SearchFilterProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onClearFilters: () => void;
  onRefresh?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onRefresh,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch || undefined, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleAgeChange = (age: string) => {
    const ageValue = age ? parseInt(age) : undefined;
    onFiltersChange({ ...filters, age: ageValue, page: 1 });
  };

  const handleGenderChange = (gender: string) => {
    const genderValue = gender || undefined;
    onFiltersChange({ 
      ...filters, 
      gender: genderValue as 'male' | 'female' | 'other' | undefined, 
      page: 1 
    });
  };

  const hasActiveFilters = filters.search || filters.age || filters.gender;

  return (
    <section className="bg-white p-4 rounded-lg shadow-sm border mb-6" aria-labelledby="search-filter-heading">
      <h2 id="search-filter-heading" className="sr-only">Search and Filter Reports</h2>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <label htmlFor="search-input" className="sr-only">Search by patient name</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="search-input"
            type="text"
            placeholder="Search by patient name..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-expanded={showFilters}
            aria-controls="filter-controls"
            aria-label={`${showFilters ? 'Hide' : 'Show'} filter options`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" aria-label={`${[filters.search, filters.age, filters.gender].filter(Boolean).length} active filters`}>
                {[filters.search, filters.age, filters.gender].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Clear all filters"
            >
              <XMarkIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Clear
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Refresh reports"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div id="filter-controls" className="mt-4 pt-4 border-t border-gray-200" role="region" aria-label="Filter controls">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age Filter */}
            <div>
              <label htmlFor="age-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                id="age-filter"
                type="number"
                placeholder="Enter age"
                value={filters.age || ''}
                onChange={(e) => handleAgeChange(e.target.value)}
                min="0"
                max="150"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="age-filter-help"
              />
              <div id="age-filter-help" className="sr-only">Filter reports by patient age</div>
            </div>

            {/* Gender Filter */}
            <div>
              <label htmlFor="gender-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender-filter"
                value={filters.gender || ''}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="gender-filter-help"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div id="gender-filter-help" className="sr-only">Filter reports by patient gender</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SearchFilter;