'use client';

import { useState, useEffect } from 'react';
import { RVUCode, VisitFormData, Visit, FavoriteGroupItem } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';
import FavoriteGroupsPicker from './FavoriteGroupsPicker';
import ProcedureList from './ProcedureList';
import { getCurrentTimeString, getTodayString } from '@/lib/dateUtils';
import { rvuCodesToProcedures, fetchRvuCodeByHcpcs, groupItemsToProcedures } from '@/lib/procedureUtils';

interface EntryFormProps {
  onEntryAdded: () => void;
  copiedVisit?: Visit | null;
  onClearCopy?: () => void;
}

export default function EntryForm({ onEntryAdded, copiedVisit, onClearCopy }: EntryFormProps) {
  const [visitData, setVisitData] = useState<VisitFormData>({
    date: getTodayString(),
    time: getCurrentTimeString(), // HH:MM format
    notes: '',
    procedures: [],
  });
  const [isTimeManuallyEdited, setIsTimeManuallyEdited] = useState(false);
  const [groupsRefreshKey, setGroupsRefreshKey] = useState(0);

  const selectedCodes = visitData.procedures.map(p => p.hcpcs);

  // Populate form when a visit is copied
  useEffect(() => {
    if (copiedVisit) {
      setVisitData({
        date: getTodayString(),
        time: getCurrentTimeString(),
        notes: copiedVisit.notes ? `Copy of: ${copiedVisit.notes}` : 'Copy of visit',
        procedures: copiedVisit.procedures.map(proc => ({
          hcpcs: proc.hcpcs,
          description: proc.description,
          status_code: proc.status_code,
          work_rvu: proc.work_rvu,
          quantity: proc.quantity || 1,
        })),
      });
      setIsTimeManuallyEdited(false); // Reset flag when copying visit
    }
  }, [copiedVisit]);

  const handleAddProcedures = (rvuCodes: RVUCode[]) => {
    const newProcedures = rvuCodesToProcedures(rvuCodes, selectedCodes);
    if (newProcedures.length > 0) {
      setVisitData(prev => ({
        ...prev,
        procedures: [...prev.procedures, ...newProcedures],
      }));
    }
  };

  const handleAddFromFavorites = async (hcpcsList: string[]) => {
    const rvuCode = await fetchRvuCodeByHcpcs(hcpcsList[0]);
    if (rvuCode) {
      handleAddProcedures([rvuCode]);
    }
  };

  const handleAddGroup = async (items: FavoriteGroupItem[], groupName: string) => {
    const newProcedures = await groupItemsToProcedures(items, selectedCodes);
    if (newProcedures.length === 0) {
      alert(`All codes from "${groupName}" are already on this visit.`);
      return;
    }
    setVisitData(prev => ({
      ...prev,
      procedures: [...prev.procedures, ...newProcedures],
    }));
  };

  const handleSaveAsGroup = async () => {
    if (visitData.procedures.length === 0) return;
    const name = window.prompt('Name this favorite group:');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const items = visitData.procedures.map(p => ({ hcpcs: p.hcpcs, quantity: p.quantity }));
    try {
      const res = await fetch('/api/favorite-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, items }),
      });
      if (res.status === 409) {
        alert('A group with that name already exists.');
        return;
      }
      if (!res.ok) {
        alert('Failed to save group.');
        return;
      }
      setGroupsRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to save favorite group:', err);
      alert('Failed to save group.');
    }
  };

  const handleRemoveProcedure = (hcpcs: string) => {
    setVisitData(prev => ({
      ...prev,
      procedures: prev.procedures.filter(p => p.hcpcs !== hcpcs),
    }));
  };

  const handleQuantityChange = (hcpcs: string, quantity: number) => {
    setVisitData(prev => ({
      ...prev,
      procedures: prev.procedures.map(p =>
        p.hcpcs === hcpcs ? { ...p, quantity: Math.max(1, quantity) } : p
      ),
    }));
  };

  const handleClearAll = () => {
    setVisitData({
      date: getTodayString(),
      time: getCurrentTimeString(),
      notes: '',
      procedures: [],
    });
    setIsTimeManuallyEdited(false); // Reset flag when clearing
    if (onClearCopy) {
      onClearCopy();
    }
  };

  const handleSaveVisit = async () => {
    if (visitData.procedures.length === 0) {
      alert('Please add at least one procedure to the visit');
      return;
    }

    // Update time to current time if not manually edited
    const dataToSave = {
      ...visitData,
      time: isTimeManuallyEdited ? visitData.time : getCurrentTimeString()
    };

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to create visit');
      }

      // Success - reset form and refresh parent
      handleClearAll();
      if (onClearCopy) {
        onClearCopy();
      }
      onEntryAdded();
    } catch (error) {
      console.error('Failed to save visit:', error);
      alert('Failed to save visit. Please try again.');
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md space-y-4">
      {/* Copy Indicator Banner */}
      {copiedVisit && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-900">
                Copying visit with {copiedVisit.procedures.length} procedure{copiedVisit.procedures.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Review and edit the procedures below, then save to create a new visit
              </p>
            </div>
          </div>
          <button
            onClick={handleClearAll}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Favorite Groups */}
      <FavoriteGroupsPicker onAddGroup={handleAddGroup} refreshKey={groupsRefreshKey} />

      {/* Search and Favorites Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Search HCPCS Codes</h3>
          <RVUPicker
            multiSelect={true}
            onMultiSelect={handleAddProcedures}
            selectedCodes={selectedCodes}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Quick Add from Favorites</h3>
          <FavoritesPicker
            multiSelect={true}
            onMultiSelect={handleAddFromFavorites}
            selectedCodes={selectedCodes}
          />
        </div>
      </div>

      {/* Selected Procedures Section */}
      {visitData.procedures.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Selected Procedures ({visitData.procedures.length})
            </h3>
            <button
              type="button"
              onClick={handleSaveAsGroup}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              Save as group
            </button>
          </div>
          <ProcedureList
            procedures={visitData.procedures}
            onRemove={handleRemoveProcedure}
            onQuantityChange={handleQuantityChange}
            editable={true}
          />
        </div>
      )}

      {/* Visit Details Section */}
      {visitData.procedures.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Visit Date *
              </label>
              <input
                type="date"
                id="date"
                value={visitData.date}
                onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Visit Time (Optional)
              </label>
              <input
                type="time"
                id="time"
                value={visitData.time || ''}
                onChange={(e) => {
                  setVisitData({ ...visitData, time: e.target.value });
                  setIsTimeManuallyEdited(true); // Mark as manually edited
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Visit Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={visitData.notes || ''}
              onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
              placeholder="Add any notes about this visit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveVisit}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              Save Visit
            </button>
            <button
              onClick={handleClearAll}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
