import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - MyProdigy",
  description: "Sign in to join your cozy multiplayer focus environment.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cozy-light px-4 dark:bg-cozy-dark">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Welcome Back</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to start focus sessions with your partner.
          </p>
        </div>
        
        {/* Placeholder for Auth Form Component */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-primary-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <button className="w-full rounded-lg bg-primary-500 py-3 font-semibold text-white transition hover:bg-primary-600">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
