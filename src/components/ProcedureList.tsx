'use client';

import { VisitProcedure } from '@/types';
import { useState, useEffect } from 'react';

interface ProcedureListProps {
  procedures: VisitProcedure[];
  onRemove?: (hcpcs: string) => void;
  onQuantityChange?: (hcpcs: string, quantity: number) => void;
  editable?: boolean;
  showFavorites?: boolean;
}

export default function ProcedureList({ procedures, onRemove, onQuantityChange, editable = true, showFavorites = true }: ProcedureListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch user's favorites
    if (showFavorites) {
      fetch('/api/favorites')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setFavorites(new Set(data.map((fav: any) => fav.hcpcs)));
          }
        })
        .catch(() => setFavorites(new Set()));
    }
  }, [showFavorites]);

  const handleToggleFavorite = async (hcpcs: string) => {
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
  if (procedures.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4 text-center border border-gray-200 rounded-md">
        No procedures added yet. Search for HCPCS codes above to add procedures.
      </div>
    );
  }

  const totalRVU = procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);

  return (
    <div className="space-y-3">
      {procedures.map((proc, index) => {
        const isFavorite = favorites.has(proc.hcpcs);
        return (
          <div key={`${proc.hcpcs}-${index}`} className="p-3 border border-gray-300 rounded-md bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{proc.hcpcs}</span>
                  {proc.status_code && (
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {proc.status_code}
                    </span>
                  )}
                  {showFavorites && (
                    <button
                      onClick={() => handleToggleFavorite(proc.hcpcs)}
                      className={`text-lg ${isFavorite ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  )}
                </div>
                <div className="text-gray-700 mt-1">{proc.description}</div>
                <div className="flex items-center gap-4 mt-2">
                  {editable && onQuantityChange ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={proc.quantity || 1}
                        onChange={(e) => onQuantityChange(proc.hcpcs, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Quantity: <span className="font-semibold">{proc.quantity || 1}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Unit RVU: <span className="font-semibold">{Number(proc.work_rvu).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-blue-600">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU</span>
                  </div>
                </div>
              </div>
              {editable && onRemove && (
                <button
                  onClick={() => onRemove(proc.hcpcs)}
                  className="ml-3 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md border border-red-300"
                  title="Remove this procedure"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Procedures:</span>
          <span className="font-bold">{procedures.length}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="font-semibold text-gray-700">Total Work RVU:</span>
          <span className="font-bold text-blue-700 text-lg">{totalRVU.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
