'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  period_start: string;
  total_work_rvu: number;
  total_encounters: number;
  total_no_shows: number;
}

interface AnalyticsBreakdownData {
  period_start: string;
  hcpcs: string;
  description: string;
  status_code: string;
  total_work_rvu: number;
  total_quantity: number;
  encounter_count: number;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [breakdownData, setBreakdownData] = useState<AnalyticsBreakdownData[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'summary' | 'breakdown'>('summary');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Update date range when period changes to yearly
  useEffect(() => {
    if (period === 'yearly') {
      const currentYear = new Date().getFullYear();
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
    }
  }, [period]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const fetchAnalytics = () => {
    if (status === 'authenticated') {
      setLoading(true);

      // Fetch summary data
      fetch(`/api/analytics?period=${period}&start=${startDate}&end=${endDate}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Convert numeric strings to numbers
            const normalized = data.map(d => ({
              ...d,
              total_work_rvu: parseFloat(d.total_work_rvu) || 0,
              total_encounters: parseInt(d.total_encounters) || 0,
              total_no_shows: parseInt(d.total_no_shows) || 0
            }));
            setData(normalized);
          } else {
            console.error('Summary data is not an array:', data);
            setData([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch summary:', err);
          setData([]);
        });

      // Fetch breakdown data
      fetch(`/api/analytics?period=${period}&start=${startDate}&end=${endDate}&groupBy=hcpcs`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Convert numeric strings to numbers
            const normalized = data.map(d => ({
              ...d,
              total_work_rvu: parseFloat(d.total_work_rvu) || 0,
              total_quantity: parseInt(d.total_quantity) || 0,
              encounter_count: parseInt(d.encounter_count) || 0
            }));
            setBreakdownData(normalized);
          } else {
            console.error('Breakdown data is not an array:', data);
            setBreakdownData([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch breakdown:', err);
          setBreakdownData([]);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [session, period, startDate, endDate]);

  // Calculate y-axis range for better visual presentation
  const maxRvu = Math.max(...data.map(d => d.total_work_rvu), 0);
  const minRvu = Math.min(...data.map(d => d.total_work_rvu), 0);

  // Add padding to y-axis (10% on top, start from 0 or slightly below min)
  const yAxisMax = Math.ceil(maxRvu * 1.1);
  const yAxisMin = minRvu > 0 ? 0 : Math.floor(minRvu * 1.1);
  const yAxisRange = yAxisMax - yAxisMin;

  // Get breakdown for selected period or all periods
  const filteredBreakdown = selectedPeriod
    ? breakdownData.filter(d => d.period_start === selectedPeriod)
    : breakdownData;

  const formatPeriod = (dateStr: string) => {
    // For yearly period, extract year directly from the string to avoid timezone issues
    if (period === 'yearly') {
      return dateStr.substring(0, 4);
    }

    // Parse date as local date to avoid timezone shifts
    const dateOnly = dateStr.toString().split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (period === 'daily') {
      return date.toLocaleDateString();
    } else if (period === 'weekly') {
      return `Week of ${date.toLocaleDateString()}`;
    } else if (period === 'monthly') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else {
      return date.getFullYear().toString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 font-medium ${
                viewMode === 'summary'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-4 py-2 font-medium ${
                viewMode === 'breakdown'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              HCPCS Breakdown
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        ) : viewMode === 'summary' ? (
          /* Summary View */
          <div className="space-y-6">
            {/* Chart */}
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
                              {/* Bar */}
                              <div
                                className="w-full bg-gradient-to-t from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 rounded-t shadow-lg cursor-pointer pointer-events-auto"
                                style={{
                                  height: `${yAxisRange > 0 ? ((d.total_work_rvu - yAxisMin) / yAxisRange) * 100 : 0}%`,
                                  minHeight: d.total_work_rvu > 0 ? '4px' : '0'
                                }}
                                onClick={() => {
                                  setSelectedPeriod(d.period_start);
                                  setViewMode('breakdown');
                                }}
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
                          {/* Line */}
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
                          {/* Data points */}
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

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Total RVUs</h3>
                <p className="text-4xl font-bold text-blue-900">
                  {data.reduce((sum, d) => sum + d.total_work_rvu, 0).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-2">Across all periods</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg shadow-md border border-emerald-200">
                <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Total Encounters</h3>
                <p className="text-4xl font-bold text-emerald-900">
                  {data.reduce((sum, d) => sum + d.total_encounters, 0)}
                </p>
                <p className="text-xs text-emerald-600 mt-2">Procedure records</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-md border border-orange-200">
                <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Total No Shows</h3>
                <p className="text-4xl font-bold text-orange-900">
                  {data.reduce((sum, d) => sum + d.total_no_shows, 0)}
                </p>
                <p className="text-xs text-orange-600 mt-2">Missed appointments</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md border border-purple-200">
                <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Avg RVU per Encounter</h3>
                <p className="text-4xl font-bold text-purple-900">
                  {data.reduce((sum, d) => sum + d.total_encounters, 0) > 0
                    ? (data.reduce((sum, d) => sum + d.total_work_rvu, 0) / data.reduce((sum, d) => sum + d.total_encounters, 0)).toFixed(2)
                    : '0.00'}
                </p>
                <p className="text-xs text-purple-600 mt-2">Efficiency metric</p>
              </div>
            </div>
          </div>
        ) : (
          /* Breakdown View */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  HCPCS Breakdown {selectedPeriod && `- ${formatPeriod(selectedPeriod)}`}
                </h2>
                {selectedPeriod && (
                  <button
                    onClick={() => setSelectedPeriod(null)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Show All Periods
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredBreakdown.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No data available
                </div>
              ) : (
                (() => {
                  // Group breakdown data by period_start
                  const groupedData = filteredBreakdown.reduce((acc, item) => {
                    const period = item.period_start;
                    if (!acc[period]) {
                      acc[period] = [];
                    }
                    acc[period].push(item);
                    return acc;
                  }, {} as Record<string, typeof filteredBreakdown>);

                  return (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">HCPCS</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Count</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total RVU</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg RVU</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {Object.entries(groupedData)
                          .sort(([periodA], [periodB]) => periodB.localeCompare(periodA))
                          .map(([period, items]) => (
                          <React.Fragment key={period}>
                            {/* Date Header Row */}
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm font-bold text-blue-900">{formatPeriod(period)}</span>
                                  <span className="text-xs text-blue-600 ml-2">
                                    ({items.length} procedure{items.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {/* Procedure Rows */}
                            {items.map((item, idx) => (
                              <tr key={`${period}-${idx}`} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {item.hcpcs}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={item.description}>
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-medium">
                                  {item.total_quantity}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900 text-right">
                                  {item.total_work_rvu.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                  {(item.total_work_rvu / item.total_quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
