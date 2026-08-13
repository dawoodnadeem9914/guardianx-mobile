import type { FamilyContact } from "@/types/family";
import { MAX_FAMILY_CONTACTS } from "@/types/family";
import { getSupabaseClient } from "@/lib/supabase";
import { generateLocalId } from "@/lib/utils";

/**
 * Real Supabase-backed persistence for family contacts — reuses the
 * EXISTING emergency_contacts table from the GuardianX website
 * (migration 0002), not a duplicate mobile-only table, once the user
 * has genuinely connected (see connectionService.ts).
 *
 * Before connecting, "no account required for Emergency Help" must
 * remain true — so this transparently falls back to localStorage
 * when there's no real Supabase session yet. Once connected, it
 * reads/writes the real, shared table directly, and the max-3 limit
 * is enforced here in the mobile app's own logic (the shared table
 * itself intentionally has no hard cap, since the website's own
 * advanced interface legitimately supports more contacts — this cap
 * is a mobile-app-specific product decision, not a data-layer one).
 */

const STORAGE_KEY = "guardianx-mobile:family-contacts";

function readLocalContacts(): FamilyContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FamilyContact[]) : [];
  } catch {
    return [];
  }
}

function writeLocalContacts(contacts: FamilyContact[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

async function getRealUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export async function getFamilyContacts(): Promise<FamilyContact[]> {
  const userId = await getRealUserId();
  if (!userId) return readLocalContacts();

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("id, name, relationship, phone, email")
    .eq("user_id", userId)
    .order("priority", { ascending: true })
    .limit(MAX_FAMILY_CONTACTS);

  if (error || !data) return readLocalContacts();

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    relationship: row.relationship ?? "",
    phone: row.phone,
    email: row.email ?? undefined,
  }));
}

export interface AddContactResult {
  success: boolean;
  error?: string;
  contact?: FamilyContact;
}

export async function addFamilyContact(
  input: Omit<FamilyContact, "id">
): Promise<AddContactResult> {
  if (!input.name.trim() || !input.phone.trim()) {
    return { success: false, error: "Name and phone number are required." };
  }

  const existing = await getFamilyContacts();
  if (existing.length >= MAX_FAMILY_CONTACTS) {
    return { success: false, error: `Maximum ${MAX_FAMILY_CONTACTS} family contacts allowed.` };
  }

  const userId = await getRealUserId();

  if (!userId) {
    const contact: FamilyContact = {
      id: generateLocalId(),
      name: input.name.trim(),
      relationship: input.relationship.trim() || "Family",
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
    };
    writeLocalContacts([...existing, contact]);
    return { success: true, contact };
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      relationship: input.relationship.trim() || "Family",
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      priority: existing.length + 1,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Couldn't save this contact." };
  }

  return {
    success: true,
    contact: {
      id: data.id,
      name: data.name,
      relationship: data.relationship ?? "",
      phone: data.phone,
      email: data.email ?? undefined,
    },
  };
}

export async function updateFamilyContact(
  id: string,
  input: Omit<FamilyContact, "id">
): Promise<AddContactResult> {
  if (!input.name.trim() || !input.phone.trim()) {
    return { success: false, error: "Name and phone number are required." };
  }

  const userId = await getRealUserId();

  if (!userId) {
    const contacts = readLocalContacts();
    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: "Contact not found." };
    }
    const updated: FamilyContact = {
      id,
      name: input.name.trim(),
      relationship: input.relationship.trim() || "Family",
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
    };
    contacts[index] = updated;
    writeLocalContacts(contacts);
    return { success: true, contact: updated };
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("emergency_contacts")
    .update({
      name: input.name.trim(),
      relationship: input.relationship.trim() || "Family",
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Couldn't update this contact." };
  }

  return {
    success: true,
    contact: {
      id: data.id,
      name: data.name,
      relationship: data.relationship ?? "",
      phone: data.phone,
      email: data.email ?? undefined,
    },
  };
}

export async function removeFamilyContact(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getRealUserId();

  if (!userId) {
    writeLocalContacts(readLocalContacts().filter((c) => c.id !== id));
    return { success: true };
  }

  const supabase = getSupabaseClient()!;
  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}