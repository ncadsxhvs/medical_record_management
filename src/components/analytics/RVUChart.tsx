'use client';

import { AnalyticsData } from '@/types';
import { getTodayString } from '@/lib/dateUtils';

interface RVUChartProps {
  data: AnalyticsData[];
  dailyTarget: number;
  monthlyTarget: number;
  onBarClick: (periodStart: string) => void;
}

export default function RVUChart({ data, dailyTarget, monthlyTarget, onBarClick }: RVUChartProps) {
  const chartData = data.slice().reverse();
  const today = getTodayString();

  const maxRvu = Math.max(...chartData.map(d => d.total_work_rvu), dailyTarget * 1.2, 1);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-zinc-200/80 text-center">
        <p className="text-zinc-400">No data available for the selected period</p>
      </div>
    );
  }

  const targetPct = (dailyTarget / maxRvu) * 100;

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200/80">
      <div className="flex justify-between items-baseline mb-1">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Daily RVU</h2>
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-zinc-800 rounded-sm" /> Logged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-zinc-400" /> Target {dailyTarget.toFixed(0)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #d4d4d8, #d4d4d8 2px, transparent 2px, transparent 4px)' }} /> Off day
          </span>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        Target {dailyTarget.toFixed(0)}/day &middot; dashed line shows pace to {monthlyTarget} goal
      </p>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-zinc-400 font-mono">
          {[maxRvu, maxRvu * 0.75, maxRvu * 0.5, maxRvu * 0.25, 0].map((v, i) => (
            <span key={i}>{v.toFixed(0)}</span>
          ))}
        </div>

        <div className="ml-10">
          {/* Chart area */}
          <div className="relative" style={{ height: 260 }}>
            {/* Gridlines */}
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} className="absolute left-0 right-0 border-t border-zinc-100" style={{ bottom: `${pct}%` }} />
            ))}

            {/* Target line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-zinc-400 z-10"
              style={{ bottom: `${targetPct}%` }}
            />

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-px">
              {chartData.map((d) => {
                const isToday = d.period_start === today;
                const isOffDay = d.total_work_rvu === 0 && d.total_encounters === 0;
                const barPct = (d.total_work_rvu / maxRvu) * 100;

                return (
                  <div
                    key={d.period_start}
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => onBarClick(d.period_start)}
                    title={`${d.period_start}\nRVU: ${d.total_work_rvu.toFixed(2)}\nEncounters: ${d.total_encounters}`}
                  >
                    <div className="w-full flex items-end justify-center" style={{ height: 260 }}>
                      {isOffDay ? (
                        <div
                          className="w-[80%] rounded-t"
                          style={{
                            height: 20,
                            background: 'repeating-linear-gradient(45deg, #e4e4e7, #e4e4e7 2px, transparent 2px, transparent 5px)',
                          }}
                        />
                      ) : (
                        <div
                          className={`w-[80%] rounded-t transition-colors ${
                            isToday ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                          style={{
                            height: `${barPct}%`,
                            minHeight: d.total_work_rvu > 0 ? 4 : 0,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-px mt-2">
            {chartData.map((d) => {
              const isToday = d.period_start === today;
              const dayNum = d.period_start.split('-')[2]?.replace(/^0/, '') || '';
              return (
                <div key={`label-${d.period_start}`} className="flex-1 text-center">
                  <span className={`text-[11px] font-mono ${isToday ? 'text-indigo-500 font-bold' : 'text-zinc-400'}`}>
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
