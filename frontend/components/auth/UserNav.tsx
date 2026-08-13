"use client";

import { signOut, useSession } from "next-auth/react";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-zinc-600 dark:text-zinc-300">
        Hi, <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{session.user.name || session.user.email}</strong>
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Sign Out
      </button>
    </div>
  );
}
