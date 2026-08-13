import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { GuardianXConnection } from "@/types/user";

/**
 * REAL connection to the GuardianX website account — no
 * localStorage-faked "connected: true", no mock QR scan. Uses:
 *   1. A real Supabase RPC (redeem_mobile_connection_token) to
 *      exchange a real, short-lived, single-use code (generated on
 *      the website while genuinely authenticated there — see
 *      migration 0021) for that account's real email.
 *   2. Supabase's own real, standard signInWithOtp({ email }) flow to
 *      get GuardianX Mobile its own genuine, real Supabase Auth
 *      session for that same account.
 * "Connected" is determined by asking Supabase for the REAL current
 * session — never a flag written to localStorage.
 */

export async function getConnectionStatus(): Promise<GuardianXConnection> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { connected: false, connectedAt: null, accountLabel: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { connected: false, connectedAt: null, accountLabel: null };
  }

  return {
    connected: true,
    connectedAt: new Date(session.user.created_at).toISOString(),
    accountLabel: session.user.email ?? "GuardianX account",
  };
}

export type RedeemResult =
  | { success: true; email: string }
  | { success: false; error: string };

/**
 * The exact set of messages redeem_mobile_connection_token() itself
 * raises (see migration 0021) for a genuinely bad code — shown to the
 * user as-is, since they're already honest and specific. Anything
 * else (most notably PostgREST's own "Could not find the function...
 * in the schema cache", which fires when the migration hasn't been
 * run yet, or this app is pointed at the wrong Supabase project) is a
 * real backend configuration problem, not something caused by what
 * the user typed — it must never be shown to the user verbatim.
 */
const KNOWN_CODE_ERRORS = new Set([
  "Invalid code.",
  "This code has already been used.",
  "This code has expired.",
]);

/** Step 1: exchange the real code from the website for the real linked account's email. */
export async function redeemConnectionCode(code: string): Promise<RedeemResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "GuardianX connection isn't configured yet." };
  }
  const supabase = getSupabaseClient()!;

  const { data, error } = await supabase.rpc("redeem_mobile_connection_token", {
    p_token: code.trim().toUpperCase(),
  });

  if (error) {
    if (KNOWN_CODE_ERRORS.has(error.message)) {
      return {
        success: false,
        error: "Invalid or expired connection code. Please generate a new code from GuardianX.",
      };
    }
    // PGRST202 ("Could not find the function... in the schema cache")
    // or any other unexpected shape — a genuine setup problem, not a
    // bad code. Logged for developers, never shown raw to the user.
    console.warn("[connectionService] Unexpected redeem error:", error.code, error.message);
    return {
      success: false,
      error: "GuardianX connection isn't set up correctly yet. Please contact support.",
    };
  }

  const email = Array.isArray(data) ? data[0]?.email : undefined;
  if (!email) {
    return { success: false, error: "That code didn't work." };
  }

  return { success: true, email };
}

export type OtpSendResult = { success: boolean; error?: string };

/** Step 2: real Supabase Auth — sends a real sign-in link/code to the real account email. */
export async function sendSignInLink(email: string): Promise<OtpSendResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "GuardianX connection isn't configured yet." };
  }
  const supabase = getSupabaseClient()!;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/connect` : undefined,
    },
  });
  if (error) {
    return { success: false, error: error.message || "Couldn't send the sign-in link." };
  }
  return { success: true };
}

export async function disconnectFromGuardianX(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}