'use client';

import { useMemo, useState, useEffect } from 'react';
import { Visit } from '@/types';
import { getTodayString, parseLocalDate } from '@/lib/dateUtils';
import { loadBonusSettings, BonusSettings } from '@/lib/bonusSettings';

interface KPIStripProps {
  visits: Visit[];
}

function getWeekBounds(today: string): { start: string; end: string } {
  const d = parseLocalDate(today);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return { start: fmt(monday), end: fmt(sunday) };
}

function getMonthBounds(today: string): { start: string; end: string } {
  const d = parseLocalDate(today);
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const m = String(month + 1).padStart(2, '0');
  return { start: `${year}-${m}-01`, end: `${year}-${m}-${String(lastDay).padStart(2, '0')}` };
}

function sumRVUs(visits: Visit[], startDate: string, endDate: string): number {
  return visits
    .filter(v => !v.is_no_show && v.date >= startDate && v.date <= endDate)
    .reduce((sum, v) => sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
}

export default function KPIStrip({ visits }: KPIStripProps) {
  const [settings, setSettings] = useState<BonusSettings | null>(null);

  useEffect(() => {
    setSettings(loadBonusSettings());
  }, []);

  const today = getTodayString();
  const week = useMemo(() => getWeekBounds(today), [today]);
  const month = useMemo(() => getMonthBounds(today), [today]);

  const todayRVU = useMemo(() => sumRVUs(visits, today, today), [visits, today]);
  const weekRVU = useMemo(() => sumRVUs(visits, week.start, week.end), [visits, week]);
  const monthRVU = useMemo(() => sumRVUs(visits, month.start, month.end), [visits, month]);

  const onTrack = useMemo(() => {
    if (!settings || settings.rvuTarget <= 0) return null;
    const start = parseLocalDate(settings.targetStartDate);
    const end = parseLocalDate(settings.targetEndDate);
    const now = parseLocalDate(today);
    const totalDays = (end.getTime() - start.getTime()) / 86400000;
    const elapsed = (now.getTime() - start.getTime()) / 86400000;
    if (totalDays <= 0 || elapsed < 0) return null;
    const expected = settings.rvuTarget * (elapsed / totalDays);
    const actual = sumRVUs(visits, settings.targetStartDate, today);
    return actual >= expected;
  }, [settings, visits, today]);

  const metrics = [
    { label: 'Today', value: todayRVU },
    { label: 'This Week', value: weekRVU },
    { label: 'Month to Date', value: monthRVU, trackingPill: onTrack },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{m.label}</p>
            {m.trackingPill !== undefined && m.trackingPill !== null && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                m.trackingPill ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {m.trackingPill ? 'On Track' : 'Below Target'}
              </span>
            )}
          </div>
          <p className="text-lg font-bold font-mono text-zinc-900 mt-1">{m.value.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
