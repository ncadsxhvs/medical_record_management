'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { parseLocalDate } from '@/lib/dateUtils';
import { AnalyticsData, AnalyticsBreakdownData } from '@/types';
import RVUChart from '@/components/analytics/RVUChart';
import AppHeader, { AppHeaderSkeleton } from '@/components/AppHeader';
import SummaryStats from '@/components/analytics/SummaryStats';
import TopCodes from '@/components/analytics/TopCodes';
import BreakdownTable from '@/components/analytics/BreakdownTable';
import BonusProjection from '@/components/analytics/BonusProjection';
import Skeleton from '@/components/Skeleton';
import { BonusSettings, getDefaultSettings } from '@/lib/bonusSettings';

type PresetKey = '7d' | '30d' | 'qtd' | 'ytd' | 'custom';

function getPresetDates(preset: PresetKey): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case '7d':
      return { start: new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    case '30d': {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
    }
    case 'qtd': {
      const d = new Date();
      const qMonth = Math.floor(d.getMonth() / 3) * 3;
      return { start: `${d.getFullYear()}-${String(qMonth + 1).padStart(2, '0')}-01`, end: new Date().toISOString().split('T')[0] };
    }
    case 'ytd':
      return { start: `${new Date().getFullYear()}-01-01`, end: new Date().toISOString().split('T')[0] };
    default:
      return { start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
  }
}

function getPriorDates(start: string, end: string): { start: string; end: string } {
  if (!start || !end) {
    const fallback = getPresetDates('30d');
    return getPriorDates(fallback.start, fallback.end);
  }
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return { start, end: start };
  }
  const days = Math.ceil((e.getTime() - s.getTime()) / 86400000);
  const priorEnd = new Date(s);
  priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - days);
  return { start: priorStart.toISOString().split('T')[0], end: priorEnd.toISOString().split('T')[0] };
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [activePreset, setActivePreset] = useState<PresetKey>('30d');
  const defaults = getPresetDates('30d');
  const [customStart, setCustomStart] = useState(defaults.start);
  const [customEnd, setCustomEnd] = useState(defaults.end);
  const [viewMode, setViewMode] = useState<'summary' | 'breakdown'>('summary');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const { data: dbSettings } = useSWR<BonusSettings>(
    status === 'authenticated' ? CACHE_KEYS.settings : null,
    fetcher,
  );
  const userSettings = dbSettings || getDefaultSettings();
  const monthlyTarget = userSettings.rvuTarget || 480;
  const dailyTarget = monthlyTarget / 22;

  const dates = activePreset === 'custom'
    ? { start: customStart, end: customEnd }
    : getPresetDates(activePreset);
  const startDate = dates.start;
  const endDate = dates.end;

  const prior = getPriorDates(startDate, endDate);

  const { data: summaryData = [], isLoading: loadingSummary } = useSWR<AnalyticsData[]>(
    status === 'authenticated' ? CACHE_KEYS.analytics('daily', startDate, endDate) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const { data: priorSummaryData = [] } = useSWR<AnalyticsData[]>(
    status === 'authenticated' ? CACHE_KEYS.analytics('daily', prior.start, prior.end) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const { data: breakdownDataRaw = [], isLoading: loadingBreakdown } = useSWR<AnalyticsBreakdownData[]>(
    status === 'authenticated' ? CACHE_KEYS.analyticsBreakdown('daily', startDate, endDate) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const data = useMemo(() => summaryData.map(d => ({
    ...d,
    total_work_rvu: parseFloat(d.total_work_rvu as any) || 0,
    total_encounters: parseInt(d.total_encounters as any) || 0,
    total_no_shows: parseInt(d.total_no_shows as any) || 0
  })), [summaryData]);

  const priorData = useMemo(() => priorSummaryData.map(d => ({
    ...d,
    total_work_rvu: parseFloat(d.total_work_rvu as any) || 0,
    total_encounters: parseInt(d.total_encounters as any) || 0,
    total_no_shows: parseInt(d.total_no_shows as any) || 0
  })), [priorSummaryData]);

  const breakdownData = useMemo(() => breakdownDataRaw.map(d => ({
    ...d,
    total_work_rvu: parseFloat(d.total_work_rvu as any) || 0,
    total_quantity: parseInt(d.total_quantity as any) || 0,
    encounter_count: parseInt(d.encounter_count as any) || 0
  })), [breakdownDataRaw]);

  const loading = loadingSummary || loadingBreakdown;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

  const totalRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
  const workdays = data.filter(d => d.total_encounters > 0).length;
  const avgPerDay = workdays > 0 ? totalRvus / workdays : 0;

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const formatPeriod = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString();
  };

  const presets: { key: PresetKey; label: string }[] = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: 'qtd', label: 'QTD' },
    { key: 'ytd', label: 'YTD' },
    { key: 'custom', label: 'Custom' },
  ];

  if (status === 'loading' || (loading && data.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <AppHeaderSkeleton />
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <Skeleton className="h-14 w-80" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <AppHeader activePage="analytics" />

      <div className="max-w-[1400px] mx-auto p-5 lg:p-8">
        {/* Editorial headline + Period chips */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-7 gap-4">
          <div>
            <h2 className="text-3xl lg:text-5xl font-light text-zinc-900 tracking-tight leading-none">
              How {monthName} is shaping up
            </h2>
            <p className="text-sm text-zinc-500 mt-2.5">
              {totalRvus.toFixed(1)} RVU across {workdays} workdays &middot; avg {avgPerDay.toFixed(1)}/day
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => setActivePreset(p.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  activePreset === p.key
                    ? 'bg-[#0070cc] text-white border-[#0070cc]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date pickers */}
        {activePreset === 'custom' && (
          <div className="flex items-center gap-3 mb-6">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm"
            />
          </div>
        )}

        {viewMode === 'summary' ? (
          <div className="space-y-6">
            <SummaryStats data={data} priorData={priorData} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <RVUChart
                  data={data}
                  dailyTarget={dailyTarget}
                  monthlyTarget={monthlyTarget}
                  onBarClick={(periodStart) => {
                    setSelectedPeriod(periodStart);
                    setViewMode('breakdown');
                  }}
                />
              </div>
              <div className="lg:col-span-2">
                <TopCodes
                  data={breakdownData}
                  onViewAll={() => setViewMode('breakdown')}
                />
              </div>
            </div>

            <BonusProjection data={data} startDate={startDate} endDate={endDate} />
          </div>
        ) : (
          <div>
            <button
              onClick={() => setViewMode('summary')}
              className="mb-4 text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              &larr; Back to summary
            </button>
            <BreakdownTable
              data={breakdownData}
              selectedPeriod={selectedPeriod}
              formatPeriod={formatPeriod}
              onClearPeriod={() => setSelectedPeriod(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
