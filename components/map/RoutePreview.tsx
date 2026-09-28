"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface RoutePreviewProps {
  pickup: { label: string; address: string; lat: number; lng: number };
  drop: { label: string; address: string; lat: number; lng: number };
  route: { distanceKm: number; durationMin: number; geometry: [number, number][] };
  onClose: () => void;
}

export default function RoutePreview({
  pickup,
  drop,
  route,
  onClose,
}: RoutePreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Dynamically inject Leaflet stylesheet
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "/leaflet/leaflet.css";
      document.head.appendChild(link);
    }

    if (!mapContainerRef.current || mapRef.current) return;

    const centerLat = (pickup.lat + drop.lat) / 2;
    const centerLng = (pickup.lng + drop.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Pickup Marker
    const pickupIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg,#10B981,#059669);
          width:34px; height:34px; border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(16,185,129,0.5);
          display:flex; align-items:center; justify-content:center;
          color:white; font-weight:800; font-size:13px;
        ">P</div>
      `,
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);

    // Drop Marker
    const dropIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg,#64748B,#475569);
          width:34px; height:34px; border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(100,116,139,0.5);
          display:flex; align-items:center; justify-content:center;
          color:white; font-weight:800; font-size:13px;
        ">D</div>
      `,
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker([drop.lat, drop.lng], { icon: dropIcon }).addTo(map);

    // Polyline
    if (route.geometry && route.geometry.length > 0) {
      const poly = L.polyline(route.geometry, {
        color: "#10B981",
        weight: 5,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(map);

      const bounds = poly.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pickup, drop, route]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 select-none animate-in fade-in duration-200">
      {/* Top Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close route preview"
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all pointer-events-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Route Stats Pill */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 pointer-events-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
            <span className="text-xs font-black text-slate-800">{route.distanceKm} km</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-200" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Time</span>
            <span className="text-xs font-black text-emerald-600">{route.durationMin} mins</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Summary Floating Card */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-100 max-w-md mx-auto space-y-2 pointer-events-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{pickup.label || pickup.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
          <span className="truncate">{drop.label || drop.address}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 mt-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
        >
          Back to Booking
        </button>
      </div>
    </div>
  );
}
