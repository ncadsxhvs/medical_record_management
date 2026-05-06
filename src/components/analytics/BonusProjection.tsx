'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { AnalyticsData } from '@/types';
import { parseLocalDate } from '@/lib/dateUtils';
import { BonusSettings, getDefaultSettings, saveBonusSettings } from '@/lib/bonusSettings';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { useToast } from '@/components/Toast';

interface BonusProjectionProps {
  data: AnalyticsData[];
  startDate: string;
  endDate: string;
}

export default function BonusProjection({ data, startDate, endDate }: BonusProjectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: dbSettings } = useSWR<BonusSettings>(CACHE_KEYS.settings, fetcher);
  const settings = dbSettings || getDefaultSettings();
  const [draft, setDraft] = useState<BonusSettings>(settings);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (dbSettings) setDraft(dbSettings);
  }, [dbSettings]);

  const isDirty = draft.rvuTarget !== settings.rvuTarget
    || draft.targetStartDate !== settings.targetStartDate
    || draft.targetEndDate !== settings.targetEndDate
    || draft.bonusRate !== settings.bonusRate;

  const handleSave = async () => {
    setSaving(true);
    try {
      mutate(CACHE_KEYS.settings, draft, false);
      await saveBonusSettings(draft);
      mutate(CACHE_KEYS.settings);
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const results = useMemo(() => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const daysInRange = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const actualRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
    const dailyRate = actualRvus / daysInRange;
    const annualizedRvus = dailyRate * 365;

    const targetStart = parseLocalDate(draft.targetStartDate);
    const targetEnd = parseLocalDate(draft.targetEndDate);
    const daysInTargetPeriod = Math.max(1, Math.round((targetEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const annualTarget = draft.rvuTarget * (365 / daysInTargetPeriod);

    const surplus = Math.max(0, annualizedRvus - annualTarget);
    const projectedBonus = surplus * draft.bonusRate;
    const progressPct = annualTarget > 0 ? Math.min(100, (annualizedRvus / annualTarget) * 100) : 0;
    const proratedBonus = projectedBonus * (daysInTargetPeriod / 365);

    return { actualRvus, daysInRange, annualizedRvus, annualTarget, surplus, projectedBonus, progressPct, daysInTargetPeriod, proratedBonus };
  }, [data, startDate, endDate, draft]);

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
                value={draft.rvuTarget || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, rvuTarget: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 4000"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period Start</label>
              <input
                type="date"
                value={draft.targetStartDate}
                onChange={(e) => setDraft(prev => ({ ...prev, targetStartDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period End</label>
              <input
                type="date"
                value={draft.targetEndDate}
                onChange={(e) => setDraft(prev => ({ ...prev, targetEndDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bonus Rate ($/RVU)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.bonusRate || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, bonusRate: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 35"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070cc]/10 focus:border-[#0070cc]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="px-5 py-2 bg-[#0070cc] text-white text-sm font-semibold rounded-full ps-btn cursor-pointer active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {isDirty && <span className="text-xs text-zinc-400">Unsaved changes</span>}
          </div>
          <p className="text-xs text-zinc-500">
            Target: {draft.rvuTarget.toLocaleString()} RVUs over {results.daysInTargetPeriod} days ({draft.targetStartDate} to {draft.targetEndDate})
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
