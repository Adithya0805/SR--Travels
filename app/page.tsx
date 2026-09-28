"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useBookingStore, LocationPoint } from "@/store/useBookingStore";
import { siteConfig } from "@/config/siteConfig";
import { LogoIcon } from "@/components/Logo";
import SideDrawer from "@/components/SideDrawer";
import OfflineBanner from "@/components/OfflineBanner";
import HomeScreen from "@/components/screens/HomeScreen";
import VehiclesScreen from "@/components/screens/VehiclesScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import DoneScreen from "@/components/DoneScreen";
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
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white gap-3 select-none">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold tracking-wide">Loading Route Map...</p>
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

  // Map modals visibility state
  const [mapPickerTarget, setMapPickerTarget] = useState<"pickup" | "drop" | null>(null);
  const [showRoutePreview, setShowRoutePreview] = useState<boolean>(false);

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
    <div className="relative w-screen h-screen flex flex-col bg-slate-900 text-slate-800 select-none overflow-hidden font-poppins">
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Persistent Floating Header: Logo (monogram 24px) + SideDrawer Hamburger */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between pointer-events-auto">
          {/* Left: Brand Pill with 24px monogram */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 px-3.5 py-1.5 pointer-events-auto">
            <LogoIcon height={24} />
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              {siteConfig.businessName}
            </span>
          </div>

          {/* Right: Side Drawer Menu trigger */}
          <SideDrawer />
        </div>
      </header>

      {/* Main Screen Container with smooth scroll & transition */}
      <main className="flex-1 w-full h-full overflow-y-auto px-4 pt-20 pb-6">
        {screen === "home" && (
          <HomeScreen onOpenMapPicker={handleOpenMapPicker} />
        )}

        {screen === "vehicles" && (
          <VehiclesScreen
            onOpenRoutePreview={() => setShowRoutePreview(true)}
          />
        )}

        {screen === "review" && (
          <ReviewScreen
            onOpenRoutePreview={() => setShowRoutePreview(true)}
          />
        )}

        {screen === "done" && <DoneScreen />}
      </main>

      {/* Map Picker Modal (rendered ONLY when user opens it) */}
      {mapPickerTarget && (
        <MapPicker
          target={mapPickerTarget}
          initialLocation={mapPickerTarget === "pickup" ? pickup : drop}
          onConfirm={handleConfirmLocation}
          onClose={() => setMapPickerTarget(null)}
        />
      )}

      {/* Route Preview Modal (rendered ONLY when user opens it) */}
      {showRoutePreview && pickup && drop && route && (
        <RoutePreview
          pickup={pickup}
          drop={drop}
          route={route}
          onClose={() => setShowRoutePreview(false)}
        />
      )}
    </div>
  );
}
