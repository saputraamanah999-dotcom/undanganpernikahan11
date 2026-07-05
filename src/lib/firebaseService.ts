import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  User
} from "./firebase";

// ============================================================
// BALI IMAGE CONSTANTS (canonical references)
// ============================================================
export const BALI_IMAGES = {
  icon: '/images/BALI-ICON.webp',
  background: '/images/BALI-BACKGROUND.jpg',
  fallback: '/images/BALI-FALLBACK.jpeg',
  coupleA1: '/images/BALI-COUPLE-1.png',   // Couple A groom
  coupleA2: '/images/BALI-COUPLE-2.webp',  // Couple A bride
  coupleB1: '/images/BALI-COUPLE-3.png',   // Couple B groom
  coupleB2: '/images/BALI-COUPLE-4.webp',  // Couple B bride
} as const;

// ============================================================
// ANNOUNCEMENT TYPES
// ============================================================
export type AnnouncementAudience = 'all' | 'coupleA' | 'coupleB' | 'vip';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  timestamp: number;
  /** Who sent the announcement (e.g. "Keluarga Besar", "Developer", "Panitia"). */
  sender?: string;
  /** Audience target — currently all guests receive every announcement; stored for future filtering. */
  audience?: AnnouncementAudience;
}

/** Human-readable labels for each audience option (used in admin select + guest badges). */
export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Semua Tamu',
  coupleA: 'Tamu Couple A',
  coupleB: 'Tamu Couple B',
  vip: 'VIP'
};

// ============================================================
// DEFAULT WEDDING CONFIG (Bali Edition)
// ============================================================
const defaultWeddingConfig = {
  title: "Undangan Pernikahan",
  dateText: "Minggu, 11 Oktober 2026",
  commonVenue: "Kediaman I Gede Julianto",
  commonAddress: "HMMM+99, Seraya Tim., Kec. Karangasem, Kabupaten Karangasem, Bali 80811",
  commonMapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
  bgMusicUrl: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-2483.mp3",
  bgMusicTitle: "Melodi Swarga - Gamelan Bali & Suling Klasik",
  monogramText: "ABDE",
  logoUrl: BALI_IMAGES.icon,
  defaultTheme: "plum-gold",
  footerThankYou: "Ungkapan terima kasih yang tulus dari lubuk hati kami atas kehadiran serta doa restu yang Anda berikan.",
  sectionTitleSaveTheDate: "Save The Date",
  sectionTitleAkad: "Akad Nikah",
  sectionTitleResepsi: "Resepsi Pernikahan",
  sectionTitleStory: "Our Love Story",
  sectionTitleGallery: "Galeri Bahagia",
  sectionTitleGift: "Amplop Digital",
  sectionTitleWishes: "Guestbook & Doa Restu",
  bgCoverUrl: BALI_IMAGES.background,
  bgAkadUrl: BALI_IMAGES.fallback,
  bgResepsiUrl: BALI_IMAGES.fallback,
  bgStoryUrl: BALI_IMAGES.fallback,
  bgGiftUrl: BALI_IMAGES.fallback,
  shareTemplate: "Dengan penuh rasa syukur dan hormat, kami mengundang Bapak/Ibu/Saudara/i {nama_tamu} untuk turut hadir dan memberikan doa restu di hari bahagia kami, pernikahan bersama (joint wedding) {nama_pasangan}.\n\nBuka tautan undangan digital resmi kami berikut ini:\n{link}",
  maintenanceMode: false,
  streamingUrl: "", // YouTube/Zoom live link
  guestList: [
    { id: "g-1", name: "Bp. Dr. Wayan Koster", invitedCouple: "both", visits: 3 },
    { id: "g-2", name: "Prof. Nyoman Gede", invitedCouple: "coupleA", visits: 1 },
    { id: "g-3", name: "Dewa Ayu Sekar", invitedCouple: "coupleB", visits: 0 }
  ],
  timeline: [
    { time: "08:00 - 09:30", type: "Akad Nikah", couple: "coupleA", title: "Akad Nikah Aria & Bella", desc: "Prosesi ijab kabul suci pasangan Aria & Bella.", icon: "heart" },
    { time: "10:00 - 11:30", type: "Akad Nikah", couple: "coupleB", title: "Akad Nikah Devan & Elina", desc: "Prosesi ijab kabul suci pasangan Devan & Elina.", icon: "heart" },
    { time: "11:00 - 13:00", type: "Resepsi", couple: "coupleA", title: "Resepsi Pernikahan Aria & Bella", desc: "Ramah tamah dan syukuran atas pernikahan Aria & Bella.", icon: "party" },
    { time: "13:30 - 15:30", type: "Resepsi", couple: "coupleB", title: "Resepsi Pernikahan Devan & Elina", desc: "Ramah tamah dan syukuran atas pernikahan Devan & Elina.", icon: "party" }
  ]
};

