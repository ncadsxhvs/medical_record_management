'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FavoriteGroup, FavoriteGroupItem } from '@/types';

interface FavoriteGroupsPickerProps {
  onAddGroup: (items: FavoriteGroupItem[], groupName: string) => void;
  onEditGroup?: (group: FavoriteGroup) => void;
  editingGroupId?: number | null;
  refreshKey?: number;
}

export default function FavoriteGroupsPicker({
  onAddGroup,
  onEditGroup,
  editingGroupId,
  refreshKey = 0,
}: FavoriteGroupsPickerProps) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<FavoriteGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/favorite-groups')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch favorite groups:', err);
        setGroups([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, refreshKey]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete group "${name}"?`)) return;
    const res = await fetch(`/api/favorite-groups/${id}`, { method: 'DELETE' });
    if (res.ok) fetchGroups();
  };

  const handleRename = async (group: FavoriteGroup) => {
    const newName = window.prompt('Rename group:', group.name);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === group.name) return;
    const res = await fetch(`/api/favorite-groups/${group.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.status === 409) {
      alert('A group with that name already exists.');
      return;
    }
    if (res.ok) fetchGroups();
  };

  if (loading) return null;
  if (groups.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Favorite Groups</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {groups.map((g) => {
          const totalRvu = g.items.reduce(
            (sum, it) => sum + (Number(it.work_rvu) || 0) * (it.quantity || 1),
            0
          );
          const isEditing = editingGroupId === g.id;
          return (
            <div
              key={g.id}
              className={`relative p-2 border rounded-md group transition-colors ${
                isEditing
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-white hover:bg-blue-50'
              }`}
            >
              <button
                onClick={() => onAddGroup(g.items, g.name)}
                className="w-full text-left pr-14"
                title="Add all codes in this group to the visit"
              >
                <div className="font-medium text-gray-900 truncate">{g.name}</div>
                <div className="text-xs text-gray-500">
                  {g.items.length} code{g.items.length !== 1 ? 's' : ''} · {totalRvu.toFixed(2)} RVU
                </div>
              </button>
              {/* Action buttons */}
              <div className="absolute top-1 right-1 flex gap-1">
                {/* Edit: load into form */}
                {onEditGroup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditGroup(g);
                    }}
                    className="text-blue-500 hover:text-blue-700 p-0.5"
                    title="Edit group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {/* Rename */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(g);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                  title="Rename group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M2 12h20M7 17h.01" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(g.id, g.name);
                  }}
                  className="text-red-500 hover:text-red-700 p-0.5"
                  title="Delete group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
