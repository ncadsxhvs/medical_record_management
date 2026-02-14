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
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Work RVUs Over Time</h2>
      <p className="text-sm text-gray-500 mb-6">Click on a bar to see HCPCS breakdown</p>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No data available for the selected period</p>
      ) : (
        <div className="relative flex gap-6">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between h-80 text-sm text-gray-700 font-medium pr-3 border-r-2 border-gray-300">
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
              style={{ minWidth: data.length > 5 ? `${data.length * 100}px` : '100%' }}
            >
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div key={percent} className="border-t border-gray-300" />
                ))}
              </div>

              {/* Bars and Line */}
              <div className="relative h-80">
                {/* Bars Only Container */}
                <div className="absolute inset-0 flex justify-around px-4 gap-4 pointer-events-none">
                  {data.map((d) => (
                    <div
                      key={d.period_start}
                      className="h-full flex items-end justify-center"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 rounded-t shadow-lg cursor-pointer pointer-events-auto"
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
                  {data.map((d) => (
                    <div
                      key={`label-${d.period_start}`}
                      className="text-center"
                      style={{ width: '80px', minWidth: '80px' }}
                    >
                      <div className="text-sm font-bold text-gray-900 mt-3">{d.total_work_rvu.toFixed(1)}</div>
                      <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">
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
                    points={data
                      .map((d, idx) => {
                        const x = ((idx + 0.5) / data.length) * 100;
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
                  {data.map((d, idx) => {
                    const x = ((idx + 0.5) / data.length) * 100;
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
