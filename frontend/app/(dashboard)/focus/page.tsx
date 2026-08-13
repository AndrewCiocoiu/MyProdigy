import { Metadata } from "next";
import { FocusTimerView } from "@/components/timer/FocusTimerView";
import { SessionHistoryView } from "@/components/timer/SessionHistoryView";

export const metadata: Metadata = {
  title: "Focus Space & History - MyProdigy",
  description: "Start a synchronized focus timer with your partner and view your household's focus chronicle.",
};

export default function FocusPage() {
  return (
    <div className="space-y-12 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
          Cooperative Focus Space
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Sync your work cycles with your partner and earn shared home materials.
        </p>
      </div>

      {/* Live Focus Timer Controller */}
      <FocusTimerView />

      {/* Household Session History & Analytics */}
      <div className="mx-auto max-w-2xl border-t border-zinc-200/80 pt-8 dark:border-zinc-800">
        <SessionHistoryView />
      </div>
    </div>
  );
}
