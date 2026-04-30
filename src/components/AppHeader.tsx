'use client';

import UserProfile from './UserProfile';
import Skeleton from './Skeleton';

const NAV_ITEMS = [
  { key: 'log', label: 'Log', href: '/' },
  { key: 'analytics', label: 'Analytics', href: '/analytics' },
  { key: 'productivity', label: 'Productivity', href: '/productivity' },
] as const;

type ActivePage = (typeof NAV_ITEMS)[number]['key'];

interface AppHeaderProps {
  activePage: ActivePage;
}

export default function AppHeader({ activePage }: AppHeaderProps) {
  return (
    <div className="border-b border-zinc-200/60 bg-white px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">R</div>
        <h1 className="text-lg font-bold text-zinc-900 tracking-tight">RVU Tracker</h1>
        <div className="flex items-center gap-1 ml-4">
          {NAV_ITEMS.map(item =>
            item.key === activePage ? (
              <span key={item.key} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg">
                {item.label}
              </span>
            ) : (
              <a key={item.key} href={item.href} className="px-3 py-1.5 text-zinc-500 text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-colors">
                {item.label}
              </a>
            )
          )}
        </div>
        <div className="flex-1" />
        <UserProfile />
      </div>
    </div>
  );
}

export function AppHeaderSkeleton() {
  return (
    <div className="border-b border-zinc-200/60 bg-white px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}
