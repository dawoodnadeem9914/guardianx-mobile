import { distanceKm } from "@/lib/utils";
import type { UserCoordinates, Hospital, NearestHospitalResult } from "@/types/hospital";

interface HospitalApiResult {
  placeId: string | null;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
}

interface HospitalApiResponse {
  success: boolean;
  hospitals?: HospitalApiResult[];
  error?: string;
}

export async function findNearestHospital(
  userCoords: UserCoordinates
): Promise<NearestHospitalResult | null> {
  try {
    const response = await fetch("/api/maps/hospitals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lat: userCoords.latitude,
        lng: userCoords.longitude,
      }),
    });

    const data = (await response.json()) as HospitalApiResponse;

    if (!response.ok || !data.success || !data.hospitals?.length) {
      return null;
    }

    let nearest = data.hospitals[0];
    let nearestKm = distanceKm(
      userCoords.latitude,
      userCoords.longitude,
      nearest.latitude,
      nearest.longitude
    );

    for (const hospital of data.hospitals.slice(1)) {
      const km = distanceKm(
        userCoords.latitude,
        userCoords.longitude,
        hospital.latitude,
        hospital.longitude
      );

      if (km < nearestKm) {
        nearest = hospital;
        nearestKm = km;
      }
    }

    const hospital: Hospital = {
      id: nearest.placeId ?? `${nearest.latitude}-${nearest.longitude}`,
      name: nearest.name,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    };

    const etaMinutes = Math.max(1, Math.round((nearestKm / 40) * 60));

    return {
      hospital,
      distanceKm: Math.round(nearestKm * 10) / 10,
      etaMinutes,
      isSimulated: true,
    };
  } catch {
    return null;
  }
}