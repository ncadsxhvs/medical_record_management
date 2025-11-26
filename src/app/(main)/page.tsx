'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import EntryForm from '@/components/EntryForm';
import { Visit } from '@/types';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(new Set());

  const fetchVisits = useCallback(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/visits')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch visits');
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setVisits(data);
          } else {
            console.error('Fetched data is not an array:', data);
            setVisits([]);
          }
        })
        .catch((error) => {
          console.error(error);
          setVisits([]); // Set to empty array on error
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    } else {
      fetchVisits();
    }
  }, [status, router, fetchVisits]);

  const handleRemove = (id: number) => {
    if (confirm('Are you sure you want to delete this visit?')) {
      fetch(`/api/visits/${id}`, { method: 'DELETE' })
        .then(() => fetchVisits());
    }
  };

  const toggleVisitExpansion = (visitId: number) => {
    setExpandedVisits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <a
            href="/analytics"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            View Analytics
          </a>
          <UserProfile />
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">RVU Tracker</h1>
        </div>

        <div className="mb-6">
          <EntryForm onEntryAdded={fetchVisits} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Visits ({visits.length})</h2>
          {visits.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No visits yet. Add your first visit above!
            </div>
          )}
          {visits.map((visit) => {
            const totalRVU = visit.procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);
            const isExpanded = expandedVisits.has(visit.id!);

            return (
              <div key={visit.id} className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Visit Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(visit.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase">Total RVU</p>
                      <p className="text-2xl font-bold text-blue-700">{totalRVU.toFixed(2)}</p>
                    </div>
                  </div>

                  {visit.notes && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <button
                      onClick={() => toggleVisitExpansion(visit.id!)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {isExpanded ? '▼ Hide' : '▶ Show'} Procedures ({visit.procedures.length})
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 mb-3 pl-4 border-l-2 border-blue-200">
                      {visit.procedures.map((proc, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div>
                                <span className="font-semibold">{proc.hcpcs}</span>
                                <span className="text-gray-600 text-sm ml-2">{proc.description}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Qty: {proc.quantity || 1} × {Number(proc.work_rvu).toFixed(2)} RVU = {(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU
                              </div>
                            </div>
                            <span className="font-semibold text-blue-600 ml-2">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleRemove(visit.id!)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete Visit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}