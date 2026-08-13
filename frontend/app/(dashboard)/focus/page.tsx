import { Metadata } from "next";
import { FocusTimerView } from "@/components/timer/FocusTimerView";

export const metadata: Metadata = {
  title: "Focus Session - MyProdigy",
  description: "Start a synchronized focus timer with your partner, earn shared resources, and care for your pet.",
};

export default function FocusPage() {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">Cooperative Focus Space</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Sync your work cycles with your partner and earn shared home materials.
        </p>
      </div>

      <FocusTimerView />
    </div>
  );
}
