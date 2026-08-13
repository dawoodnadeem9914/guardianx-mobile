# GuardianX Mobile

**GuardianX Mobile** is a separate, mobile-first "Easy Emergency Assistant" — a simplified companion to the full GuardianX website, built specifically for elderly users, children, and anyone who needs help fast without navigating a complex interface.

This is a **completely separate project** from the main `guardianx` website repo. Nothing in the website's design or features was replaced — the two share the same Supabase backend once connected, but remain independent frontends.

## Installation & running locally

```bash
cd guardianx-mobile
npm install
cp .env.example .env.local   # then fill in real values — see below
npm run dev
```

Next.js will print the actual local URL in your terminal (commonly `http://localhost:3000`, but check the terminal output — it will tell you if it picked a different port). To test on a real phone, use the "Network" URL Next.js also prints, with your phone on the same WiFi.

```bash
npm run build && npm run start   # production build
```

## Environment variables

| Variable | Powers | Without it |
|---|---|---|
| `OPENAI_API_KEY` | Real GPT-4.1 mini emergency classification, image analysis, and AI guidance | Falls back to an honest, clearly-labeled non-AI classifier — never silently presented as AI |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Real "Connect to GuardianX" (real token exchange + Supabase Auth sign-in), real Family Contacts (`emergency_contacts`) and Medical Information (`medical_profiles`) once connected — the same tables the website uses | Connect page honestly shows "not set up yet"; Family Contacts/Medical Info stay device-local |

Emergency Help and Family & Relatives work fully with **no environment variables set at all** — nothing is required to use the core emergency features.

## What's real vs. simulated

- **Real**: AI classification/guidance (GPT-4.1 mini), voice input (SpeechRecognition), camera/image input, real `tel:999` and family calls, real geolocation, real distance calculation to the nearest hospital, real family messaging (Web Share API / SMS / WhatsApp deep links — GuardianX never claims to have delivered a message itself), real Supabase-backed connection (short-lived single-use token + Supabase Auth), real camera QR scanning, real accessibility settings (large text/high contrast/reduced motion/voice guidance — all apply instantly, app-wide, no refresh), real English/Bahasa Melayu translation.
- **Simulated, always clearly labeled**: the ambulance/hospital journey shown for Medical emergencies only. Police and Fire flows never show an ambulance or any fabricated dispatch tracking.
- **Estimated, not live routing**: hospital distance is a real straight-line calculation from your real location; travel time is explicitly labeled as an approximate estimate, not live traffic/routing data.

## Testing checklist

- Home → Emergency Help → Medical / Police / Fire / I'm Not Sure / voice / text / camera
- Family & Relatives → add up to 3 contacts → Call / Message
- Settings → Accessibility → toggle Large Text / High Contrast / Reduced Animation / Voice Guidance, and switch language — every change should apply immediately, on the current screen, with no refresh
- Settings → Connect to GuardianX → Scan QR Code (needs camera permission) or Enter Code Manually
