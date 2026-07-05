export interface CoupleInfo {
  id: 'coupleA' | 'coupleB';
  groom: {
    fullName: string;
    nickname: string;
    fatherName: string;
    motherName: string;
    childOrdinal: string;
    instagram?: string;
    avatar: string;
  };
  bride: {
    fullName: string;
    nickname: string;
    fatherName: string;
    motherName: string;
    childOrdinal: string;
    instagram?: string;
    avatar: string;
  };
  quote: string;
  quoteAuthor: string;
  akad: {
    date: string; // YYYY-MM-DD
    time: string; // e.g., "08.00 - 09.30 WIB"
    venue: string;
    address: string;
    mapsLink: string;
    googleCalendarUrl: string;
  };
  resepsi: {
    date: string; // YYYY-MM-DD
    time: string; // e.g., "11.00 - 13.00 WIB"
    venue: string;
    address: string;
    mapsLink: string;
    dressCode: string;
    googleCalendarUrl: string;
  };
  gift: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrisUrl?: string;
  };
}

const defaultWeddingData = {
  title: "Undangan Pernikahan",
  dateText: "Minggu, 11 Oktober 2026",
  commonVenue: "Kediaman I Gede Julianto",
  commonAddress: "HMMM+99, Seraya Tim., Kec. Karangasem, Kabupaten Karangasem, Bali 80811",
  commonMapsLink: "https://maps.google.com/maps?q=I%20GEDE%20JULIANTO,%20Seraya%20Tim.,%20Kec.%20Karangasem,%20Kabupaten%20Karangasem,%20Bali%2080811",
  bgMusicUrl: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-2483.mp3",
  bgMusicTitle: "Melodi Swarga - Gamelan Bali & Suling Klasik",
  
  // Customization Core Additions
  monogramText: "ABDE",
  logoUrl: "/images/BALI-ICON.webp",
  defaultTheme: "plum-gold",
  footerThankYou: "Ungkapan terima kasih yang tulus dari lubuk hati kami atas kehadiran serta doa restu yang Anda berikan.",
  sectionTitleSaveTheDate: "Save The Date",
  sectionTitleAkad: "Akad Nikah",
  sectionTitleResepsi: "Resepsi Pernikahan",
  sectionTitleStory: "Our Love Story",
  sectionTitleGallery: "Galeri Bahagia",
  sectionTitleGift: "Amplop Digital",
  sectionTitleWishes: "Guestbook & Doa Restu",
  bgCoverUrl: "/images/BALI-BACKGROUND.jpg",
  bgAkadUrl: "/images/BALI-FALLBACK.jpeg",
  bgResepsiUrl: "/images/BALI-FALLBACK.jpeg",
  bgStoryUrl: "/images/BALI-FALLBACK.jpeg",
  bgGiftUrl: "/images/BALI-FALLBACK.jpeg",
  
  // Admin Features Additions
  shareTemplate: "Dengan penuh rasa syukur dan hormat, kami mengundang Bapak/Ibu/Saudara/i {nama_tamu} untuk turut hadir dan memberikan doa restu di hari bahagia kami, pernikahan bersama (joint wedding) {nama_pasangan}.\n\nBuka tautan undangan digital resmi kami berikut ini:\n{link}",
  maintenanceMode: false,
  streamingUrl: "" as string, // YouTube/Zoom live link — empty by default
  streamingEnabled: true as boolean, // admin can toggle the Watch-Live button on/off
  streamingLiveStart: "" as string, // optional ISO datetime for go-live window
  streamingLiveEnd: "" as string,   // optional ISO datetime for go-live window end
  guestList: [
    { id: "g-1", name: "Bp. Dr. Wayan Koster", invitedCouple: "both", visits: 3 },
    { id: "g-2", name: "Prof. Nyoman Gede", invitedCouple: "coupleA", visits: 1 },
    { id: "g-3", name: "Dewa Ayu Sekar", invitedCouple: "coupleB", visits: 0 }
  ] as Array<{ id: string; name: string; invitedCouple: 'both' | 'coupleA' | 'coupleB'; visits: number; phone?: string }>,
  
  coupleA: {
    id: 'coupleA',
    groom: {
      fullName: "Aria Nugraha, S.T.",
      nickname: "Aria",
      fatherName: "I Gede Julianto",
      motherName: "Ni Ketut Astini",
      childOrdinal: "Putra pertama",
      instagram: "@aria.nugraha",
      avatar: "/images/BALI-COUPLE-1.png"
    },
    bride: {
      fullName: "Bella Citra, S.Ak.",
      nickname: "Bella",
      fatherName: "H. Rahman Hakim",
      motherName: "Hj. Linda Lestari",
      childOrdinal: "Putri kedua",
      instagram: "@bellacitra_",
      avatar: "/images/BALI-COUPLE-2.webp"
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
      qrisUrl: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=300"
    }
  } as CoupleInfo,

  coupleB: {
    id: 'coupleB',
    groom: {
      fullName: "Devan Aditya, S.Kom.",
      nickname: "Devan",
      fatherName: "I Gede Julianto",
      motherName: "Ni Ketut Astini",
      childOrdinal: "Putra kedua",
      instagram: "@devan.aditya",
      avatar: "/images/BALI-COUPLE-3.png"
    },
    bride: {
      fullName: "Elina Putri, M.B.A.",
      nickname: "Elina",
      fatherName: "Drs. Bambang Wijaya",
      motherName: "Hj. Ratna Safitri",
      childOrdinal: "Putri pertama",
      instagram: "@elinaputri.w",
      avatar: "/images/BALI-COUPLE-4.webp"
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
      qrisUrl: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=300"
    }
  } as CoupleInfo,

  timeline: [
    { time: "08:00 - 09:30", type: "Akad Nikah", couple: "coupleA", title: "Akad Nikah Aria & Bella", desc: "Prosesi ijab kabul suci pasangan Aria & Bella.", icon: "heart" },
    { time: "10:00 - 11:30", type: "Akad Nikah", couple: "coupleB", title: "Akad Nikah Devan & Elina", desc: "Prosesi ijab kabul suci pasangan Devan & Elina.", icon: "heart" },
    { time: "11:00 - 13:00", type: "Resepsi", couple: "coupleA", title: "Resepsi Pernikahan Aria & Bella", desc: "Ramah tamah dan syukuran atas pernikahan Aria & Bella.", icon: "party" },
    { time: "13:30 - 15:30", type: "Resepsi", couple: "coupleB", title: "Resepsi Pernikahan Devan & Elina", desc: "Ramah tamah dan syukuran atas pernikahan Devan & Elina.", icon: "party" },
  ]
};

// Initialize dynamic weddingData from localStorage
let loadedData = { ...defaultWeddingData };
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('wedding_custom_data');
  if (stored) {
    try {
      loadedData = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing wedding_custom_data", e);
    }
  } else {
    localStorage.setItem('wedding_custom_data', JSON.stringify(defaultWeddingData));
  }
}

export const weddingData = loadedData;
