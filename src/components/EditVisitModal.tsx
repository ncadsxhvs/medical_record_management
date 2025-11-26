'use client';

import { useState } from 'react';
import { Visit, VisitProcedure, RVUCode } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';
import ProcedureList from './ProcedureList';

interface EditVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSave: () => void;
}

export default function EditVisitModal({ visit, onClose, onSave }: EditVisitModalProps) {
  const [editedVisit, setEditedVisit] = useState<Visit>({
    ...visit,
    procedures: [...visit.procedures],
  });

  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    visit.procedures.map(p => p.hcpcs)
  );

  const handleAddProcedures = (rvuCodes: RVUCode[]) => {
    const newProcedures: VisitProcedure[] = rvuCodes
      .filter(code => !selectedCodes.includes(code.hcpcs))
      .map(code => ({
        hcpcs: code.hcpcs,
        description: code.description,
        status_code: code.status_code,
        work_rvu: code.work_rvu,
        quantity: 1,
      }));

    if (newProcedures.length > 0) {
      setEditedVisit(prev => ({
        ...prev,
        procedures: [...prev.procedures, ...newProcedures],
      }));
      setSelectedCodes(prev => [...prev, ...newProcedures.map(p => p.hcpcs)]);
    }
  };

  const handleRemoveProcedure = (hcpcs: string) => {
    setEditedVisit(prev => ({
      ...prev,
      procedures: prev.procedures.filter(p => p.hcpcs !== hcpcs),
    }));
    setSelectedCodes(prev => prev.filter(code => code !== hcpcs));
  };

  const handleQuantityChange = (hcpcs: string, quantity: number) => {
    setEditedVisit(prev => ({
      ...prev,
      procedures: prev.procedures.map(p =>
        p.hcpcs === hcpcs ? { ...p, quantity: Math.max(1, quantity) } : p
      ),
    }));
  };

  const handleSave = async () => {
    if (editedVisit.procedures.length === 0) {
      alert('Please add at least one procedure');
      return;
    }

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editedVisit.date,
          notes: editedVisit.notes,
          procedures: editedVisit.procedures,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visit');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating visit:', error);
      alert('Failed to update visit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Visit</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search for Additional Procedures */}
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Add More Procedures</h3>
            <RVUPicker
              multiSelect
              onMultiSelect={handleAddProcedures}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Quick Add from Favorites */}
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Add from Favorites</h3>
            <FavoritesPicker
              multiSelect
              onMultiSelect={(hcpcsCodes) => {
                fetch(`/api/rvu/search?q=${hcpcsCodes.join(',')}`)
                  .then(res => res.json())
                  .then(data => handleAddProcedures(data));
              }}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Selected Procedures */}
          {editedVisit.procedures.length > 0 && (
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Selected Procedures ({editedVisit.procedures.length})
              </h3>
              <ProcedureList
                procedures={editedVisit.procedures}
                onRemove={handleRemoveProcedure}
                onQuantityChange={handleQuantityChange}
                editable
              />
            </div>
          )}

          {/* Visit Details */}
          <div className="border border-gray-200 rounded-md p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Visit Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={editedVisit.date}
                onChange={(e) => setEditedVisit(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={editedVisit.notes || ''}
                onChange={(e) => setEditedVisit(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add visit notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editedVisit.procedures.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
