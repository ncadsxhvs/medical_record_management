'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  period_start: string;
  total_work_rvu: number;
  total_entries: number;
}

interface AnalyticsBreakdownData {
  period_start: string;
  hcpcs: string;
  description: string;
  status_code: string;
  total_work_rvu: number;
  entry_count: number;
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
              total_entries: parseInt(d.total_entries) || 0
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
              entry_count: parseInt(d.entry_count) || 0
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

  const maxRvu = Math.max(...data.map(d => d.total_work_rvu), 0);

  // Get breakdown for selected period or all periods
  const filteredBreakdown = selectedPeriod
    ? breakdownData.filter(d => d.period_start === selectedPeriod)
    : breakdownData;

  const formatPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4 items-end">
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
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Work RVUs Over Time</h2>
              {data.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No data available for the selected period</p>
              ) : (
                <div className="flex items-end h-64 gap-2">
                  {data.map((d) => (
                    <div
                      key={d.period_start}
                      className="flex-1 flex flex-col items-center group cursor-pointer"
                      onClick={() => {
                        setSelectedPeriod(d.period_start);
                        setViewMode('breakdown');
                      }}
                    >
                      <div
                        className="w-full bg-blue-500 group-hover:bg-blue-600 transition rounded-t"
                        style={{ height: `${maxRvu > 0 ? (d.total_work_rvu / maxRvu) * 100 : 0}%` }}
                        title={`RVU: ${d.total_work_rvu.toFixed(2)} | Entries: ${d.total_entries}`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 text-center">
                        <div className="font-medium">{d.total_work_rvu.toFixed(1)}</div>
                        <div className="text-gray-400 truncate max-w-[80px]">{formatPeriod(d.period_start)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4 text-center">Click on a bar to see HCPCS breakdown</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total RVUs</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {data.reduce((sum, d) => sum + d.total_work_rvu, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Entries</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {data.reduce((sum, d) => sum + d.total_entries, 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Avg RVU per Entry</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {data.reduce((sum, d) => sum + d.total_entries, 0) > 0
                    ? (data.reduce((sum, d) => sum + d.total_work_rvu, 0) / data.reduce((sum, d) => sum + d.total_entries, 0)).toFixed(2)
                    : '0.00'}
                </p>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HCPCS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total RVU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg RVU</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    filteredBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPeriod(item.period_start)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.hcpcs}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={item.description}>
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.entry_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.total_work_rvu.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(item.total_work_rvu / item.entry_count).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
