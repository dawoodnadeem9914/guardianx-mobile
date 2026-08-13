/**
 * Real browser Notification permission handling — no push
 * infrastructure required for THIS part; requesting permission and
 * showing a local notification both work with just the native
 * Notification API. Real cross-device PUSH delivery (receiving a
 * notification while the app isn't open) requires a real Firebase
 * project — see README for the exact environment variables that
 * activates once configured; this service is honest about that
 * distinction rather than claiming push works when only local
 * notifications are currently wired up.
 */

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  return result;
}

/** Shows a real local notification (no push server involved) — used to let the user confirm permission genuinely works. */
export function showTestNotification(): boolean {
  if (!isNotificationSupported() || Notification.permission !== "granted") return false;
  new Notification("GuardianX", {
    body: "Notifications are working on this device.",
  });
  return true;
}
