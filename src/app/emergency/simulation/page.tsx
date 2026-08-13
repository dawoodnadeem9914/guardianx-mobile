"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CallingScreen } from "@/components/CallingScreen";
import { AmbulanceSimulation } from "@/components/AmbulanceSimulation";
import { EmergencyVehicleSimulation } from "@/components/EmergencyVehicleSimulation";
import { HospitalMap } from "@/components/HospitalMap";
import { GuidanceCard } from "@/components/GuidanceCard";
import { getEmergencyGuidance } from "@/services/guidanceService";
import { readEmergencyContext } from "@/lib/emergencyContext";
import { locateAndFindNearestHospital } from "@/services/emergencyService";
import { getRealLocation } from "@/services/locationService";
import { EMERGENCY_NUMBER, EMERGENCY_CATEGORY_LABELS, SIM_MIN_SECONDS, SIM_MAX_SECONDS } from "@/lib/constants";
import { EMERGENCY_CATEGORY_ICON } from "@/lib/icons";
import { useSettings } from "@/lib/settingsContext";
import type { TranslationKey } from "@/lib/i18n";
import { scaleToDemoSeconds, telHref } from "@/lib/utils";
import type { EmergencyCategory } from "@/types/emergency";
import type { UserCoordinates, NearestHospitalResult } from "@/types/hospital";
import {
  MapPin,
  Loader2,
  LifeBuoy,
  CheckCircle2,
  Hospital,
  Ambulance,
  Home,
  User,
  Users,
  PhoneCall,
} from "lucide-react";

/**
 * Stages shared by every category: calling, locating, location_failed.
 * Everything after that branches by category — only "medical" reaches
 * finding_hospital/ambulance/arrived/transported/hospital_arrival.
 * Police, fire, and unclear reach the simpler assistance_active/
 * complete stages instead, which never show an ambulance, a hospital,
 * or any fabricated dispatch tracking — per the explicit requirement
 * that the flow must NOT be ambulance-only and must not pretend
 * GuardianX has real police/fire dispatch integration.
 */
type Stage =
  | "calling"
  | "locating"
  | "location_failed"
  | "finding_hospital"
  | "ambulance"
  | "arrived"
  | "pickup"
  | "transported"
  | "hospital_arrival"
  | "vehicle_active"
  | "vehicle_arrived"
  | "assistance_active"
  | "complete";

const NON_MEDICAL_LABEL_KEY: Record<Exclude<EmergencyCategory, "medical">, TranslationKey> = {
  police: "policeAssistance",
  fire: "fireAssistance",
  unclear: "emergencyServices",
};

const NON_MEDICAL_DISPATCH_KEY: Record<Exclude<EmergencyCategory, "medical">, TranslationKey> = {
  police: "noPoliceDispatchTracking",
  fire: "noFireDispatchTracking",
  unclear: "noPoliceDispatchTracking",
};

function CallingStage({ category, demo, onDone }: { category: EmergencyCategory; demo: boolean; onDone: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!demo) {
        window.location.href = telHref(EMERGENCY_NUMBER);
      }
      onDone();
    }, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CallingScreen name={EMERGENCY_CATEGORY_LABELS[category]} number={EMERGENCY_NUMBER} simulated={demo} />;
}

