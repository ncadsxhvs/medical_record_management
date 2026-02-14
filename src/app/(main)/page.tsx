'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import UserProfile from '@/components/UserProfile';
import EntryForm from '@/components/EntryForm';
import EditVisitModal from '@/components/EditVisitModal';
import VisitCard from '@/components/VisitCard';
import { Visit } from '@/types';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { getTodayString } from '@/lib/dateUtils';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(new Set());
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [addingNoShow, setAddingNoShow] = useState(false);
  const [copiedVisit, setCopiedVisit] = useState<Visit | null>(null);

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
      mutate(CACHE_KEYS.visits, visits.filter(v => v.id !== id), false);

      try {
        await fetch(`/api/visits/${id}`, { method: 'DELETE' });
        mutate(CACHE_KEYS.visits);
      } catch (error) {
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
          date: getTodayString(),
          notes: 'No Show',
          is_no_show: true,
          procedures: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create no-show visit');
      }

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
          {visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              isExpanded={expandedVisits.has(visit.id!)}
              onToggleExpand={() => toggleVisitExpansion(visit.id!)}
              onEdit={() => setEditingVisit(visit)}
              onCopy={() => handleCopyVisit(visit)}
              onDelete={() => handleRemove(visit.id!)}
            />
          ))}
        </div>
      </div>

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
