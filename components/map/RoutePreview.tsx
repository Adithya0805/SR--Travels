"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface RoutePreviewProps {
  pickup: { label: string; address: string; lat: number; lng: number };
  drop: { label: string; address: string; lat: number; lng: number };
  route: { distanceKm: number; durationMin: number; geometry: [number, number][] };
  onViewLarger?: () => void;
  className?: string;
}

export default function RoutePreview({
  pickup,
  drop,
  route,
  onViewLarger,
  className,
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

    // 200px non-interactive Leaflet map per SRT-R5
    const map = L.map(mapContainerRef.current, {
      center: [(pickup.lat + drop.lat) / 2, (pickup.lng + drop.lng) / 2],
      zoom: 12,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      preferCanvas: true,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "",
    }).addTo(map);

    // Green pickup pin (emerald)
    const pickupIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg,#10B981,#059669);
          width:28px; height:28px; border-radius:50%;
          border:2px solid white;
          box-shadow:0 3px 10px rgba(16,185,129,0.5);
          display:flex; align-items:center; justify-content:center;
          color:white; font-weight:800; font-size:11px;
        ">P</div>
      `,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);

    // Navy drop pin (#1c2d4f) per SRT-R5
    const dropIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg,#1c2d4f,#121d33);
          width:28px; height:28px; border-radius:50%;
          border:2px solid white;
          box-shadow:0 3px 10px rgba(28,45,79,0.5);
          display:flex; align-items:center; justify-content:center;
          color:white; font-weight:800; font-size:11px;
        ">D</div>
      `,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([drop.lat, drop.lng], { icon: dropIcon }).addTo(map);

    // Route polyline & fitBounds
    if (route.geometry && route.geometry.length > 0) {
      const poly = L.polyline(route.geometry, {
        color: "#10B981",
        weight: 4,
        opacity: 0.9,
        lineJoin: "round",
      }).addTo(map);

      const bounds = poly.getBounds();
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
      ]);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pickup, drop, route]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 ${
        className || "h-[200px]"
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Route Stats & View Larger Link */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-800 shadow-md border border-slate-100">
          {route.distanceKm} km &bull; ~{route.durationMin} mins
        </span>

        {onViewLarger && (
          <button
            type="button"
            onClick={onViewLarger}
            className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-700 shadow-md border border-slate-100 hover:bg-white active:scale-95 transition-transform pointer-events-auto flex items-center gap-1"
          >
            <span>View larger</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
