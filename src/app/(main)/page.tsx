'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import UserProfile from '@/components/UserProfile';
import EntryForm from '@/components/EntryForm';
import EditVisitModal from '@/components/EditVisitModal';
import VisitCard from '@/components/VisitCard';
import KPIStrip from '@/components/KPIStrip';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
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
  const [deletingVisitId, setDeletingVisitId] = useState<number | null>(null);
  const { toast } = useToast();

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

  const handleRemove = (id: number) => {
    setDeletingVisitId(id);
  };

  const confirmDelete = async () => {
    if (deletingVisitId === null) return;
    const id = deletingVisitId;
    setDeletingVisitId(null);
    mutate(CACHE_KEYS.visits, visits.filter(v => v.id !== id), false);
    try {
      await fetch(`/api/visits/${id}`, { method: 'DELETE' });
      mutate(CACHE_KEYS.visits);
      toast('Visit deleted', 'success');
    } catch (error) {
      console.error('Failed to delete visit:', error);
      mutate(CACHE_KEYS.visits);
      toast('Failed to delete visit', 'error');
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
      toast('No-show visit added', 'success');
    } catch (error) {
      console.error('Failed to add no-show:', error);
      toast('Failed to add no-show visit', 'error');
    } finally {
      setAddingNoShow(false);
    }
  };

  const handleCopyVisit = (visit: Visit) => {
    setCopiedVisit(visit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const DATE_ACCENT_COLORS = [
    'border-l-sky-400',
    'border-l-emerald-400',
    'border-l-amber-400',
    'border-l-rose-400',
    'border-l-violet-400',
    'border-l-teal-400',
    'border-l-orange-300',
  ];

  const dateColorMap = (() => {
    const uniqueDates = [...new Set(visits.map(v => v.date))];
    return Object.fromEntries(uniqueDates.map((d, i) => [d, DATE_ACCENT_COLORS[i % DATE_ACCENT_COLORS.length]]));
  })();

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load visits</p>
          <button
            onClick={() => mutate(CACHE_KEYS.visits)}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-zinc-200/60 bg-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">RVU Tracker</h1>
          <div className="flex-1" />
          <a
            href="/analytics"
            className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150"
          >
            Analytics
          </a>
          <UserProfile />
        </div>
      </div>

      {/* Split Panel */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 57px)' }}>
        {/* Left Panel — Entry Form */}
        <div className="lg:w-[420px] xl:w-[460px] flex-shrink-0 border-r border-zinc-200/60 bg-white lg:overflow-y-auto lg:sticky lg:top-[57px]" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <div className="p-5">
            <EntryForm
              onEntryAdded={() => mutate(CACHE_KEYS.visits)}
              copiedVisit={copiedVisit}
              onClearCopy={() => setCopiedVisit(null)}
              onAddNoShow={handleAddNoShow}
              addingNoShow={addingNoShow}
            />
          </div>
        </div>

        {/* Right Panel — Feed */}
        <div className="flex-1 p-5 lg:p-6">
          {/* KPI Strip */}
          <KPIStrip visits={visits} />

          {/* Visit Feed */}
          <div className="mt-5 space-y-2">
            {visits.length === 0 && (
              <div className="bg-white rounded-xl border border-zinc-200/80 p-8 text-center text-zinc-400">
                <p className="text-sm">No visits yet. Add your first visit using the form.</p>
              </div>
            )}
            {(() => {
              let lastDate = '';
              return visits.map((visit) => {
                const showDateHeader = visit.date !== lastDate;
                lastDate = visit.date;
                return (
                  <div key={visit.id}>
                    {showDateHeader && (
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pt-3 pb-1 first:pt-0">
                        {visit.date === getTodayString() ? 'Today' : new Date(visit.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    <VisitCard
                      visit={visit}
                      accentColor={dateColorMap[visit.date]}
                      isExpanded={expandedVisits.has(visit.id!)}
                      onToggleExpand={() => toggleVisitExpansion(visit.id!)}
                      onEdit={() => setEditingVisit(visit)}
                      onCopy={() => handleCopyVisit(visit)}
                      onDelete={() => handleRemove(visit.id!)}
                    />
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {editingVisit && (
        <EditVisitModal
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={() => mutate(CACHE_KEYS.visits)}
        />
      )}

      <ConfirmDialog
        open={deletingVisitId !== null}
        title="Delete Visit"
        message="Are you sure you want to delete this visit? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingVisitId(null)}
      />
    </div>
  );
}
