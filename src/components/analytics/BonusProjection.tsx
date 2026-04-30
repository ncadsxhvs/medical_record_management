'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnalyticsData } from '@/types';
import { parseLocalDate } from '@/lib/dateUtils';
import { BonusSettings, loadBonusSettings, saveBonusSettings } from '@/lib/bonusSettings';

interface BonusProjectionProps {
  data: AnalyticsData[];
  startDate: string;
  endDate: string;
}

export default function BonusProjection({ data, startDate, endDate }: BonusProjectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<BonusSettings>(loadBonusSettings);

  useEffect(() => {
    saveBonusSettings(settings);
  }, [settings]);

  const results = useMemo(() => {
    // Data range (actual RVUs observed)
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const daysInRange = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const actualRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
    const dailyRate = actualRvus / daysInRange;
    const annualizedRvus = dailyRate * 365;

    // Target period
    const targetStart = parseLocalDate(settings.targetStartDate);
    const targetEnd = parseLocalDate(settings.targetEndDate);
    const daysInTargetPeriod = Math.max(1, Math.round((targetEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const annualTarget = settings.rvuTarget * (365 / daysInTargetPeriod);

    const surplus = Math.max(0, annualizedRvus - annualTarget);
    const projectedBonus = surplus * settings.bonusRate;
    const progressPct = annualTarget > 0 ? Math.min(100, (annualizedRvus / annualTarget) * 100) : 0;

    // Prorated bonus for the target period
    const proratedBonus = projectedBonus * (daysInTargetPeriod / 365);

    return { actualRvus, daysInRange, annualizedRvus, annualTarget, surplus, projectedBonus, progressPct, daysInTargetPeriod, proratedBonus };
  }, [data, startDate, endDate, settings]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Bonus Projection</h2>
        <svg
          className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">RVU Target</label>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.rvuTarget || ''}
                onChange={(e) => setSettings(s => ({ ...s, rvuTarget: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 4000"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period Start</label>
              <input
                type="date"
                value={settings.targetStartDate}
                onChange={(e) => setSettings(s => ({ ...s, targetStartDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Target Period End</label>
              <input
                type="date"
                value={settings.targetEndDate}
                onChange={(e) => setSettings(s => ({ ...s, targetEndDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bonus Rate ($/RVU)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.bonusRate || ''}
                onChange={(e) => setSettings(s => ({ ...s, bonusRate: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 35"
                className="block w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Target: {settings.rvuTarget.toLocaleString()} RVUs over {results.daysInTargetPeriod} days ({settings.targetStartDate} to {settings.targetEndDate})
          </p>

          {/* Progress Bar */}
          {results.annualTarget > 0 && (
            <div>
              <div className="flex justify-between text-sm text-zinc-600 mb-1">
                <span>Annualized Pace: {results.annualizedRvus.toFixed(1)} RVUs</span>
                <span>Target: {results.annualTarget.toFixed(1)} RVUs/yr</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    results.progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, results.progressPct)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{results.progressPct.toFixed(1)}% of annual target</p>
            </div>
          )}

          {/* Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-md border border-blue-200">
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Actual RVUs</h3>
              <p className="text-2xl font-bold text-blue-900">{results.actualRvus.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">{results.daysInRange} days in range</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg shadow-md border border-indigo-200">
              <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Annualized Pace</h3>
              <p className="text-2xl font-bold text-indigo-900">{results.annualizedRvus.toFixed(1)}</p>
              <p className="text-xs text-indigo-600 mt-1">RVUs per year</p>
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
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow-md border border-purple-200">
              <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Period Bonus</h3>
              <p className="text-2xl font-bold text-purple-900">${results.proratedBonus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-purple-600 mt-1">Prorated ({results.daysInTargetPeriod} days)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
