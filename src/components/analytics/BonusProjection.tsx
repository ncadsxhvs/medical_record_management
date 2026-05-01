'use client';

import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { AnalyticsData } from '@/types';
import { parseLocalDate } from '@/lib/dateUtils';
import { BonusSettings, getDefaultSettings, saveBonusSettings } from '@/lib/bonusSettings';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';

interface BonusProjectionProps {
  data: AnalyticsData[];
  startDate: string;
  endDate: string;
}

export default function BonusProjection({ data, startDate, endDate }: BonusProjectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: dbSettings } = useSWR<BonusSettings>(CACHE_KEYS.settings, fetcher);
  const settings = dbSettings || getDefaultSettings();

  const updateSettings = async (update: Partial<BonusSettings>) => {
    const newSettings = { ...settings, ...update };
    mutate(CACHE_KEYS.settings, newSettings, false);
    await saveBonusSettings(newSettings);
    mutate(CACHE_KEYS.settings);
  };

  const results = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const daysInRange = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const actualRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
    const dailyRate = actualRvus / daysInRange;
    const annualizedRvus = dailyRate * 365;

    const targetStart = parseLocalDate(settings.targetStartDate);
    const targetEnd = parseLocalDate(settings.targetEndDate);
    const daysInTargetPeriod = Math.max(1, Math.round((targetEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const annualTarget = settings.rvuTarget * (365 / daysInTargetPeriod);

    const surplus = Math.max(0, annualizedRvus - annualTarget);
    const projectedBonus = surplus * settings.bonusRate;
    const progressPct = annualTarget > 0 ? Math.min(100, (annualizedRvus / annualTarget) * 100) : 0;
    const proratedBonus = projectedBonus * (daysInTargetPeriod / 365);

    return { actualRvus, daysInRange, annualizedRvus, annualTarget, surplus, projectedBonus, progressPct, daysInTargetPeriod, proratedBonus };
  }, [data, startDate, endDate, settings]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 active:scale-[0.98] transition cursor-pointer"
      >
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Bonus Projection</h2>
        <svg
          className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">RVU Target</label>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.rvuTarget || ''}
                onChange={(e) => updateSettings({ rvuTarget: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 4000"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-[#0070cc] focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period Start</label>
              <input
                type="date"
                value={settings.targetStartDate}
                onChange={(e) => updateSettings({ targetStartDate: e.target.value })}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-[#0070cc] focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period End</label>
              <input
                type="date"
                value={settings.targetEndDate}
                onChange={(e) => updateSettings({ targetEndDate: e.target.value })}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-[#0070cc] focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bonus Rate ($/RVU)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.bonusRate || ''}
                onChange={(e) => updateSettings({ bonusRate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 35"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-[#0070cc] focus:border-[#0070cc]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-1">
            <div>
              <p className="text-sm font-medium text-[#1f1f1f]">Daily Reminder</p>
              <p className="text-xs text-zinc-500">Email at 5 PM if no visits logged</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reminderEnabled}
              onClick={() => updateSettings({ reminderEnabled: !settings.reminderEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settings.reminderEnabled ? 'bg-[#0070cc]' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Target: {settings.rvuTarget.toLocaleString()} RVUs over {results.daysInTargetPeriod} days ({settings.targetStartDate} to {settings.targetEndDate})
          </p>

          {results.annualTarget > 0 && (
            <div>
              <div className="flex justify-between text-sm text-zinc-600 mb-1">
                <span>Annualized Pace: {results.annualizedRvus.toFixed(1)} RVUs</span>
                <span>Target: {results.annualTarget.toFixed(1)} RVUs/yr</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    results.progressPct >= 100 ? 'bg-emerald-500' : 'bg-[#0070cc]'
                  }`}
                  style={{ width: `${Math.min(100, results.progressPct)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{results.progressPct.toFixed(1)}% of annual target</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-[#0070cc]/5 to-[#0070cc]/10 p-4 rounded-lg shadow-md border border-[#0070cc]/20">
              <h3 className="text-xs font-semibold text-[#0070cc] uppercase tracking-wider mb-1">Actual RVUs</h3>
              <p className="text-2xl font-bold text-[#1f1f1f]">{results.actualRvus.toFixed(2)}</p>
              <p className="text-xs text-[#0070cc] mt-1">{results.daysInRange} days in range</p>
            </div>
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 rounded-lg border border-zinc-200">
              <h3 className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider mb-1">Annualized Pace</h3>
              <p className="text-2xl font-bold text-[#1f1f1f]">{results.annualizedRvus.toFixed(1)}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">RVUs per year</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg shadow-md border border-emerald-200">
              <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Projected Surplus</h3>
              <p className="text-2xl font-bold text-emerald-900">{results.surplus.toFixed(1)}</p>
              <p className="text-xs text-emerald-600 mt-1">RVUs above target/yr</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg shadow-md border border-amber-200">
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Annual Bonus</h3>
              <p className="text-2xl font-bold text-amber-900">${results.projectedBonus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-amber-600 mt-1">Full year estimate</p>
            </div>
            <div className="bg-gradient-to-br from-[#0070cc]/8 to-[#0070cc]/15 p-4 rounded-lg border border-[#0070cc]/25">
              <h3 className="text-xs font-semibold text-[#0070cc] uppercase tracking-wider mb-1">Period Bonus</h3>
              <p className="text-2xl font-bold text-[#1f1f1f]">${results.proratedBonus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-[#0070cc] mt-1">Prorated ({results.daysInTargetPeriod} days)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
