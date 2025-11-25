'use client';

import { useState, useEffect } from 'react';
import { RVUCode, Favorite } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';

interface EntryFormProps {
  onEntryAdded: () => void;
}

export default function EntryForm({ onEntryAdded }: EntryFormProps) {
  const [formData, setFormData] = useState<Partial<RVUCode> & { date: string }>({
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedHCPCS, setSelectedHCPCS] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesKey, setFavoritesKey] = useState(0);

  const handleRvuSelect = (rvuCode: RVUCode) => {
    setFormData({
      ...formData,
      hcpcs: rvuCode.hcpcs,
      description: rvuCode.description,
      status_code: rvuCode.status_code,
      work_rvu: rvuCode.work_rvu,
    });
    setSelectedHCPCS(rvuCode.hcpcs);
  };

  // Fetch favorites to check if current HCPCS is favorited
  useEffect(() => {
    fetch('/api/favorites')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setFavorites(data);
        }
      })
      .catch(() => setFavorites([]));
  }, [favoritesKey]);

  const handleFavoriteSelect = async (hcpcs: string) => {
    // Fetch the full RVU code details from cache
    try {
      const res = await fetch(`/api/rvu/search?q=${hcpcs}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const rvuCode = data.find(code => code.hcpcs === hcpcs) || data[0];
        handleRvuSelect(rvuCode);
      }
    } catch (error) {
      console.error('Failed to fetch RVU code details:', error);
    }
  };

  const handleSave = () => {
    fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(() => {
      onEntryAdded();
      setFormData({ date: new Date().toISOString().split('T')[0] });
      setSelectedHCPCS(null);
    });
  };

  const handleToggleFavorite = async () => {
    if (!selectedHCPCS) return;

    const isFavorite = favorites.some(fav => fav.hcpcs === selectedHCPCS);

    try {
      if (isFavorite) {
        // Remove from favorites
        await fetch(`/api/favorites/${selectedHCPCS}`, {
          method: 'DELETE',
        });
      } else {
        // Add to favorites
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hcpcs: selectedHCPCS }),
        });
      }
      // Refresh favorites list
      setFavoritesKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const isFavorite = selectedHCPCS ? favorites.some(fav => fav.hcpcs === selectedHCPCS) : false;

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Search HCPCS</h3>
          <RVUPicker onSelect={handleRvuSelect} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Favorites</h3>
          <FavoritesPicker key={favoritesKey} onSelect={handleFavoriteSelect} />
        </div>
      </div>

      {selectedHCPCS && (
        <div className="mt-4">
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <div><strong>HCPCS:</strong> {formData.hcpcs}</div>
            <div><strong>Description:</strong> {formData.description}</div>
            <div><strong>Work RVU:</strong> {formData.work_rvu}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Entry
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`px-4 py-2 rounded-md ${
                isFavorite
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