const defaultCoupleA = {
  id: 'coupleA',
  groom: {
    fullName: "Aria Nugraha, S.T.",
    nickname: "Aria",
    fatherName: "I Gede Julianto",
    motherName: "Ni Ketut Astini",
    childOrdinal: "Putra pertama",
    instagram: "@aria.nugraha",
    avatar: BALI_IMAGES.coupleA1
  },
  bride: {
    fullName: "Bella Citra, S.Ak.",
    nickname: "Bella",
    fatherName: "H. Rahman Hakim",
    motherName: "Hj. Linda Lestari",
    childOrdinal: "Putri kedua",
    instagram: "@bellacitra_",
    avatar: BALI_IMAGES.coupleA2
  },
  quote: "Maka Dia menjadikan kamu berpasang-pasangan, agar kamu cenderung dan merasa tenteram kepada-Nya, dan dijadikan-Nya diantaramu rasa kasih dan sayang.",
  quoteAuthor: "Ar-Rum: 21",
  akad: {
    date: "2026-10-11",
    time: "08:00 - 09:30 WITA",
    venue: "Kediaman I Gede Julianto",
    address: "HMMM+99, Seraya Tim., Kec. Karangasem, Bali 80811",
    mapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
    googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Akad+Nikah+Aria+%26+Bella&dates=20261011T010000Z/20261011T023000Z&details=Pernikahan+Aria+%26+Bella&location=Kediaman+I+Gede+Julianto"
  },
  resepsi: {
    date: "2026-10-11",
    time: "11:00 - 13:00 WITA",
    venue: "Kediaman I Gede Julianto",
    address: "HMMM+99, Seraya Tim., Kec. Karangasem, Bali 80811",
    mapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
    dressCode: "Adat Bali / Formal Sopan (Gold & Cream Accent)",
    googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Resepsi+Pernikahan+Aria+%26+Bella&dates=20261011T040000Z/20261011T060000Z&details=Resepsi+Pernikahan+Aria+%26+Bella&location=Kediaman+I+Gede+Julianto"
  },
  gift: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "8012345678",
    accountHolder: "I GEDE JULIANTO",
    qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226BCA5937I%20GEDE%20JULIANTO520459995802ID5914I%20GEDE%20JULIANTO6011Karangasem61058081162270517018012345678703A0113045812A0113HE07"
  }
};

