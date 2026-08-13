"use client";

import * as React from "react";
import { HospitalMap, type MapMarker } from "@/components/HospitalMap";
import type { UserCoordinates, Hospital } from "@/types/hospital";

export type AmbulancePhase =
  | "to_patient"
  | "pickup"
  | "to_hospital"
  | "complete";

interface AmbulanceSimulationProps {
  userCoords: UserCoordinates;
  hospital: Hospital;
  progress: number;
  phase: AmbulancePhase;
}

type RoutePoint = [number, number];

interface RouteResponse {
  success: boolean;
  geometry?: RoutePoint[] | null;
}

export function AmbulanceSimulation({
  userCoords,
  hospital,
  progress,
  phase,
}: AmbulanceSimulationProps) {
  const [route, setRoute] = React.useState<RoutePoint[]>([]);
  const [routeLoaded, setRouteLoaded] = React.useState(false);

  /*
   * Get the REAL road route between the patient and hospital.
   */
  React.useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      setRouteLoaded(false);
      setRoute([]);

      try {
        const response = await fetch("/api/maps/route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: {
              lat: userCoords.latitude,
              lng: userCoords.longitude,
            },
            destination: {
              lat: hospital.latitude,
              lng: hospital.longitude,
            },
          }),
        });

        const data = (await response.json()) as RouteResponse;

        if (!cancelled && data.success && data.geometry?.length) {
          setRoute(data.geometry);
        }
      } catch (error) {
        console.error("Failed to load real ambulance route:", error);
      } finally {
        if (!cancelled) {
          setRouteLoaded(true);
        }
      }
    }

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    userCoords.latitude,
    userCoords.longitude,
    hospital.latitude,
    hospital.longitude,
  ]);

  const clamped = Math.min(1, Math.max(0, progress));

  /*
   * Find the ambulance position along the REAL road geometry.
   */
  function getPositionAlongRoute(
    points: RoutePoint[],
    amount: number
  ): RoutePoint | null {
    if (points.length === 0) return null;

    if (points.length === 1) {
      return points[0];
    }

    const index = Math.min(
      points.length - 1,
      Math.floor(amount * (points.length - 1))
    );

    return points[index];
  }

  const routePosition = getPositionAlongRoute(route, clamped);

  let ambulanceLat: number;
  let ambulanceLng: number;

  if (phase === "to_patient") {
    /*
     * Ambulance travels from hospital side toward the patient.
     * Reverse the real hospital -> patient route.
     */
    const reversedRoute = [...route].reverse();
    const position = getPositionAlongRoute(reversedRoute, clamped);

    if (position) {
      ambulanceLat = position[0];
      ambulanceLng = position[1];
    } else {
      ambulanceLat = hospital.latitude;
      ambulanceLng = hospital.longitude;
    }
  } else if (phase === "pickup") {
    /*
     * Ambulance has reached the patient.
     */
    ambulanceLat = userCoords.latitude;
    ambulanceLng = userCoords.longitude;
  } else if (phase === "to_hospital") {
    /*
     * Patient has been picked up.
     * Ambulance now follows the REAL road route to the hospital.
     */
    if (routePosition) {
      ambulanceLat = routePosition[0];
      ambulanceLng = routePosition[1];
    } else {
      ambulanceLat = userCoords.latitude;
      ambulanceLng = userCoords.longitude;
    }
  } else {
    /*
     * Simulation complete — ambulance has reached the hospital.
     */
    ambulanceLat = hospital.latitude;
    ambulanceLng = hospital.longitude;
  }

  const markers: MapMarker[] = [
    {
      lat: userCoords.latitude,
      lng: userCoords.longitude,
      title: "You",
      emoji: "📍",
    },
    {
      lat: hospital.latitude,
      lng: hospital.longitude,
      title: hospital.name,
      emoji: "🏥",
    },
    {
      lat: ambulanceLat,
      lng: ambulanceLng,
      title: "Simulated ambulance",
      emoji: "🚑",
    },
  ];

  /*
   * Do NOT draw the old straight line.
   * Only show the actual road geometry returned by Geoapify.
   */
  const mapRoute =
    routeLoaded && route.length > 1 ? route : [];

  return (
    <HospitalMap
      markers={markers}
      route={mapRoute}
      height={240}
    />
  );
}