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
  multiSelect: boolean;
}

function SortableItem({ fav, isAlreadySelected, onSelect, multiSelect }: SortableItemProps) {
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
      className={`p-2.5 border rounded-xl transition-all duration-200 ${
        isAlreadySelected ? 'bg-green-50 border-green-300' : 'bg-white border-zinc-200 hover:border-[#0070cc]/30 hover:bg-[#0070cc]/5'
      } ${isDragging ? 'opacity-40 scale-95 shadow-lg z-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <button
          onClick={onSelect}
          disabled={multiSelect && isAlreadySelected}
          className="flex-1 text-left min-w-0"
          {...(!isAlreadySelected ? { ...attributes, ...listeners } : {})}
        >
          <div className={`font-mono font-bold text-sm ${isAlreadySelected ? 'text-green-700' : 'text-zinc-900'}`}>
            {fav.hcpcs}
          </div>
          {fav.description && (
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">{fav.description}</div>
          )}
          <div className="text-xs font-mono font-semibold text-[#0070cc] mt-1">
            {fav.work_rvu ? `${Number(fav.work_rvu).toFixed(2)} RVU` : ''}
            {isAlreadySelected && <span className="text-green-600 ml-1">&#10003;</span>}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function FavoritesPicker({ onSelect, onMultiSelect, multiSelect = false, selectedCodes = [] }: FavoritesPickerProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
      {/* Header: FAVORITES + Add / Edit */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Favorites</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSearch(true)}
            className="text-xs font-semibold text-[#0070cc] hover:text-[#1eaedb] transition-colors cursor-pointer"
          >
            + Add
          </button>
          {favorites.length > 0 && (
            editMode ? (
              <button
                onClick={() => setEditMode(false)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 border border-zinc-300 rounded-full px-2.5 py-0.5 cursor-pointer"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold text-[#0070cc] hover:text-[#1eaedb] border border-[#0070cc]/30 rounded-full px-2.5 py-0.5 cursor-pointer"
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>

      {/* Add search */}
      {showAddSearch && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={addQuery}
              onChange={(e) => {
                setAddQuery(e.target.value);
                searchFavorites(e.target.value);
              }}
              placeholder="Add favorite by code or name..."
              className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setShowAddSearch(false);
                setAddQuery('');
                setAddResults([]);
              }}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-700"
            >
              Done
            </button>
          </div>
          {addLoading && <div className="text-xs text-zinc-400">Searching...</div>}
          {addResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg">
              {addResults.map(code => {
                const alreadyFav = favorites.some(f => f.hcpcs === code.hcpcs);
                return (
                  <button
                    key={code.hcpcs}
                    onClick={() => !alreadyFav && handleAddFavorite(code.hcpcs)}
                    disabled={alreadyFav}
                    className={`w-full text-left px-3 py-1.5 text-sm border-b border-zinc-100 last:border-b-0 ${
                      alreadyFav ? 'bg-zinc-50 text-zinc-400' : 'hover:bg-[#0070cc]/5'
                    }`}
                  >
                    <span className="font-medium">{code.hcpcs}</span>
                    <span className="text-zinc-500 ml-2">{code.description}</span>
                    {alreadyFav && <span className="ml-1 text-xs">(already added)</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading && <div>Loading favorites...</div>}
      {!loading && favorites.length === 0 && !showAddSearch && (
        <div className="text-zinc-500 text-sm">No favorites yet</div>
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
                <div key={fav.hcpcs} className="relative">
                  <SortableItem
                    fav={fav}
                    isAlreadySelected={isAlreadySelected}
                    onSelect={() => !isAlreadySelected && handleSelect(fav.hcpcs)}
                    multiSelect={multiSelect}
                  />
                  {editMode && (
                    <button
                      onClick={() => handleRemove(fav.hcpcs)}
                      className="absolute right-1.5 top-1.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all z-10"
                      aria-label={`Remove ${fav.hcpcs} from favorites`}
                      title="Remove from favorites"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
