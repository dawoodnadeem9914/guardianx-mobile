export interface FamilyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export const MAX_FAMILY_CONTACTS = 3;

export interface FamilyMessage {
  id: string;
  text: string;
  sentToContactIds: string[];
  sentAt: string;
}
