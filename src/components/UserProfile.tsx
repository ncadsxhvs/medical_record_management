"use client";

import { useSession, signOut } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initial = (session.user.name || session.user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white lg:hidden flex-shrink-0 hover:bg-[#1eaedb] transition-colors duration-180"
        title="Sign Out"
      >
        {initial}
      </button>
      <div className="hidden lg:flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {session.user.name || session.user.email}
          </div>
          <div className="text-xs text-white/50">{session.user.email}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="ps-btn px-4 py-2 text-sm font-medium text-white bg-transparent border-2 border-white/30 active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
