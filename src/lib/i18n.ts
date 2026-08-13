/**
 * Real, centralized translation dictionary. Every user-facing string
 * in the app should be looked up here via a translation key, not
 * hardcoded per-page — that's what makes switching language actually
 * translate the whole app instead of just a label.
 *
 * Deliberately NOT translated anywhere in the app, per the explicit
 * requirement: emergency phone numbers, hospital/medical proper
 * names, and technical URLs/codes.
 *
 * Malay strings are natural Bahasa Melayu phrasing for an elderly
 * audience, not literal word-for-word machine translation.
 */

export type Language = "en" | "ms";

const dict = {
  // ---- Home ----
  appName: { en: "GuardianX", ms: "GuardianX" },
  homeTagline: { en: "We're here to help you.", ms: "Kami di sini untuk membantu anda." },
  emergencyHelp: { en: "EMERGENCY HELP", ms: "BANTUAN KECEMASAN" },
  getHelpNow: { en: "Get help now", ms: "Dapatkan bantuan sekarang" },
  familyAndRelatives: { en: "FAMILY & RELATIVES", ms: "KELUARGA & SAUDARA" },
  callOrMessage: { en: "Call or message", ms: "Telefon atau mesej" },
  settings: { en: "Settings", ms: "Tetapan" },
  connectToGuardianX: { en: "Connect to GuardianX", ms: "Sambung ke GuardianX" },

  // ---- Emergency ----
  whatDoYouNeed: { en: "WHAT DO YOU NEED?", ms: "APA YANG ANDA PERLUKAN?" },
  speakOrChoose: { en: "You can speak or choose.", ms: "Anda boleh bercakap atau pilih." },
  speakToGuardianX: { en: "SPEAK TO GUARDIANX", ms: "BERCAKAP DENGAN GUARDIANX" },
  medicalAmbulance: { en: "MEDICAL / AMBULANCE", ms: "PERUBATAN / AMBULANS" },
  police: { en: "POLICE", ms: "POLIS" },
  fireRescue: { en: "FIRE & RESCUE", ms: "BOMBA & PENYELAMAT" },
  notSure: { en: "I'M NOT SURE", ms: "SAYA TIDAK PASTI" },
  aiAssistant: { en: "AI ASSISTANT", ms: "PEMBANTU AI" },
  typeInstead: { en: "Type instead", ms: "Taip sebaliknya" },
  speakInstead: { en: "Speak instead", ms: "Bercakap sebaliknya" },
  sendToAi: { en: "SEND TO AI", ms: "HANTAR KE AI" },
  addPhoto: { en: "Add a Photo (optional)", ms: "Tambah Gambar (pilihan)" },
  readingPhoto: { en: "Reading photo…", ms: "Membaca gambar…" },
  continueLabel: { en: "Continue", ms: "Teruskan" },
  back: { en: "Back", ms: "Kembali" },
  analyzing: { en: "Analyzing…", ms: "Menganalisis…" },
  tellGuardianX: { en: "Tell GuardianX what's happening.", ms: "Beritahu GuardianX apa yang berlaku." },
  guidingQuestions: {
    en: "What happened? Is someone hurt? Is there a fire? Is someone threatening you?",
    ms: "Apa yang berlaku? Adakah sesiapa cedera? Adakah kebakaran? Adakah sesiapa mengancam anda?",
  },

  // ---- Confirmation / calling ----
  weRecommendCalling: {
    en: "GuardianX recommends calling emergency services.",
    ms: "GuardianX mengesyorkan anda menghubungi perkhidmatan kecemasan.",
  },
  emergencyNumberLabel: { en: "Emergency number", ms: "Nombor kecemasan" },
  callNow: { en: "CALL", ms: "HUBUNGI" },
  cancel: { en: "CANCEL", ms: "BATAL" },
  calling: { en: "Calling…", ms: "Menghubungi…" },
  emergencyServices: { en: "Emergency Services", ms: "Perkhidmatan Kecemasan" },

  // ---- AI Assistant ----
  listening: { en: "Listening…", ms: "Mendengar…" },
  tapToSpeak: { en: "Tap to speak", ms: "Ketik untuk bercakap" },
  youSaid: { en: "You said:", ms: "Anda berkata:" },
  voiceNotSupported: { en: "Voice isn't supported here", ms: "Suara tidak disokong di sini" },
  readAloud: { en: "Read aloud", ms: "Baca dengan kuat" },
  stopReading: { en: "Stop reading", ms: "Berhenti membaca" },
  aiGuidance: { en: "AI Guidance", ms: "Panduan AI" },
  generalGuidance: {
    en: "This is general guidance, not a substitute for emergency responders.",
    ms: "Ini adalah panduan umum, bukan pengganti pasukan kecemasan.",
  },

  // ---- Medical ----
  yourLocation: { en: "Your real location", ms: "Lokasi sebenar anda" },
  nearestHospital: { en: "Nearest hospital", ms: "Hospital terdekat" },
  simulated: { en: "simulated", ms: "simulasi" },
  distanceLabel: { en: "Distance", ms: "Jarak" },
  estimatedDrivingTime: {
    en: "Estimated driving time (straight-line estimate, not live routing)",
    ms: "Anggaran masa pemanduan (anggaran garis lurus, bukan navigasi masa nyata)",
  },
  ambulanceIsComing: { en: "SIMULATED AMBULANCE COMING", ms: "AMBULANS SIMULASI SEDANG DATANG" },
  pleaseStayCalm: { en: "Please stay calm.", ms: "Sila kekal tenang." },
  needAssistanceGuide: { en: "NEED ASSISTANCE / GUIDE?", ms: "PERLUKAN BANTUAN / PANDUAN?" },
  areYouAlone: { en: "Are you alone?", ms: "Adakah anda bersendirian?" },
  iAmAlone: { en: "I AM ALONE", ms: "SAYA BERSENDIRIAN" },
  someoneIsWithMe: { en: "SOMEONE IS WITH ME", ms: "ADA ORANG BERSAMA SAYA" },
  arrivedAtHospital: { en: "Arrived at hospital.", ms: "Tiba di hospital." },
  simulationEndsHere: { en: "Simulation ends here.", ms: "Simulasi tamat di sini." },

  // ---- Police / Fire ----
  policeAssistance: { en: "POLICE ASSISTANCE", ms: "BANTUAN POLIS" },
  fireAssistance: { en: "FIRE & RESCUE ASSISTANCE", ms: "BANTUAN BOMBA & PENYELAMAT" },
  callPlaced: { en: "CALL PLACED", ms: "PANGGILAN DIBUAT" },
  noPoliceDispatchTracking: {
    en: "GuardianX doesn't have a real live tracking connection to Malaysian police dispatch — this screen shows your real location only, not a real response ETA.",
    ms: "GuardianX tidak mempunyai sambungan penjejakan langsung sebenar ke penghantaran polis Malaysia — skrin ini hanya menunjukkan lokasi sebenar anda, bukan anggaran masa tiba sebenar.",
  },
  noFireDispatchTracking: {
    en: "GuardianX doesn't have a real live tracking connection to Malaysian fire and rescue dispatch — this screen shows your real location only, not a real response ETA.",
    ms: "GuardianX tidak mempunyai sambungan penjejakan langsung sebenar ke penghantaran bomba dan penyelamat Malaysia — skrin ini hanya menunjukkan lokasi sebenar anda, bukan anggaran masa tiba sebenar.",
  },
  imSafeFinish: { en: "I'm safe / Finish", ms: "Saya selamat / Selesai" },
  emergencyCallComplete: { en: "Emergency call complete.", ms: "Panggilan kecemasan selesai." },

  // ---- Family ----
  messageFamily: { en: "MESSAGE FAMILY", ms: "MESEJ KELUARGA" },
  callFamily: { en: "CALL FAMILY", ms: "TELEFON KELUARGA" },
  sendMessage: { en: "SEND MESSAGE", ms: "HANTAR MESEJ" },
  reviewMessage: { en: "Review message", ms: "Semak semula mesej" },
  sendTo: { en: "Send to (max 3)", ms: "Hantar kepada (maks 3)" },
  chooseContact: { en: "Choose a contact", ms: "Pilih kenalan" },
  callEnded: { en: "CALL ENDED", ms: "PANGGILAN TAMAT" },
  speakYourMessage: { en: "Speak your message.", ms: "Tuturkan mesej anda." },
  typeYourMessage: { en: "Type your message.", ms: "Taip mesej anda." },
  noContactsYet: { en: "No family contacts saved yet.", ms: "Belum ada kenalan keluarga disimpan." },
  addFamilyContact: { en: "Add a family contact", ms: "Tambah kenalan keluarga" },
  openedInYourApp: { en: "OPENED IN YOUR APP", ms: "DIBUKA DALAM APLIKASI ANDA" },
  finishSendingThere: {
    en: "Your message is ready — finish sending it in the app that opened. GuardianX can't confirm delivery on its own.",
    ms: "Mesej anda sudah sedia — selesaikan penghantaran dalam aplikasi yang dibuka. GuardianX tidak dapat mengesahkan penghantaran dengan sendirinya.",
  },
  backToHome: { en: "BACK TO HOME", ms: "KEMBALI KE UTAMA" },

  // ---- Settings ----
  myInformation: { en: "MY INFORMATION", ms: "MAKLUMAT SAYA" },
  myInformationDesc: { en: "Your name and basic details", ms: "Nama dan butiran asas anda" },
  familyContacts: { en: "FAMILY CONTACTS", ms: "KENALAN KELUARGA" },
  familyContactsDesc: { en: "People GuardianX can contact", ms: "Orang yang boleh dihubungi GuardianX" },
  maxContacts: { en: "Maximum 3 contacts", ms: "Maksimum 3 kenalan" },
  medicalInformation: { en: "MEDICAL INFORMATION", ms: "MAKLUMAT PERUBATAN" },
  medicalInformationDesc: { en: "Important health information", ms: "Maklumat kesihatan penting" },
  location: { en: "LOCATION", ms: "LOKASI" },
  locationDesc: { en: "Allow GuardianX to use your location", ms: "Benarkan GuardianX guna lokasi anda" },
  notifications: { en: "NOTIFICATIONS", ms: "PEMBERITAHUAN" },
  notificationsDesc: { en: "Emergency alerts and notifications", ms: "Amaran dan pemberitahuan kecemasan" },
  accessibility: { en: "ACCESSIBILITY", ms: "KEBOLEHCAPAIAN" },
  accessibilityDesc: {
    en: "Make GuardianX easier to see and use",
    ms: "Jadikan GuardianX lebih mudah dilihat dan digunakan",
  },
  connectDesc: {
    en: "Connect this mobile app to your GuardianX website account",
    ms: "Sambungkan aplikasi mudah alih ini ke akaun laman web GuardianX anda",
  },
  simulationMode: { en: "SIMULATION MODE", ms: "MOD SIMULASI" },
  simulationModeDesc: { en: "Safe demo — no real calls", ms: "Demo selamat — tiada panggilan sebenar" },
  largeText: { en: "Large Text", ms: "Teks Besar" },
  largeTextDesc: { en: "Make text bigger throughout the app", ms: "Besarkan teks di seluruh aplikasi" },
  highContrast: { en: "High Contrast", ms: "Kontras Tinggi" },
  highContrastDesc: {
    en: "Increase contrast for better visibility",
    ms: "Tingkatkan kontras untuk penglihatan lebih jelas",
  },
  voiceGuidance: { en: "Voice Guidance", ms: "Panduan Suara" },
  voiceGuidanceDesc: {
    en: "Automatically read important messages aloud",
    ms: "Baca mesej penting secara automatik dengan kuat",
  },
  reducedAnimation: { en: "Reduced Animation", ms: "Kurangkan Animasi" },
  reducedAnimationDesc: { en: "Turn off motion effects", ms: "Matikan kesan pergerakan" },
  language: { en: "Language", ms: "Bahasa" },
  english: { en: "English", ms: "English" },
  malay: { en: "Bahasa Melayu", ms: "Bahasa Melayu" },
  save: { en: "Save", ms: "Simpan" },
  saved: { en: "Saved", ms: "Disimpan" },
  addContact: { en: "Add Family Contact", ms: "Tambah Kenalan Keluarga" },
  fieldName: { en: "Name", ms: "Nama" },
  fieldAge: { en: "Age", ms: "Umur" },
  fieldBloodType: { en: "Blood type", ms: "Jenis darah" },
  fieldAllergies: { en: "Allergies", ms: "Alahan" },
  fieldConditions: { en: "Medical conditions", ms: "Keadaan perubatan" },
  fieldOtherInfo: { en: "Other important information", ms: "Maklumat penting lain" },
  medicalVisibleNote: {
    en: "Visible to hospital staff during a real emergency, once you've connected to GuardianX. Otherwise stored only on this device.",
    ms: "Boleh dilihat oleh kakitangan hospital semasa kecemasan sebenar, sebaik sahaja anda menyambung ke GuardianX. Jika tidak, hanya disimpan pada peranti ini.",
  },
  locationEnabledTitle: { en: "Location is enabled", ms: "Lokasi telah diaktifkan" },
  locationEnabledDesc: {
    en: "GuardianX can use your real location during an emergency to find the nearest hospital.",
    ms: "GuardianX boleh menggunakan lokasi sebenar anda semasa kecemasan untuk mencari hospital terdekat.",
  },
  locationDeniedTitle: { en: "Location is turned off", ms: "Lokasi dimatikan" },
  locationDeniedDesc: {
    en: "GuardianX can't access your location. On iPhone, check Settings → Privacy & Security → Location Services → Safari Websites (or your installed GuardianX app).",
    ms: "GuardianX tidak dapat mengakses lokasi anda. Di iPhone, semak Settings → Privacy & Security → Location Services → Safari Websites (atau aplikasi GuardianX yang dipasang).",
  },
  locationPromptTitle: { en: "Location hasn't been requested yet", ms: "Lokasi belum diminta lagi" },
  locationPromptDesc: {
    en: "GuardianX will ask for permission the next time it's needed, or you can test it now below.",
    ms: "GuardianX akan meminta kebenaran apabila diperlukan, atau anda boleh mengujinya sekarang di bawah.",
  },
  locationUnsupportedTitle: { en: "Location isn't supported", ms: "Lokasi tidak disokong" },
  locationUnsupportedDesc: {
    en: "This browser or device doesn't support location services.",
    ms: "Pelayar atau peranti ini tidak menyokong perkhidmatan lokasi.",
  },
  testRealLocation: { en: "Test Real Location", ms: "Uji Lokasi Sebenar" },
  gettingYourLocation: { en: "Getting your location…", ms: "Mendapatkan lokasi anda…" },
  locationOnlyForEmergency: {
    en: "Location is only ever used during an active emergency, to find the nearest hospital.",
    ms: "Lokasi hanya digunakan semasa kecemasan aktif, untuk mencari hospital terdekat.",
  },
  notifOnTitle: { en: "Notifications are on", ms: "Pemberitahuan dihidupkan" },
  notifOnDesc: {
    en: "GuardianX can show you notifications on this device.",
    ms: "GuardianX boleh menunjukkan pemberitahuan pada peranti ini.",
  },
  notifOffTitle: { en: "Notifications are off", ms: "Pemberitahuan dimatikan" },
  notifOffDesc: {
    en: "Turn them on in your browser or phone settings if you'd like GuardianX to notify you.",
    ms: "Hidupkannya dalam tetapan pelayar atau telefon anda jika anda mahu GuardianX memberitahu anda.",
  },
  notifDefaultTitle: { en: "Not set up yet", ms: "Belum disediakan" },
  notifDefaultDesc: {
    en: "Turn on notifications so GuardianX can reach you.",
    ms: "Hidupkan pemberitahuan supaya GuardianX dapat menghubungi anda.",
  },
  notifUnsupportedTitle: { en: "Not supported", ms: "Tidak disokong" },
  notifUnsupportedDesc: {
    en: "This browser doesn't support notifications.",
    ms: "Pelayar ini tidak menyokong pemberitahuan.",
  },
  requesting: { en: "Requesting…", ms: "Meminta…" },
  enableNotifications: { en: "Enable Notifications", ms: "Aktifkan Pemberitahuan" },
  sendTestNotification: { en: "Send a Test Notification", ms: "Hantar Pemberitahuan Ujian" },
  notifPushNote: {
    en: "Receiving a notification while GuardianX isn't open requires connecting to GuardianX (Settings → Connect to GuardianX) and a configured push service.",
    ms: "Menerima pemberitahuan semasa GuardianX tidak dibuka memerlukan sambungan ke GuardianX (Tetapan → Sambung ke GuardianX) dan perkhidmatan push yang dikonfigurasi.",
  },
  connectNotConfigured: { en: "GuardianX connection isn't set up yet", ms: "Sambungan GuardianX belum disediakan" },
  connectSignedInAs: { en: "Signed in as", ms: "Log masuk sebagai" },
  disconnect: { en: "Disconnect", ms: "Putuskan Sambungan" },
  connectWebsiteInstruction: {
    en: "On the GuardianX website, go to Settings → Connect Mobile App to get a real code.",
    ms: "Di laman web GuardianX, pergi ke Tetapan → Sambung Aplikasi Mudah Alih untuk dapatkan kod sebenar.",
  },
  or: { en: "or", ms: "atau" },
  connect: { en: "Connect", ms: "Sambung" },
  checkYourEmail: { en: "Check your email", ms: "Semak e-mel anda" },
  signInLinkSentTo: {
    en: "A real sign-in link was sent to",
    ms: "Pautan log masuk sebenar telah dihantar kepada",
  },
  openOnThisDevice: {
    en: "Open it on this device to finish connecting.",
    ms: "Buka di peranti ini untuk selesaikan penyambungan.",
  },
  noEmergencyTitle: { en: "No Emergency Detected", ms: "Tiada Kecemasan Dikesan" },
  noEmergencyMessage: {
    en: "Based on the information provided, GuardianX did not identify an apparent emergency.",
    ms: "Berdasarkan maklumat yang diberikan, GuardianX tidak mengesan sebarang kecemasan yang jelas.",
  },
  describeAgain: { en: "DESCRIBE AGAIN", ms: "TERANGKAN SEMULA" },
  callAnywayNote: {
    en: "If you believe someone is in immediate danger, you can still call for help.",
    ms: "Jika anda percaya seseorang berada dalam bahaya segera, anda masih boleh memanggil bantuan.",
  },
  call999Anyway: { en: "CALL 999 ANYWAY", ms: "TETAP HUBUNGI 999" },
  noAccountBanner: {
    en: "No account required — emergency help works immediately.",
    ms: "Tiada akaun diperlukan — bantuan kecemasan berfungsi serta-merta.",
  },

  // ---- Connection ----
  scanQrCode: { en: "SCAN QR CODE", ms: "IMBAS KOD QR" },
  enterCodeManually: { en: "Enter Code Manually", ms: "Masukkan Kod Secara Manual" },
  connected: { en: "GuardianX connected.", ms: "GuardianX telah disambungkan." },
  connectionSuccessful: {
    en: "Your family contacts and medical information can now sync with your GuardianX website account.",
    ms: "Kenalan keluarga dan maklumat perubatan anda kini boleh disegerakkan dengan akaun laman web GuardianX anda.",
  },
  invalidOrExpiredCode: {
    en: "That code didn't work — it may be invalid or expired.",
    ms: "Kod itu tidak berfungsi — mungkin tidak sah atau telah tamat tempoh.",
  },

  // ---- Generic errors/loading ----
  tryAgain: { en: "Try Again", ms: "Cuba Lagi" },
  loading: { en: "Loading…", ms: "Memuatkan…" },
} as const;

export type TranslationKey = keyof typeof dict;

export function translate(key: TranslationKey, language: Language): string {
  return dict[key][language];
}