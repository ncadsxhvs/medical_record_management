'use client';

import { useMemo } from 'react';
import { AnalyticsData } from '@/types';
import { getTodayString } from '@/lib/dateUtils';

type Granularity = 'daily' | 'weekly' | 'monthly';

interface AggregatedBar {
  label: string;
  periodStart: string;
  total_work_rvu: number;
  total_encounters: number;
  containsToday: boolean;
}

function getGranularity(dayCount: number): Granularity {
  if (dayCount <= 14) return 'daily';
  if (dayCount <= 90) return 'weekly';
  return 'monthly';
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().split('T')[0];
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function aggregateData(daily: AnalyticsData[], granularity: Granularity, today: string): AggregatedBar[] {
  if (granularity === 'daily') {
    return daily.map(d => ({
      label: d.period_start.split('-')[2]?.replace(/^0/, '') || '',
      periodStart: d.period_start,
      total_work_rvu: d.total_work_rvu,
      total_encounters: d.total_encounters,
      containsToday: d.period_start === today,
    }));
  }

  const keyFn = granularity === 'weekly' ? getWeekKey : getMonthKey;
  const buckets = new Map<string, AggregatedBar>();

  for (const d of daily) {
    const key = keyFn(d.period_start);
    const existing = buckets.get(key);
    if (existing) {
      existing.total_work_rvu += d.total_work_rvu;
      existing.total_encounters += d.total_encounters;
      if (d.period_start === today) existing.containsToday = true;
    } else {
      let label: string;
      if (granularity === 'weekly') {
        const mon = new Date(key + 'T12:00:00');
        label = `${mon.getMonth() + 1}/${mon.getDate()}`;
      } else {
        label = new Date(key + '-15T12:00:00').toLocaleString('en-US', { month: 'short' });
      }
      buckets.set(key, {
        label,
        periodStart: key,
        total_work_rvu: d.total_work_rvu,
        total_encounters: d.total_encounters,
        containsToday: d.period_start === today,
      });
    }
  }

  return Array.from(buckets.values());
}

interface RVUChartProps {
  data: AnalyticsData[];
  dailyTarget: number;
  monthlyTarget: number;
  startDate: string;
  endDate: string;
  onBarClick: (periodStart: string) => void;
}

export default function RVUChart({ data, dailyTarget, monthlyTarget, startDate, endDate, onBarClick }: RVUChartProps) {
  const dailyData = useMemo(() => data.slice().reverse(), [data]);
  const today = getTodayString();

  const daySpan = useMemo(() => {
    const s = new Date(startDate + 'T12:00:00');
    const e = new Date(endDate + 'T12:00:00');
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [startDate, endDate]);

  const granularity = useMemo(() => getGranularity(daySpan), [daySpan]);

  const bars = useMemo(() => aggregateData(dailyData, granularity, today), [dailyData, granularity, today]);

  const targetValue = granularity === 'daily'
    ? dailyTarget
    : granularity === 'weekly'
      ? dailyTarget * 5
      : monthlyTarget;

  const targetLabel = granularity === 'daily'
    ? `${dailyTarget.toFixed(0)}/day`
    : granularity === 'weekly'
      ? `${(dailyTarget * 5).toFixed(0)}/wk`
      : `${monthlyTarget.toFixed(0)}/mo`;

  const granularityLabel = granularity === 'daily' ? 'Daily' : granularity === 'weekly' ? 'Weekly' : 'Monthly';

  const maxRvu = Math.max(...bars.map(d => d.total_work_rvu), targetValue * 1.2, 1);

  if (bars.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-zinc-200/80 text-center">
        <p className="text-zinc-400">No data available for the selected period</p>
      </div>
    );
  }

  const targetPct = (targetValue / maxRvu) * 100;

  const monthBoundaries = granularity === 'daily'
    ? bars.reduce<number[]>((acc, d, i) => {
        if (i > 0 && d.periodStart.slice(5, 7) !== bars[i - 1].periodStart.slice(5, 7)) acc.push(i);
        return acc;
      }, [])
    : [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200/80">
      <div className="flex justify-between items-baseline mb-1">
        <h2 className="text-2xl font-light text-[#1f1f1f] tracking-tight">{granularityLabel} RVU</h2>
        <div className="flex items-center gap-5 text-xs text-[#6b6b6b]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-emerald-600 rounded-sm" /> Logged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#0070cc] rounded-sm" /> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-[#cccccc]" /> Target {targetLabel}
          </span>
          {granularity === 'daily' && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #d4d4d8, #d4d4d8 2px, transparent 2px, transparent 4px)' }} /> Off day
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        Target {targetLabel} &middot; dashed line shows pace to {monthlyTarget.toFixed(0)}/mo goal
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-zinc-400 font-mono">
          {[maxRvu, maxRvu * 0.75, maxRvu * 0.5, maxRvu * 0.25, 0].map((v, i) => (
            <span key={i}>{v.toFixed(0)}</span>
          ))}
        </div>

        <div className="ml-10">
          <div className="relative" style={{ height: 260 }}>
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} className="absolute left-0 right-0 border-t border-zinc-100" style={{ bottom: `${pct}%` }} />
            ))}

            {monthBoundaries.map(idx => (
              <div
                key={`month-${idx}`}
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-zinc-300 z-10 pointer-events-none"
                style={{ left: `${(idx / bars.length) * 100}%` }}
              />
            ))}

            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-[#cccccc] z-10"
              style={{ bottom: `${targetPct}%` }}
            />

            <div className="absolute inset-0 flex items-end gap-px">
              {bars.map((d) => {
                const isOffDay = granularity === 'daily' && d.total_work_rvu === 0 && d.total_encounters === 0;
                const barPct = (d.total_work_rvu / maxRvu) * 100;

                return (
                  <div
                    key={d.periodStart}
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => onBarClick(d.periodStart)}
                    title={`${d.periodStart}\nRVU: ${d.total_work_rvu.toFixed(2)}\nEncounters: ${d.total_encounters}`}
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
                            d.containsToday ? 'bg-[#0070cc] hover:bg-[#005fa3]' : 'bg-emerald-600 hover:bg-emerald-500'
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

          <div className="relative flex gap-px mt-2">
            {bars.map((d, i) => {
              const isMonthStart = monthBoundaries.includes(i);
              const monthName = isMonthStart
                ? new Date(d.periodStart + 'T12:00:00').toLocaleString('en-US', { month: 'short' })
                : null;
              return (
                <div key={`label-${d.periodStart}`} className="flex-1 text-center relative">
                  {monthName && (
                    <span className="absolute -top-0.5 left-0 text-[9px] font-semibold text-zinc-500 -translate-x-1/2">
                      {monthName}
                    </span>
                  )}
                  <span className={`text-[11px] font-mono ${d.containsToday ? 'text-[#0070cc] font-bold' : 'text-zinc-400'}`}>
                    {d.label}
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
