'use client';

import { Visit } from '@/types';
import { formatDateWithTime } from '@/lib/dateUtils';

interface VisitCardProps {
  visit: Visit;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export default function VisitCard({ visit, isExpanded, onToggleExpand, onEdit, onCopy, onDelete }: VisitCardProps) {
  const totalRVU = visit.procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${visit.is_no_show ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} hover:shadow-md transition-shadow duration-200`}>
      <div className="p-5">
        {visit.is_no_show && (
          <div className="mb-3 inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
            🚫 No Show
          </div>
        )}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Visit Date & Time</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDateWithTime(visit.date, visit.time)}
            </p>
          </div>
          {!visit.is_no_show && (
            <div className="text-right">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total RVU</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">{totalRVU.toFixed(2)}</p>
            </div>
          )}
        </div>

        {visit.notes && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{visit.notes}</p>
          </div>
        )}

        {!visit.is_no_show && (
          <>
            <div className="mb-3">
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                <span>{isExpanded ? 'Hide' : 'Show'} Procedures ({visit.procedures.length})</span>
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-2 mb-4 pl-4 border-l-2 border-blue-200">
                {visit.procedures.map((proc, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div>
                          <span className="font-semibold text-gray-900">{proc.hcpcs}</span>
                          <span className="text-gray-600 text-sm ml-2">{proc.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">
                          Qty: {proc.quantity || 1} × {Number(proc.work_rvu).toFixed(2)} RVU = {(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU
                        </div>
                      </div>
                      <span className="font-bold text-blue-600 ml-3 text-sm">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {!visit.is_no_show && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          {!visit.is_no_show && (
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-100 active:bg-green-200 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
