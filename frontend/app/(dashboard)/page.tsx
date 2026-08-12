import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - MyProdigy",
  description: "Check in on your pet, household state, and local weather.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Your Shared Home</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Check on your virtual pet and upgrade your house together.
          </p>
        </div>
      </div>

      {/* Grid Layout for Game, Pet, and Weather */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* House / Town View Card */}
        <div className="md:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Household Status</h3>
          <div className="flex aspect-video items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
            {/* HouseRenderer Component Placeholder */}
            <span>Pixel Art House Render View</span>
          </div>
        </div>

        {/* Pet & Weather Cards */}
        <div className="space-y-6">
          {/* Pet State Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Your Pet</h3>
            <div className="flex h-36 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              {/* PetSprite Component Placeholder */}
              <span>Pet Sprite (Idle)</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Level 1</span>
                <span className="text-zinc-500">Exp: 0/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full w-1/4 bg-primary-500" />
              </div>
            </div>
          </div>

          {/* Weather Overlay Info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Weather</h3>
            <div className="flex h-24 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              {/* WeatherOverlay Component Placeholder */}
              <span>No active weather patterns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
