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
      <div className="text-gray-500 text-sm p-4 text-center border border-gray-200 rounded-md">
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
          <div key={`${proc.hcpcs}-${index}`} className="p-3 border border-gray-300 rounded-md bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{proc.hcpcs}</span>
                  {proc.status_code && (
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {proc.status_code}
                    </span>
                  )}
                  {showFavorites && (
                    <button
                      onClick={() => toggleFavorite(proc.hcpcs)}
                      className={`text-lg ${fav ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                      title={fav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {fav ? '★' : '☆'}
                    </button>
                  )}
                </div>
                <div className="text-gray-700 mt-1">{proc.description}</div>
                <div className="flex items-center gap-4 mt-2">
                  {editable && onQuantityChange ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Quantity:</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onQuantityChange(proc.hcpcs, Math.max(1, (proc.quantity || 1) - 1))}
                          className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 font-bold text-lg"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <div className="w-12 h-9 flex items-center justify-center bg-white border border-gray-300 rounded-lg font-semibold text-gray-900">
                          {proc.quantity || 1}
                        </div>
                        <button
                          onClick={() => onQuantityChange(proc.hcpcs, (proc.quantity || 1) + 1)}
                          className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 font-bold text-lg"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Quantity: <span className="font-semibold">{proc.quantity || 1}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Unit RVU: <span className="font-semibold">{Number(proc.work_rvu).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-blue-600">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU</span>
                  </div>
                </div>
              </div>
              {editable && onRemove && (
                <button
                  onClick={() => onRemove(proc.hcpcs)}
                  className="ml-3 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md border border-red-300"
                  title="Remove this procedure"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Procedures:</span>
          <span className="font-bold">{procedures.length}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="font-semibold text-gray-700">Total Work RVU:</span>
          <span className="font-bold text-blue-700 text-lg">{totalRVU.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
