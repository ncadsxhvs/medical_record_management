'use client';

import { AnalyticsData } from '@/types';

interface SummaryStatsProps {
  data: AnalyticsData[];
}

export default function SummaryStats({ data }: SummaryStatsProps) {
  const totalRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
  const totalEncounters = data.reduce((sum, d) => sum + d.total_encounters, 0);
  const totalNoShows = data.reduce((sum, d) => sum + d.total_no_shows, 0);
  const avgRvu = totalEncounters > 0 ? (totalRvus / totalEncounters).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md border border-blue-200">
        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Total RVUs</h3>
        <p className="text-4xl font-bold text-blue-900">{totalRvus.toFixed(2)}</p>
        <p className="text-xs text-blue-600 mt-2">Across all periods</p>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg shadow-md border border-emerald-200">
        <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Total Encounters</h3>
        <p className="text-4xl font-bold text-emerald-900">{totalEncounters}</p>
        <p className="text-xs text-emerald-600 mt-2">Procedure records</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-md border border-orange-200">
        <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Total No Shows</h3>
        <p className="text-4xl font-bold text-orange-900">{totalNoShows}</p>
        <p className="text-xs text-orange-600 mt-2">Missed appointments</p>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md border border-purple-200">
        <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Avg RVU per Encounter</h3>
        <p className="text-4xl font-bold text-purple-900">{avgRvu}</p>
        <p className="text-xs text-purple-600 mt-2">Efficiency metric</p>
      </div>
    </div>
  );
}
