'use client';

import { useState, useEffect, useCallback } from 'react';
import { Favorite, RVUCode } from '@/types';
import { useSession } from 'next-auth/react';
import { debounce } from 'lodash';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FavoritesPickerProps {
  onSelect?: (hcpcs: string) => void;
  onMultiSelect?: (hcpcs: string[]) => void;
  multiSelect?: boolean;
  selectedCodes?: string[];
}

interface SortableItemProps {
  fav: Favorite;
  isAlreadySelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  multiSelect: boolean;
}

function SortableItem({ fav, isAlreadySelected, onSelect, onRemove, multiSelect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fav.hcpcs, disabled: isAlreadySelected });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 border rounded-md transition-all duration-200 ${
        isAlreadySelected ? 'bg-green-50 border-green-300' : 'bg-white'
      } ${isDragging ? 'opacity-40 scale-95 shadow-lg z-50' : ''}`}
    >
      {/* Drag Handle */}
      {!isAlreadySelected && (
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
          </svg>
        </div>
      )}

      {/* Content */}
      <button
        onClick={onSelect}
        disabled={multiSelect && isAlreadySelected}
        className="flex-1 text-left min-w-0 truncate"
      >
        <span className={`font-medium ${isAlreadySelected ? 'text-green-700' : 'text-gray-900'}`}>
          {fav.hcpcs}
        </span>
        {isAlreadySelected && (
          <span className="ml-1 text-xs text-green-600">✓ added</span>
        )}
      </button>

      {/* Delete Button — icon only */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-150"
        title="Remove from favorites"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function FavoritesPicker({ onSelect, onMultiSelect, multiSelect = false, selectedCodes = [] }: FavoritesPickerProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<RVUCode[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchFavorites = () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/favorites')
      .then((res) => {
        if (!res.ok) {
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
        if (!data) return;
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

  const handleSelect = (hcpcs: string) => {
    if (multiSelect && onMultiSelect) {
      onMultiSelect([hcpcs]);
    } else if (onSelect) {
      onSelect(hcpcs);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex(fav => fav.hcpcs === active.id);
      const newIndex = favorites.findIndex(fav => fav.hcpcs === over.id);

      const newFavorites = arrayMove(favorites, oldIndex, newIndex);
      setFavorites(newFavorites);

      // Save order to backend
      fetch('/api/favorites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: newFavorites }),
      }).catch((error) => {
        console.error('Failed to save favorites order:', error);
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFavorites = useCallback(
    debounce((q: string) => {
      if (q.length < 2) {
        setAddResults([]);
        return;
      }
      setAddLoading(true);
      fetch(`/api/rvu/search?q=${encodeURIComponent(q)}&limit=20`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAddResults(Array.isArray(data) ? data : []))
        .catch(() => setAddResults([]))
        .finally(() => setAddLoading(false));
    }, 300),
    []
  );

  const handleAddFavorite = async (hcpcs: string) => {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hcpcs }),
    });
    if (res.ok) fetchFavorites();
  };

  return (
    <div>
      {/* Add Favorites Button / Search */}
      <div className="mb-2">
        {showAddSearch ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={addQuery}
                onChange={(e) => {
                  setAddQuery(e.target.value);
                  searchFavorites(e.target.value);
                }}
                placeholder="Add favorite by code or name..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowAddSearch(false);
                  setAddQuery('');
                  setAddResults([]);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Done
              </button>
            </div>
            {addLoading && <div className="text-xs text-gray-400">Searching...</div>}
            {addResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {addResults.map(code => {
                  const alreadyFav = favorites.some(f => f.hcpcs === code.hcpcs);
                  return (
                    <button
                      key={code.hcpcs}
                      onClick={() => !alreadyFav && handleAddFavorite(code.hcpcs)}
                      disabled={alreadyFav}
                      className={`w-full text-left px-3 py-1.5 text-sm border-b border-gray-100 last:border-b-0 ${
                        alreadyFav ? 'bg-gray-50 text-gray-400' : 'hover:bg-blue-50'
                      }`}
                    >
                      <span className="font-medium">{code.hcpcs}</span>
                      <span className="text-gray-500 ml-2">{code.description}</span>
                      {alreadyFav && <span className="ml-1 text-xs">(already added)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAddSearch(true)}
            className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100"
          >
            + Add Favorite
          </button>
        )}
      </div>

      {loading && <div>Loading favorites...</div>}
      {!loading && favorites.length === 0 && !showAddSearch && (
        <div className="text-gray-500 text-sm">No favorites yet</div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={favorites.map(fav => fav.hcpcs)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-2">
            {favorites.map((fav) => {
              const isAlreadySelected = selectedCodes.includes(fav.hcpcs);
              return (
                <SortableItem
                  key={fav.hcpcs}
                  fav={fav}
                  isAlreadySelected={isAlreadySelected}
                  onSelect={() => !isAlreadySelected && handleSelect(fav.hcpcs)}
                  onRemove={(e) => {
                    e.stopPropagation();
                    handleRemove(fav.hcpcs);
                  }}
                  multiSelect={multiSelect}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
