import { getRealLocation } from "@/services/locationService";
import { findNearestHospital } from "@/services/hospitalService";
import type { UserCoordinates } from "@/types/hospital";
import type { NearestHospitalResult } from "@/types/hospital";
import type { LocationError } from "@/services/locationService";

export type LocateAndFindHospitalResult =
  | { success: true; coords: UserCoordinates; result: NearestHospitalResult }
  | ({ success: false } & LocationError);

export async function locateAndFindNearestHospital(): Promise<LocateAndFindHospitalResult> {
  const location = await getRealLocation();

  if (!location.success) {
    return {
      success: false,
      reason: location.reason,
      message: location.message,
    };
  }

  const result = await findNearestHospital(location.coords);

  if (!result) {
    return {
      success: false,
      reason: "unavailable",
      message: "We couldn't find a nearby hospital at your current location.",
    };
  }

  return {
    success: true,
    coords: location.coords,
    result,
  };
}