const defaultCoupleB = {
  id: 'coupleB',
  groom: {
    fullName: "Devan Aditya, S.Kom.",
    nickname: "Devan",
    fatherName: "I Gede Julianto",
    motherName: "Ni Ketut Astini",
    childOrdinal: "Putra kedua",
    instagram: "@devan.aditya",
    avatar: BALI_IMAGES.coupleB1
  },
  bride: {
    fullName: "Elina Putri, M.B.A.",
    nickname: "Elina",
    fatherName: "Drs. Bambang Wijaya",
    motherName: "Hj. Ratna Safitri",
    childOrdinal: "Putri pertama",
    instagram: "@elinaputri.w",
    avatar: BALI_IMAGES.coupleB2
  },
  quote: "Cinta sejati tidak berakhir pada pernikahan, melainkan dimulai di hari pernikahan itu dan terus tumbuh mekar setiap hari di sepanjang kehidupan.",
  quoteAuthor: "M. Ghandi",
  akad: {
    date: "2026-10-11",
    time: "10:00 - 11:30 WITA",
    venue: "Kediaman I Gede Julianto",
    address: "HMMM+99, Seraya Tim., Kec. Karangasem, Bali 80811",
    mapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
    googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Akad+Nikah+Devan+%26+Elina&dates=20261011T030000Z/20261011T043000Z&details=Pernikahan+Devan+%26+Elina&location=Kediaman+I+Gede+Julianto"
  },
  resepsi: {
    date: "2026-10-11",
    time: "13:30 - 15:30 WITA",
    venue: "Kediaman I Gede Julianto",
    address: "HMMM+99, Seraya Tim., Kec. Karangasem, Bali 80811",
    mapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
    dressCode: "Adat Bali / Formal Sopan (Pastel & Sage Accent)",
    googleCalendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Resepsi+Pernikahan+Devan+%26+Elina&dates=20261011T053000Z/20261011T073000Z&details=Resepsi+Pernikahan+Devan+%26+Elina&location=Kediaman+I+Gede+Julianto"
  },
  gift: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "8012345678",
    accountHolder: "I GEDE JULIANTO",
    qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226BCA5937I%20GEDE%20JULIANTO520459995802ID5914I%20GEDE%20JULIANTO6011Karangasem61058081162270517018012345678703A0113045812A0113HE07"
  }
};

const defaultGallery = [
  {
    id: 'bali-couple-1',
    url: BALI_IMAGES.coupleA1,
    caption: 'Aria - Mempelai Pria Pernikahan I',
    category: 'Prewedding'
  },
  {
    id: 'bali-couple-2',
    url: BALI_IMAGES.coupleA2,
    caption: 'Bella - Mempelai Wanita Pernikahan I',
    category: 'Prewedding'
  },
  {
    id: 'bali-couple-3',
    url: BALI_IMAGES.coupleB1,
    caption: 'Devan - Mempelai Pria Pernikahan II',
    category: 'Engagement'
  },
  {
    id: 'bali-couple-4',
    url: BALI_IMAGES.coupleB2,
    caption: 'Elina - Mempelai Wanita Pernikahan II',
    category: 'Engagement'
  },
  {
    id: 'bali-bg',
    url: BALI_IMAGES.background,
    caption: 'Pemandangan Bali - Latar Acara Pernikahan',
    category: 'Family'
  },
  {
    id: 'bali-fallback',
    url: BALI_IMAGES.fallback,
    caption: 'Suasana Khidmat Pesta Pernikahan Adat Bali',
    category: 'Family'
  }
];

const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann-welcome',
    title: 'SELAMAT DATANG',
    message: 'Terima kasih telah membuka undangan digital pernikahan bersama kami. Mohon aktifkan notifikasi untuk menerima pengumuman penting langsung dari keluarga mempelai.',
    icon: 'sparkles',
    link: '',
    timestamp: Date.now() - 3600000 * 24, // 1 day ago
    sender: 'Keluarga Besar',
    audience: 'all'
  }
];

