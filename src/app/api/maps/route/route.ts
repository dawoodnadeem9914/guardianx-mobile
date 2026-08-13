import { NextResponse } from "next/server";
import { computeRealRoute } from "@/lib/maps/geoapify-client";

interface RouteRequestBody {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
}

export async function POST(request: Request) {
  let body: RouteRequestBody;

  try {
    body = (await request.json()) as RouteRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { origin, destination } = body;

  if (
    typeof origin?.lat !== "number" ||
    typeof origin?.lng !== "number" ||
    typeof destination?.lat !== "number" ||
    typeof destination?.lng !== "number"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Origin and destination coordinates are required.",
      },
      { status: 400 }
    );
  }

  const route = await computeRealRoute(origin, destination);

  if (!route) {
    return NextResponse.json(
      {
        success: false,
        error: "Real route calculation is unavailable.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    success: true,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    geometry: route.geometry,
  });
}