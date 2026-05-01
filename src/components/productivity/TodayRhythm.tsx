'use client';

import { Visit } from '@/types';
import { getTodayString } from '@/lib/dateUtils';

interface TodayRhythmProps {
  visits: Visit[];
}

const HOURS = [
  { label: '8a', hour: 8 }, { label: '9a', hour: 9 }, { label: '10a', hour: 10 },
  { label: '11a', hour: 11 }, { label: '12p', hour: 12 }, { label: '1p', hour: 13 },
  { label: '2p', hour: 14 }, { label: '3p', hour: 15 }, { label: '4p', hour: 16 },
  { label: '5p', hour: 17 },
];

export default function TodayRhythm({ visits }: TodayRhythmProps) {
  const today = getTodayString();
  const todayVisits = visits.filter(v => v.date === today && !v.is_no_show);

  const hourlyRVU = HOURS.map(({ label, hour }) => {
    const rvu = todayVisits
      .filter(v => {
        if (!v.time) return false;
        const h = parseInt(v.time.split(':')[0], 10);
        return h === hour;
      })
      .reduce((sum, v) => sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0);
    return { label, hour, rvu };
  });

  const currentHour = new Date().getHours();
  const maxRVU = Math.max(...hourlyRVU.map(h => h.rvu), 1);
  const totalRVU = hourlyRVU.reduce((s, h) => s + h.rvu, 0);
  const activeHours = hourlyRVU.filter(h => h.rvu > 0);
  const avgPerHr = activeHours.length > 0 ? totalRVU / activeHours.length : 0;
  const peakHour = hourlyRVU.reduce((best, h) => h.rvu > best.rvu ? h : best, hourlyRVU[0]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-6">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h3 className="text-xl font-semibold text-[#1f1f1f] tracking-tight">Today&apos;s rhythm</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Most productive hour: <strong className="text-[#1f1f1f]">{peakHour.label}</strong> &middot; {peakHour.rvu.toFixed(1)} RVU
          </p>
        </div>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span><strong className="text-[#1f1f1f]">{totalRVU.toFixed(1)}</strong> total</span>
          <span>&middot;</span>
          <span><strong className="text-[#1f1f1f]">{avgPerHr.toFixed(1)}</strong> avg/hr</span>
        </div>
      </div>
      <div className="grid gap-1.5 items-end" style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, height: 160 }}>
        {hourlyRVU.map((h, i) => {
          const isPast = h.hour <= currentHour;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="flex-1 w-full flex items-end">
                {h.rvu > 0 ? (
                  <div
                    className="w-full rounded-t relative"
                    style={{
                      height: `${(h.rvu / maxRVU) * 100}%`,
                      backgroundColor: h.rvu >= 4 ? '#059669' : '#1f1f1f',
                      opacity: isPast ? 1 : 0.4,
                    }}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono text-[#1f1f1f] whitespace-nowrap">
                      {h.rvu.toFixed(1)}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-1 bg-zinc-100 rounded" />
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">{h.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
