'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Visit } from '@/types';
import { getTodayString, parseLocalDate } from '@/lib/dateUtils';
import { BonusSettings, getDefaultSettings } from '@/lib/bonusSettings';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';

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

function countEncounters(visits: Visit[], startDate: string, endDate: string): number {
  return visits.filter(v => !v.is_no_show && v.date >= startDate && v.date <= endDate).length;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-2">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 bg-zinc-100 rounded-full mt-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

export default function KPIStrip({ visits }: KPIStripProps) {
  const { status } = useSession();
  const { data: dbSettings } = useSWR<BonusSettings>(
    status === 'authenticated' ? CACHE_KEYS.settings : null,
    fetcher,
  );
  const settings = dbSettings || getDefaultSettings();

  const today = getTodayString();
  const week = useMemo(() => getWeekBounds(today), [today]);
  const month = useMemo(() => getMonthBounds(today), [today]);

  const todayRVU = useMemo(() => sumRVUs(visits, today, today), [visits, today]);
  const weekRVU = useMemo(() => sumRVUs(visits, week.start, week.end), [visits, week]);
  const monthRVU = useMemo(() => sumRVUs(visits, month.start, month.end), [visits, month]);
  const todayEncounters = useMemo(() => countEncounters(visits, today, today), [visits, today]);

  const monthlyTarget = settings.rvuTarget || 480;
  const dailyTarget = monthlyTarget / 22;
  const weeklyTarget = dailyTarget * 5;

  const last7Encounters = useMemo(() => {
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(parseLocalDate(today));
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts.push(countEncounters(visits, ds, ds));
    }
    return counts;
  }, [visits, today]);

  const avgEncounters = useMemo(() => {
    const sum = last7Encounters.reduce((a, b) => a + b, 0);
    const workdays = last7Encounters.filter(c => c > 0).length || 1;
    return sum / workdays;
  }, [last7Encounters]);

  const encounterDelta = todayEncounters - Math.round(avgEncounters);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Today</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold font-mono text-zinc-900">{todayRVU.toFixed(2)}</span>
          <span className="text-xs text-zinc-400">RVU</span>
        </div>
        <MiniProgressBar pct={(todayRVU / dailyTarget) * 100} color="#22c55e" />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">This Week</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold font-mono text-zinc-900">{weekRVU.toFixed(2)}</span>
          <span className="text-xs text-zinc-400">RVU</span>
        </div>
        <MiniProgressBar pct={(weekRVU / weeklyTarget) * 100} color="#3b82f6" />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">MTD</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold font-mono text-zinc-900">{monthRVU.toFixed(1)}</span>
          <span className="text-xs text-zinc-400">/ {monthlyTarget}</span>
        </div>
        <MiniProgressBar pct={(monthRVU / monthlyTarget) * 100} color="#3b82f6" />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Encounters</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold font-mono text-zinc-900">{todayEncounters}</span>
          {encounterDelta !== 0 && (
            <span className={`text-xs font-semibold ${encounterDelta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {encounterDelta > 0 ? '+' : ''}{encounterDelta} vs avg
            </span>
          )}
        </div>
        <MiniSparkline data={last7Encounters} color="#3b82f6" />
      </div>
    </div>
  );
}
