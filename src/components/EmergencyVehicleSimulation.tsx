"use client";

import { HospitalMap, type MapMarker } from "@/components/HospitalMap";
import type { UserCoordinates } from "@/types/hospital";

export type EmergencyVehicleType = "police" | "fire";

interface EmergencyVehicleSimulationProps {
  userCoords: UserCoordinates;
  progress: number;
  type: EmergencyVehicleType;
  route: [number, number][];
}

export function EmergencyVehicleSimulation({
  userCoords,
  progress,
  type,
  route,
}: EmergencyVehicleSimulationProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  let vehicleLat = userCoords.latitude;
  let vehicleLng = userCoords.longitude;

  if (route.length > 0) {
    const position = clamped * (route.length - 1);
    const index = Math.min(Math.floor(position), route.length - 1);
    const nextIndex = Math.min(index + 1, route.length - 1);

    const localProgress = position - index;

    const current = route[index];
    const next = route[nextIndex];

    vehicleLat =
      current[0] + (next[0] - current[0]) * localProgress;

    vehicleLng =
      current[1] + (next[1] - current[1]) * localProgress;
  }

  const isPolice = type === "police";

  const vehicleEmoji = isPolice ? "🚓" : "🚒";

  const vehicleTitle = isPolice
    ? "Simulated police vehicle"
    : "Simulated fire truck";

  const markers: MapMarker[] = [
    {
      lat: userCoords.latitude,
      lng: userCoords.longitude,
      title: "You",
      emoji: "📍",
    },
    {
      lat: vehicleLat,
      lng: vehicleLng,
      title: vehicleTitle,
      emoji: vehicleEmoji,
    },
  ];

  return (
    <HospitalMap
      markers={markers}
      route={route}
      height={240}
    />
  );
}