// ============================================================
// SEEDING (guarded - only seeds ONCE via meta/seeded flag)
// ============================================================
export async function seedDefaultDataIfNeeded() {
  try {
    // Use a meta doc to guard against re-seeding admin edits
    const metaRef = doc(db, "meta", "seeded");
    const metaSnap = await getDoc(metaRef);

    // If meta says seeded AND the site_config doc exists, skip
    const configDocRef = doc(db, "siteSettings", "site_config");
    const configSnap = await getDoc(configDocRef);

    if (metaSnap.exists() && configSnap.exists()) {
      console.log("[Firebase] Database already seeded. Skipping.");
      return;
    }

    console.log("[Firebase] Database is empty. Seeding defaults...");

    // 1. Seed Site Config (only if missing)
    if (!configSnap.exists()) {
      await setDoc(configDocRef, defaultWeddingConfig);
    }

    // 2. Seed Couples (use setDoc with merge:false to ensure clean defaults only on first run)
    const coupleARef = doc(db, "couples", "coupleA");
    const coupleBRef = doc(db, "couples", "coupleB");
    const [aSnap, bSnap] = await Promise.all([getDoc(coupleARef), getDoc(coupleBRef)]);
    if (!aSnap.exists()) await setDoc(coupleARef, defaultCoupleA);
    if (!bSnap.exists()) await setDoc(coupleBRef, defaultCoupleB);

    // 3. Seed Gallery (only items not already present)
    for (const item of defaultGallery) {
      const itemRef = doc(db, "gallery", item.id);
      const itemSnap = await getDoc(itemRef);
      if (!itemSnap.exists()) {
        await setDoc(itemRef, { ...item, timestamp: Date.now() });
      }
    }

    // 4. Seed Announcements
    for (const ann of defaultAnnouncements) {
      const annRef = doc(db, "announcements", ann.id);
      const annSnap = await getDoc(annRef);
      if (!annSnap.exists()) {
        await setDoc(annRef, ann);
      }
    }

    // 5. Whitelist default admin emails
    const admins = [
      "gedejulianto148@gmail.com",
      "saputra.developer@gmail.com",
      "saputraamanah999@gmail.com"
    ];
    for (const email of admins) {
      const adminRef = doc(db, "admins", email.toLowerCase());
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          email: email.toLowerCase(),
          role: "admin",
          name: email.split("@")[0]
        });
      }
    }

    // 6. Mark seeded
    await setDoc(metaRef, { seeded: true, seededAt: Date.now() });

    console.log("[Firebase] Seeding successfully completed!");
  } catch (error) {
    console.error("[Firebase] Error seeding default data:", error);
  }
}

// ============================================================
// ADMIN AUTH (Google sign-in gated by Firestore admins collection)
// ============================================================
export async function checkIfAdminEmailWhitelisted(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const adminDocRef = doc(db, "admins", email.toLowerCase());
    const adminSnap = await getDoc(adminDocRef);
    return adminSnap.exists();
  } catch (e) {
    console.error("Error checking whitelist:", e);
    return false;
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email;
    if (email) {
      const isAllowed = await checkIfAdminEmailWhitelisted(email);
      if (isAllowed) {
        localStorage.setItem('wedding_admin_logged_in', 'true');
        localStorage.setItem('wedding_admin_email', email);
        window.dispatchEvent(new CustomEvent('wedding_admin_state_changed'));
        return result.user;
      } else {
        await signOut(auth);
        throw new Error("Email ini tidak terdaftar sebagai admin! Tambahkan email Anda ke koleksi 'admins' di Firestore.");
      }
    }
    throw new Error("Gagal mengambil email dari Google Auth.");
  } catch (error: any) {
    console.error("Google login error:", error);
    throw error;
  }
}

export async function logoutAdmin() {
  await signOut(auth);
  localStorage.removeItem('wedding_admin_logged_in');
  localStorage.removeItem('wedding_admin_email');
  window.dispatchEvent(new CustomEvent('wedding_admin_state_changed'));
}

export { onAuthStateChanged };

// ============================================================
// REALTIME SUBSCRIBERS (onSnapshot — admin edits → all guests instantly)
// ============================================================
export function subscribeToSiteSettings(onUpdate: (data: any) => void) {
  return onSnapshot(doc(db, "siteSettings", "site_config"), (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data());
    }
  }, (err) => {
    console.error("[Firebase] siteSettings subscribe error:", err);
  });
}

