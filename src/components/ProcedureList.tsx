'use client';

import { VisitProcedure } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';

interface ProcedureListProps {
  procedures: VisitProcedure[];
  onRemove?: (hcpcs: string) => void;
  onQuantityChange?: (hcpcs: string, quantity: number) => void;
  editable?: boolean;
  showFavorites?: boolean;
}

export default function ProcedureList({ procedures, onRemove, onQuantityChange, editable = true, showFavorites = true }: ProcedureListProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  if (procedures.length === 0) {
    return (
      <div className="text-zinc-500 text-sm p-4 text-center border border-zinc-200 rounded-lg">
        No procedures added yet. Search for HCPCS codes above to add procedures.
      </div>
    );
  }

  const totalRVU = procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);

  return (
    <div className="space-y-3">
      {procedures.map((proc, index) => {
        const fav = isFavorite(proc.hcpcs);
        return (
          <div key={`${proc.hcpcs}-${index}`} className="p-3 border border-zinc-300 rounded-lg bg-white overflow-hidden">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-lg">{proc.hcpcs}</span>
                {proc.status_code && (
                  <span className="text-xs px-2 py-1 bg-zinc-200 rounded flex-shrink-0">
                    {proc.status_code}
                  </span>
                )}
                {showFavorites && (
                  <button
                    onClick={() => toggleFavorite(proc.hcpcs)}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-lg flex-shrink-0 ${fav ? 'text-yellow-500' : 'text-zinc-300'} hover:text-yellow-400 transition-colors`}
                    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {fav ? '★' : '☆'}
                  </button>
                )}
              </div>
              {editable && onRemove && (
                <button
                  onClick={() => onRemove(proc.hcpcs)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg border border-red-300 cursor-pointer flex-shrink-0"
                  aria-label="Remove procedure"
                >
                  ×
                </button>
              )}
            </div>
            <div className="text-zinc-700 text-sm mt-1 break-words">{proc.description}</div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {editable && onQuantityChange ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-600">Qty:</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const qty = proc.quantity || 1;
                        if (qty <= 1 && onRemove) {
                          onRemove(proc.hcpcs);
                        } else {
                          onQuantityChange(proc.hcpcs, qty - 1);
                        }
                      }}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-150 font-bold text-base cursor-pointer"
                      aria-label={proc.quantity && proc.quantity > 1 ? "Decrease quantity" : "Remove procedure"}
                    >
                      −
                    </button>
                    <div className="w-10 h-8 flex items-center justify-center bg-white border border-zinc-300 rounded-lg font-semibold text-sm text-[#1f1f1f]">
                      {proc.quantity || 1}
                    </div>
                    <button
                      onClick={() => onQuantityChange(proc.hcpcs, (proc.quantity || 1) + 1)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 active:bg-zinc-300 transition-all duration-150 font-bold text-base cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-600">
                  Qty: <span className="font-semibold">{proc.quantity || 1}</span>
                </div>
              )}
              <div className="text-sm text-zinc-600">
                {Number(proc.work_rvu).toFixed(2)} RVU
              </div>
              <div className="text-sm text-zinc-600">
                Total: <span className="font-semibold text-[#0070cc]">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="p-3 bg-[#0070cc]/5 border border-[#0070cc]/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-700">Total Procedures:</span>
          <span className="font-bold">{procedures.length}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="font-semibold text-zinc-700">Total Work RVU:</span>
          <span className="font-bold text-[#0070cc] text-lg">{totalRVU.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
