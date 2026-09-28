"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { siteConfig } from "@/config/siteConfig";

export interface BookingRow {
  id: string;
  booking_code: string;
  name: string;
  phone: string;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  drop_address: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  distance_km: number | null;
  trip_type: string | null;
  drive_mode: string | null;
  days: number | null;
  vehicle_id: string | null;
  fare_total: number | null;
  travel_datetime: string | null;
  status: "new" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

type StatusFilter = "all" | "new" | "confirmed" | "completed" | "cancelled";

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

  const fetchBookings = async () => {
    if (!session) return;
    setLoadingBookings(true);
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
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
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
          b.id === bookingId ? { ...b, status: newStatus as BookingRow["status"] } : b
        )
      );
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Login View
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
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
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {siteConfig.businessName} Admin
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Sign in to manage bookings and customer trips
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
              <svg
                className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@srtravels.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
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
    const matchesQuery =
      !query ||
      b.booking_code.toLowerCase().includes(query) ||
      b.name.toLowerCase().includes(query) ||
      b.phone.toLowerCase().includes(query) ||
      (b.pickup_address && b.pickup_address.toLowerCase().includes(query)) ||
      (b.drop_address && b.drop_address.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  const countNew = bookings.filter((b) => b.status === "new").length;
  const countConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const countCompleted = bookings.filter((b) => b.status === "completed").length;
  const countCancelled = bookings.filter((b) => b.status === "cancelled").length;

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId) return "Standard Vehicle";
    const found = siteConfig.vehicles.find((v) => v.id === vehicleId);
    return found ? found.name : vehicleId.toUpperCase();
  };

  const formatWhatsAppUrl = (phone: string, bookingCode: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${name}, regarding your booking ${bookingCode} with ${siteConfig.businessName}:`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const formatGoogleMapsUrl = (lat: number | null, lng: number | null, address: string | null) => {
    if (lat && lng) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              SR
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">
                {siteConfig.businessName} Admin
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              disabled={loadingBookings}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition border border-slate-700"
              title="Refresh bookings"
            >
              <svg
                className={`w-4 h-4 ${loadingBookings ? "animate-spin" : ""}`}
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
            </button>

            <button
              onClick={handleSignOut}
              className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-300 text-xs font-semibold border border-rose-500/20 transition flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
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
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Bookings
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {bookings.length}
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
            <div className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              New
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">
              {countNew}
            </div>
          </div>

          <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-4">
            <div className="text-xs font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Confirmed
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-300 mt-1">
              {countConfirmed}
            </div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Completed
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-1">
              {countCompleted}
            </div>
          </div>
        </div>

        {/* Control Bar: Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          {/* Status Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
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

          {/* Search Box */}
          <div className="relative w-full md:w-72">
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
              placeholder="Search code, name, phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error alert if fetch failed */}
        {fetchError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <span>{fetchError}</span>
            <button
              onClick={fetchBookings}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings List */}
        {loadingBookings ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
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
            <h3 className="text-white font-semibold text-base">
              No Bookings Found
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search terms."
                : "No customer bookings have been placed yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => {
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

              return (
                <div
                  key={booking.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 shadow-lg space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                        {booking.booking_code}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(booking.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Status Select dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Status:
                      </span>
                      <select
                        value={booking.status}
                        disabled={updatingId === booking.id}
                        onChange={(e) =>
                          handleStatusChange(booking.id, e.target.value)
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none transition cursor-pointer ${
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

                  {/* Customer & Quick Action Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Customer Details
                      </div>
                      <div className="text-base font-semibold text-white">
                        {booking.name}
                      </div>
                      <div className="text-sm font-mono text-emerald-300">
                        +91 {booking.phone}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 md:justify-end">
                      <a
                        href={`tel:${booking.phone}`}
                        className="flex-1 md:flex-none py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400"
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

                      <a
                        href={formatWhatsAppUrl(
                          booking.phone,
                          booking.booking_code,
                          booking.name
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none py-2 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 active:scale-95 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                      >
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.187 4.271-1.118z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Route & Trip Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
                    {/* Pickup & Drop Addresses */}
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-400 font-medium block">
                            Pickup Location:
                          </span>
                          <span className="text-slate-200 font-medium">
                            {booking.pickup_address || "Not specified"}
                          </span>
                          {pickupMapUrl && (
                            <a
                              href={pickupMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <span>View Pickup on Google Maps</span>
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

                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-400 font-medium block">
                            Drop Location:
                          </span>
                          <span className="text-slate-200 font-medium">
                            {booking.drop_address || "Not specified"}
                          </span>
                          {dropMapUrl && (
                            <a
                              href={dropMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <span>View Drop on Google Maps</span>
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

                    {/* Trip Summary Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-t md:border-t-0 md:border-l border-slate-800 pt-2.5 md:pt-0 md:pl-4">
                      <div>
                        <span className="text-slate-400 block">Vehicle:</span>
                        <span className="text-white font-medium">
                          {getVehicleName(booking.vehicle_id)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Service:</span>
                        <span className="text-white font-medium capitalize">
                          {booking.drive_mode === "with-driver"
                            ? "With Driver"
                            : "Self Drive"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Trip Type:</span>
                        <span className="text-white font-medium capitalize">
                          {booking.trip_type === "one-way"
                            ? "One Way"
                            : "Round Trip"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Duration:</span>
                        <span className="text-white font-medium">
                          {booking.days || 1} {booking.days === 1 ? "Day" : "Days"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Distance:</span>
                        <span className="text-white font-medium">
                          {booking.distance_km || 0} km
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Travel Date:</span>
                        <span className="text-white font-medium">
                          {booking.travel_datetime || "N/A"}
                        </span>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">
                          Total Fare:
                        </span>
                        <span className="text-emerald-400 font-bold text-base">
                          ₹{booking.fare_total ? booking.fare_total.toLocaleString("en-IN") : 0}
                        </span>
                      </div>
                    </div>
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
