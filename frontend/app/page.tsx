import { auth, signOut } from "@/auth";
import { HomeContent } from "@/components/auth/HomeContent";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Navigation Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">MyProdigy</h1>
          <div>
            {session ? (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Log Out
                </button>
              </form>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Home Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        {session ? (
          <HomeContent
            userName={session.user?.name || session.user?.email || "Player"}
            userId={session.user?.id}
          />
        ) : (
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Welcome to MyProdigy</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You are currently logged out. Please log in or create an account to start focus sessions.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


