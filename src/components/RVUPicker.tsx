'use client';

import { useState, useEffect, useCallback } from 'react';
import { RVUCode } from '@/types';
import { debounce } from 'lodash';

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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
    // Fetch user's favorites
    fetch('/api/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setFavorites(new Set(data.map((fav: any) => fav.hcpcs)));
        }
      })
      .catch(() => setFavorites(new Set()));
  }, []);

  const handleSelect = (rvuCode: RVUCode) => {
    if (onSelect) {
      onSelect(rvuCode);
      setQuery('');
      setResults([]);
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
      const selectedRVUCodes = results.filter(code => checkedCodes.has(code.hcpcs));
      onMultiSelect(selectedRVUCodes);
      setQuery('');
      setResults([]);
      setCheckedCodes(new Set());
    }
  };

  const handleToggleFavorite = async (hcpcs: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering selection
    const isFavorite = favorites.has(hcpcs);

    try {
      if (isFavorite) {
        await fetch(`/api/favorites/${hcpcs}`, { method: 'DELETE' });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(hcpcs);
          return newSet;
        });
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hcpcs }),
        });
        setFavorites(prev => new Set(prev).add(hcpcs));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search HCPCS code or description..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
      {loading && <div className="p-2">Loading...</div>}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <ul className="max-h-60 overflow-y-auto">
            {results.map((rvuCode) => {
              const isAlreadySelected = selectedCodes.includes(rvuCode.hcpcs);
              const isFavorite = favorites.has(rvuCode.hcpcs);
              return (
                <li
                  key={rvuCode.hcpcs}
                  className={`px-3 py-2 ${!multiSelect ? 'cursor-pointer hover:bg-gray-100' : ''} ${isAlreadySelected ? 'bg-gray-100 opacity-50' : ''}`}
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
                          className={`text-lg ${isFavorite ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {rvuCode.description}
                        {isAlreadySelected && <span className="ml-2 text-blue-600">(Already added)</span>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {multiSelect && checkedCodes.size > 0 && (
            <div className="p-2 border-t border-gray-300">
              <button
                onClick={handleAddSelected}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
