"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useBookingStore } from "@/store/useBookingStore";

interface MapProps {
  center: { lat: number; lng: number };
  onMapMoveStart: () => void;
  onMapMoveEnd: (lat: number, lng: number) => void;
  onGpsError: (errorMsg: string) => void;
}

export default function Map({
  center,
  onMapMoveStart,
  onMapMoveEnd,
  onGpsError,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [isMoving, setIsMoving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const { step, pickup, drop, route } = useBookingStore();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = center.lat || 13.0827;
    const initialLng = center.lng || 80.2707;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("movestart", () => {
      setIsMoving(true);
      onMapMoveStart();
    });

    map.on("moveend", () => {
      setIsMoving(false);
      const c = map.getCenter();
      onMapMoveEnd(c.lat, c.lng);
    });

    mapRef.current = map;

    // Initial GPS acquisition
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15);
          onMapMoveEnd(latitude, longitude);
        },
        (err) => {
          setIsLocating(false);
          let msg = "Unable to access your location.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "GPS location permission was denied.";
          }
          onGpsError(msg);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center when flyTo is needed (e.g. search suggestion selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center.lat || !center.lng) return;

    const currentCenter = map.getCenter();
    const distance = Math.hypot(
      currentCenter.lat - center.lat,
      currentCenter.lng - center.lng
    );

    if (distance > 0.0001 && step !== "route") {
      map.flyTo([center.lat, center.lng], 15, { duration: 1 });
    }
  }, [center.lat, center.lng, step]);

  // Update Pickup Marker — green custom pin with pulse animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pickup && step !== "pickup") {
      const isActive = step === "drop" || step === "route";
      const emeraldIcon = L.divIcon({
        html: `
          <div class="pickup-pin-active" style="
            background: linear-gradient(135deg,#10B981,#059669);
            width:36px; height:36px; border-radius:50%;
            border:3px solid white;
            box-shadow:0 4px 14px rgba(16,185,129,0.5);
            display:flex; align-items:center; justify-content:center;
            color:white; font-weight:800; font-size:13px;
            font-family:var(--font-poppins,sans-serif);
          ">P</div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
        pickupMarkerRef.current.setIcon(emeraldIcon);
      } else {
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], {
          icon: emeraldIcon,
        }).addTo(map);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
  }, [pickup, step]);

  // Update Drop Marker — slate custom pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (drop && step === "route") {
      const slateIcon = L.divIcon({
        html: `
          <div class="drop-pin-active" style="
            background: linear-gradient(135deg,#64748B,#475569);
            width:36px; height:36px; border-radius:50%;
            border:3px solid white;
            box-shadow:0 4px 14px rgba(100,116,139,0.5);
            display:flex; align-items:center; justify-content:center;
            color:white; font-weight:800; font-size:13px;
            font-family:var(--font-poppins,sans-serif);
          ">D</div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (dropMarkerRef.current) {
        dropMarkerRef.current.setLatLng([drop.lat, drop.lng]);
        dropMarkerRef.current.setIcon(slateIcon);
      } else {
        dropMarkerRef.current = L.marker([drop.lat, drop.lng], {
          icon: slateIcon,
        }).addTo(map);
      }
    } else if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }
  }, [drop, step]);

  // Update Polyline & Fit Map Bounds for Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (step === "route" && route && route.geometry.length > 0) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(route.geometry);
      } else {
        polylineRef.current = L.polyline(route.geometry, {
          color: "#10B981",
          weight: 5,
          opacity: 0.85,
          lineJoin: "round",
        }).addTo(map);
      }

      // Fit map bounds to show full route
      const bounds = L.latLngBounds(route.geometry);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
  }, [route, step]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      onGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 16, { duration: 1 });
        }
        onMapMoveEnd(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not get current location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS location permission denied.";
        }
        onGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const showCenterPin = step === "pickup" || step === "drop";
  const pinBadge = step === "pickup" ? "P" : "D";
  const pinGradient =
    step === "pickup"
      ? "linear-gradient(135deg,#10B981,#059669)"
      : "linear-gradient(135deg,#64748B,#475569)";

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Center-Fixed Pin over Map during selection steps */}
      {showCenterPin && (
        <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col items-center">
          <div
            className={`transition-transform duration-200 ${
              isMoving ? "-translate-y-3 scale-110" : "translate-y-0 scale-100"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center font-bold text-sm text-white"
                style={{ background: pinGradient }}
              >
                {pinBadge}
              </div>
            </div>
          </div>
          <div
            className={`w-4 h-1.5 bg-slate-900/40 rounded-full blur-[1px] transition-all duration-200 mt-0.5 ${
              isMoving ? "scale-75 opacity-40" : "scale-100 opacity-100"
            }`}
          />
        </div>
      )}

      {/* Locate Me Floating Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        aria-label="Center on my location"
        className="absolute top-16 right-4 z-10 w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.364-6.364l-2.121 2.121M6.757 17.243l-2.121 2.121m12.728 0l-2.121-2.121M6.757 6.757L4.636 4.636M12 15a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
