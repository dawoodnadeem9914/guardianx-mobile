import type { UserCoordinates } from "@/types/hospital";

/**
 * Real browser geolocation wrapper — no fabricated coordinates ever.
 * Mirrors the same proven pattern (timeout, error handling, permission
 * states) used in the GuardianX website's own location service, since
 * both apps will eventually share this exact behavior against the
 * same Supabase backend.
 */

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export type LocationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/**
 * Checks the CURRENT permission state without prompting the user —
 * uses the real Permissions API where available, falling back to the
 * honest "prompt" (we don't know yet; requesting will ask) when it
 * isn't supported in this browser (e.g. some iOS Safari versions).
 */
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  if (!isGeolocationSupported()) return "unsupported";
  if (typeof navigator.permissions?.query !== "function") return "prompt";

  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as LocationPermissionState;
  } catch {
    return "prompt";
  }
}

export type LocationErrorReason = "denied" | "unavailable" | "timeout" | "unsupported" | "inaccurate";

export interface LocationResult {
  success: true;
  coords: UserCoordinates;
}
export interface LocationError {
  success: false;
  reason: LocationErrorReason;
  message: string;
}

/**
 * The real GPS/WiFi/IP-based position the browser returns always comes
 * straight from navigator.geolocation — this project never invents or
 * hardcodes a coordinate anywhere. But "success" from getCurrentPosition
 * only means the browser produced SOME estimate — on a device with no
 * real GPS fix (a desktop/laptop, a browser running through a VPN, or a
 * device with location services set to a coarse/network-only mode),
 * that estimate can genuinely be off by thousands of kilometres, while
 * still being reported as a "successful" reading.
 *
 * `position.coords.accuracy` is the browser's OWN real confidence
 * radius for that reading, in meters. When it's this large, the
 * reading is not trustworthy enough to calculate a real distance to a
 * real nearby hospital — treating it as a location failure (same
 * honest "we couldn't get your location" path used for denied/
 * unavailable/timeout) is what keeps this app from ever silently
 * presenting a wildly-wrong location as if it were the user's real one.
 */
const MAX_ACCEPTABLE_ACCURACY_METERS = 50000; // 50km

function describeInaccurateLocation(accuracyMeters: number): LocationError {
  const accuracyKm = Math.round(accuracyMeters / 1000);
  return {
    success: false,
    reason: "inaccurate",
    message: `We could only get an approximate location (accurate to about ${accuracyKm} km), which is too imprecise to find a nearby hospital. Please check that precise/GPS location is enabled on this device, and try again.`,
  };
}

function describeError(error: GeolocationPositionError): LocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        success: false,
        reason: "denied",
        message: "We couldn't access your location. Location permission was denied.",
      };
    case error.POSITION_UNAVAILABLE:
      return {
        success: false,
        reason: "unavailable",
        message: "We couldn't determine your location right now.",
      };
    case error.TIMEOUT:
      return {
        success: false,
        reason: "timeout",
        message: "Finding your location took too long.",
      };
    default:
      return { success: false, reason: "unavailable", message: "We couldn't access your location." };
  }
}

/**
 * Real, once-off location request. 20s timeout — GPS on a phone
 * genuinely takes longer than a laptop's WiFi-based positioning,
 * especially indoors or on a cold start.
 */
export function getRealLocation(): Promise<LocationResult | LocationError> {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({
        success: false,
        reason: "unsupported",
        message: "Location isn't supported on this device.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (typeof accuracy === "number" && accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
          resolve(describeInaccurateLocation(accuracy));
          return;
        }
        resolve({
          success: true,
          coords: { latitude, longitude },
        });
      },
      (error) => resolve(describeError(error)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}