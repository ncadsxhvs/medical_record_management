'use client';

import { useState, useEffect } from 'react';
import { Favorite } from '@/types';
import { useSession } from 'next-auth/react';
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
      className={`relative p-2 border rounded-md group transition-all duration-200 ${
        isAlreadySelected ? 'bg-gray-100 opacity-50' : 'bg-white'
      } ${isDragging ? 'opacity-40 scale-95 shadow-lg z-50' : ''}`}
    >
      {/* Drag Handle */}
      {!isAlreadySelected && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
          </svg>
        </div>
      )}

      {/* Content */}
      {multiSelect ? (
        <button
          onClick={onSelect}
          disabled={isAlreadySelected}
          className="w-full text-left pl-5"
        >
          <span className={isAlreadySelected ? 'text-gray-400' : ''}>
            {fav.hcpcs}
            {isAlreadySelected && <span className="ml-1 text-xs">(added)</span>}
          </span>
        </button>
      ) : (
        <button
          onClick={onSelect}
          className="w-full text-left pl-5"
        >
          {fav.hcpcs}
        </button>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove from favorites"
      >
        &times;
      </button>
    </div>
  );
}

export default function FavoritesPicker({ onSelect, onMultiSelect, multiSelect = false, selectedCodes = [] }: FavoritesPickerProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {loading && <div>Loading favorites...</div>}
      {!loading && favorites.length === 0 && (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
