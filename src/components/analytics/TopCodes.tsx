'use client';

import { AnalyticsBreakdownData } from '@/types';

interface TopCodesProps {
  data: AnalyticsBreakdownData[];
  onViewAll: () => void;
}

export default function TopCodes({ data, onViewAll }: TopCodesProps) {
  const codeMap = new Map<string, { hcpcs: string; description: string; rvu: number; count: number }>();
  data.forEach(d => {
    const existing = codeMap.get(d.hcpcs);
    if (existing) {
      existing.rvu += d.total_work_rvu;
      existing.count += d.total_quantity;
    } else {
      codeMap.set(d.hcpcs, { hcpcs: d.hcpcs, description: d.description, rvu: d.total_work_rvu, count: d.total_quantity });
    }
  });

  const codes = Array.from(codeMap.values())
    .sort((a, b) => b.rvu - a.rvu)
    .slice(0, 6);

  const totalRvu = codes.reduce((s, c) => s + c.rvu, 0);
  const maxRvu = codes[0]?.rvu || 1;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-6">
      <div className="flex justify-between items-baseline mb-5">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Top HCPCS codes</h2>
        <button onClick={onViewAll} className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
          View all &rarr;
        </button>
      </div>

      <div className="space-y-5">
        {codes.map(code => {
          const pct = totalRvu > 0 ? (code.rvu / totalRvu) * 100 : 0;
          return (
            <div key={code.hcpcs}>
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono font-bold text-sm text-zinc-900">{code.hcpcs}</span>
                  <span className="text-xs text-zinc-500 truncate">{code.description}</span>
                </div>
                <span className="font-mono font-bold text-base text-zinc-900 ml-3 flex-shrink-0">{code.rvu.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-800 rounded-full"
                    style={{ width: `${(code.rvu / maxRvu) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 flex-shrink-0 font-mono">
                  {code.count} &times; &middot; {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
