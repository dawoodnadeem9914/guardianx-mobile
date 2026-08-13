"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/LeafletMapInner";

const LeafletMapInner = dynamic(() => import("@/components/LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border-2 border-white/10 bg-navy-light text-white/60">
      Loading map…
    </div>
  ),
});

export { type MapMarker };

/**
 * Real OpenStreetMap + Leaflet map — free, no API key required.
 * Kept modest in height on purpose (default 220px) so it stays
 * readable for elderly users instead of dominating the screen.
 */
export function HospitalMap({
  markers,
  route,
  height = 220,
}: {
  markers: MapMarker[];
  route?: [number, number][] | null;
  height?: number;
}) {
  return <LeafletMapInner markers={markers} route={route} height={height} />;
}
