import { telHref } from "@/lib/utils";

/**
 * Builds a real tel: link — the browser/OS handles the actual call
 * from here; a web app cannot fully control the native phone call
 * screen, and this project never claims otherwise. simulateOnly lets
 * demo mode walk through the full calling UI without ever triggering
 * a real dial.
 */
export function buildCallAction(phone: string, simulateOnly: boolean): { href: string | null } {
  if (simulateOnly) return { href: null };
  return { href: telHref(phone) };
}
