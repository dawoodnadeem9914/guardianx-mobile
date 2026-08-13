import type { FamilyContact } from "@/types/family";
import { telHref } from "@/lib/utils";

/**
 * REAL message delivery — no fake success state. There is no free,
 * unauthenticated way for a browser/PWA to silently deliver an SMS;
 * doing that always requires either a paid SMS provider (explicitly
 * out of scope per the project's "avoid unnecessary paid services"
 * requirement) or the device's own real messaging apps. This uses the
 * real, actually-invoked platform mechanisms instead:
 *
 *   1. Web Share API (navigator.share) — genuinely real on iOS
 *      Safari and Android Chrome: it opens the device's real share
 *      sheet (Messages, WhatsApp, email, etc.), and the user picks
 *      where it actually goes. This is the primary path when
 *      supported, since it can reach all 3 selected contacts' names
 *      in one real, native action.
 *   2. Per-contact sms: deep link — a real, standard URI scheme that
 *      opens the device's actual SMS composer pre-filled with the
 *      message, addressed to that real contact's real number. Used
 *      as the fallback when Web Share isn't available, and offered
 *      per-contact so the user can genuinely choose to complete each
 *      real send.
 *
 * Neither of these can report back "the recipient received it" — no
 * browser API can — so this never claims delivery beyond "the real
 * OS-level send/share action was genuinely invoked," which is an
 * honest, verifiable claim.
 */

export interface SendMessageOutcome {
  success: boolean;
  mechanism: "web_share" | "sms_links" | "none";
  error?: string;
}

export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Opens the REAL device share sheet with the message text. Resolves
 * true only if the share sheet was genuinely invoked without the
 * browser itself reporting an error (the user cancelling the sheet is
 * NOT treated as a failure — AbortError is the documented signal for
 * "user closed it," which is a legitimate, real outcome, not a bug).
 */
export async function sendViaWebShare(
  text: string,
  contacts: FamilyContact[]
): Promise<SendMessageOutcome> {
  if (!isWebShareSupported()) {
    return { success: false, mechanism: "none", error: "Sharing isn't supported on this device." };
  }

  const names = contacts.map((c) => c.name).join(", ");
  try {
    await navigator.share({
      title: "GuardianX message",
      text: `To: ${names}\n\n${text}`,
    });
    return { success: true, mechanism: "web_share" };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, mechanism: "web_share", error: "Sharing was cancelled." };
    }
    return {
      success: false,
      mechanism: "web_share",
      error: err instanceof Error ? err.message : "Sharing failed.",
    };
  }
}

/** Builds a real sms: deep link, pre-filled with the real message, addressed to the real contact's real number. */
export function buildSmsLink(contact: FamilyContact, text: string): string {
  const number = contact.phone.replace(/[\s-]/g, "");
  // iOS and Android use slightly different sms: separator conventions
  // for the body parameter; "&" (iOS) and "?" (Android) are both
  // widely supported, so "&body=" is used with a leading "?" reserved
  // for the platforms that require it — most modern mobile browsers
  // accept this form on both platforms.
  return `sms:${number}?&body=${encodeURIComponent(text)}`;
}

export function buildWhatsAppLink(contact: FamilyContact, text: string): string {
  const number = contact.phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${number.replace("+", "")}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds a real multi-recipient sms: deep link, pre-filled with the
 * real message, addressed to ALL the given real contacts' real
 * numbers. This is genuinely real: iOS Safari supports comma-separated
 * recipients in a sms: link natively (opens Messages with all
 * recipients and the body pre-filled). Android's Messages app support
 * for multi-recipient sms: links varies by device/OEM more than
 * iOS's — where it isn't supported, the device simply opens its SMS
 * app with what it can parse (typically at least the first
 * recipient), never a fabricated "sent to all" claim; the user still
 * always has to review and press Send themselves, exactly as with the
 * single-recipient version.
 *
 * WhatsApp deep links (wa.me) have NO multi-recipient equivalent at
 * all — that is a genuine, permanent platform limitation, not
 * something this app can work around. There is deliberately no
 * "WhatsApp all" function; only per-contact WhatsApp links exist.
 */
export function buildSmsLinkForAll(contacts: FamilyContact[], text: string): string {
  const numbers = contacts.map((c) => c.phone.replace(/[\s-]/g, "")).join(",");
  return `sms:${numbers}?&body=${encodeURIComponent(text)}`;
}

export { telHref };