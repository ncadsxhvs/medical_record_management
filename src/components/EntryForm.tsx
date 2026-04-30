'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RVUCode, VisitFormData, Visit, FavoriteGroupItem } from '@/types';
import RVUPicker from './RVUPicker';
import FavoritesPicker from './FavoritesPicker';
import FavoriteGroupsPicker from './FavoriteGroupsPicker';
import { getCurrentTimeString, getTodayString } from '@/lib/dateUtils';
import { rvuCodesToProcedures, fetchRvuCodeByHcpcs, groupItemsToProcedures } from '@/lib/procedureUtils';
import { useToast } from './Toast';

export interface SelectedProcedure {
  hcpcs: string;
  description: string;
  status_code: string;
  work_rvu: number;
  quantity: number;
}

export interface VisitFormControls {
  procedures: SelectedProcedure[];
  onQuantityChange: (hcpcs: string, quantity: number) => void;
  onRemove: (hcpcs: string) => void;
  date: string;
  time: string;
  notes: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onAddNoShow?: () => void;
  addingNoShow?: boolean;
  canSave: boolean;
}

interface EntryFormProps {
  onEntryAdded: () => void;
  copiedVisit?: Visit | null;
  onClearCopy?: () => void;
  onAddNoShow?: () => void;
  addingNoShow?: boolean;
  externalSelected?: boolean;
  onSelectedUpdate?: (data: VisitFormControls) => void;
}

