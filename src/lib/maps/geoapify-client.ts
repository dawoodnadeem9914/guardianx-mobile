export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][] | null;
}

/**
 * Real driving route through Geoapify.
 * This file is server-side only.
 */
export async function computeRealRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.warn("[geoapify] GEOAPIFY_API_KEY is not configured.");
    return null;
  }

  try {
    const waypoints =
      `${origin.lat},${origin.lng}|` +
      `${destination.lat},${destination.lng}`;

    const url = new URL("https://api.geoapify.com/v1/routing");

    url.searchParams.set("waypoints", waypoints);
    url.searchParams.set("mode", "drive");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(
        "[geoapify] routing request failed:",
        response.status
      );
      return null;
    }

    const data = (await response.json()) as {
      features?: {
        properties?: {
          distance?: number;
          time?: number;
        };
        geometry?: {
          type?: string;
          coordinates?: number[][] | number[][][];
        };
      }[];
    };

    const feature = data.features?.[0];

    if (!feature?.properties) {
      return null;
    }

    const distance = feature.properties.distance;
    const time = feature.properties.time;

    if (distance == null || time == null) {
      return null;
    }

    const geometry = extractRouteGeometry(feature.geometry);

    return {
      distanceMeters: distance,
      durationSeconds: time,
      geometry,
    };
  } catch (error) {
    console.warn("[geoapify] computeRealRoute failed:", error);
    return null;
  }
}

function extractRouteGeometry(
  geometry:
    | {
        type?: string;
        coordinates?: number[][] | number[][][];
      }
    | undefined
): [number, number][] | null {
  if (!geometry?.coordinates) {
    return null;
  }

  try {
    if (geometry.type === "LineString") {
      const coordinates = geometry.coordinates as number[][];

      return coordinates.map(([lng, lat]) => [lat, lng]);
    }

    if (geometry.type === "MultiLineString") {
      const lines = geometry.coordinates as number[][][];

      return lines.flat().map(([lng, lat]) => [lat, lng]);
    }

    return null;
  } catch {
    return null;
  }
}