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
  const [showMobileForm, setShowMobileForm] = useState(false);

  useKeyboardShortcuts({
    'mod+k': () => {
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
      searchInput?.focus();
    },
    'mod+n': () => {
      setShowMobileForm(true);
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }, 100);
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="border-b border-zinc-200/60 bg-white px-5 py-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex flex-col lg:flex-row gap-4 p-5 max-w-7xl mx-auto">
          <div className="hidden lg:block w-[420px] space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
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
      <div id="main-content" className="max-w-7xl mx-auto flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 57px)' }}>
        {/* Left Panel — Entry Form (desktop only) */}
        <div className="hidden lg:block lg:w-[420px] xl:w-[460px] flex-shrink-0 border-r border-zinc-200/60 bg-white lg:overflow-y-auto lg:sticky lg:top-[57px]" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <div className="p-5">
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

        {/* Right Panel — Feed */}
        <div className="flex-1 p-5 lg:p-6">
          {/* Selected Procedures + Form Controls (desktop only, mobile uses FAB) */}
          <div className="hidden lg:block">
            <SelectedProceduresCard data={selectedData} />
          </div>

          {/* KPI Strip */}
          <div className="mt-4">
            <KPIStrip visits={visits} />
          </div>

          {/* Visit Feed */}
          <div className="mt-5 space-y-2">
            {visits.length === 0 && (
              <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-8 text-center">
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
                        {visit.date === getTodayString() ? 'Today' : formatDate(visit.date, { month: 'short', day: 'numeric' })}
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

      {/* Mobile bottom sheet */}
      {showMobileForm && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileForm(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-auto animate-[slideUp_300ms_ease-out]">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-zinc-300 rounded-full" />
            </div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Add Visit</p>
                <button
                  onClick={() => setShowMobileForm(false)}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <EntryForm
                onEntryAdded={() => { mutate(CACHE_KEYS.visits); setSelectedData(null); setShowMobileForm(false); }}
                copiedVisit={copiedVisit}
                onClearCopy={() => setCopiedVisit(null)}
                onAddNoShow={handleAddNoShow}
                addingNoShow={addingNoShow}
              />
            </div>
          </div>
        </div>
      )}

      {/* FAB - mobile only */}
      <button
        onClick={() => setShowMobileForm(true)}
        className="fixed bottom-6 right-4 w-14 h-14 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all z-30 lg:hidden"
        aria-label="Add visit"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

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
