'use client';

import { useState } from 'react';
import { Visit, RVUCode } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';
import ProcedureList from './ProcedureList';
import { rvuCodesToProcedures, fetchRvuCodeByHcpcs } from '@/lib/procedureUtils';

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
    const newProcedures = rvuCodesToProcedures(rvuCodes, selectedCodes);
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
          time: editedVisit.time,
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
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Visit</h2>
              <p className="text-sm text-gray-500 mt-0.5">Modify procedures, quantities, and visit details</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all duration-150"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">

        <div className="p-6 space-y-5">
          {/* Search for Additional Procedures */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Add More Procedures</h3>
            </div>
            <RVUPicker
              multiSelect
              onMultiSelect={handleAddProcedures}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Quick Add from Favorites */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Quick Add from Favorites</h3>
            </div>
            <FavoritesPicker
              multiSelect
              onMultiSelect={async (hcpcsCodes) => {
                const rvuCode = await fetchRvuCodeByHcpcs(hcpcsCodes[0]);
                if (rvuCode) {
                  handleAddProcedures([rvuCode]);
                }
              }}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Selected Procedures */}
          {editedVisit.procedures.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
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
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Visit Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editedVisit.date}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (Optional)
                </label>
                <input
                  type="time"
                  value={editedVisit.time || ''}
                  onChange={(e) => setEditedVisit(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={editedVisit.notes || ''}
                onChange={(e) => setEditedVisit(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add visit notes..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 font-semibold text-sm rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editedVisit.procedures.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
