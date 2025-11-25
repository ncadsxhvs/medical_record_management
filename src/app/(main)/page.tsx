'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import EntryForm from '@/components/EntryForm';
import { Entry } from '@/types';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/entries')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch entries');
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setEntries(data);
          } else {
            console.error('Fetched data is not an array:', data);
            setEntries([]);
          }
        })
        .catch((error) => {
          console.error(error);
          setEntries([]); // Set to empty array on error
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    } else {
      fetchEntries();
    }
  }, [status, router, fetchEntries]);

  const handleRemove = (id: number) => {
    fetch(`/api/entries/${id}`, { method: 'DELETE' })
      .then(() => fetchEntries());
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
          <EntryForm onEntryAdded={fetchEntries} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Entries</h2>
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">HCPCS</p>
                  <p className="text-sm font-medium text-gray-900">{entry.hcpcs}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Work RVU</p>
                  <p className="text-sm font-medium text-gray-900">{entry.work_rvu}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}