export default function EntryForm({ onEntryAdded, copiedVisit, onClearCopy, onAddNoShow, addingNoShow, externalSelected, onSelectedUpdate }: EntryFormProps) {
  const [visitData, setVisitData] = useState<VisitFormData>({
    date: getTodayString(),
    time: getCurrentTimeString(), // HH:MM format
    notes: '',
    procedures: [],
  });
  const [isTimeManuallyEdited, setIsTimeManuallyEdited] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const { toast } = useToast();

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
      toast(`All codes from "${groupName}" are already on this visit.`, 'info');
      return;
    }
    setVisitData(prev => ({
      ...prev,
      procedures: [...prev.procedures, ...newProcedures],
    }));
  };

  const handleRemoveProcedure = useCallback((hcpcs: string) => {
    setVisitData(prev => ({
      ...prev,
      procedures: prev.procedures.filter(p => p.hcpcs !== hcpcs),
    }));
  }, []);

  const handleQuantityChange = useCallback((hcpcs: string, quantity: number) => {
    setVisitData(prev => ({
      ...prev,
      procedures: prev.procedures.map(p =>
        p.hcpcs === hcpcs ? { ...p, quantity: Math.max(1, quantity) } : p
      ),
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setVisitData({
      date: getTodayString(),
      time: getCurrentTimeString(),
      notes: '',
      procedures: [],
    });
    setIsTimeManuallyEdited(false);
    if (onClearCopy) {
      onClearCopy();
    }
  }, [onClearCopy]);

  const handleSaveVisit = useCallback(async () => {
    if (visitData.procedures.length === 0) return;

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

      handleClearAll();
      if (onClearCopy) {
        onClearCopy();
      }
      onEntryAdded();
      toast('Visit saved', 'success');
    } catch (error) {
      console.error('Failed to save visit:', error);
      toast('Failed to save visit. Please try again.', 'error');
    }
  }, [visitData, isTimeManuallyEdited, handleClearAll, onClearCopy, onEntryAdded, toast]);

  const callbackRefs = useRef({ onSelectedUpdate, handleSaveVisit, handleQuantityChange, handleRemoveProcedure, onAddNoShow, addingNoShow });
  callbackRefs.current = { onSelectedUpdate, handleSaveVisit, handleQuantityChange, handleRemoveProcedure, onAddNoShow, addingNoShow };

  const prevDataKey = useRef('');
  useEffect(() => {
    if (!externalSelected || !callbackRefs.current.onSelectedUpdate) return;
    const dataKey = JSON.stringify({ d: visitData.date, t: visitData.time, n: visitData.notes, p: visitData.procedures.map(p => `${p.hcpcs}:${p.quantity}`), a: callbackRefs.current.addingNoShow });
    if (dataKey === prevDataKey.current) return;
    prevDataKey.current = dataKey;

    callbackRefs.current.onSelectedUpdate({
      procedures: visitData.procedures,
      onQuantityChange: (...args) => callbackRefs.current.handleQuantityChange(...args),
      onRemove: (...args) => callbackRefs.current.handleRemoveProcedure(...args),
      date: visitData.date,
      time: visitData.time || '',
      notes: visitData.notes || '',
      onDateChange: (date: string) => setVisitData(prev => ({ ...prev, date })),
      onTimeChange: (time: string) => { setVisitData(prev => ({ ...prev, time })); setIsTimeManuallyEdited(true); },
      onNotesChange: (notes: string) => setVisitData(prev => ({ ...prev, notes })),
      onSave: (...args) => callbackRefs.current.handleSaveVisit(...args),
      onAddNoShow: callbackRefs.current.onAddNoShow,
      addingNoShow: callbackRefs.current.addingNoShow,
      canSave: visitData.procedures.length > 0,
    });
  });

  return (
    <div className="space-y-4">
      {/* Copy Indicator Banner */}
      {copiedVisit && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-900">
              Copying {copiedVisit.procedures.length} procedure{copiedVisit.procedures.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="text-green-600 hover:text-green-800 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Favorite Groups */}
      <FavoriteGroupsPicker
        onAddGroup={handleAddGroup}
        onEditingChange={setIsEditingGroup}
        refreshKey={0}
      />

      {/* Block visit form while editing a group */}
      {isEditingGroup && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-sm text-amber-800 font-medium">
            Finish editing the group before adding visits.
          </p>
        </div>
      )}

      {!isEditingGroup && (
        <>
          {/* Search */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Search HCPCS</p>
            <RVUPicker
              multiSelect={true}
              onMultiSelect={handleAddProcedures}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Favorites */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Favorites</p>
            <FavoritesPicker
              multiSelect={true}
              onMultiSelect={handleAddFromFavorites}
              selectedCodes={selectedCodes}
            />
          </div>

          {/* Selected Procedures (hidden when rendered externally) */}
          {!externalSelected && visitData.procedures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Selected</p>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-1.5">
                {visitData.procedures.map(p => (
                  <div key={p.hcpcs} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-semibold text-sm text-zinc-900">{p.hcpcs}</span>
                      <span className="text-xs text-zinc-500 truncate">{p.description}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuantityChange(p.hcpcs, (p.quantity || 1) - 1)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-sky-100 text-sky-700 rounded-lg text-sm font-bold hover:bg-sky-200"
                        >
                          −
                        </button>
                        <span className="font-mono text-xs text-zinc-500 w-4 text-center">x{p.quantity || 1}</span>
                        <button
                          onClick={() => handleQuantityChange(p.hcpcs, (p.quantity || 1) + 1)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-sky-100 text-sky-700 rounded-lg text-sm font-bold hover:bg-sky-200"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-sm font-bold text-sky-700 w-12 text-right">{(Number(p.work_rvu) * (p.quantity || 1)).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveProcedure(p.hcpcs)}
                        className="text-sky-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-sky-200 pt-1.5 flex justify-between">
                  <span className="text-xs font-semibold text-sky-800">Total</span>
                  <span className="font-mono font-bold text-sky-900">
                    {visitData.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0).toFixed(2)} RVU
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Date / Time / Notes / Actions — hidden when rendered externally */}
          {!externalSelected && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="date" className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={visitData.date}
                    onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-xs font-medium text-zinc-500 mb-1">Time</label>
                  <input
                    type="time"
                    id="time"
                    value={visitData.time || ''}
                    onChange={(e) => {
                      setVisitData({ ...visitData, time: e.target.value });
                      setIsTimeManuallyEdited(true);
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <input
                type="text"
                id="notes"
                value={visitData.notes || ''}
                onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSaveVisit}
                  disabled={visitData.procedures.length === 0}
                  className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Visit
                </button>
                {onAddNoShow && (
                  <button
                    onClick={onAddNoShow}
                    disabled={addingNoShow}
                    className="py-2.5 px-4 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
                  >
                    {addingNoShow ? '...' : 'No Show'}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
