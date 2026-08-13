export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface NearestHospitalResult {
  hospital: Hospital;
  distanceKm: number;
  etaMinutes: number;
  /** Always true here — this project's first version uses a small local hospital list rather than a live search API. Never presented to the user as real-time data. */
  isSimulated: true;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}
