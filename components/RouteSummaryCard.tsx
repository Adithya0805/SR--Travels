"use client";

import { useBookingStore } from "@/store/useBookingStore";

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hrs ${mins} mins` : `${hours} hrs`;
}

export default function RouteSummaryCard() {
  const {
    pickup,
    drop,
    route,
    isRouteLoading,
    routeError,
    fetchRoute,
    setStep,
    resetBooking,
  } = useBookingStore();

  // Route calculation skeleton loader
  if (isRouteLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-6 space-y-4 max-w-md mx-auto select-none transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto" />
        
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 animate-pulse rounded w-1/3" />
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="h-7 bg-slate-200 animate-pulse rounded w-2/3" />
        </div>

        <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="h-3 bg-slate-200 animate-pulse rounded w-3/4" />
          <div className="h-3 bg-slate-200 animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Route calculation failure state
  if (routeError) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto" />
        
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Route Calculation Failed</span>
          </div>
          <p className="text-xs text-red-600">{routeError}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("drop")}
            className="flex-1 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 min-h-[44px]"
          >
            Change Drop Point
          </button>
          <button
            type="button"
            onClick={fetchRoute}
            className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Retry Route
          </button>
        </div>
      </div>
    );
  }

  if (!route) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto select-none transition-transform duration-250 ease-out animate-in slide-in-from-bottom-5 duration-250">
      <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-1" />

      {/* Main Distance & Duration Badge */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Driving Distance & Time
          </span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {route.distanceKm} km <span className="text-slate-400 font-normal">&bull;</span> {formatDuration(route.durationMin)}
          </div>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
          <svg
            className="w-6 h-6 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
          </svg>
        </div>
      </div>

      {/* Route Trip Summary Details */}
      <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Pickup Point
            </span>
            <span className="font-semibold text-slate-800 truncate block">
              {pickup?.shortName || pickup?.displayName || "Pickup Point"}
            </span>
          </div>
        </div>

        <div className="w-0.5 h-3 bg-slate-300 ml-1.5" />

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Drop Point
            </span>
            <span className="font-semibold text-slate-800 truncate block">
              {drop?.shortName || drop?.displayName || "Drop Point"}
            </span>
          </div>
        </div>
      </div>

      {/* SINGLE PRIMARY ACTION BUTTON */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setStep("details")}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Configure Trip Details</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>

        {/* SUBTLE SECONDARY ACTIONS */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("drop")}
            className="flex-1 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all min-h-[40px]"
          >
            Change Drop
          </button>
          <button
            type="button"
            onClick={resetBooking}
            className="px-4 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs active:scale-95 transition-all min-h-[40px]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
