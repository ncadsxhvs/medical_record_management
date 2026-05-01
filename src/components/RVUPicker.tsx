'use client';

import { useState, useEffect, useCallback } from 'react';
import { RVUCode } from '@/types';
import { debounce } from 'lodash';
import { useFavorites } from '@/hooks/useFavorites';

interface RVUPickerProps {
  onSelect?: (rvuCode: RVUCode) => void;
  onMultiSelect?: (rvuCodes: RVUCode[]) => void;
  multiSelect?: boolean;
  selectedCodes?: string[];
}

export default function RVUPicker({ onSelect, onMultiSelect, multiSelect = false, selectedCodes = [] }: RVUPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RVUCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedCodes, setCheckedCodes] = useState<Set<string>>(new Set());
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularCodes, setPopularCodes] = useState<RVUCode[]>([]);

  const fetchResults = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/rvu/search?q=${searchQuery}`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .finally(() => setLoading(false));
    }, 300),
    []
  );

  useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  useEffect(() => {
    // Fetch popular/common codes for dropdown (office visit codes)
    const commonCodes = ['99213', '99214', '99215', '99203', '99204', '99205'];
    fetch(`/api/rvu/search?q=${commonCodes.join(',')}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setPopularCodes(data);
        }
      })
      .catch(() => setPopularCodes([]));
  }, []);

  const handleSelect = (rvuCode: RVUCode) => {
    if (onSelect) {
      onSelect(rvuCode);
      setQuery('');
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleCheckboxChange = (hcpcs: string) => {
    setCheckedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hcpcs)) {
        newSet.delete(hcpcs);
      } else {
        newSet.add(hcpcs);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    if (onMultiSelect && checkedCodes.size > 0) {
      // Get from either results or popularCodes depending on what's displayed
      const sourceList = query.length >= 2 ? results : popularCodes;
      const selectedRVUCodes = sourceList.filter(code => checkedCodes.has(code.hcpcs));
      onMultiSelect(selectedRVUCodes);
      setQuery('');
      setResults([]);
      setCheckedCodes(new Set());
      setShowDropdown(false);
    }
  };

  const handleToggleFavorite = async (hcpcs: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggleFavorite(hcpcs);
  };

  const displayResults = query.length >= 2 ? results : (showDropdown && popularCodes.length > 0 ? popularCodes : []);

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search HCPCS code or desc"
          data-search-input
          className="w-full pl-9 pr-12 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50 focus:bg-white focus:border-[#0070cc] focus:ring-2 focus:ring-[#0070cc]/10 outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded pointer-events-none">&#8984;K</span>
      </div>
      {loading && <div className="p-2">Loading...</div>}
      {displayResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-300 rounded-lg shadow-lg">
          {query.length < 2 && (
            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 bg-zinc-50">
              Common Office Visit Codes
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto">
            {displayResults.map((rvuCode) => {
              const isAlreadySelected = selectedCodes.includes(rvuCode.hcpcs);
              const fav = isFavorite(rvuCode.hcpcs);
              return (
                <li
                  key={rvuCode.hcpcs}
                  className={`px-3 py-2 ${!multiSelect ? 'cursor-pointer hover:bg-zinc-100' : ''} ${isAlreadySelected ? 'bg-zinc-100 opacity-50' : ''}`}
                  onClick={() => !multiSelect && !isAlreadySelected && handleSelect(rvuCode)}
                >
                  <div className="flex items-center gap-2">
                    {multiSelect && (
                      <input
                        type="checkbox"
                        checked={checkedCodes.has(rvuCode.hcpcs)}
                        onChange={() => !isAlreadySelected && handleCheckboxChange(rvuCode.hcpcs)}
                        disabled={isAlreadySelected}
                        className="w-4 h-4"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{rvuCode.hcpcs}</span>
                        <button
                          onClick={(e) => handleToggleFavorite(rvuCode.hcpcs, e)}
                          className={`text-lg ${fav ? 'text-yellow-500' : 'text-zinc-300'} hover:text-yellow-400 transition-colors`}
                          title={fav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {fav ? '★' : '☆'}
                        </button>
                      </div>
                      <div className="text-sm text-zinc-600">
                        {rvuCode.description}
                        {isAlreadySelected && <span className="ml-2 text-[#0070cc]">(Already added)</span>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {multiSelect && checkedCodes.size > 0 && (
            <div className="p-2 border-t border-zinc-300">
              <button
                onClick={handleAddSelected}
                className="w-full px-4 py-2 bg-[#0070cc] text-white rounded-full hover:bg-[#005fa3] cursor-pointer"
              >
                Add Selected ({checkedCodes.size}) {checkedCodes.size === 1 ? 'Code' : 'Codes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
