'use client';

import { VisitFormControls } from './EntryForm';

interface Props {
  data: VisitFormControls | null;
}

export default function SelectedProceduresCard({ data }: Props) {
  if (!data) return null;

  const { procedures, onQuantityChange, onRemove, date, time, notes, onDateChange, onTimeChange, onNotesChange, onSave, onAddNoShow, addingNoShow, canSave } = data;

  return (
    <div className="space-y-3">
      {/* Selected Procedures */}
      {procedures.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Selected</p>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 space-y-1.5">
            {procedures.map(p => (
              <div key={p.hcpcs} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-semibold text-sm text-zinc-900">{p.hcpcs}</span>
                  <span className="text-xs text-zinc-500 truncate">{p.description}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuantityChange(p.hcpcs, (p.quantity || 1) - 1)}
                      className="w-5 h-5 flex items-center justify-center bg-sky-100 text-sky-700 rounded text-xs font-bold hover:bg-sky-200"
                    >
                      −
                    </button>
                    <span className="font-mono text-xs text-zinc-500 w-4 text-center">x{p.quantity || 1}</span>
                    <button
                      onClick={() => onQuantityChange(p.hcpcs, (p.quantity || 1) + 1)}
                      className="w-5 h-5 flex items-center justify-center bg-sky-100 text-sky-700 rounded text-xs font-bold hover:bg-sky-200"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-mono text-sm font-bold text-sky-700 w-12 text-right">{(Number(p.work_rvu) * (p.quantity || 1)).toFixed(2)}</span>
                  <button
                    onClick={() => onRemove(p.hcpcs)}
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
                {procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0).toFixed(2)} RVU
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ext-date" className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
          <input
            type="date"
            id="ext-date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
          />
        </div>
        <div>
          <label htmlFor="ext-time" className="block text-xs font-medium text-zinc-500 mb-1">Time</label>
          <input
            type="time"
            id="ext-time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      {/* Notes */}
      <input
        type="text"
        id="ext-notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!canSave}
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
    </div>
  );
}
