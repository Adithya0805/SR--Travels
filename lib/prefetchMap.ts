/**
 * Prefetches the MapPicker and RoutePreview dynamic chunks.
 * Invoked during idle time after Home renders, and on
 * touchstart / mouseenter / focus of any "Pick on map" button
 * so that opening the map feels instant while keeping the initial bundle map-free.
 */

let isPrefetched = false;

export function prefetchMapChunks() {
  if (isPrefetched || typeof window === "undefined") return;
  isPrefetched = true;

  try {
    import("@/components/map/MapPicker");
    import("@/components/map/RoutePreview");
  } catch (err) {
    // Ignore prefetch errors silently
    console.debug("Map prefetch notice:", err);
  }
}
