'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FavoriteGroup, FavoriteGroupItem, RVUCode, VisitProcedure } from '@/types';
import RVUPicker from './RVUPicker';
import ProcedureList from './ProcedureList';
import { groupItemsToProcedures, rvuCodesToProcedures } from '@/lib/procedureUtils';

interface FavoriteGroupsPickerProps {
  onAddGroup: (items: FavoriteGroupItem[], groupName: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
  refreshKey?: number;
}

export default function FavoriteGroupsPicker({
  onAddGroup,
  onEditingChange,
  refreshKey = 0,
}: FavoriteGroupsPickerProps) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<FavoriteGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [managementMode, setManagementMode] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FavoriteGroup | null>(null);
  const [editProcedures, setEditProcedures] = useState<VisitProcedure[]>([]);
  const [creatingGroupName, setCreatingGroupName] = useState<string | null>(null);

  const setEditingState = (group: FavoriteGroup | null, procs: VisitProcedure[], creating: string | null = null) => {
    setEditingGroup(group);
    setEditProcedures(procs);
    setCreatingGroupName(creating);
    onEditingChange?.(group !== null || creating !== null);
  };

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
    if (res.ok) {
      if (editingGroup?.id === id) {
        setEditingState(null, []);
      }
      fetchGroups();
    }
  };

  const handleRename = async () => {
    if (!editingGroup) return;
    const newName = window.prompt('Rename group:', editingGroup.name);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === editingGroup.name) return;
    const res = await fetch(`/api/favorite-groups/${editingGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.status === 409) {
      alert('A group with that name already exists.');
      return;
    }
    if (res.ok) {
      setEditingGroup(prev => prev ? { ...prev, name: trimmed } : null);
      fetchGroups();
    }
  };

  const handleSelectForEdit = async (group: FavoriteGroup) => {
    const procs = await groupItemsToProcedures(group.items, []);
    setEditingState(group, procs);
  };

  const handleAddEditProcedure = (rvuCodes: RVUCode[]) => {
    const existingHcpcs = editProcedures.map(p => p.hcpcs);
    const newProcs = rvuCodesToProcedures(rvuCodes, existingHcpcs);
    if (newProcs.length > 0) {
      setEditProcedures(prev => [...prev, ...newProcs]);
    }
  };

  const handleRemoveEditProcedure = (hcpcs: string) => {
    setEditProcedures(prev => prev.filter(p => p.hcpcs !== hcpcs));
  };

  const handleEditQuantityChange = (hcpcs: string, quantity: number) => {
    setEditProcedures(prev =>
      prev.map(p => p.hcpcs === hcpcs ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || editProcedures.length === 0) return;
    const items = editProcedures.map(p => ({ hcpcs: p.hcpcs, quantity: p.quantity }));
    try {
      const res = await fetch(`/api/favorite-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        alert('Failed to update group.');
        return;
      }
      setEditingState(null, []);
      fetchGroups();
    } catch (err) {
      console.error('Failed to update favorite group:', err);
      alert('Failed to update group.');
    }
  };

  const handleCancelEdit = () => {
    setEditingState(null, []);
  };

  const handleAddNewGroup = () => {
    const name = window.prompt('Name for new group:');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setManagementMode(true);
    setEditingState(null, [], trimmed);
  };

  const handleSaveNewGroup = async () => {
    if (!creatingGroupName || editProcedures.length === 0) return;
    const items = editProcedures.map(p => ({ hcpcs: p.hcpcs, quantity: p.quantity }));
    try {
      const res = await fetch('/api/favorite-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: creatingGroupName, items }),
      });
      if (res.status === 409) {
        alert('A group with that name already exists.');
        return;
      }
      if (!res.ok) {
        alert('Failed to create group.');
        return;
      }
      setEditingState(null, []);
      fetchGroups();
    } catch (err) {
      console.error('Failed to create favorite group:', err);
      alert('Failed to create group.');
    }
  };

  const handleExitManagement = () => {
    setManagementMode(false);
    setEditingState(null, []);
  };

  if (loading) return null;

  // Always show header so users can add their first group
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Favorite Groups</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddNewGroup}
            className="px-3 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Group
          </button>
          {groups.length > 0 && (
            managementMode ? (
              <button
                onClick={handleExitManagement}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setManagementMode(true)}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>

      {groups.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {groups.map((g) => {
          const totalRvu = g.items.reduce(
            (sum, it) => sum + (Number(it.work_rvu) || 0) * (it.quantity || 1),
            0
          );
          const isSelected = editingGroup?.id === g.id;

          if (managementMode) {
            return (
              <div
                key={g.id}
                className={`relative p-2 border rounded-md transition-colors ${
                  isSelected
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-white hover:bg-blue-50'
                }`}
              >
                <button
                  onClick={() => handleSelectForEdit(g)}
                  className="w-full text-left pr-16"
                  title="Select to edit procedures"
                >
                  <div className="font-medium text-gray-900 truncate">{g.name}</div>
                  <div className="text-xs text-gray-500">
                    {g.items.length} code{g.items.length !== 1 ? 's' : ''} · {totalRvu.toFixed(2)} RVU
                  </div>
                  {isSelected && (
                    <div className="text-xs text-blue-600 font-medium mt-0.5">▼ SELECTED</div>
                  )}
                </button>
                {/* Delete button - red pill style */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(g.id, g.name); }}
                  className="absolute top-1/2 -translate-y-1/2 right-1 flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-150"
                  title="Delete group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            );
          }

          // Normal mode: click to add to visit
          return (
            <div
              key={g.id}
              className="relative p-2 border rounded-md bg-white hover:bg-blue-50 transition-colors"
            >
              <button
                onClick={() => onAddGroup(g.items, g.name)}
                className="w-full text-left"
                title="Add all codes in this group to the visit"
              >
                <div className="font-medium text-gray-900 truncate">{g.name}</div>
                <div className="text-xs text-gray-500">
                  {g.items.length} code{g.items.length !== 1 ? 's' : ''} · {totalRvu.toFixed(2)} RVU
                </div>
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Inline editor for selected group or new group */}
      {managementMode && (editingGroup || creatingGroupName) && (
        <div className="mt-3 p-4 border border-blue-300 rounded-md bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-blue-900">
              {creatingGroupName
                ? <>New Group &quot;{creatingGroupName}&quot;</>
                : <>Editing &quot;{editingGroup!.name}&quot;</>
              }
            </h4>
            {editingGroup && (
              <button
                onClick={handleRename}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                title="Rename group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>
            )}
          </div>

          <div className="mb-3">
            <RVUPicker
              multiSelect={true}
              onMultiSelect={handleAddEditProcedure}
              selectedCodes={editProcedures.map(p => p.hcpcs)}
            />
          </div>

          <ProcedureList
            procedures={editProcedures}
            onRemove={handleRemoveEditProcedure}
            onQuantityChange={handleEditQuantityChange}
            editable={true}
            showFavorites={false}
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={creatingGroupName ? handleSaveNewGroup : handleSaveEdit}
              disabled={editProcedures.length === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingGroupName ? 'Create Group' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
