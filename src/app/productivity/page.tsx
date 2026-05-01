'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import ScoreRing from '@/components/productivity/ScoreRing';
import AppHeader, { AppHeaderSkeleton } from '@/components/AppHeader';
import TodayRhythm from '@/components/productivity/TodayRhythm';
import StreakGrid from '@/components/productivity/StreakGrid';
import WeeklyTrend from '@/components/productivity/WeeklyTrend';
import PeerComparison from '@/components/productivity/PeerComparison';
import CoachingSuggestions from '@/components/productivity/CoachingSuggestions';
import ReminderToggle from '@/components/productivity/ReminderToggle';
import Skeleton from '@/components/Skeleton';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { getTodayString, formatDate } from '@/lib/dateUtils';
import { BonusSettings, getDefaultSettings } from '@/lib/bonusSettings';
import { Visit } from '@/types';

export default function ProductivityPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: dbSettings } = useSWR<BonusSettings>(
    status === 'authenticated' ? CACHE_KEYS.settings : null,
    fetcher,
  );
  const settings = dbSettings || getDefaultSettings();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

  const normalizeDate = (d: string) => d?.toString().split('T')[0] ?? d;
  const { data: visits = [], isLoading } = useSWR<Visit[]>(
    status === 'authenticated' ? CACHE_KEYS.visits : null,
    async (url: string) => {
      const data: Visit[] = await fetcher(url);
      return data
        .map(v => ({ ...v, date: normalizeDate(v.date) }))
        .sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });
    },
  );

  const workdaysTotal = 22;
  const monthlyTarget = settings.rvuTarget || 480;
  const dailyTarget = monthlyTarget / workdaysTotal;
  const weeklyTarget = dailyTarget * 5;

  const today = getTodayString();
  const todayVisits = visits.filter(v => v.date === today && !v.is_no_show);
  const todayRVU = todayVisits.reduce((sum, v) =>
    sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
  const todayPct = (todayRVU / dailyTarget) * 100;

  const todayDate = new Date(today + 'T12:00:00');
  const monthStart = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`;
  const monthVisits = visits.filter(v => v.date >= monthStart && !v.is_no_show);
  const monthRVU = monthVisits.reduce((sum, v) =>
    sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
  const monthPct = (monthRVU / monthlyTarget) * 100;

  const workdaysElapsed = Math.max(new Set(monthVisits.map(v => v.date)).size, 1);
  const expectedPct = (workdaysElapsed / workdaysTotal) * 100;
  const projection = (monthRVU / workdaysElapsed) * workdaysTotal;
  const onPace = monthPct >= expectedPct - 3;

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  const yesterdayCount = visits.filter(v => v.date === yesterday && !v.is_no_show).length;

  const productivityScore = Math.min(Math.round(
    (todayPct * 0.3 + monthPct * 0.5 + (onPace ? 20 : 0)) * 100 / 100
  ), 100);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f7fa]">
        <AppHeaderSkeleton />
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f7fa]">
      <AppHeader activePage="productivity" />

      <div className="max-w-[1400px] mx-auto p-5 lg:p-8">
        {/* Editorial headline */}
        <div className="mb-7">
          <h2 className="text-3xl lg:text-5xl font-light text-[#1f1f1f] tracking-tight leading-none">
            You&apos;re having{' '}
            <em className="not-italic font-bold" style={{ color: onPace ? '#059669' : '#d97706' }}>
              {onPace ? 'a strong week' : 'a slow week'}
            </em>.
          </h2>
          <p className="text-sm text-zinc-500 mt-2.5">
            {formatDate(today, { month: 'long', day: 'numeric', year: 'numeric' })} &middot;{' '}
            {todayVisits.length} visit{todayVisits.length !== 1 ? 's' : ''} today, {yesterdayCount} yesterday
          </p>
        </div>

        {/* Score rings */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-6 lg:p-9 mb-6 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0">
          <div className="flex flex-col items-center lg:border-r lg:border-zinc-200/80 lg:pr-8">
            <ScoreRing
              pct={todayPct}
              value={todayRVU.toFixed(1)}
              sublabel="RVU today"
              color={todayPct >= 60 ? '#059669' : '#d97706'}
            />
            <p className="text-xs text-zinc-500 mt-4 text-center">
              {todayPct.toFixed(0)}% of {dailyTarget.toFixed(0)} daily target
            </p>
          </div>
          <div className="flex flex-col items-center lg:border-r lg:border-zinc-200/80 lg:px-8">
            <ScoreRing
              pct={monthPct}
              value={`${monthPct.toFixed(0)}%`}
              sublabel="Monthly pace"
              color="#0070cc"
            />
            <p className="text-xs text-zinc-500 mt-4 text-center">
              {monthRVU.toFixed(1)} of {monthlyTarget} &middot; projected {projection.toFixed(0)}
            </p>
          </div>
          <div className="flex flex-col items-center lg:pl-8">
            <ScoreRing
              pct={productivityScore}
              value={String(productivityScore)}
              sublabel="Productivity score"
              color="#059669"
            />
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Composite of pace, volume &amp; consistency
            </p>
          </div>
        </div>

        {/* Rhythm + Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          <div className="lg:col-span-3">
            <TodayRhythm visits={visits} />
          </div>
          <div className="lg:col-span-2">
            <StreakGrid visits={visits} dailyTarget={dailyTarget} />
          </div>
        </div>

        {/* Trend + Peers */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
          <div className="lg:col-span-3">
            <WeeklyTrend visits={visits} weeklyTarget={weeklyTarget} />
          </div>
          <div className="lg:col-span-2">
            <PeerComparison visits={visits} monthlyTarget={monthlyTarget} />
          </div>
        </div>

        {/* Coaching */}
        <CoachingSuggestions visits={visits} />

        {/* Reminder */}
        <div className="mt-5">
          <ReminderToggle />
        </div>
      </div>
    </div>
  );
}
