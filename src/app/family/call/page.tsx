"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { FamilyContactCard } from "@/components/FamilyContactCard";
import { getFamilyContacts } from "@/services/familyService";
import { useSettings } from "@/lib/settingsContext";
import type { FamilyContact } from "@/types/family";

export default function FamilyCallPage() {
  const router = useRouter();
  const { t } = useSettings();
  const [contacts, setContacts] = React.useState<FamilyContact[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    void getFamilyContacts().then((list) => {
      setContacts(list);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("callFamily")} showHome />
      <div className="flex flex-1 flex-col gap-4 px-6 pb-10">
        {loaded && contacts.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-xl font-semibold text-white">{t("noContactsYet")}</p>
            <Link href="/settings/contacts" className="text-lg font-bold text-teal underline">
              {t("addFamilyContact")}
            </Link>
          </div>
        )}

        {contacts.map((c) => (
          <FamilyContactCard key={c.id} contact={c} onCall={() => router.push(`/family/call/${c.id}`)} />
        ))}
      </div>
    </div>
  );
}
