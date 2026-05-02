'use client';

import { VisitFormControls } from './EntryForm';
import DateInput from './DateInput';

interface Props {
  data: VisitFormControls | null;
}

export default function SelectedProceduresCard({ data }: Props) {
  if (!data) return null;

  const { procedures, onQuantityChange, onRemove, date, time, notes, onDateChange, onTimeChange, onNotesChange, onSave, onClear, onAddNoShow, addingNoShow, canSave } = data;

  const totalRvu = procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0);

  return (
    <div className="space-y-5">
      {/* Selected Codes Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Selected Codes</p>
          <div className="text-right">
            <span className="text-3xl font-bold text-[#1f1f1f] font-mono tracking-tight">{totalRvu.toFixed(2)}</span>
            <span className="text-sm text-zinc-400 ml-1.5">RVU</span>
          </div>
        </div>

        {procedures.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-400">
            Select codes from favorites or search to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {procedures.map(p => {
              const qty = p.quantity || 1;
              const lineRvu = Number(p.work_rvu) * qty;
              return (
                <div key={p.hcpcs} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-sm text-[#1f1f1f]">{p.hcpcs}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => qty <= 1 ? onRemove(p.hcpcs) : onQuantityChange(p.hcpcs, qty - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
                        aria-label={qty <= 1 ? `Remove ${p.hcpcs}` : `Decrease ${p.hcpcs} quantity`}
                      >
                        &minus;
                      </button>
                      <span className="font-mono text-xs text-zinc-500 w-6 text-center">{qty}</span>
                      <button
                        onClick={() => onQuantityChange(p.hcpcs, qty + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
                        aria-label={`Increase ${p.hcpcs} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono text-sm text-zinc-600 w-14 text-right">{lineRvu.toFixed(2)}</span>
                    <button
                      onClick={() => onRemove(p.hcpcs)}
                      className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 cursor-pointer"
                      aria-label={`Remove ${p.hcpcs}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ext-date" className="block text-sm font-medium text-zinc-600 mb-1.5">Date</label>
          <DateInput
            id="ext-date"
            value={date}
            onChange={onDateChange}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070cc]/20 focus:border-[#0070cc] transition-all"
          />
        </div>
        <div>
          <label htmlFor="ext-time" className="block text-sm font-medium text-zinc-600 mb-1.5">Time</label>
          <input
            type="time"
            id="ext-time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070cc]/20 focus:border-[#0070cc] transition-all"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="ext-notes" className="block text-sm font-medium text-zinc-600 mb-1.5">Notes (optional)</label>
        <input
          type="text"
          id="ext-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder=""
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070cc]/20 focus:border-[#0070cc] transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onAddNoShow && (
          <button
            onClick={onAddNoShow}
            disabled={addingNoShow}
            className="py-3 px-5 text-[#d53b00] text-sm font-semibold rounded-full border border-[#d53b00] cursor-pointer hover:bg-red-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            {addingNoShow ? '...' : 'No Show'}
          </button>
        )}
        <button
          onClick={onClear}
          className="py-3 px-5 text-zinc-500 text-sm font-semibold rounded-full border border-zinc-200 cursor-pointer hover:bg-zinc-50 active:scale-[0.98] transition-all duration-150"
        >
          Clear
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-[#0070cc] text-white text-sm font-semibold rounded-full ps-btn cursor-pointer active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Visit
        </button>
      </div>
    </div>
  );
}
