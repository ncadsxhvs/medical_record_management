'use client';

import { AnalyticsData } from '@/types';

interface RVUChartProps {
  data: AnalyticsData[];
  yAxisMin: number;
  yAxisRange: number;
  formatPeriod: (dateStr: string) => string;
  onBarClick: (periodStart: string) => void;
}

export default function RVUChart({ data, yAxisMin, yAxisRange, formatPeriod, onBarClick }: RVUChartProps) {
  const chartData = data.slice().reverse();

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm shadow-zinc-900/5">
      <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mb-1">Work RVUs Over Time</h2>
      <p className="text-sm text-zinc-500 mb-6">Click on a bar to see HCPCS breakdown</p>
      {chartData.length === 0 ? (
        <p className="text-zinc-400 text-center py-12">No data available for the selected period</p>
      ) : (
        <div className="relative flex gap-6">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between h-80 text-xs text-zinc-500 font-mono pr-3 border-r border-zinc-200">
            {[100, 75, 50, 25, 0].map((percent) => {
              const value = yAxisMin + (yAxisRange * percent) / 100;
              return (
                <div key={percent} className="text-right -mt-2">
                  {value.toFixed(1)}
                </div>
              );
            })}
          </div>

          {/* Chart Area with Horizontal Scroll */}
          <div className="flex-1 overflow-x-auto pb-16">
            <div
              className="relative"
              style={{ minWidth: chartData.length > 5 ? `${chartData.length * 100}px` : '100%' }}
            >
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div key={percent} className="border-t border-zinc-100" />
                ))}
              </div>

              {/* Bars and Line */}
              <div className="relative h-80">
                {/* Bars Only Container */}
                <div className="absolute inset-0 flex justify-around px-4 gap-4 pointer-events-none">
                  {chartData.map((d) => (
                    <div
                      key={d.period_start}
                      className="h-full flex items-end justify-center"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div
                        className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors duration-150 rounded-t cursor-pointer pointer-events-auto"
                        style={{
                          height: `${yAxisRange > 0 ? ((d.total_work_rvu - yAxisMin) / yAxisRange) * 100 : 0}%`,
                          minHeight: d.total_work_rvu > 0 ? '4px' : '0'
                        }}
                        onClick={() => onBarClick(d.period_start)}
                        title={`${formatPeriod(d.period_start)}\nRVU: ${d.total_work_rvu.toFixed(2)}\nEncounters: ${d.total_encounters}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Labels Below Chart */}
                <div className="absolute left-0 right-0 flex justify-around px-4 gap-4" style={{ top: '320px' }}>
                  {chartData.map((d) => (
                    <div
                      key={`label-${d.period_start}`}
                      className="text-center"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="text-sm font-semibold font-mono text-zinc-900 mt-3">{d.total_work_rvu.toFixed(1)}</div>
                      <div className="text-xs text-zinc-500 mt-1 whitespace-nowrap">
                        {formatPeriod(d.period_start)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Line Graph Overlay */}
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: '16px',
                    right: '16px',
                    top: 0,
                    height: '320px',
                    width: 'calc(100% - 32px)'
                  }}
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polyline
                    points={chartData
                      .map((d, idx) => {
                        const x = ((idx + 0.5) / chartData.length) * 100;
                        const y = 100 - (yAxisRange > 0 ? ((d.total_work_rvu - yAxisMin) / yAxisRange) * 100 : 0);
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((d, idx) => {
                    const x = ((idx + 0.5) / chartData.length) * 100;
                    const y = 100 - (yAxisRange > 0 ? ((d.total_work_rvu - yAxisMin) / yAxisRange) * 100 : 0);
                    return (
                      <circle
                        key={d.period_start}
                        cx={x}
                        cy={y}
                        r="1.2"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="0.4"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
