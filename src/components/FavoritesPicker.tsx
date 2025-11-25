'use client';

import { useState, useEffect } from 'react';
import { Favorite } from '@/types';
import { useSession } from 'next-auth/react';

interface FavoritesPickerProps {
  onSelect: (hcpcs: string) => void;
}

export default function FavoritesPicker({ onSelect }: FavoritesPickerProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-semibold mb-2">Favorites</h3>
      {loading && <div>Loading favorites...</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {favorites.map((fav) => (
          <div key={fav.hcpcs} className="relative p-2 border rounded-md group">
            <button
              onClick={() => onSelect(fav.hcpcs)}
              className="w-full text-left"
            >
              {fav.hcpcs}
            </button>
            <button
              onClick={() => handleRemove(fav.hcpcs)}
              className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
