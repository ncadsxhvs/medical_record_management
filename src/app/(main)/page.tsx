'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import EntryForm from '@/components/EntryForm';
import AppHeader, { AppHeaderSkeleton } from '@/components/AppHeader';
import EditVisitModal from '@/components/EditVisitModal';
import VisitCard from '@/components/VisitCard';
import SelectedProceduresCard from '@/components/SelectedProceduresCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Visit } from '@/types';
import { VisitFormControls } from '@/components/EntryForm';
import Skeleton from '@/components/Skeleton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';
import { getTodayString, formatDate } from '@/lib/dateUtils';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(new Set());
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [addingNoShow, setAddingNoShow] = useState(false);
  const [copiedVisit, setCopiedVisit] = useState<Visit | null>(null);
  const [deletingVisitId, setDeletingVisitId] = useState<number | null>(null);
  const [selectedData, setSelectedData] = useState<VisitFormControls | null>(null);

  useKeyboardShortcuts({
    'mod+k': () => {
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
      searchInput?.focus();
    },
  });
  const { toast } = useToast();

  const normalizeDate = (d: string) => d?.toString().split('T')[0] ?? d;
  const { data: visits = [], error, isLoading } = useSWR<Visit[]>(
    status === 'authenticated' ? CACHE_KEYS.visits : null,
    async (url: string) => {
      const data: Visit[] = await fetcher(url);
      return data
        .map(v => ({ ...v, date: normalizeDate(v.date) }))
        .sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });
    },
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

  const confirmDelete = () => {
    if (deletingVisitId === null) return;
    const id = deletingVisitId;
    setDeletingVisitId(null);

    const deletedVisit = visits.find(v => v.id === id);
    mutate(CACHE_KEYS.visits, visits.filter(v => v.id !== id), false);

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`/api/visits/${id}`, { method: 'DELETE' });
        mutate(CACHE_KEYS.visits);
      } catch (error) {
        console.error('Failed to delete visit:', error);
        mutate(CACHE_KEYS.visits);
        toast('Failed to delete visit', 'error');
      }
    }, 5000);

    toast('Visit deleted', 'info', {
      label: 'Undo',
      onClick: () => {
        clearTimeout(timeoutId);
        if (deletedVisit) {
          mutate(CACHE_KEYS.visits);
        }
      },
    });
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
    'bg-sky-400',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-rose-400',
    'bg-violet-400',
    'bg-teal-400',
    'bg-orange-300',
  ];

  const dateColorMap = (() => {
    const uniqueDates = [...new Set(visits.map(v => v.date))];
    return Object.fromEntries(uniqueDates.map((d, i) => [d, DATE_ACCENT_COLORS[i % DATE_ACCENT_COLORS.length]]));
  })();

  const todayVisitCount = visits.filter(v => v.date === getTodayString()).length;

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f7fa]">
        <AppHeaderSkeleton />
        <div className="flex flex-col lg:flex-row max-w-[1400px] mx-auto" style={{ minHeight: 'calc(100vh - 57px)' }}>
          <div className="hidden lg:block w-[300px] p-5 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="flex-1 p-5 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid grid-cols-4 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
          <div className="hidden lg:block w-[380px] p-5 space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load visits</p>
          <button
            onClick={() => mutate(CACHE_KEYS.visits)}
            className="px-4 py-2 bg-[#0070cc] text-white rounded-full ps-btn cursor-pointer active:scale-[0.98] transition-all duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f7fa]">
      <AppHeader activePage="log" />

      {/* 3-Column Layout */}
      <div id="main-content" className="max-w-[1400px] mx-auto flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 57px)' }}>

        {/* Left Column — Search + Groups + Favorites */}
        <div className="hidden lg:block lg:w-[300px] flex-shrink-0 border-r border-zinc-200/60 bg-white lg:overflow-y-auto lg:sticky lg:top-[57px]" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <div className="p-4">
            <EntryForm
              onEntryAdded={() => { mutate(CACHE_KEYS.visits); setSelectedData(null); }}
              copiedVisit={copiedVisit}
              onClearCopy={() => setCopiedVisit(null)}
              onAddNoShow={handleAddNoShow}
              addingNoShow={addingNoShow}
              externalSelected={true}
              onSelectedUpdate={setSelectedData}
            />
          </div>
        </div>

        {/* Center Column — Log Visit Form + KPI */}
        <div className="flex-1 p-5 lg:p-8">
          <div className="max-w-[640px] mx-auto">
            {/* Log Visit Header */}
            <h2 className="text-2xl font-light text-[#1f1f1f] tracking-tight">Log Visit</h2>
            <p className="text-sm text-zinc-400 mt-1 mb-6">Pick from favorites or search, then save.</p>

            {/* Mobile inline favorites + search */}
            <div className="lg:hidden mb-4">
              <EntryForm
                onEntryAdded={() => { mutate(CACHE_KEYS.visits); setSelectedData(null); }}
                copiedVisit={copiedVisit}
                onClearCopy={() => setCopiedVisit(null)}
                onAddNoShow={handleAddNoShow}
                addingNoShow={addingNoShow}
                externalSelected={true}
                onSelectedUpdate={setSelectedData}
              />
            </div>

            {/* Selected Procedures Card + Form */}
            <SelectedProceduresCard data={selectedData} />

          </div>
        </div>

        {/* Right Column — Visit Log */}
        <div className="lg:w-[380px] flex-shrink-0 lg:border-l border-zinc-200/60 bg-white lg:overflow-y-auto lg:sticky lg:top-[57px]" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <div className="p-4 lg:p-5">
            {/* Visit Log Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1f1f1f] tracking-tight">Visit Log</h2>
              <span className="text-xs text-zinc-400 font-medium">{todayVisitCount} today</span>
            </div>

            {/* Visit Feed */}
            <div className="space-y-2">
              {visits.length === 0 && (
                <div className="bg-zinc-50 rounded-xl border border-zinc-200/80 p-8 text-center">
                  <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-sm font-semibold text-zinc-700">No visits yet today</p>
                  <p className="text-xs text-zinc-400 mt-1">Search for HCPCS codes or use your favorites to log your first visit.</p>
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
                          {visit.date === getTodayString() ? `Today \u2014 ${formatDate(visit.date, { month: 'long', day: 'numeric' })}` : formatDate(visit.date, { month: 'short', day: 'numeric' })}
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
