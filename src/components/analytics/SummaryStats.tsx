'use client';

import { AnalyticsData } from '@/types';

interface SummaryStatsProps {
  data: AnalyticsData[];
  priorData: AnalyticsData[];
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="mt-2">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SummaryStats({ data, priorData }: SummaryStatsProps) {
  const totalRvus = data.reduce((sum, d) => sum + d.total_work_rvu, 0);
  const totalEncounters = data.reduce((sum, d) => sum + d.total_encounters, 0);
  const totalNoShows = data.reduce((sum, d) => sum + d.total_no_shows, 0);
  const avgRvu = totalEncounters > 0 ? totalRvus / totalEncounters : 0;

  const priorRvus = priorData.reduce((sum, d) => sum + d.total_work_rvu, 0);
  const priorEncounters = priorData.reduce((sum, d) => sum + d.total_encounters, 0);
  const priorNoShows = priorData.reduce((sum, d) => sum + d.total_no_shows, 0);
  const priorAvg = priorEncounters > 0 ? priorRvus / priorEncounters : 0;

  const pctChange = (curr: number, prior: number) => {
    if (prior === 0) return curr > 0 ? 100 : 0;
    return ((curr - prior) / prior) * 100;
  };

  const cards = [
    {
      label: 'TOTAL RVU',
      value: totalRvus.toFixed(2),
      change: pctChange(totalRvus, priorRvus),
      prior: priorRvus.toFixed(2),
      sparkValues: data.map(d => d.total_work_rvu),
    },
    {
      label: 'ENCOUNTERS',
      value: String(totalEncounters),
      change: pctChange(totalEncounters, priorEncounters),
      prior: String(priorEncounters),
      sparkValues: data.map(d => d.total_encounters),
    },
    {
      label: 'AVG RVU / ENCOUNTER',
      value: avgRvu.toFixed(2),
      change: pctChange(avgRvu, priorAvg),
      prior: priorAvg.toFixed(2),
      sparkValues: data.map(d => d.total_encounters > 0 ? d.total_work_rvu / d.total_encounters : 0),
    },
    {
      label: 'NO-SHOWS',
      value: String(totalNoShows),
      change: pctChange(totalNoShows, priorNoShows),
      prior: String(priorNoShows),
      sparkValues: data.map(d => d.total_no_shows),
      invertColor: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const isPositive = card.invertColor ? card.change <= 0 : card.change >= 0;
        const changeColor = isPositive ? 'text-green-600' : 'text-red-500';
        const sparkColor = isPositive ? '#16a34a' : '#a1a1aa';
        return (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-zinc-200/80">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.14em] mb-2">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-zinc-900 tracking-tight">{card.value}</span>
              {card.change !== 0 && (
                <span className={`text-sm font-semibold ${changeColor}`}>
                  {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">vs prior 30d &middot; {card.prior}</p>
            <MiniSparkline values={card.sparkValues} color={sparkColor} />
          </div>
        );
      })}
    </div>
  );
}
