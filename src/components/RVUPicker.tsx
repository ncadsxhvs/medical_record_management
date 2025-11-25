'use client';

import { useState, useEffect, useCallback } from 'react';
import { RVUCode } from '@/types';
import { debounce } from 'lodash';

interface RVUPickerProps {
  onSelect: (rvuCode: RVUCode) => void;
}

export default function RVUPicker({ onSelect }: RVUPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RVUCode[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleSelect = (rvuCode: RVUCode) => {
    onSelect(rvuCode);
    setQuery('');
    setResults([]);
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
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((rvuCode) => (
            <li
              key={rvuCode.hcpcs}
              onClick={() => handleSelect(rvuCode)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              <div className="font-bold">{rvuCode.hcpcs}</div>
              <div className="text-sm text-gray-600">{rvuCode.description}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
