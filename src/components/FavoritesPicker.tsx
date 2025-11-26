'use client';

import { useState, useEffect } from 'react';
import { Favorite } from '@/types';
import { useSession } from 'next-auth/react';

interface FavoritesPickerProps {
  onSelect?: (hcpcs: string) => void;
  onMultiSelect?: (hcpcs: string[]) => void;
  multiSelect?: boolean;
  selectedCodes?: string[];
}

export default function FavoritesPicker({ onSelect, onMultiSelect, multiSelect = false, selectedCodes = [] }: FavoritesPickerProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedFavorites, setCheckedFavorites] = useState<Set<string>>(new Set());

  const fetchFavorites = () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/favorites')
      .then((res) => {
        if (!res.ok) {
          // Handle 401 gracefully (user not authenticated)
          if (res.status === 401) {
            console.log('User not authenticated, skipping favorites fetch');
            setFavorites([]);
            return null;
          }
          throw new Error('Failed to fetch favorites');
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return; // Skip if null (401 case)
        // Ensure data is an array
        if (Array.isArray(data)) {
          setFavorites(data);
        } else {
          console.error('Favorites API returned non-array:', data);
          setFavorites([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching favorites:', error);
        setFavorites([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFavorites();
  }, [session]);

  const handleRemove = (hcpcs: string) => {
    fetch(`/api/favorites/${hcpcs}`, { method: 'DELETE' })
      .then(() => fetchFavorites());
  };

  const handleCheckboxChange = (hcpcs: string) => {
    setCheckedFavorites(prev => {
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
    if (onMultiSelect && checkedFavorites.size > 0) {
      onMultiSelect(Array.from(checkedFavorites));
      setCheckedFavorites(new Set());
    }
  };

  return (
    <div>
      {loading && <div>Loading favorites...</div>}
      {!loading && favorites.length === 0 && (
        <div className="text-gray-500 text-sm">No favorites yet</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {favorites.map((fav) => {
          const isAlreadySelected = selectedCodes.includes(fav.hcpcs);
          return (
            <div key={fav.hcpcs} className={`relative p-2 border rounded-md group ${isAlreadySelected ? 'bg-gray-100 opacity-50' : ''}`}>
              {multiSelect ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedFavorites.has(fav.hcpcs)}
                    onChange={() => !isAlreadySelected && handleCheckboxChange(fav.hcpcs)}
                    disabled={isAlreadySelected}
                    className="w-4 h-4"
                  />
                  <span className={isAlreadySelected ? 'text-gray-400' : ''}>
                    {fav.hcpcs}
                    {isAlreadySelected && <span className="ml-1 text-xs">(added)</span>}
                  </span>
                </label>
              ) : (
                <button
                  onClick={() => onSelect && onSelect(fav.hcpcs)}
                  className="w-full text-left"
                >
                  {fav.hcpcs}
                </button>
              )}
              {!multiSelect && (
                <button
                  onClick={() => handleRemove(fav.hcpcs)}
                  className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100"
                >
                  &times;
                </button>
              )}
            </div>
          );
        })}
      </div>
      {multiSelect && checkedFavorites.size > 0 && (
        <div className="mt-3">
          <button
            onClick={handleAddSelected}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Selected ({checkedFavorites.size}) {checkedFavorites.size === 1 ? 'Favorite' : 'Favorites'}
          </button>
        </div>
      )}
    </div>
  );
}
