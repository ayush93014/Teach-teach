"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="max-page py-8">
      <div className="card space-y-2">
        <p className="text-sm text-red-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
