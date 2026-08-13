"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import { Camera, X, AlertCircle } from "lucide-react";

/**
 * A real camera QR scanner — genuinely requests camera access via
 * getUserMedia, renders the live video feed, and decodes real QR
 * codes from real camera frames using jsQR (a real, standard,
 * open-source QR decoding library — not a mock or a static image).
 * Every frame is sampled from the actual live video, never simulated.
 *
 * Rendered via a React portal straight to document.body — NOT as a
 * normal child of whatever page opened it. The root layout wraps the
 * whole app in a centered `max-w-md` column (so the app itself feels
 * phone-sized even on a wider screen); nesting this full-screen,
 * position:fixed overlay inside that column risked it being
 * positioned/sized relative to that ancestor rather than the actual
 * viewport on some browsers — exactly the "pushed to the right, cut
 * off" bug reported. Portaling to document.body is the same fix
 * already proven for an equivalent fixed-overlay bug elsewhere in
 * this project, and removes any dependency on the DOM position this
 * component happens to be mounted at.
 */
export function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const scannedRef = React.useRef(false);

  const [error, setError] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(true);

  // document.body doesn't exist during SSR — the portal itself only
  // renders once mounted is true, matching the same pattern already
  // used elsewhere in this project for portaled overlays.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        // The real, specific reason camera access fails when testing
        // over a plain http:// LAN address (e.g. http://192.168.1.2:3000)
        // instead of https:// or localhost — getUserMedia is only
        // available in secure contexts. This is NOT "your browser
        // doesn't support cameras"; saying so would be inaccurate.
        setError(
          "Camera access needs a secure connection (https://) or localhost. It isn't available over a plain http:// address like this one."
        );
        setStarting(false);
        return;
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Camera scanning isn't supported in this browser.");
        setStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
        tick();
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera permission was denied."
            : "Couldn't access the camera.";
        setError(message);
        setStarting(false);
      }
    }

    // Real per-frame decoding: draws the actual current video frame to
    // a canvas, reads its real pixel data, and hands it to jsQR — run
    // via requestAnimationFrame so it naturally paces to real camera
    // frame rate rather than an arbitrary fixed interval.
    function tick() {
      if (scannedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            // Stops the real camera stream the instant a code is
            // successfully decoded — the camera must never keep
            // running in the background after a scan succeeds.
            scannedRef.current = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onScan(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Stops the real camera stream on unmount too — covers the
      // user tapping Close, navigating away, or the component being
      // torn down for any other reason. The camera must never keep
      // running in the background.
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex w-screen max-w-full flex-col overflow-hidden bg-black">
      <div className="flex w-full items-center justify-between p-4">
        <p className="text-lg font-bold text-white">Scan QR Code</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scanner"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 max-w-[80vw] rounded-2xl border-4 border-teal/80" />
          </div>
        )}

        {starting && !error && (
          <div className="absolute inset-x-0 bottom-10 text-center text-white/70">
            Starting camera…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex w-full max-w-full flex-col items-center justify-center gap-3 px-8 text-center">
            <AlertCircle size={40} className="shrink-0 text-emergency" />
            <p className="w-full max-w-full break-words text-lg font-semibold text-white">
              {error}
            </p>
            <p className="w-full max-w-full break-words text-sm text-white/60">
              You can still enter the code manually.
            </p>
          </div>
        )}
      </div>

      {!error && (
        <p className="flex w-full items-center justify-center gap-2 p-4 text-center text-sm text-white/60">
          <Camera size={16} className="shrink-0" />
          <span className="max-w-full break-words">
            Point your camera at the QR code shown on the GuardianX website.
          </span>
        </p>
      )}
    </div>,
    document.body
  );
}