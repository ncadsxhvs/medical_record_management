'use client';

import { Visit } from '@/types';

interface VisitCardProps {
  visit: Visit;
  accentColor?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function VisitCard({ visit, accentColor, isExpanded, onToggleExpand, onEdit, onCopy, onDelete }: VisitCardProps) {
  const totalRVU = visit.procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);

  if (visit.is_no_show) {
    return (
      <div className="flex items-center bg-orange-50 rounded-xl border border-orange-200 px-4 py-3 group">
        <div className="w-1 h-8 bg-orange-400 rounded-full mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-900">{formatTime(visit.time)}</span>
          <span className="inline-block ml-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full uppercase">No Show</span>
          {visit.notes && visit.notes !== 'No Show' && (
            <span className="text-xs text-zinc-400 ml-2">{visit.notes}</span>
          )}
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete no-show visit"
          className="sm:opacity-0 sm:group-hover:opacity-100 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  }

  const accentBg = accentColor || 'bg-zinc-300';

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 group">
      {/* Compact row */}
      <div className="flex items-center px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <div className={`w-1 h-8 ${accentBg} rounded-full mr-3 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-900">{formatTime(visit.time)}</span>
          <span className="text-xs text-zinc-400 ml-2 truncate">
            {visit.procedures.map(p => p.quantity && p.quantity > 1 ? `${p.hcpcs} x${p.quantity}` : p.hcpcs).join(', ')}
          </span>
          {visit.notes && (
            <span className="text-xs text-zinc-400 ml-1">· {visit.notes}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <div className="flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              aria-label="Edit visit"
              className="p-1.5 sm:p-2.5 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
              aria-label="Copy visit"
              className="p-1.5 sm:p-2.5 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete visit"
              className="p-1.5 sm:p-2.5 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <span className="font-mono text-lg font-bold text-zinc-900 ml-2 w-16 text-right">{totalRVU.toFixed(2)}</span>
        </div>
      </div>

      {/* Expanded procedures */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-0 border-t border-zinc-100">
          <div className="space-y-1.5 mt-2 pl-4 border-l-2 border-zinc-200">
            {visit.procedures.map((proc, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
                <div className="min-w-0">
                  <span className="font-mono font-semibold text-zinc-900">{proc.hcpcs}</span>
                  <span className="text-zinc-500 ml-1.5 truncate">{proc.description}</span>
                </div>
                <span className="font-mono text-zinc-600 flex-shrink-0 ml-2">
                  {proc.quantity && proc.quantity > 1 ? `${proc.quantity} x ` : ''}{Number(proc.work_rvu).toFixed(2)}
                  {proc.quantity && proc.quantity > 1 ? ` = ${(Number(proc.work_rvu) * proc.quantity).toFixed(2)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
