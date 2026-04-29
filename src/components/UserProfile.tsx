"use client";

import { useSession, signOut } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-medium text-zinc-900">
          {session.user.name || session.user.email}
        </div>
        <div className="text-xs text-zinc-500">{session.user.email}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 active:scale-[0.98] transition-all duration-150"
      >
        Sign Out
      </button>
    </div>
  );
}
