"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { FamilyContactCard } from "@/components/FamilyContactCard";
import {
  getFamilyContacts,
  addFamilyContact,
  updateFamilyContact,
  removeFamilyContact,
} from "@/services/familyService";
import { useSettings } from "@/lib/settingsContext";
import { MAX_FAMILY_CONTACTS } from "@/types/family";
import type { FamilyContact } from "@/types/family";

export default function FamilyContactsSettingsPage() {
  const { t } = useSettings();
  const [contacts, setContacts] = React.useState<FamilyContact[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  // Non-null while editing an existing contact — the SAME form below
  // is reused for both add and edit, distinguished by this id.
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void getFamilyContacts().then(setContacts);
  }, []);

  function openAddForm() {
    if (contacts.length >= MAX_FAMILY_CONTACTS) {
      setError(t("maxContacts"));
      return;
    }
    setError(null);
    setEditingId(null);
    setName("");
    setRelationship("");
    setPhone("");
    setShowForm(true);
  }

  function openEditForm(contact: FamilyContact) {
    setError(null);
    setEditingId(contact.id);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = editingId
        ? await updateFamilyContact(editingId, { name, relationship, phone })
        : await addFamilyContact({ name, relationship, phone });

      if (!result.success) {
        setError(result.error ?? "Couldn't save this contact.");
        return;
      }

      if (editingId) {
        setContacts((prev) => prev.map((c) => (c.id === editingId ? result.contact! : c)));
      } else {
        setContacts((prev) => [...prev, result.contact!]);
      }
      closeForm();
    } catch (err) {
      // Belt-and-suspenders: the same "must never get stuck on
      // Saving..." guarantee applies to editing as it does to adding.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      const result = await removeFamilyContact(id);
      if (!result.success) {
        setError(result.error ?? "Couldn't remove this contact.");
        return;
      }
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const atLimit = contacts.length >= MAX_FAMILY_CONTACTS;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("familyContacts")} showHome />

      <div className="flex flex-1 flex-col gap-4 px-6 pb-10">
        <p className="text-center text-white/60">
          {contacts.length} / {MAX_FAMILY_CONTACTS}
        </p>

        {contacts.map((c) => (
          <FamilyContactCard
            key={c.id}
            contact={c}
            onEdit={() => openEditForm(c)}
            onRemove={() => void handleRemove(c.id)}
          />
        ))}

        {contacts.length === 0 && (
          <p className="text-center text-lg text-white/50">{t("noContactsYet")}</p>
        )}

        {!showForm && (
          <button
            type="button"
            onClick={openAddForm}
            disabled={atLimit}
            className="min-h-[4rem] rounded-xl2 border-2 border-dashed border-white/20 text-xl font-bold text-white/80 disabled:opacity-40"
          >
            + {t("addContact")}
          </button>
        )}

        {error && <p className="text-center text-lg font-semibold text-emergency-strong">{error}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl2 bg-white/5 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {editingId ? "Edit Contact" : "New Contact"}
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
              className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
            />
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Relationship (e.g. Mother)"
              className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              type="tel"
              required
              className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="min-h-[3.5rem] flex-1 rounded-xl2 border-2 border-white/20 text-lg font-bold text-white"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[3.5rem] flex-1 rounded-xl2 bg-teal text-lg font-bold text-navy disabled:opacity-50"
              >
                {saving ? "Saving…" : t("save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}