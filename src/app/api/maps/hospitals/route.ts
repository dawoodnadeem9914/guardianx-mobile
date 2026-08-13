import { NextResponse } from "next/server";

interface HospitalSearchBody {
  lat: number;
  lng: number;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Geoapify API key is not configured." },
      { status: 500 }
    );
  }

  let body: HospitalSearchBody;

  try {
    body = (await request.json()) as HospitalSearchBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { lat, lng } = body;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { success: false, error: "Valid latitude and longitude are required." },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://api.geoapify.com/v2/places");

    url.searchParams.set("categories", "healthcare.hospital");
    url.searchParams.set("filter", `circle:${lng},${lat},15000`);
    url.searchParams.set("bias", `proximity:${lng},${lat}`);
    url.searchParams.set("limit", "10");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Hospital search is unavailable." },
        { status: 200 }
      );
    }

    const data = (await response.json()) as {
      features?: {
        properties?: {
          name?: string;
          formatted?: string;
          lat?: number;
          lon?: number;
          place_id?: string;
          contact?: {
            phone?: string;
          };
        };
      }[];
    };

    const hospitals = (data.features ?? [])
      .map((feature) => feature.properties)
      .filter(
        (hospital) =>
          hospital &&
          typeof hospital.name === "string" &&
          typeof hospital.lat === "number" &&
          typeof hospital.lon === "number"
      )
      .map((hospital) => ({
        placeId: hospital!.place_id ?? null,
        name: hospital!.name!,
        address: hospital!.formatted ?? null,
        latitude: hospital!.lat!,
        longitude: hospital!.lon!,
        phone: hospital!.contact?.phone ?? null,
      }));

    return NextResponse.json({
      success: true,
      hospitals,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Hospital search failed." },
      { status: 200 }
    );
  }
}