export function subscribeToCouples(onUpdate: (couples: { coupleA: any; coupleB: any }) => void) {
  let coupleA: any = null;
  let coupleB: any = null;
  return onSnapshot(collection(db, "couples"), (snapshot) => {
    snapshot.forEach((doc) => {
      if (doc.id === "coupleA") coupleA = doc.data();
      if (doc.id === "coupleB") coupleB = doc.data();
    });
    onUpdate({ coupleA, coupleB });
  }, (err) => {
    console.error("[Firebase] couples subscribe error:", err);
  });
}

export function subscribeToGallery(onUpdate: (photos: any[]) => void) {
  const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const photos: any[] = [];
    snapshot.forEach((doc) => {
      photos.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(photos);
  }, (err) => {
    console.error("[Firebase] gallery subscribe error:", err);
    onUpdate([]);
  });
}

export function subscribeToAnnouncements(onUpdate: (announcements: any[]) => void) {
  const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (err) => {
    console.error("[Firebase] announcements subscribe error:", err);
    onUpdate([]);
  });
}

export function subscribeToRSVP(onUpdate: (rsvp: any[]) => void) {
  const q = query(collection(db, "rsvp"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (err) => {
    console.error("[Firebase] rsvp subscribe error:", err);
    onUpdate([]);
  });
}

export function subscribeToGuestbook(onUpdate: (wishes: any[]) => void) {
  const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (err) => {
    console.error("[Firebase] guestbook subscribe error:", err);
    onUpdate([]);
  });
}

export function subscribeToViewedByTracking(onUpdate: (views: Record<string, string[]>) => void) {
  return onSnapshot(collection(db, "viewedByTracking"), (snapshot) => {
    const viewsMap: Record<string, string[]> = {};
    snapshot.forEach((doc) => {
      viewsMap[doc.id] = doc.data().viewers || [];
    });
    onUpdate(viewsMap);
  });
}

// ============================================================
// LIVE GUEST PRESENCE (heartbeats, expires after 60s)
// ============================================================
export function subscribeToPresence(onUpdate: (count: number, guests: any[]) => void) {
  const q = query(collection(db, "presence"));
  return onSnapshot(q, (snapshot) => {
    const now = Date.now();
    const guests: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen || 0;
      // Expire after 60 seconds
      if (now - lastSeen < 60000) {
        guests.push({ id: doc.id, ...data });
      }
    });
    onUpdate(guests.length, guests);
  });
}

export async function heartbeatPresence(guestId: string, meta: { name?: string; couple?: string } = {}) {
  try {
    const ref = doc(db, "presence", guestId);
    await setDoc(ref, {
      id: guestId,
      lastSeen: Date.now(),
      name: meta.name || 'Tamu',
      couple: meta.couple || 'both',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }, { merge: true });
  } catch (e) {
    // Silent fail — presence is best-effort
  }
}

export async function removePresence(guestId: string) {
  try {
    await deleteDoc(doc(db, "presence", guestId));
  } catch (e) {
    // Silent fail
  }
}

// ============================================================
// MUTATORS (admin / public writes — these propagate to ALL guests in realtime)
// ============================================================
export async function updateSiteSettingsInFirebase(settingsData: any) {
  const configDocRef = doc(db, "siteSettings", "site_config");
  await updateDoc(configDocRef, settingsData);
}

export async function updateCoupleInFirebase(coupleId: 'coupleA' | 'coupleB', coupleData: any) {
  const coupleRef = doc(db, "couples", coupleId);
  await updateDoc(coupleRef, coupleData);
}

export async function addGalleryPhotoToFirebase(photo: { url: string; caption: string; category: string }) {
  const id = `photo-${Date.now()}`;
  await setDoc(doc(db, "gallery", id), {
    id,
    ...photo,
    timestamp: Date.now()
  });
  return id;
}

