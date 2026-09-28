"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useBookingStore, LocationPoint } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { LogoIcon } from "@/components/Logo";
import OfflineBanner from "@/components/OfflineBanner";
import HomeScreen from "@/components/screens/HomeScreen";
import VehiclesScreen from "@/components/screens/VehiclesScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import DoneScreen from "@/components/DoneScreen";
import BottomTabBar, { TabId } from "@/components/BottomTabBar";
import TripsView from "@/components/tabs/TripsView";
import TariffView from "@/components/tabs/TariffView";
import ContactView from "@/components/tabs/ContactView";
import { prefetchMapChunks } from "@/lib/prefetchMap";

// Map components loaded strictly on-demand via next/dynamic (ssr: false)
const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white gap-3 select-none">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold tracking-wide">Loading Map Picker...</p>
    </div>
  ),
});

const RoutePreview = dynamic(() => import("@/components/map/RoutePreview"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">
      Loading route preview...
    </div>
  ),
});

export default function Home() {
  const {
    screen,
    pickup,
    drop,
    route,
    setPickup,
    setDrop,
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState<TabId>("book");
  const [mapPickerTarget, setMapPickerTarget] = useState<"pickup" | "drop" | null>(null);
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);

  // Requirement 4: Prefetch map chunks using requestIdleCallback after Home renders
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          prefetchMapChunks();
        });
      } else {
        const timer = setTimeout(() => {
          prefetchMapChunks();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleOpenMapPicker = (target: "pickup" | "drop") => {
    setMapPickerTarget(target);
  };

  const handleConfirmLocation = (loc: LocationPoint) => {
    if (mapPickerTarget === "pickup") {
      setPickup(loc);
    } else if (mapPickerTarget === "drop") {
      setDrop(loc);
    }
    setMapPickerTarget(null);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#1c2d4f] text-slate-800 select-none overflow-hidden font-poppins">
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Persistent Floating Header: Logo (monogram 24px) + Call Icon Button */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 pt-3.5 pb-2 bg-gradient-to-b from-[#1c2d4f] via-[#1c2d4f]/90 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between pointer-events-auto">
          {/* Left: Brand Pill with 24px monogram */}
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 px-3.5 py-1.5 pointer-events-auto">
            <LogoIcon height={24} />
            <span className="text-sm font-black text-slate-900 tracking-tight">
              {siteConfig.businessName}
            </span>
          </div>

          {/* Right: Direct Call button with tel: link from siteConfig */}
          <a
            href={`tel:${siteConfig.phone}`}
            aria-label={`Call ${siteConfig.businessName}`}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all pointer-events-auto"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Screen Container with bottom padding for fixed tab bar */}
      <main className="flex-1 w-full h-full overflow-y-auto px-4 pt-18 pb-24">
        {activeTab === "book" && (
          <>
            {screen === "home" && (
              <HomeScreen onOpenMapPicker={handleOpenMapPicker} />
            )}
            {screen === "vehicles" && (
              <VehiclesScreen />
            )}
            {screen === "review" && (
              <ReviewScreen
                onOpenRoutePreview={() => setShowRouteModal(true)}
              />
            )}
            {screen === "done" && <DoneScreen />}
          </>
        )}

        {activeTab === "trips" && (
          <TripsView
            onSelectTripToRefill={() => {
              setActiveTab("book");
            }}
          />
        )}

        {activeTab === "tariff" && <TariffView />}

        {activeTab === "contact" && <ContactView />}
      </main>

      {/* Fixed Bottom Tab Bar: Book | Trips | Tariff | Contact */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Map Picker Modal (rendered ONLY when user opens it) */}
      {mapPickerTarget && (
        <MapPicker
          target={mapPickerTarget}
          initialLocation={mapPickerTarget === "pickup" ? pickup : drop}
          onConfirm={handleConfirmLocation}
          onClose={() => setMapPickerTarget(null)}
        />
      )}

      {/* Large Route Preview Modal (rendered ONLY when user clicks "View larger") */}
      {showRouteModal && pickup && drop && route && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 flex-1 flex flex-col overflow-hidden max-w-lg w-full mx-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800">Route Map</h3>
                <p className="text-[11px] text-slate-400">
                  {route.distanceKm} km &bull; ~{route.durationMin} mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRouteModal(false)}
                aria-label="Close route map"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold active:scale-95 transition-transform"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 w-full mt-3 rounded-2xl overflow-hidden relative">
              <RoutePreview
                pickup={pickup}
                drop={drop}
                route={route}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
