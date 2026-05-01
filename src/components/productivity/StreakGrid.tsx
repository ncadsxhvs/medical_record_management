'use client';

import { Visit } from '@/types';
import { getTodayString } from '@/lib/dateUtils';

interface StreakGridProps {
  visits: Visit[];
  dailyTarget: number;
}

export default function StreakGrid({ visits, dailyTarget }: StreakGridProps) {
  const today = getTodayString();
  const days: { date: string; rvu: number; hit: boolean; isToday: boolean }[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayVisits = visits.filter(v => v.date === dateStr && !v.is_no_show);
    const rvu = dayVisits.reduce((sum, v) =>
      sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
    days.push({ date: dateStr, rvu, hit: rvu >= dailyTarget, isToday: dateStr === today });
  }

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].hit) currentStreak++;
    else break;
  }

  let bestStreak = 0, tempStreak = 0;
  for (const d of days) {
    if (d.hit) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-6">
      <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">Hit-target streak</h3>
      <p className="text-xs text-zinc-500 mt-1 mb-5">Days you hit your daily RVU target</p>

      <div className="flex items-baseline gap-2.5 mb-4">
        <span className="text-5xl font-mono font-bold leading-none" style={{ color: '#059669' }}>
          {currentStreak}
        </span>
        <span className="text-sm text-zinc-500">day streak &middot; best {bestStreak}</span>
      </div>

      <div className="grid grid-cols-14 gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            title={`${d.date}: ${d.rvu.toFixed(1)} RVU`}
            className="aspect-square rounded"
            style={{
              backgroundColor: d.hit
                ? (d.isToday ? '#0070cc' : '#059669')
                : '#e4e4e7',
              opacity: d.hit ? (d.isToday ? 1 : 0.85) : 0.6,
              border: d.isToday ? '2px solid #0070cc' : 'none',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2.5 text-[10px] text-zinc-500">
        <span>2 weeks ago</span><span>Today</span>
      </div>
    </div>
  );
}
