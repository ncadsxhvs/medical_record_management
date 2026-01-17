'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import UserProfile from '@/components/UserProfile';
import EntryForm from '@/components/EntryForm';
import EditVisitModal from '@/components/EditVisitModal';
import { Visit } from '@/types';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(new Set());
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [addingNoShow, setAddingNoShow] = useState(false);
  const [copiedVisit, setCopiedVisit] = useState<Visit | null>(null);

  // Use SWR for visits data
  const { data: visits = [], error, isLoading } = useSWR<Visit[]>(
    status === 'authenticated' ? CACHE_KEYS.visits : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const handleRemove = async (id: number) => {
    if (confirm('Are you sure you want to delete this visit?')) {
      // Optimistic update - remove from UI immediately
      mutate(CACHE_KEYS.visits, visits.filter(v => v.id !== id), false);

      try {
        await fetch(`/api/visits/${id}`, { method: 'DELETE' });
        // Revalidate to get fresh data from server
        mutate(CACHE_KEYS.visits);
      } catch (error) {
        // Rollback on error
        console.error('Failed to delete visit:', error);
        mutate(CACHE_KEYS.visits);
      }
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

  const handleAddNoShow = async () => {
    setAddingNoShow(true);
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          notes: 'No Show',
          is_no_show: true,
          procedures: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create no-show visit');
      }

      // Revalidate visits data
      mutate(CACHE_KEYS.visits);
    } catch (error) {
      console.error('Failed to add no-show:', error);
      alert('Failed to add no-show visit. Please try again.');
    } finally {
      setAddingNoShow(false);
    }
  };

  const handleCopyVisit = (visit: Visit) => {
    setCopiedVisit(visit);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load visits</p>
          <button
            onClick={() => mutate(CACHE_KEYS.visits)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a
            href="/analytics"
            className="px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Analytics
          </a>
          <UserProfile />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RVU Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage medical procedure RVUs</p>
        </div>

        <div className="mb-6">
          <EntryForm
            onEntryAdded={() => mutate(CACHE_KEYS.visits)}
            copiedVisit={copiedVisit}
            onClearCopy={() => setCopiedVisit(null)}
          />
        </div>

        <div className="mb-6 flex justify-end">
          <button
            onClick={handleAddNoShow}
            disabled={addingNoShow}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {addingNoShow ? 'Adding...' : 'Add No Show'}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Visits ({visits.length})</h2>
          {visits.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-base">No visits yet. Add your first visit above!</p>
            </div>
          )}
          {visits.map((visit) => {
            const totalRVU = visit.procedures.reduce((sum, proc) => sum + (Number(proc.work_rvu) * (proc.quantity || 1)), 0);
            const isExpanded = expandedVisits.has(visit.id!);

            return (
              <div key={visit.id} className={`bg-white rounded-xl shadow-sm border ${visit.is_no_show ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} hover:shadow-md transition-shadow duration-200`}>
                <div className="p-5">
                  {visit.is_no_show && (
                    <div className="mb-3 inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      🚫 No Show
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Visit Date & Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(() => {
                          // Extract just the date part (YYYY-MM-DD) from the date string
                          const dateStr = visit.date.toString().split('T')[0];
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          const dateFormatted = date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });

                          // Format time if available
                          if (visit.time) {
                            const [hours, minutes] = visit.time.split(':');
                            const hour = parseInt(hours, 10);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${dateFormatted} at ${displayHour}:${minutes} ${ampm}`;
                          }

                          return dateFormatted;
                        })()}
                      </p>
                    </div>
                    {!visit.is_no_show && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total RVU</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">{totalRVU.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {visit.notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  )}

                  {!visit.is_no_show && (
                    <>
                      <div className="mb-3">
                        <button
                          onClick={() => toggleVisitExpansion(visit.id!)}
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                          <span>{isExpanded ? 'Hide' : 'Show'} Procedures ({visit.procedures.length})</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 mb-4 pl-4 border-l-2 border-blue-200">
                          {visit.procedures.map((proc, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div>
                                    <span className="font-semibold text-gray-900">{proc.hcpcs}</span>
                                    <span className="text-gray-600 text-sm ml-2">{proc.description}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 font-medium">
                                    Qty: {proc.quantity || 1} × {Number(proc.work_rvu).toFixed(2)} RVU = {(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)} RVU
                                  </div>
                                </div>
                                <span className="font-bold text-blue-600 ml-3 text-sm">{(Number(proc.work_rvu) * (proc.quantity || 1)).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {!visit.is_no_show && (
                      <button
                        onClick={() => setEditingVisit(visit)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-all duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {!visit.is_no_show && (
                      <button
                        onClick={() => handleCopyVisit(visit)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-100 active:bg-green-200 transition-all duration-150"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(visit.id!)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 active:bg-red-200 transition-all duration-150"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Visit Modal */}
      {editingVisit && (
        <EditVisitModal
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={() => mutate(CACHE_KEYS.visits)}
        />
      )}
    </div>
  );
}