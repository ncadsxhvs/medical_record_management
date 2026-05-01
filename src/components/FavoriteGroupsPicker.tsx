'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FavoriteGroup, FavoriteGroupItem, RVUCode, VisitProcedure } from '@/types';
import RVUPicker from './RVUPicker';
import ProcedureList from './ProcedureList';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './Toast';
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
  const [deletingGroup, setDeletingGroup] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

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

  const handleDelete = (id: number, name: string) => {
    setDeletingGroup({ id, name });
  };

  const confirmDeleteGroup = async () => {
    if (!deletingGroup) return;
    const { id } = deletingGroup;
    setDeletingGroup(null);
    const res = await fetch(`/api/favorite-groups/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (editingGroup?.id === id) {
        setEditingState(null, []);
      }
      fetchGroups();
      toast('Group deleted', 'success');
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
      toast('A group with that name already exists.', 'error');
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
        toast('Failed to update group.', 'error');
        return;
      }
      setEditingState(null, []);
      fetchGroups();
    } catch (err) {
      console.error('Failed to update favorite group:', err);
      toast('Failed to update group.', 'error');
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
        toast('A group with that name already exists.', 'error');
        return;
      }
      if (!res.ok) {
        toast('Failed to create group.', 'error');
        return;
      }
      setEditingState(null, []);
      fetchGroups();
    } catch (err) {
      console.error('Failed to create favorite group:', err);
      toast('Failed to create group.', 'error');
    }
  };

  const handleExitManagement = () => {
    setManagementMode(false);
    setEditingState(null, []);
  };

  if (loading) return null;

  const GROUP_DOT_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500'];

  // Always show header so users can add their first group
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Favorite Groups</p>
        <div className="flex gap-2">
          <button
            onClick={handleAddNewGroup}
            className="text-xs font-semibold text-[#0070cc] hover:text-[#1eaedb] transition-colors cursor-pointer"
          >
            + Add
          </button>
          {groups.length > 0 && (
            managementMode ? (
              <button
                onClick={handleExitManagement}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 border border-zinc-300 rounded-full px-2.5 py-0.5 cursor-pointer"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setManagementMode(true)}
                className="text-xs font-semibold text-[#0070cc] hover:text-[#1eaedb] border border-[#0070cc]/30 rounded-full px-2.5 py-0.5 cursor-pointer"
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>

      {groups.length > 0 && (
      <div className="space-y-1.5">
        {groups.map((g, idx) => {
          const totalRvu = g.items.reduce(
            (sum, it) => sum + (Number(it.work_rvu) || 0) * (it.quantity || 1),
            0
          );
          const isSelected = editingGroup?.id === g.id;
          const dotColor = GROUP_DOT_COLORS[idx % GROUP_DOT_COLORS.length];

          if (managementMode) {
            return (
              <div
                key={g.id}
                className={`relative flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-[#0070cc]/5 border-[#0070cc]/30'
                    : 'bg-white border-zinc-200 hover:bg-[#0070cc]/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                <button
                  onClick={() => handleSelectForEdit(g)}
                  className="flex-1 text-left min-w-0 pr-12"
                  title="Select to edit procedures"
                >
                  <div className="font-semibold text-sm text-zinc-900 truncate">{g.name}</div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {g.items.length} code{g.items.length !== 1 ? 's' : ''} &middot; {totalRvu.toFixed(2)} RVU
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(g.id, g.name); }}
                  className="absolute right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          }

          return (
            <div
              key={g.id}
              className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl bg-white hover:bg-[#0070cc]/5 transition-colors cursor-pointer"
              onClick={() => onAddGroup(g.items, g.name)}
              title="Add all codes in this group to the visit"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-zinc-900 truncate">{g.name}</div>
                <div className="text-xs text-zinc-400 font-mono">
                  {g.items.length} code{g.items.length !== 1 ? 's' : ''} &middot; {totalRvu.toFixed(2)} RVU
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Inline editor for selected group or new group */}
      {managementMode && (editingGroup || creatingGroupName) && (
        <div className="mt-3 p-4 border border-[#0070cc]/20 rounded-md bg-[#0070cc]/5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-[#0070cc]">
              {creatingGroupName
                ? <>New Group &quot;{creatingGroupName}&quot;</>
                : <>Editing &quot;{editingGroup!.name}&quot;</>
              }
            </h4>
            {editingGroup && (
              <button
                onClick={handleRename}
                className="px-3 py-1 text-sm bg-white text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 flex items-center gap-1"
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
              className="px-4 py-2 text-sm bg-[#0070cc] text-white rounded-full hover:bg-[#005fa3] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingGroupName ? 'Create Group' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingGroup !== null}
        title="Delete Group"
        message={`Delete group "${deletingGroup?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeletingGroup(null)}
      />
    </div>
  );
}
