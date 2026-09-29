"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { siteConfig } from "@/config/siteConfig";
import { calculateFare } from "@/lib/fare";

export interface BookingRow {
  id: string;
  booking_code: string;
  customer_name?: string | null;
  name?: string | null;
  customer_phone?: string | null;
  phone?: string | null;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  drop_address: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  distance_km: number | null;
  vehicle_id: string | null;
  vehicle_name?: string | null;
  service_mode?: string | null;
  drive_mode?: string | null;
  trip_type: string | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  days: number | null;
  passengers?: number | null;
  total_fare?: number | null;
  fare_total?: number | null;
  travel_datetime: string | null;
  status: "new" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

type StatusFilter = "all" | "new" | "confirmed" | "completed" | "cancelled";

// Helper to extract Supabase project ref for sync validation (Part A3)
const getProjectRef = (urlStr: string) => {
  const match = urlStr.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : "unknown";
};

// Format duration estimate from distance
function formatDuration(distanceKm: number | null): string {
  if (!distanceKm || distanceKm <= 0) return "N/A";
  const totalMins = Math.round((distanceKm / 45) * 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `~${mins} min`;
  return `~${hours} hr${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} min` : ""}`.trim();
}

// Format travel date & time
function formatTravelDateTime(
  dt: string | null,
  date?: string | null,
  time?: string | null
): string {
  const raw = dt || (date && time ? `${date} ${time}` : date || time || "");
  if (!raw) return "Not specified";
  try {
    const d = new Date(raw.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {}
  return raw;
}

// Format phone for display (+91 98765 43210)
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const num = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (num.length === 10) {
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return raw.startsWith("+") ? raw : `+91 ${raw}`;
}

// Clean phone for tel: link
function cleanPhoneForTel(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return digits;
}

// Compute full fare breakdown
function getFareBreakdown(booking: BookingRow) {
  const vehicle =
    siteConfig.vehicles.find((v) => v.id === booking.vehicle_id) ||
    siteConfig.vehicles[0];
  const distanceKm = booking.distance_km || 0;
  const tripType = (
    booking.trip_type === "round-trip" ? "round-trip" : "one-way"
  ) as "one-way" | "round-trip";
  const driveMode = (
    booking.drive_mode === "self-drive" || booking.service_mode === "self-drive"
      ? "self-drive"
      : "with-driver"
  ) as "with-driver" | "self-drive";
  const days = booking.days || 1;

  try {
    const result = calculateFare({
      vehicle,
      distanceKm,
      tripType,
      driveMode,
      days,
    });

    const isRoundTrip = tripType === "round-trip";
    const billableKm = result.billableKm;
    const baseFare = result.baseRatePerKm * billableKm;
    const driverBata =
      driveMode === "with-driver" && !result.isShortDistance
        ? siteConfig.driverBataPerDay * days
        : 0;

    return {
      vehicleName: vehicle.name,
      seats: vehicle.seats,
      billableKm,
      baseFare: Math.round(baseFare),
      driverBata,
      fuelAdjustment: Math.round(result.fuelAdjustmentTotal),
      total: booking.fare_total ?? booking.total_fare ?? result.total,
      notes: result.notes,
      breakdownLines: result.breakdown,
    };
  } catch {
    const total = booking.fare_total ?? booking.total_fare ?? 0;
    return {
      vehicleName: booking.vehicle_name || vehicle.name,
      seats: vehicle.seats,
      billableKm: distanceKm,
      baseFare: total,
      driverBata: 0,
      fuelAdjustment: 0,
      total,
      notes: ["Tolls and permits extra as per actuals"],
      breakdownLines: [],
    };
  }
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Dashboard state
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Part A3: Console check for project ref sync
  useEffect(() => {
    const adminUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://yxefcwoirmdlqadqntjm.supabase.co";
    console.log(
      `[SUPABASE_SYNC_CHECK] Admin Supabase URL Ref: ${getProjectRef(adminUrl)}`
    );
  }, []);

  // Authentication session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch bookings from database
  const fetchBookings = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoadingBookings(true);
    }
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setBookings((data as BookingRow[]) || []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setFetchError(err.message || "Failed to load bookings");
    } finally {
      if (showLoadingSpinner) {
        setLoadingBookings(false);
      }
    }
  };

  // Realtime subscription + auto-polling interval (Part A7: no manual refresh needed)
  useEffect(() => {
    if (!session) return;

    fetchBookings(true);

    // 1. Supabase Realtime Channel
    const channel = supabase
      .channel("admin-bookings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          console.log("[Admin Realtime] Booking change detected:", payload);
          fetchBookings(false);
        }
      )
      .subscribe();

    // 2. Fallback polling every 10 seconds in case postgres replication isn't toggled
    const pollInterval = setInterval(() => {
      fetchBookings(false);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (err: any) {
      setAuthError(err?.message || "An error occurred during login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) {
        alert(`Failed to update status: ${error.message}`);
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: newStatus as BookingRow["status"] }
            : b
        )
      );
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllExpand = () => {
    const allExpanded =
      filteredBookings.length > 0 &&
      filteredBookings.every((b) => expandedIds[b.id]);
    const nextState: Record<string, boolean> = {};
    if (!allExpanded) {
      filteredBookings.forEach((b) => {
        nextState[b.id] = true;
      });
    }
    setExpandedIds(nextState);
  };

  // Auth Loading View
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Login View
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {siteConfig.businessName} Admin
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Sign in to manage bookings and customer trips
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <svg
                className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>{authError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@srtravels.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-medium transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtering & Stats calculation
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === "all" ? true : b.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const customerName = (b.customer_name || b.name || "").toLowerCase();
    const customerPhone = (b.customer_phone || b.phone || "").toLowerCase();
    const code = (b.booking_code || "").toLowerCase();
    const pickup = (b.pickup_address || "").toLowerCase();
    const drop = (b.drop_address || "").toLowerCase();

    const matchesQuery =
      !query ||
      code.includes(query) ||
      customerName.includes(query) ||
      customerPhone.includes(query) ||
      pickup.includes(query) ||
      drop.includes(query);

    return matchesStatus && matchesQuery;
  });

  const countNew = bookings.filter((b) => b.status === "new").length;
  const countConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const countCompleted = bookings.filter((b) => b.status === "completed").length;
  const countCancelled = bookings.filter((b) => b.status === "cancelled").length;

  const formatWhatsAppUrl = (
    phone: string,
    bookingCode: string,
    name: string
  ) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone =
      cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${name}, regarding your booking ${bookingCode} with ${siteConfig.businessName}:`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const formatGoogleMapsUrl = (
    lat: number | null,
    lng: number | null,
    address: string | null
  ) => {
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`;
    }
    return null;
  };

  const formatGoogleDirectionsUrl = (
    pickupAddress: string | null,
    dropAddress: string | null
  ) => {
    if (pickupAddress && dropAddress) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        pickupAddress
      )}&destination=${encodeURIComponent(dropAddress)}`;
    }
    if (dropAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        dropAddress
      )}`;
    }
    if (pickupAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        pickupAddress
      )}`;
    }
    return "https://www.google.com/maps";
  };

  const isAllExpanded =
    filteredBookings.length > 0 &&
    filteredBookings.every((b) => expandedIds[b.id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-emerald-950">
              SR
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-sm sm:text-base leading-tight truncate">
                {siteConfig.businessName} Admin
              </h1>
              <p className="text-[10px] text-slate-400 truncate max-w-[170px] sm:max-w-xs">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchBookings(true)}
              disabled={loadingBookings}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh bookings"
            >
              <svg
                className={`w-3.5 h-3.5 ${loadingBookings ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSignOut}
              className="py-2 px-2.5 sm:px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-300 text-xs font-semibold border border-rose-500/20 transition flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Metric Cards: 2 per row on <480px screens, 4 on desktop (Part C10) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </div>
            <div className="text-xl sm:text-3xl font-black text-white mt-0.5">
              {bookings.length}
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              New
            </div>
            <div className="text-xl sm:text-3xl font-black text-amber-300 mt-0.5">
              {countNew}
            </div>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Confirmed
            </div>
            <div className="text-xl sm:text-3xl font-black text-blue-300 mt-0.5">
              {countConfirmed}
            </div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4">
            <div className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Completed
            </div>
            <div className="text-xl sm:text-3xl font-black text-emerald-300 mt-0.5">
              {countCompleted}
            </div>
          </div>
        </div>

        {/* Sticky Search & Filter Bar (Part C10) */}
        <div className="sticky top-[57px] sm:top-[65px] z-20 bg-slate-950/95 backdrop-blur-md py-2.5 space-y-2.5 border-b border-slate-800/80">
          {/* Search Box: Full width */}
          <div className="relative w-full">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, customer name, phone, or location..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs: Horizontal scroll on mobile (Part C10) + Global Expand/Collapse */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 touch-pan-x">
              {(
                [
                  { id: "all", label: "All", count: bookings.length },
                  { id: "new", label: "New", count: countNew },
                  { id: "confirmed", label: "Confirmed", count: countConfirmed },
                  { id: "completed", label: "Completed", count: countCompleted },
                  { id: "cancelled", label: "Cancelled", count: countCancelled },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                      active
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        active
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredBookings.length > 0 && (
              <button
                onClick={toggleAllExpand}
                className="shrink-0 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold transition"
              >
                {isAllExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}
          </div>
        </div>

        {/* Error Alert with Retry */}
        {fetchError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span>{fetchError}</span>
            <button
              onClick={() => fetchBookings(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings List */}
        {loadingBookings && bookings.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-white font-bold text-sm">No Bookings Found</h3>
            <p className="text-slate-400 text-xs mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search keywords."
                : "No customer bookings have been placed yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredBookings.map((booking) => {
              const isExpanded = !!expandedIds[booking.id];
              const customerName =
                booking.customer_name || booking.name || "Customer";
              const rawPhone = booking.customer_phone || booking.phone || "";
              const telPhone = cleanPhoneForTel(rawPhone);
              const displayPhone = formatPhoneDisplay(rawPhone);

              const pickupAddress =
                booking.pickup_address || "Not specified";
              const dropAddress = booking.drop_address || "Not specified";

              const pickupMapUrl = formatGoogleMapsUrl(
                booking.pickup_lat,
                booking.pickup_lng,
                booking.pickup_address
              );
              const dropMapUrl = formatGoogleMapsUrl(
                booking.drop_lat,
                booking.drop_lng,
                booking.drop_address
              );
              const directionsMapUrl = formatGoogleDirectionsUrl(
                booking.pickup_address,
                booking.drop_address
              );

              const fareInfo = getFareBreakdown(booking);

              return (
                <div
                  key={booking.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 overflow-hidden"
                >
                  {/* Top Bar: Booking Code + Copy Button + Status Dropdown (Part B8) */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-400 tracking-wider">
                        {booking.booking_code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(booking.booking_code)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-semibold flex items-center gap-1 shrink-0"
                        title="Copy booking code"
                      >
                        {copiedCode === booking.booking_code ? (
                          <>
                            <span className="text-emerald-400">✓</span>
                            <span className="text-[10px] text-emerald-400">
                              Copied
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3 h-3 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              />
                            </svg>
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Status Dropdown with Colored Dot (Part B8) */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <select
                        value={booking.status}
                        disabled={updatingId === booking.id}
                        onChange={(e) =>
                          handleStatusChange(booking.id, e.target.value)
                        }
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none transition cursor-pointer appearance-none ${
                          booking.status === "new"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : booking.status === "confirmed"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                            : booking.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        <option value="new" className="bg-slate-900 text-white">
                          🟡 New
                        </option>
                        <option
                          value="confirmed"
                          className="bg-slate-900 text-white"
                        >
                          🔵 Confirmed
                        </option>
                        <option
                          value="completed"
                          className="bg-slate-900 text-white"
                        >
                          🟢 Completed
                        </option>
                        <option
                          value="cancelled"
                          className="bg-slate-900 text-white"
                        >
                          🔴 Cancelled
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Header Row: Customer Name & Phone */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-extrabold text-white truncate">
                        {customerName}
                      </div>
                      <a
                        href={`tel:${telPhone}`}
                        className="text-xs font-mono font-semibold text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{displayPhone}</span>
                      </a>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total Fare
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-400">
                        ₹{fareInfo.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Collapsed Compact Summary (Part B9) */}
                  <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800/80 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-slate-400 font-medium">From: </span>
                        <span className="text-slate-200 font-semibold">
                          {pickupAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-slate-400 font-medium">To: </span>
                        <span className="text-slate-200 font-semibold">
                          {dropAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span>
                        📅{" "}
                        {formatTravelDateTime(
                          booking.travel_datetime,
                          booking.pickup_date,
                          booking.pickup_time
                        )}
                      </span>
                      <span>
                        📍 {booking.distance_km || 0} km (
                        {formatDuration(booking.distance_km)})
                      </span>
                    </div>
                  </div>

                  {/* Expand / Collapse Details Button (Part B9) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(booking.id)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>
                        {isExpanded ? "Hide Full Trip Details" : "Show Full Trip Details"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded Full Details Section (Part B8 & B9) */}
                  {isExpanded && (
                    <div className="space-y-3.5 pt-2 border-t border-slate-800">
                      {/* Full Addresses with Direct Google Maps Links */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Full Route &amp; Locations
                        </div>

                        {/* Full Pickup Address */}
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Full Pickup Address:
                              </span>
                              <p className="text-xs font-medium text-slate-200 break-words">
                                {pickupAddress}
                              </p>
                              {pickupMapUrl && (
                                <a
                                  href={pickupMapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-1 font-semibold"
                                >
                                  <span>Open Pickup in Google Maps</span>
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Full Drop Address */}
                        <div className="space-y-1 pt-2 border-t border-slate-800/80">
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                Full Drop Address:
                              </span>
                              <p className="text-xs font-medium text-slate-200 break-words">
                                {dropAddress}
                              </p>
                              {dropMapUrl && (
                                <a
                                  href={dropMapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:underline mt-1 font-semibold"
                                >
                                  <span>Open Drop in Google Maps</span>
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trip & Vehicle Metadata Grid */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Trip &amp; Vehicle Specifications
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Service Mode
                            </span>
                            <span className="text-white font-semibold">
                              {booking.drive_mode === "self-drive" ||
                              booking.service_mode === "self-drive"
                                ? "Self Drive"
                                : "With Driver"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Trip Type
                            </span>
                            <span className="text-white font-semibold">
                              {booking.trip_type === "round-trip"
                                ? "Round Trip"
                                : "One Way"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Trip Duration
                            </span>
                            <span className="text-white font-semibold">
                              {booking.days || 1}{" "}
                              {(booking.days || 1) === 1 ? "Day" : "Days"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Distance &amp; Duration
                            </span>
                            <span className="text-white font-semibold">
                              {booking.distance_km || 0} km (
                              {formatDuration(booking.distance_km)})
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Vehicle &amp; Capacity
                            </span>
                            <span className="text-white font-semibold">
                              {fareInfo.vehicleName} ({fareInfo.seats} Seats)
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Passengers
                            </span>
                            <span className="text-white font-semibold">
                              {booking.passengers || 1} Passenger
                              {(booking.passengers || 1) > 1 ? "s" : ""}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Pickup Date &amp; Time
                            </span>
                            <span className="text-white font-semibold">
                              {formatTravelDateTime(
                                booking.travel_datetime,
                                booking.pickup_date,
                                booking.pickup_time
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Booked On
                            </span>
                            <span className="text-slate-300 font-medium text-[11px]">
                              {new Date(booking.created_at).toLocaleString(
                                "en-IN",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Full Fare Breakdown (Part B8) */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Full Fare Breakdown
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Base Fare ({fareInfo.billableKm} km):</span>
                            <span className="font-semibold text-white">
                              ₹{fareInfo.baseFare.toLocaleString("en-IN")}
                            </span>
                          </div>

                          {fareInfo.driverBata > 0 && (
                            <div className="flex items-center justify-between text-slate-300">
                              <span>Driver Bata ({booking.days || 1} day):</span>
                              <span className="font-semibold text-white">
                                ₹{fareInfo.driverBata.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          {fareInfo.fuelAdjustment > 0 && (
                            <div className="flex items-center justify-between text-slate-300">
                              <span>Fuel Adjustment:</span>
                              <span className="font-semibold text-amber-300">
                                +₹{fareInfo.fuelAdjustment.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
                            <span className="text-white">Total Amount:</span>
                            <span className="text-emerald-400 font-black text-base">
                              ₹{fareInfo.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {fareInfo.notes && fareInfo.notes.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                            {fareInfo.notes.map((note, idx) => (
                              <p key={idx}>• {note}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row: Min 44px tap targets (Part C10) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                    {/* Call Button */}
                    <a
                      href={`tel:${telPhone}`}
                      className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>Call</span>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={formatWhatsAppUrl(
                        rawPhone,
                        booking.booking_code,
                        customerName
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950 transition flex items-center justify-center gap-1.5"
                    >
                      <svg
                        className="w-4 h-4 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.187 4.271-1.118z" />
                      </svg>
                      <span>WhatsApp</span>
                    </a>

                    {/* Google Maps Directions Button */}
                    <a
                      href={directionsMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 active:scale-95 text-blue-300 font-bold text-xs border border-blue-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Maps</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
