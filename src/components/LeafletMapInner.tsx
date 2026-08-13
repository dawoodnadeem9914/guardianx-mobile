"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Real OpenStreetMap + Leaflet map, using Leaflet IMPERATIVELY rather
 * than react-leaflet's declarative <MapContainer>.
 *
 * This is a deliberate fix for "Map container is already initialized":
 * React 18 Strict Mode (next.config.mjs has reactStrictMode: true, on
 * purpose — we're not disabling it to hide this) intentionally mounts,
 * unmounts, and remounts every component once in development to catch
 * missing-cleanup bugs. Combined with this map being loaded via
 * next/dynamic(..., { ssr: false }) (see HospitalMap.tsx), the timing
 * of that double-invoke can let a second L.map() call fire on the same
 * DOM node before react-leaflet's own internal cleanup has fully
 * detached Leaflet's _leaflet_id marker from it — which is exactly
 * what throws that error.
 *
 * Taking direct, imperative control of exactly when L.map() is created
 * and destroyed (below) sidesteps that interaction entirely: the map
 * is created ONCE in a properly-cleaned-up effect, markers/route are
 * updated in a SEPARATE effect that never touches map creation, and a
 * defensive check clears any stale _leaflet_id before creating a new
 * map — belt-and-suspenders against the exact race described above,
 * without disabling Strict Mode or hiding the underlying issue.
 */

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function createEmojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="font-size:26px;line-height:1;text-align:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  emoji?: string;
}

interface Props {
  markers: MapMarker[];
  route?: [number, number][] | null;
  height: number;
}

/** A DOM node Leaflet has attached a map to carries this internal flag — used defensively below. */
interface LeafletTaggedElement extends HTMLDivElement {
  _leaflet_id?: number | null;
}

export default function LeafletMapInner({ markers, route, height }: Props) {
  const containerRef = React.useRef<LeafletTaggedElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markersLayerRef = React.useRef<L.LayerGroup | null>(null);
  const routeLayerRef = React.useRef<L.Polyline | null>(null);

  // Creates the map exactly once per real mount, and tears it down
  // exactly once per real unmount. Deliberately has NO dependencies on
  // markers/route — those are handled by the separate effect below, so
  // updating them never touches map creation/destruction at all.
  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Defensive guard against the Strict-Mode race described in this
    // file's header comment — if this exact DOM node still carries a
    // stale Leaflet id from an incompletely-cleaned-up previous
    // instance, clear it before creating a new map on it.
    if (node._leaflet_id) {
      node._leaflet_id = null;
    }

    const initialCenter: [number, number] = markers[0]
      ? [markers[0].lat, markers[0].lng]
      : [3.139, 101.6869];

    const map = L.map(node, {
      center: initialCenter,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Updates markers/route/viewport whenever they actually change,
  // entirely independent of map creation/destruction above.
  React.useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const points: [number, number][] = [];

    for (const marker of markers) {
      const icon = marker.emoji ? createEmojiIcon(marker.emoji) : DefaultIcon;
      L.marker([marker.lat, marker.lng], { icon }).bindPopup(marker.title).addTo(markersLayer);
      points.push([marker.lat, marker.lng]);
    }

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (route && route.length > 1) {
      routeLayerRef.current = L.polyline(route, { color: "#14b8a6", weight: 4 }).addTo(map);
      points.push(...route);
    }

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    }
  }, [markers, route]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-hidden rounded-2xl border-2 border-white/10"
    />
  );
}
