'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  period_start: string;
  total_work_rvu: number;
  total_entries: number;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const fetchAnalytics = () => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch(`/api/analytics?period=${period}&start=${startDate}&end=${endDate}`)
        .then((res) => res.json())
        .then((data) => setData(data))
        .finally(() => setLoading(false));
    }
  };
  
  useEffect(() => {
    fetchAnalytics();
  }, [session, period, startDate, endDate]);

  const maxRvu = Math.max(...data.map(d => d.total_work_rvu), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

        <div className="flex gap-4 mb-6 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <button onClick={fetchAnalytics} className="self-end px-4 py-2 bg-blue-600 text-white rounded-md">
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Work RVUs over time</h2>
            <div className="flex items-end h-64 space-x-2">
              {data.map((d) => (
                <div key={d.period_start} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500"
                    style={{ height: `${(d.total_work_rvu / maxRvu) * 100}%` }}
                    title={`RVU: ${d.total_work_rvu}`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(d.period_start).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
