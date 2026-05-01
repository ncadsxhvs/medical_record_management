'use client';

import useSWR, { mutate } from 'swr';
import { BonusSettings, getDefaultSettings } from '@/lib/bonusSettings';
import { fetcher } from '@/lib/fetcher';
import { CACHE_KEYS } from '@/lib/cache-keys';

export default function ReminderToggle() {
  const { data: dbSettings } = useSWR<BonusSettings>(CACHE_KEYS.settings, fetcher);
  const settings = dbSettings || getDefaultSettings();

  const toggle = async () => {
    const updated = { ...settings, reminderEnabled: !settings.reminderEnabled };
    mutate(CACHE_KEYS.settings, updated, false);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    mutate(CACHE_KEYS.settings);
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[#1f1f1f]">Daily Reminder</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Email at 5 PM if no visits logged</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={settings.reminderEnabled}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
          settings.reminderEnabled ? 'bg-[#0070cc]' : 'bg-zinc-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
