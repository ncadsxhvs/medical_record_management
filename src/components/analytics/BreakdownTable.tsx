'use client';

import React from 'react';
import { AnalyticsBreakdownData } from '@/types';

interface BreakdownTableProps {
  data: AnalyticsBreakdownData[];
  selectedPeriod: string | null;
  formatPeriod: (dateStr: string) => string;
  onClearPeriod: () => void;
}

export default function BreakdownTable({ data, selectedPeriod, formatPeriod, onClearPeriod }: BreakdownTableProps) {
  const filteredData = selectedPeriod
    ? data.filter(d => d.period_start === selectedPeriod)
    : data;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            HCPCS Breakdown {selectedPeriod && `- ${formatPeriod(selectedPeriod)}`}
          </h2>
          {selectedPeriod && (
            <button
              onClick={onClearPeriod}
              className="text-sm text-blue-600 hover:underline"
            >
              Show All Periods
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredData.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No data available
          </div>
        ) : (
          (() => {
            const groupedData = filteredData.reduce((acc, item) => {
              const period = item.period_start;
              if (!acc[period]) {
                acc[period] = [];
              }
              acc[period].push(item);
              return acc;
            }, {} as Record<string, typeof filteredData>);

            return (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">HCPCS</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total RVU</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg RVU</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {Object.entries(groupedData)
                    .sort(([periodA], [periodB]) => periodB.localeCompare(periodA))
                    .map(([period, items]) => (
                    <React.Fragment key={period}>
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-bold text-blue-900">{formatPeriod(period)}</span>
                            <span className="text-xs text-blue-600 ml-2">
                              ({items.length} procedure{items.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </td>
                      </tr>
                      {items.map((item, idx) => (
                        <tr key={`${period}-${idx}`} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {item.hcpcs}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={item.description}>
                            {item.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-medium">
                            {item.total_quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900 text-right">
                            {item.total_work_rvu.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {(item.total_work_rvu / item.total_quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            );
          })()
        )}
      </div>
    </div>
  );
}
