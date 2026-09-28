"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef } from "react";
import { reverseGeocode } from "@/lib/maps";
import { useBookingStore } from "@/store/useBookingStore";
import LocationPickerBottomSheet from "@/components/LocationPickerBottomSheet";
import RouteSummaryCard from "@/components/RouteSummaryCard";
import TripDetailsBottomSheet from "@/components/TripDetailsBottomSheet";
import VehicleSelectionBottomSheet from "@/components/VehicleSelectionBottomSheet";
import BookingSummaryBottomSheet from "@/components/BookingSummaryBottomSheet";
import DoneScreen from "@/components/DoneScreen";
import SideDrawer from "@/components/SideDrawer";
import OfflineBanner from "@/components/OfflineBanner";
import { siteConfig } from "@/config/siteConfig";
import { LogoIcon, LogoFull } from "@/components/Logo";

// Dynamically import Leaflet Map component with SSR disabled
const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold tracking-wide">Loading Leaflet Map...</p>
    </div>
  ),
});

export default function Home() {
  const {
    step,
    setStep,
    confirmPickup,
    confirmDrop,
  } = useBookingStore();

  // Map center state
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.0827,
    lng: 80.2707,
  });

  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [gpsErrorNotice, setGpsErrorNotice] = useState<string | null>(null);

  const reverseGeocodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMapMoveStart = useCallback(() => {
    if (step !== "pickup" && step !== "drop") return;
    setIsGeocoding(true);
  }, [step]);

  const handleMapMoveEnd = useCallback(
    (lat: number, lng: number) => {
      if (step !== "pickup" && step !== "drop") return;

      setCenter({ lat, lng });
      setIsGeocoding(true);

      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
      }

      reverseGeocodeTimerRef.current = setTimeout(async () => {
        const addr = await reverseGeocode(lat, lng);
        setCurrentAddress(addr);
        setIsGeocoding(false);
      }, 300);
    },
    [step]
  );

  const handleSelectSuggestion = useCallback(
    (lat: number, lng: number, address: string) => {
      setCenter({ lat, lng });
      setCurrentAddress(address);
      setIsGeocoding(false);
    },
    []
  );

  const handleConfirmStep = () => {
    if (step === "pickup") {
      confirmPickup({
        lat: center.lat,
        lng: center.lng,
        displayName: currentAddress,
        shortName: currentAddress,
      });
      setCurrentAddress("");
    } else if (step === "drop") {
      confirmDrop({
        lat: center.lat,
        lng: center.lng,
        displayName: currentAddress,
        shortName: currentAddress,
      });
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Floating Header Pill — SR Travels branding + menu icon */}
      <div className="fixed top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Brand pill — Monogram (24px tall) + SR Travels */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-100 px-3 py-1.5 pointer-events-auto">
          <LogoIcon height={24} />
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
            {siteConfig.businessName}
          </span>
        </div>

        {/* Right: Hamburger menu button */}
        <SideDrawer />
      </div>

      {/* Leaflet Map */}
      <MapComponent
        center={center}
        onMapMoveStart={handleMapMoveStart}
        onMapMoveEnd={handleMapMoveEnd}
        onGpsError={(msg) => setGpsErrorNotice(msg)}
      />

      {/* Step 1 & Step 2: Location Picker Bottom Sheet (Pickup or Drop) */}
      {(step === "pickup" || step === "drop") && (
        <LocationPickerBottomSheet
          mode={step}
          address={currentAddress}
          isGeocoding={isGeocoding}
          gpsErrorNotice={gpsErrorNotice}
          onClearGpsNotice={() => setGpsErrorNotice(null)}
          onSelectSuggestion={handleSelectSuggestion}
          onConfirm={handleConfirmStep}
          onBack={step === "drop" ? () => setStep("pickup") : undefined}
        />
      )}

      {/* Step 3: Route Summary Card */}
      {step === "route" && <RouteSummaryCard />}

      {/* Step 4: Trip Details Bottom Sheet */}
      {step === "details" && <TripDetailsBottomSheet />}

      {/* Step 5: Vehicle Selection Bottom Sheet */}
      {step === "vehicles" && <VehicleSelectionBottomSheet />}

      {/* Step 6: Confirm Booking Summary Sheet */}
      {step === "summary" && <BookingSummaryBottomSheet />}

      {/* Step 7: Booking Done Confirmation Screen */}
      {step === "done" && <DoneScreen />}
    </main>
  );
}
