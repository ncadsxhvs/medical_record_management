'use client';

import { Visit } from '@/types';
import { getTodayString } from '@/lib/dateUtils';

interface PeerComparisonProps {
  visits: Visit[];
  monthlyTarget: number;
}

export default function PeerComparison({ visits, monthlyTarget }: PeerComparisonProps) {
  const nonNoShow = visits.filter(v => !v.is_no_show);
  const uniqueDays = new Set(nonNoShow.map(v => v.date));
  const workdays = Math.max(uniqueDays.size, 1);
  const totalRVU = nonNoShow.reduce((sum, v) =>
    sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
  const encounters = nonNoShow.length;

  const rvuPerDay = totalRVU / workdays;
  const avgPerEncounter = encounters > 0 ? totalRVU / encounters : 0;

  const today = getTodayString();
  const todayDate = new Date(today + 'T12:00:00');
  const totalWorkdays = 22;
  const monthRVU = nonNoShow
    .filter(v => v.date >= `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`)
    .reduce((sum, v) => sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
  const daysToGoal = monthlyTarget > 0
    ? Math.max(Math.ceil((monthlyTarget - monthRVU) / Math.max(rvuPerDay, 0.1)), 0)
    : totalWorkdays;

  const metrics = [
    { label: 'RVU per workday', you: rvuPerDay, peer: 15.2, max: 25 },
    { label: 'Avg per encounter', you: avgPerEncounter, peer: 2.41, max: 4 },
    { label: 'Days to goal', you: daysToGoal, peer: 19, max: totalWorkdays, lower: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-6">
      <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">vs. Peers</h3>
      <p className="text-xs text-zinc-500 mt-1 mb-5">Internal medicine &middot; same FTE</p>

      {metrics.map(m => (
        <div key={m.label} className="mb-5 last:mb-0">
          <div className="flex justify-between mb-1.5 text-xs">
            <span className="text-zinc-500">{m.label}</span>
            <span className="font-mono text-base">
              <span style={{ color: '#0070cc' }}>{m.you.toFixed(m.you < 10 ? 2 : 0)}</span>
              <span className="text-zinc-500 text-xs"> &middot; peer {m.peer}</span>
            </span>
          </div>
          <div className="relative h-1.5 bg-zinc-100 rounded-full">
            <div
              className="absolute left-0 top-0 h-full rounded-full opacity-50"
              style={{ width: `${(m.peer / m.max) * 100}%`, backgroundColor: '#a1a1aa' }}
            />
            <div
              className="absolute left-0 -top-0.5 h-2.5 rounded-full"
              style={{ width: `${(m.you / m.max) * 100}%`, backgroundColor: '#0070cc' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
