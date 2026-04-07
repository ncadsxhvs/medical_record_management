'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FavoriteGroup, FavoriteGroupItem } from '@/types';

interface FavoriteGroupsPickerProps {
  onAddGroup: (items: FavoriteGroupItem[], groupName: string) => void;
  refreshKey?: number;
}

export default function FavoriteGroupsPicker({ onAddGroup, refreshKey = 0 }: FavoriteGroupsPickerProps) {
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
          return (
            <div
              key={g.id}
              className="relative p-2 border rounded-md bg-white group hover:bg-blue-50 transition-colors"
            >
              <button
                onClick={() => onAddGroup(g.items, g.name)}
                className="w-full text-left pr-6"
                title="Add all codes in this group to the visit"
              >
                <div className="font-medium text-gray-900 truncate">{g.name}</div>
                <div className="text-xs text-gray-500">
                  {g.items.length} code{g.items.length !== 1 ? 's' : ''} · {totalRvu.toFixed(2)} RVU
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(g.id, g.name);
                }}
                className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete group"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