function EmergencySimulationContent() {
  const searchParams = useSearchParams();
  const { t } = useSettings();
  const category = (searchParams.get("type") as EmergencyCategory) || "unclear";
  const demo = searchParams.get("demo") === "true";
  const isMedical = category === "medical";

  const [stage, setStage] = React.useState<Stage>("calling");
  const [coords, setCoords] = React.useState<UserCoordinates | null>(null);
  const [hospitalResult, setHospitalResult] = React.useState<NearestHospitalResult | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [vehicleRoute, setVehicleRoute] = React.useState<[number, number][]>([]);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [ambulancePhase, setAmbulancePhase] =
    React.useState<"to_patient" | "pickup" | "to_hospital" | "complete">(
      "to_patient"
    );

  const [showAssistance, setShowAssistance] = React.useState(false);
  const [assistanceChoice, setAssistanceChoice] = React.useState<"alone" | "helper" | null>(null);
  const [guidanceIndex, setGuidanceIndex] = React.useState(0);
  const [guidanceSteps, setGuidanceSteps] = React.useState<string[]>([]);
  const [guidanceLoading, setGuidanceLoading] = React.useState(false);
  const [guidanceSource, setGuidanceSource] = React.useState<"ai" | "fallback" | null>(null);

  async function handleAssistanceChoice(choice: "alone" | "helper") {
    setAssistanceChoice(choice);
    setGuidanceLoading(true);
    setGuidanceIndex(0);

    const context = readEmergencyContext();
    const result = await getEmergencyGuidance(
      category,
      context.description,
      choice === "alone",
      context.imageDataUrl
    );

    setGuidanceSteps(result.steps);
    setGuidanceSource(result.source);
    setGuidanceLoading(false);
  }

  /**
   * Real GPS for every category (police/fire genuinely benefit from
   * the user's real location being visible too, per the requirement
   * that the map must appear whenever location is useful) — but only
   * MEDICAL proceeds to a real hospital-distance lookup. Police/fire/
   * unclear go straight to the simpler assistance stage: no ambulance,
   * no hospital, no fabricated dispatch ETA.
   */
  async function runLocationFlow() {
    setStage("locating");
    setLocationError(null);

    if (isMedical) {
      const outcome = await locateAndFindNearestHospital();
      if (!outcome.success) {
        setLocationError(outcome.message);
        setStage("location_failed");
        return;
      }
      setCoords(outcome.coords);
      setStage("finding_hospital");
      await new Promise((r) => setTimeout(r, 900));
      setHospitalResult(outcome.result);
      setStage("ambulance");
      return;
    }

    const location = await getRealLocation();
    if (!location.success) {
      setLocationError(location.message);
      setStage("location_failed");
      return;
    }
    setCoords(location.coords);
    setProgress(0);

    const start = {
      lat: location.coords.latitude + 0.01,
      lng: location.coords.longitude - 0.01,
    };

    try {
      const response = await fetch("/api/maps/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: start,
          destination: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        }),
      });

      const result = await response.json();

      if (result.success && Array.isArray(result.geometry)) {
        setVehicleRoute(result.geometry);
      } else {
        setVehicleRoute([]);
      }
    } catch {
      setVehicleRoute([]);
    }

    setSecondsLeft(
      scaleToDemoSeconds(1, SIM_MIN_SECONDS, SIM_MAX_SECONDS)
    );

    setStage("vehicle_active");
  }

  // dispatched → en route → arrived → pickup → transport → complete.
  React.useEffect(() => {
    if (stage !== "ambulance" || !hospitalResult) return;

    const demoSeconds = scaleToDemoSeconds(
      hospitalResult.etaMinutes,
      SIM_MIN_SECONDS,
      SIM_MAX_SECONDS
    );

    setAmbulancePhase("to_patient");
    setProgress(0);
    setSecondsLeft(demoSeconds);

    let ticks = 0;
    const totalTicks = demoSeconds * 4;

    const interval = setInterval(() => {
      ticks += 1;

      const p = Math.min(1, ticks / totalTicks);

      setProgress(p);
      setSecondsLeft(
        Math.max(0, Math.round(demoSeconds - ticks / 4))
      );

      if (p >= 1) {
        clearInterval(interval);
        setProgress(1);
        setSecondsLeft(0);
        setStage("arrived");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [stage, hospitalResult]);

  React.useEffect(() => {
    if (stage === "arrived") {
      setAmbulancePhase("pickup");
      setProgress(0);
      setSecondsLeft(0);
      setStage("pickup");
      return;
    }

    if (stage === "pickup") {
      const timer = setTimeout(() => {
        setAmbulancePhase("to_hospital");
        setProgress(0);

        const demoSeconds = hospitalResult
          ? scaleToDemoSeconds(
              hospitalResult.etaMinutes,
              SIM_MIN_SECONDS,
              SIM_MAX_SECONDS
            )
          : 0;

        setSecondsLeft(demoSeconds);
        setStage("transported");
      }, 1200);

      return () => clearTimeout(timer);
    }

    if (stage === "transported" && hospitalResult) {
      const demoSeconds = scaleToDemoSeconds(
        hospitalResult.etaMinutes,
        SIM_MIN_SECONDS,
        SIM_MAX_SECONDS
      );

      let ticks = 0;
      const totalTicks = demoSeconds * 4;

      const interval = setInterval(() => {
        ticks += 1;

        const p = Math.min(1, ticks / totalTicks);

        setProgress(p);
        setSecondsLeft(
          Math.max(0, Math.round(demoSeconds - ticks / 4))
        );

        if (p >= 1) {
          clearInterval(interval);
          setProgress(1);
          setSecondsLeft(0);
          setAmbulancePhase("complete");
          setStage("hospital_arrival");
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [stage, hospitalResult]);

  // Police / fire vehicle simulation:
  // vehicle travels toward the user's real location, then assistance becomes active.
  React.useEffect(() => {
    if (stage !== "vehicle_active" || !coords) return;

    const demoSeconds = scaleToDemoSeconds(
      1,
      SIM_MIN_SECONDS,
      SIM_MAX_SECONDS
    );

    setProgress(0);
    setSecondsLeft(demoSeconds);

    let ticks = 0;
    const totalTicks = demoSeconds * 4;

    const interval = setInterval(() => {
      ticks += 1;

      const p = Math.min(1, ticks / totalTicks);

      setProgress(p);
      setSecondsLeft(
        Math.max(0, Math.round(demoSeconds - ticks / 4))
      );

      if (p >= 1) {
        clearInterval(interval);
        setProgress(1);
        setSecondsLeft(0);
        setStage("vehicle_arrived");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [stage, coords]);


  const NonMedicalIcon = !isMedical ? EMERGENCY_CATEGORY_ICON[category] : null;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={EMERGENCY_CATEGORY_LABELS[category]} showHome />

      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {((stage === "ambulance" ||
            stage === "arrived" ||
            stage === "pickup" ||
            stage === "transported")) && (
          <span className="mx-auto rounded-full bg-teal/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-teal-soft">
            {demo ? t("simulationMode") : "Ambulance journey below is simulated"}
          </span>
        )}

        {stage === "calling" && (
          <CallingStage category={category} demo={demo} onDone={() => void runLocationFlow()} />
        )}

        {stage === "locating" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <MapPin size={48} className="animate-pulse text-teal" />
            <p className="text-xl font-semibold text-white">{t("loading")}</p>
            <p className="text-white/60">
              {isMedical
                ? "We need your location to find the nearest hospital."
                : "We need your location to show it on the map."}
            </p>
          </div>
        )}

        {stage === "location_failed" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <MapPin size={48} className="text-white/40" />
            <p className="text-xl font-semibold text-white">{locationError}</p>
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => void runLocationFlow()}
                className="min-h-[4rem] rounded-xl2 bg-teal text-xl font-bold text-navy"
              >
                {t("tryAgain")}
              </button>
              <button
                type="button"
                onClick={() => setStage(isMedical ? "hospital_arrival" : "complete")}
                className="min-h-[4rem] rounded-xl2 border-2 border-white/20 text-xl font-bold text-white"
              >
                Continue Without Location
              </button>
            </div>
          </div>
        )}

        {stage === "finding_hospital" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Loader2 size={48} className="animate-spin text-teal" />
            <p className="text-xl font-semibold text-white">{t("nearestHospital")}…</p>
          </div>
        )}

        {/* ---------------- MEDICAL: ambulance + hospital ---------------- */}
        {(stage === "ambulance" ||
          stage === "arrived" ||
          stage === "pickup" ||
          stage === "transported") &&
          coords &&
          hospitalResult && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl2 bg-white/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  {t("nearestHospital")} <span className="text-teal-soft">({t("simulated")})</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-white">
                  <Hospital size={20} className="shrink-0 text-teal-soft" />
                  {hospitalResult.hospital.name}
                </p>
                {/*
                  Honest split, per the explicit requirement: distance
                  is a REAL calculation (real Haversine math against
                  the user's real coordinates); the minutes figure is
                  NOT from a live routing API and is labeled as such,
                  never presented as if both were equally "real."
                */}
                <p className="mt-1 text-white/70">
                  {t("distanceLabel")}: {hospitalResult.distanceKm} km
                </p>
                <p className="mt-0.5 text-sm text-white/50">
                  {t("estimatedDrivingTime")}: ~{hospitalResult.etaMinutes} min
                </p>
              </div>

              <AmbulanceSimulation
                userCoords={coords}
                hospital={hospitalResult.hospital}
                progress={progress}
                phase={ambulancePhase}
              />

              <div className="text-center">
                {stage === "ambulance" && (
                  <>
                    <p className="flex items-center justify-center gap-2 text-2xl font-extrabold text-white">
                      <Ambulance size={26} className="text-emergency" />
                      {t("ambulanceIsComing")}
                    </p>
                    <p className="mt-1 text-white/70">{t("pleaseStayCalm")}</p>
                    <p className="mt-2 text-3xl font-extrabold text-teal-soft">{secondsLeft}s</p>
                  </>
                )}
                {stage === "arrived" && (
                  <p className="text-2xl font-extrabold text-white">
                    Simulated ambulance has arrived.
                  </p>
                )}

                {stage === "pickup" && (
                  <>
                    <p className="text-2xl font-extrabold text-white">
                      Patient pickup in progress.
                    </p>
                    <p className="mt-1 text-white/70">
                      Simulated ambulance is picking up the patient.
                    </p>
                  </>
                )}

                {stage === "transported" && (
                  <>
                    <p className="text-2xl font-extrabold text-white">
                      Simulated ambulance is transporting the patient.
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-teal-soft">
                      {secondsLeft}s
                    </p>
                  </>
                )}
              </div>

              {stage === "ambulance" && (
                <button
                  type="button"
                  onClick={() => setShowAssistance(true)}
                  className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-emergency text-xl font-extrabold text-white active:scale-[0.98]"
                >
                  <LifeBuoy size={22} />
                  {t("needAssistanceGuide")}
                </button>
              )}
            </div>
          )}

        {stage === "hospital_arrival" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <CheckCircle2 size={56} className="text-safe" />
            <p className="flex items-center justify-center gap-2 text-2xl font-extrabold text-white">
              <Hospital size={26} className="text-teal-soft" />
              {t("simulationEndsHere")}
            </p>
            <p className="max-w-xs text-white/60">
              {demo
                ? "This was a full simulation — no real call was placed."
                : "Your real 999 call was placed."}{" "}
              Hospital arrival, ambulance movement, and ETA above were a simulated demonstration
              only — GuardianX has no real ambulance dispatch integration.
            </p>
            <Link
              href="/"
              className="mt-4 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy"
            >
              <Home size={22} />
              {t("backToHome")}
            </Link>
          </div>
        )}

        {/* ---------------- POLICE / FIRE / UNCLEAR: no ambulance, no hospital ---------------- */}

        {stage === "vehicle_active" && coords && !isMedical && (
          <div className="flex flex-col gap-5">
            <span className="mx-auto rounded-full bg-teal/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-teal-soft">
              {demo ? t("simulationMode") : "Emergency vehicle journey is simulated"}
            </span>

            <div className="flex flex-col items-center gap-2 text-center">
              {NonMedicalIcon && (
                <NonMedicalIcon size={44} className="text-emergency" />
              )}

              <p className="text-2xl font-extrabold text-white">
                {category === "police"
                  ? "Simulated police vehicle is coming."
                  : "Simulated fire truck is coming."}
              </p>

              <p className="text-white/70">
                Emergency vehicle is travelling to your location.
              </p>
            </div>

            <EmergencyVehicleSimulation
              userCoords={coords}
              progress={progress}
              type={category as "police" | "fire"}
              route={vehicleRoute}
            />

            <div className="text-center">
              <p className="text-3xl font-extrabold text-teal-soft">
                {secondsLeft}s
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAssistance(true)}
              className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-emergency text-xl font-extrabold text-white active:scale-[0.98]"
            >
              <LifeBuoy size={22} />
              {t("needAssistanceGuide")}
            </button>
          </div>
        )}

{stage === "vehicle_arrived" && NonMedicalIcon && (
  <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
    <NonMedicalIcon size={56} className="text-safe" />

    <p className="text-2xl font-extrabold text-white">
      {category === "police"
        ? "Simulated police vehicle has arrived."
        : "Simulated fire truck has arrived."}
    </p>

    <p className="text-white/70">
      The simulated emergency vehicle has reached your location.
    </p>

    <button
      type="button"
      onClick={() => setShowAssistance(true)}
      className="mt-2 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-emergency text-xl font-extrabold text-white active:scale-[0.98]"
    >
      <LifeBuoy size={22} />
      {t("needAssistanceGuide")}
    </button>

    <button
      type="button"
      onClick={() => setStage("complete")}
      className="min-h-[3.5rem] w-full rounded-xl2 border-2 border-white/20 text-lg font-bold text-white"
    >
      {t("imSafeFinish")}
    </button>
  </div>
)}

        {stage === "assistance_active" && coords && NonMedicalIcon && (

          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <NonMedicalIcon size={44} className="text-emergency" />
              <p className="text-2xl font-extrabold text-white">
                {t(NON_MEDICAL_LABEL_KEY[category as Exclude<EmergencyCategory, "medical">])}
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-safe/20 px-3 py-1 text-sm font-bold text-safe">
                <PhoneCall size={14} />
                {demo ? "SIMULATED — no real call" : t("callPlaced")}
              </span>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/60">
                <MapPin size={14} />
                {t("yourLocation")}
              </p>
              <HospitalMap
                markers={[{ lat: coords.latitude, lng: coords.longitude, title: "You", emoji: "📍" }]}
                height={220}
              />
            </div>

            <p className="text-center text-sm text-white/50">
              {t(NON_MEDICAL_DISPATCH_KEY[category as Exclude<EmergencyCategory, "medical">])}
            </p>

            <button
              type="button"
              onClick={() => setShowAssistance(true)}
              className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-emergency text-xl font-extrabold text-white active:scale-[0.98]"
            >
              <LifeBuoy size={22} />
              {t("needAssistanceGuide")}
            </button>

            <button
              type="button"
              onClick={() => setStage("complete")}
              className="min-h-[3.5rem] rounded-xl2 border-2 border-white/20 text-lg font-bold text-white"
            >
              {t("imSafeFinish")}
            </button>
          </div>
        )}

        {stage === "complete" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <CheckCircle2 size={56} className="text-safe" />
            <p className="text-2xl font-extrabold text-white">{t("emergencyCallComplete")}</p>
            <p className="max-w-xs text-white/60">
              {demo
                ? "This was a full simulation — no real call was placed."
                : "Your real 999 call was placed."}{" "}
              GuardianX has no real dispatch-tracking integration — everything shown above (other
              than your real location and the real call) was for demonstration only.
            </p>
            <Link
              href="/"
              className="mt-4 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy"
            >
              <Home size={22} />
              {t("backToHome")}
            </Link>
          </div>
        )}
      </div>

      {showAssistance && assistanceChoice === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl2 bg-navy-raised p-6 text-center shadow-2xl">
            <p className="text-xl font-bold text-white">{t("areYouAlone")}</p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleAssistanceChoice("alone")}
                className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy"
              >
                <User size={24} />
                {t("iAmAlone")}
              </button>
              <button
                type="button"
                onClick={() => void handleAssistanceChoice("helper")}
                className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-xl2 bg-white/10 text-xl font-extrabold text-white"
              >
                <Users size={24} />
                {t("someoneIsWithMe")}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAssistance(false)}
              className="mt-4 text-white/60 underline"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {showAssistance && assistanceChoice !== null && guidanceLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex flex-col items-center gap-3 rounded-xl2 bg-navy-raised p-8 text-center shadow-2xl">
            <Loader2 size={36} className="animate-spin text-teal" />
            <p className="text-lg font-semibold text-white">Getting real guidance…</p>
          </div>
        </div>
      )}

      {showAssistance && assistanceChoice !== null && !guidanceLoading && guidanceSteps.length > 0 && (
        <GuidanceCard
          step={guidanceIndex + 1}
          totalSteps={guidanceSteps.length}
          text={guidanceSteps[guidanceIndex]}
          isLast={guidanceIndex === guidanceSteps.length - 1}
          aiGenerated={guidanceSource === "ai"}
          onNext={() => {
            if (guidanceIndex >= guidanceSteps.length - 1) {
              setShowAssistance(false);
              setAssistanceChoice(null);
              setGuidanceIndex(0);
              setGuidanceSteps([]);
            } else {
              setGuidanceIndex((i) => i + 1);
            }
          }}
          onClose={() => {
            setShowAssistance(false);
            setAssistanceChoice(null);
            setGuidanceIndex(0);
            setGuidanceSteps([]);
          }}
        />
      )}
    </div>
  );
}

export default function EmergencySimulationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={40} className="animate-spin text-teal" />
        </div>
      }
    >
      <EmergencySimulationContent />
    </React.Suspense>
  );
}
