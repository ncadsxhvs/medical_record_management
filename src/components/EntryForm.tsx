'use client';

import { useState } from 'react';
import { RVUCode, VisitFormData, VisitProcedure } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';
import ProcedureList from './ProcedureList';

interface EntryFormProps {
  onEntryAdded: () => void;
}

export default function EntryForm({ onEntryAdded }: EntryFormProps) {
  const [visitData, setVisitData] = useState<VisitFormData>({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    procedures: [],
  });

  const selectedCodes = visitData.procedures.map(p => p.hcpcs);

  const handleAddProcedures = (rvuCodes: RVUCode[]) => {
    // Filter out codes that are already added
    const newProcedures: VisitProcedure[] = rvuCodes
      .filter(code => !selectedCodes.includes(code.hcpcs))
      .map(code => ({
        hcpcs: code.hcpcs,
        description: code.description,
        status_code: code.status_code,
        work_rvu: code.work_rvu,
      }));

    if (newProcedures.length > 0) {
      setVisitData(prev => ({
        ...prev,
        procedures: [...prev.procedures, ...newProcedures],
      }));
    }
  };

  const handleAddFromFavorites = async (hcpcsList: string[]) => {
    // Fetch full RVU code details for each HCPCS
    const fetchPromises = hcpcsList.map(async (hcpcs) => {
      try {
        const res = await fetch(`/api/rvu/search?q=${hcpcs}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.find(code => code.hcpcs === hcpcs) || data[0];
        }
      } catch (error) {
        console.error(`Failed to fetch RVU code details for ${hcpcs}:`, error);
      }
      return null;
    });

    const rvuCodes = (await Promise.all(fetchPromises)).filter(Boolean) as RVUCode[];
    handleAddProcedures(rvuCodes);
  };

  const handleRemoveProcedure = (hcpcs: string) => {
    setVisitData(prev => ({
      ...prev,
      procedures: prev.procedures.filter(p => p.hcpcs !== hcpcs),
    }));
  };

  const handleClearAll = () => {
    setVisitData({
      date: new Date().toISOString().split('T')[0],
      notes: '',
      procedures: [],
    });
  };

  const handleSaveVisit = async () => {
    if (visitData.procedures.length === 0) {
      alert('Please add at least one procedure to the visit');
      return;
    }

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) {
        throw new Error('Failed to create visit');
      }

      // Success - reset form and refresh parent
      handleClearAll();
      onEntryAdded();
    } catch (error) {
      console.error('Failed to save visit:', error);
      alert('Failed to save visit. Please try again.');
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md space-y-4">
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
          <h3 className="text-lg font-semibold mb-2">
            Selected Procedures ({visitData.procedures.length})
          </h3>
          <ProcedureList
            procedures={visitData.procedures}
            onRemove={handleRemoveProcedure}
            editable={true}
          />
        </div>
      )}

      {/* Visit Details Section */}
      {visitData.procedures.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-300">
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
