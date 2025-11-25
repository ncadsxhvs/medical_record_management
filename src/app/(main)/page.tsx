'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import { DEFAULTS } from '@/config/defaults';

interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  metadata: { title: string };
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SheetData | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const loadData = () => {
    setLoading(true);
    fetch('/api/sheets/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: DEFAULTS.SHEET_URL }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result.data);
        else setError(result.error);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const handleAdd = () => {
    if (!data) return;
    setFormData(Object.fromEntries(data.headers.map((h) => [h, ''])));
    setIsAdding(true);
    setEditingRow(null);
  };

  const handleEdit = (idx: number) => {
    if (!data) return;
    setFormData({ ...data.rows[idx] });
    setEditingRow(idx);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingRow(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      if (isAdding) {
        await fetch('/api/sheets/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: DEFAULTS.SHEET_URL, headers: data.headers, values: formData }),
        });
      } else if (editingRow !== null) {
        await fetch('/api/sheets/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: DEFAULTS.SHEET_URL, rowIndex: editingRow, headers: data.headers, values: formData }),
        });
      }
      handleCancel();
      loadData();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm('Delete this entry?')) return;
    setSaving(true);

    try {
      await fetch('/api/sheets/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: DEFAULTS.SHEET_URL, rowIndex: idx }),
      });
      loadData();
    } catch {
      setError('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isEditing = isAdding || editingRow !== null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* User Profile Header */}
        <div className="flex items-center justify-end mb-4">
          <UserProfile />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.metadata.title}</h1>
            <p className="text-sm text-gray-500">{data.rows.length} records</p>
          </div>
          {!isEditing && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Entry
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="font-semibold mb-3">{isAdding ? 'Add Entry' : 'Edit Entry'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {data.headers.map((header) => (
                <div key={header}>
                  <label className="text-xs text-gray-500 uppercase">{header}</label>
                  <input
                    type="text"
                    value={formData[header] || ''}
                    onChange={(e) => setFormData({ ...formData, [header]: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {data.rows.map((row, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {data.headers.map((header) => (
                  <div key={header}>
                    <p className="text-xs text-gray-500 uppercase">{header}</p>
                    <p className="text-sm font-medium text-gray-900">{row[header] || '-'}</p>
                  </div>
                ))}
              </div>
              {!isEditing && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(idx)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
