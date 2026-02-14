'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { parseLocalDate } from '@/lib/dateUtils';
import { AnalyticsData, AnalyticsBreakdownData } from '@/types';
import RVUChart from '@/components/analytics/RVUChart';
import SummaryStats from '@/components/analytics/SummaryStats';
import BreakdownTable from '@/components/analytics/BreakdownTable';

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'summary' | 'breakdown'>('summary');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const { data: summaryData = [], isLoading: loadingSummary } = useSWR<AnalyticsData[]>(
    status === 'authenticated' ? CACHE_KEYS.analytics(period, startDate, endDate) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const { data: breakdownDataRaw = [], isLoading: loadingBreakdown } = useSWR<AnalyticsBreakdownData[]>(
    status === 'authenticated' ? CACHE_KEYS.analyticsBreakdown(period, startDate, endDate) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const data = useMemo(() => summaryData.map(d => ({
    ...d,
    total_work_rvu: parseFloat(d.total_work_rvu as any) || 0,
    total_encounters: parseInt(d.total_encounters as any) || 0,
    total_no_shows: parseInt(d.total_no_shows as any) || 0
  })), [summaryData]);

  const breakdownData = useMemo(() => breakdownDataRaw.map(d => ({
    ...d,
    total_work_rvu: parseFloat(d.total_work_rvu as any) || 0,
    total_quantity: parseInt(d.total_quantity as any) || 0,
    encounter_count: parseInt(d.encounter_count as any) || 0
  })), [breakdownDataRaw]);

  const loading = loadingSummary || loadingBreakdown;

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

  const maxRvu = Math.max(...data.map(d => d.total_work_rvu), 0);
  const minRvu = Math.min(...data.map(d => d.total_work_rvu), 0);
  const yAxisTop = Math.ceil(maxRvu * 1.1);
  const yAxisMin = minRvu > 0 ? 0 : Math.floor(minRvu * 1.1);
  const yAxisRange = yAxisTop - yAxisMin;

  const formatPeriod = (dateStr: string) => {
    if (period === 'yearly') {
      return dateStr.substring(0, 4);
    }
    const date = parseLocalDate(dateStr);
    if (period === 'daily') {
      return date.toLocaleDateString();
    } else if (period === 'weekly') {
      return `Week of ${date.toLocaleDateString()}`;
    } else if (period === 'monthly') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    return date.getFullYear().toString();
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
              onClick={() => {
                mutate(CACHE_KEYS.analytics(period, startDate, endDate));
                mutate(CACHE_KEYS.analyticsBreakdown(period, startDate, endDate));
              }}
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
          <div className="space-y-6">
            <RVUChart
              data={data}
              yAxisMin={yAxisMin}
              yAxisRange={yAxisRange}
              formatPeriod={formatPeriod}
              onBarClick={(periodStart) => {
                setSelectedPeriod(periodStart);
                setViewMode('breakdown');
              }}
            />
            <SummaryStats data={data} />
          </div>
        ) : (
          <BreakdownTable
            data={breakdownData}
            selectedPeriod={selectedPeriod}
            formatPeriod={formatPeriod}
            onClearPeriod={() => setSelectedPeriod(null)}
          />
        )}
      </div>
    </div>
  );
}
