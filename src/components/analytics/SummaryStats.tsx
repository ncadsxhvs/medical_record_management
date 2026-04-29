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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm shadow-blue-900/5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total RVUs</h3>
        <p className="text-3xl font-bold font-mono text-zinc-900">{totalRvus.toFixed(2)}</p>
        <p className="text-xs text-zinc-400 mt-2">Across all periods</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm shadow-emerald-900/5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total Encounters</h3>
        <p className="text-3xl font-bold font-mono text-zinc-900">{totalEncounters}</p>
        <p className="text-xs text-zinc-400 mt-2">Procedure records</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm shadow-orange-900/5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total No Shows</h3>
        <p className="text-3xl font-bold font-mono text-zinc-900">{totalNoShows}</p>
        <p className="text-xs text-zinc-400 mt-2">Missed appointments</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm shadow-violet-900/5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Avg RVU per Encounter</h3>
        <p className="text-3xl font-bold font-mono text-zinc-900">{avgRvu}</p>
        <p className="text-xs text-zinc-400 mt-2">Efficiency metric</p>
      </div>
    </div>
  );
}