export async function updateGalleryPhotoInFirebase(photoId: string, photo: { url?: string; caption?: string; category?: string }) {
  await updateDoc(doc(db, "gallery", photoId), photo);
}

export async function deleteGalleryPhotoFromFirebase(photoId: string) {
  await deleteDoc(doc(db, "gallery", photoId));
}

// Announcements — admin broadcasts to ALL guests instantly via onSnapshot.
// Extended schema: each announcement carries `sender` (who sent it) and
// `audience` (which guest segment it targets; for now all guests receive all).
export async function addAnnouncementToFirebase(
  title: string,
  message: string,
  options: { icon?: string; link?: string; sender?: string; audience?: AnnouncementAudience } = {}
) {
  const id = `ann-${Date.now()}`;
  const data: Announcement = {
    id,
    title,
    message,
    icon: options.icon || 'bell',
    link: options.link || '',
    timestamp: Date.now(),
    sender: options.sender?.trim() || 'Keluarga Besar',
    audience: options.audience || 'all'
  };
  await setDoc(doc(db, "announcements", id), data);
  return data;
}

export async function deleteAnnouncementFromFirebase(id: string) {
  await deleteDoc(doc(db, "announcements", id));
  await deleteDoc(doc(db, "viewedByTracking", id));
}

// RSVP — accepts the RSVPForm.tsx RSVPData shape
export async function submitRSVPToFirebase(rsvp: {
  id: string;
  name: string;
  guestsCount: number;
  coupleChoice: 'coupleA' | 'coupleB' | 'both';
  ceremonyChoice: 'akad' | 'resepsi' | 'both';
  status: 'hadir' | 'tidak_hadir';
  wishes: string;
  createdAt: string;
}) {
  await setDoc(doc(db, "rsvp", rsvp.id), {
    ...rsvp,
    timestamp: Date.now()
  });
}

export async function deleteRsvpFromFirebase(id: string) {
  await deleteDoc(doc(db, "rsvp", id));
}

// Guestbook — supports the shape used by Guestbook.tsx
export async function submitGuestbookWishToFirebase(wish: {
  id: string;
  name: string;
  wishes: string;
  coupleChoice: 'coupleA' | 'coupleB' | 'both';
  createdAt: string;
  likes?: number;
}) {
  await setDoc(doc(db, "guestbook", wish.id), {
    ...wish,
    likes: wish.likes || 0,
    timestamp: Date.now()
  });
}

export async function likeGuestbookWishInFirebase(id: string, unlike: boolean = false) {
  const ref = doc(db, "guestbook", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const currentLikes = snap.data().likes || 0;
  await updateDoc(ref, { likes: unlike ? Math.max(0, currentLikes - 1) : currentLikes + 1 });
}

export async function deleteGuestbookWishFromFirebase(id: string) {
  await deleteDoc(doc(db, "guestbook", id));
}

// Legacy alias (some components may still call submitWishToFirebase)
export async function submitWishToFirebase(wishData: {
  name: string;
  relation: string;
  message: string;
  emoji?: string;
}) {
  const id = `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  await setDoc(doc(db, "guestbook", id), {
    id,
    name: wishData.name,
    wishes: wishData.message,
    coupleChoice: 'both' as const,
    likes: 0,
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  });
}

export async function trackAnnouncementViewInFirebase(announcementId: string, guestName: string) {
  if (!announcementId || !guestName) return;
  const docRef = doc(db, "viewedByTracking", announcementId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const viewers = docSnap.data().viewers || [];
      if (!viewers.includes(guestName)) {
        await updateDoc(docRef, {
          viewers: arrayUnion(guestName)
        });
      }
    } else {
      await setDoc(docRef, {
        announcementId,
        viewers: [guestName]
      });
    }
  } catch (e) {
    console.error("Error tracking view:", e);
  }
}
