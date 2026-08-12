import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Session - MyProdigy",
  description: "Start a focus timer, earn resources, and level up your pet.",
};

export default function FocusPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">Focus Timer</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Work together in real-time or complete solo focus sprints.
        </p>
      </div>

      {/* Timer Container Card */}
      <div className="rounded-3xl bg-white p-8 shadow-md border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-8">
        <div className="text-6xl font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-50">
          {/* SyncTimer Component Placeholder */}
          25:00
        </div>

        <div className="flex justify-center gap-4">
          <button className="rounded-full bg-primary-500 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-600">
            Start Session
          </button>
          <button className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            Select Duration
          </button>
        </div>
      </div>

      {/* Session type description */}
      <div className="rounded-2xl bg-zinc-100 p-6 dark:bg-zinc-800">
        <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-50">Timer modes</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Solo sessions generate resources like wood and stone. Joint sessions with your partner let you upgrade the household.
        </p>
      </div>
    </div>
  );
}
