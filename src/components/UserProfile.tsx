"use client";

import { useSession, signOut } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
          {session.user.name || session.user.email}
        </div>
        <div className="text-xs text-gray-500">{session.user.email}</div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Sign Out
      </button>
    </div>
  );
}
