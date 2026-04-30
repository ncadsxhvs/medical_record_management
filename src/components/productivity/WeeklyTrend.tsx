'use client';

import { Visit } from '@/types';

interface WeeklyTrendProps {
  visits: Visit[];
  weeklyTarget: number;
}

function getISOWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function WeeklyTrend({ visits, weeklyTarget }: WeeklyTrendProps) {
  const weekMap = new Map<string, number>();

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStart = getISOWeekStart(d);
    weekMap.set(weekStart, 0);
  }

  visits.filter(v => !v.is_no_show).forEach(v => {
    const vDate = new Date(v.date + 'T12:00:00');
    const weekStart = getISOWeekStart(vDate);
    if (weekMap.has(weekStart)) {
      const rvu = v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0);
      weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + rvu);
    }
  });

  const weeks = Array.from(weekMap.entries()).map(([key, rvu]) => ({ key, rvu }));
  const maxRVU = Math.max(...weeks.map(w => w.rvu), weeklyTarget, 1);
  const targetPct = (weeklyTarget / maxRVU) * 100;

  const firstWeekRvu = weeks.find(w => w.rvu > 0)?.rvu || 1;
  const lastWeekRvu = weeks[weeks.length - 1].rvu;
  const trendPct = ((lastWeekRvu - firstWeekRvu) / firstWeekRvu) * 100;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-6">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">12-week trend</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Weekly RVU &middot; trending{' '}
            <strong style={{ color: trendPct >= 0 ? 'oklch(60% 0.13 155)' : '#ef4444' }}>
              {trendPct >= 0 ? '+' : ''}{trendPct.toFixed(0)}%
            </strong>
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 items-end relative" style={{ height: 140 }}>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-zinc-300 text-[10px] text-zinc-500"
          style={{ bottom: `${targetPct}%` }}
        >
          <span className="bg-white px-1">target {weeklyTarget}</span>
        </div>
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(w.rvu / maxRVU) * 100}%`,
                  backgroundColor: i === weeks.length - 1
                    ? 'oklch(55% 0.15 265)'
                    : w.rvu >= weeklyTarget ? 'oklch(60% 0.13 155)' : '#18181b',
                  opacity: i === weeks.length - 1 ? 1 : 0.7,
                  minHeight: w.rvu > 0 ? 4 : 0,
                }}
              />
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">W{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
