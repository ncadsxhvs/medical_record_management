'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const refreshFavorites = useCallback(() => {
    fetch('/api/favorites')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setFavorites(new Set(data.map((fav: any) => fav.hcpcs)));
        }
      })
      .catch(() => setFavorites(new Set()));
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback((hcpcs: string) => favorites.has(hcpcs), [favorites]);

  const toggleFavorite = useCallback(async (hcpcs: string) => {
    const wasFavorite = favorites.has(hcpcs);

    try {
      if (wasFavorite) {
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
  }, [favorites]);

  return { favorites, isFavorite, toggleFavorite, refreshFavorites };
}
