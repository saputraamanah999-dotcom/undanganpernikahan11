import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Navigation, Calendar, Share2, Lock, Bell, Users, Radio, Languages, X, User } from 'lucide-react';
import { weddingData } from './data/weddingData';
import CoupleSwitcher from './components/CoupleSwitcher';
import CoupleCountdownCard from './components/CoupleCountdownCard';
import PetalCanvas from './components/PetalCanvas';
import AnimatedHeroBackground from './components/AnimatedHeroBackground';
import FloatingDock from './components/FloatingDock';
import LoadingFallback from './components/LoadingFallback';
import MaintenanceScreen from './components/MaintenanceScreen';
import {
  seedDefaultDataIfNeeded,
  subscribeToSiteSettings,
  subscribeToCouples,
  subscribeToAnnouncements,
  subscribeToPresence,
  heartbeatPresence,
  removePresence,
  updateSiteSettingsInFirebase,
} from './lib/firebaseService';

// Lazy loaded heavy components
const Envelope = lazy(() => import('./components/Envelope'));
const TimelineRundown = lazy(() => import('./components/TimelineRundown'));
const RSVPForm = lazy(() => import('./components/RSVPForm'));
const Guestbook = lazy(() => import('./components/Guestbook'));
const GiftSection = lazy(() => import('./components/GiftSection'));
const CoupleSection = lazy(() => import('./components/CoupleSection'));
const ScheduleSection = lazy(() => import('./components/ScheduleSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const NotificationPrompt = lazy(() => import('./components/NotificationPrompt'));
const PwaInstallPrompt = lazy(() => import('./components/PwaInstallPrompt'));

// Crystalline Cathedral Bell Chord Synthesizer using Web Audio API
const playChimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, delay: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Golden wedding chime chord sequence (G5, C6, E6)
    playTone(783.99, 0, 1.5, 0.15);
    playTone(1046.50, 0.12, 1.8, 0.15);
    playTone(1318.51, 0.24, 2.0, 0.12);
  } catch (err) {
    console.warn("AudioContext blocked or failed", err);
  }
};

// ============================================================
// LIVE-NOW DETECTION — when current time is during akad/resepsi
// ============================================================
function isLiveNow(weddingState: any, selectedCouple: 'coupleA' | 'coupleB' | 'both'): { live: boolean; couple: string; event: string } | null {
  const now = Date.now();
  const check = (coupleKey: 'coupleA' | 'coupleB') => {
    const c = weddingState[coupleKey];
    if (!c) return null;
    const checkEvent = (ev: any, label: string) => {
      if (!ev || !ev.date) return null;
      const match = ev.time?.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
      if (!match) return null;
      const [, sh, sm, eh, em] = match;
      const start = new Date(`${ev.date}T${sh.padStart(2, '0')}:${sm}:00+08:00`).getTime();
      const end = new Date(`${ev.date}T${eh.padStart(2, '0')}:${em}:00+08:00`).getTime();
      if (now >= start && now <= end) {
        return { live: true, couple: coupleKey, event: label };
      }
      return null;
    };
    return checkEvent(c.akad, 'Akad Nikah') || checkEvent(c.resepsi, 'Resepsi');
  };
  if (selectedCouple === 'coupleA') return check('coupleA');
  if (selectedCouple === 'coupleB') return check('coupleB');
  return check('coupleA') || check('coupleB');
}

export default function App() {
  const [weddingState, setWeddingState] = useState(weddingData);
  const [isOpened, setIsOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCouple, setSelectedCouple] = useState<'coupleA' | 'coupleB' | 'both'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const coupleParam = params.get('couple');
      if (coupleParam === 'coupleA' || coupleParam === 'coupleB' || coupleParam === 'both') {
        return coupleParam;
      }
    }
    return 'both';
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const [liveGuestCount, setLiveGuestCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [seenAnnouncementIds, setSeenAnnouncementIds] = useState<Set<string>>(new Set());

  // Language toggle (ID / EN)
  const [language, setLanguage] = useState<'id' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wedding_lang');
      if (stored === 'id' || stored === 'en') return stored;
    }
    return 'id';
  });

  useEffect(() => {
    localStorage.setItem('wedding_lang', language);
  }, [language]);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('wedding_admin_logged_in') === 'true';
  });

  // ============================================================
  // ADMIN STATE + SERVICE WORKER
  // ============================================================
  useEffect(() => {
    const handleAdminState = () => {
      setIsAdminLoggedIn(localStorage.getItem('wedding_admin_logged_in') === 'true');
    };
    window.addEventListener('wedding_admin_state_changed', handleAdminState);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.error('SW failed:', err));
    }

    return () => {
      window.removeEventListener('wedding_admin_state_changed', handleAdminState);
    };
  }, []);

  // ============================================================
  // THEME
  // ============================================================
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('wedding_active_theme');
      if (storedTheme) return storedTheme;
      const storedData = localStorage.getItem('wedding_custom_data');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.defaultTheme) return parsed.defaultTheme;
        } catch (e) {}
      }
    }
    return 'plum-gold';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('wedding_active_theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (weddingState.defaultTheme) {
      const userSelected = localStorage.getItem('wedding_theme_user_override') === 'true';
      if (!userSelected) {
        setCurrentTheme(weddingState.defaultTheme);
      }
    }
  }, [weddingState.defaultTheme]);

  // ============================================================
  // DYNAMIC HEAD METADATA
  // ============================================================
  useEffect(() => {
    let title = "The Joint Wedding | Aria & Bella & Devan & Elina";
    let description = "Kami mengundang Anda untuk menghadiri Acara Pernikahan Bersama (Joint Wedding) Aria & Bella & Devan & Elina pada Minggu, 11 Oktober 2026 di Kediaman I Gede Julianto, Karangasem, Bali.";
    let imageUrl = weddingState.bgCoverUrl || "/images/BALI-BACKGROUND.jpg";

    if (selectedCouple === 'coupleA' && weddingState.coupleA) {
      const groom = weddingState.coupleA.groom?.nickname;
      const bride = weddingState.coupleA.bride?.nickname;
      title = `Undangan Pernikahan ${groom} & ${bride}`;
      description = `Kami mengundang Anda untuk menghadiri Acara Pernikahan ${weddingState.coupleA.groom?.fullName} & ${weddingState.coupleA.bride?.fullName} di Karangasem, Bali.`;
    } else if (selectedCouple === 'coupleB' && weddingState.coupleB) {
      const groom = weddingState.coupleB.groom?.nickname;
      const bride = weddingState.coupleB.bride?.nickname;
      title = `Undangan Pernikahan ${groom} & ${bride}`;
      description = `Kami mengundang Anda untuk menghadiri Acara Pernikahan ${weddingState.coupleB.groom?.fullName} & ${weddingState.coupleB.bride?.fullName} di Karangasem, Bali.`;
    }

    document.title = title;

    const setMeta = (attr: string, val: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${val}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', imageUrl);

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('couple', selectedCouple);
    setMeta('property', 'og:url', shareUrl.toString());
    setMeta('property', 'og:type', 'website');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
  }, [selectedCouple, weddingState]);

  // ============================================================
  // FIREBASE REALTIME SUBSCRIPTIONS — admin edits → all guests
  // ============================================================
  useEffect(() => {
    seedDefaultDataIfNeeded();

    // Site settings (title, dates, monogram, themes, backgrounds, gift info, etc.)
    const unsubscribeSiteSettings = subscribeToSiteSettings((settings) => {
      setWeddingState((prev: any) => ({ ...prev, ...settings }));
    });

    // Couples (groom/bride info, akad/resepsi, gift, quote)
    const unsubscribeCouples = subscribeToCouples((couplesData) => {
      setWeddingState((prev: any) => ({
        ...prev,
        coupleA: couplesData.coupleA || prev.coupleA,
        coupleB: couplesData.coupleB || prev.coupleB
      }));
    });

    // Announcements — admin broadcasts to ALL guests instantly via onSnapshot
    const unsubscribeAnnouncements = subscribeToAnnouncements((list) => {
      setAnnouncements(list);
      // Auto-show NEW announcement as toast (only those we haven't seen)
      list.forEach((ann) => {
        if (ann && ann.id && !seenAnnouncementIds.has(ann.id)) {
          const isRecent = Date.now() - (ann.timestamp || 0) < 60000; // Only show if < 1min old
          if (isRecent) {
            setActiveNotification(ann);
            playChimeSound();
            // Trigger OS native notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              const senderLabel = ann.sender || 'Keluarga Besar';
              const audienceSuffix = ann.audience && ann.audience !== 'all' ? ` (untuk ${ann.audience === 'coupleA' ? 'Couple A' : ann.audience === 'coupleB' ? 'Couple B' : 'VIP'})` : '';
              try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: ann.title,
                    message: ann.message,
                    sender: senderLabel,
                    audience: ann.audience || 'all',
                    icon: '/images/BALI-ICON.webp'
                  });
                } else {
                  new Notification(`${senderLabel}: ${ann.title}${audienceSuffix}`, {
                    body: ann.message,
                    icon: '/images/BALI-ICON.webp'
                  });
                }
              } catch (e) {}
            }
            setTimeout(() => setActiveNotification(null), 12000);
          }
          setSeenAnnouncementIds((prev) => new Set(prev).add(ann.id));
        }
      });
    });

    return () => {
      unsubscribeSiteSettings();
      unsubscribeCouples();
      unsubscribeAnnouncements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // LIVE GUEST PRESENCE — heartbeat every 20s, expires after 60s
  // ============================================================
  const guestIdRef = useRef<string>('');
  useEffect(() => {
    // Generate a stable guest ID per browser session
    let id = sessionStorage.getItem('wedding_presence_id');
    if (!id) {
      id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('wedding_presence_id', id);
    }
    guestIdRef.current = id;

    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    const meta = {
      name: toParam ? toParam.replace(/\+/g, ' ') : 'Tamu Anonim',
      couple: selectedCouple
    };

    // Heartbeat immediately + every 20 seconds
    heartbeatPresence(id, meta);
    const interval = setInterval(() => heartbeatPresence(id, meta), 20000);

    // Subscribe to live presence count
    const unsubscribePresence = subscribeToPresence((count) => {
      setLiveGuestCount(count);
    });

    // Cleanup on unmount/tab close
    const handleBeforeUnload = () => {
      removePresence(id);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      unsubscribePresence();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence(id);
    };
  }, [selectedCouple]);

  // ============================================================
  // GUEST VISIT TRACKING (URL ?to=)
  // ============================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    if (toParam && weddingState && weddingState.guestList) {
      const guestNameClean = toParam.replace(/\+/g, ' ').trim();
      const guestList = [...(weddingState.guestList || [])];
      const guestIndex = guestList.findIndex(
        (g: any) => g.name.toLowerCase().trim() === guestNameClean.toLowerCase()
      );
      let updated = false;
      if (guestIndex !== -1) {
        const sessionKey = `visited_${guestNameClean}`;
        if (!sessionStorage.getItem(sessionKey)) {
          guestList[guestIndex].visits = (guestList[guestIndex].visits || 0) + 1;
          sessionStorage.setItem(sessionKey, 'true');
          updated = true;
        }
      } else {
        const sessionKey = `visited_${guestNameClean}`;
        if (!sessionStorage.getItem(sessionKey)) {
          const newGuest: { id: string; name: string; invitedCouple: 'both' | 'coupleA' | 'coupleB'; visits: number } = {
            id: `guest-${Math.random().toString(36).substring(2, 9)}`,
            name: guestNameClean,
            invitedCouple: params.get('couple') === 'coupleA' ? 'coupleA' : params.get('couple') === 'coupleB' ? 'coupleB' : 'both',
            visits: 1
          };
          guestList.push(newGuest);
          sessionStorage.setItem(sessionKey, 'true');
          updated = true;
        }
      }
      if (updated) {
        updateSiteSettingsInFirebase({ guestList })
          .catch(e => console.error("Failed to sync guest visit count:", e));
      }
    }
  }, [weddingState?.guestList]);

  // ============================================================
  // REAL-TIME BROADCAST NOTIFICATIONS (legacy localStorage bridge)
  // ============================================================
  useEffect(() => {
    let autoDismissTimer: any;

    const handlePushNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
        playChimeSound();
        if (autoDismissTimer) clearTimeout(autoDismissTimer);
        autoDismissTimer = setTimeout(() => setActiveNotification(null), 12000);
      }
    };

    window.addEventListener('wedding_push_notification', handlePushNotification);
    return () => {
      window.removeEventListener('wedding_push_notification', handlePushNotification);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, []);

  const getThemeAccents = () => {
    return {
      bg: 'from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]',
      accent: 'text-[#C5A059]',
      badge: 'bg-[#151515] text-[#C5A059] border-[#C5A059]/40',
      border: 'border-[#C5A059]/25',
      button: 'bg-gradient-to-r from-[#C5A059] to-[#E2C284] hover:from-[#b38e4b] hover:to-[#C5A059] text-black',
      card: 'bg-[#151515]/90 border-[#C5A059]/20'
    };
  };

  const handleShare = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('couple', selectedCouple);
    const finalUrl = shareUrl.toString();

    let shareTitle = 'Undangan Pernikahan Bersama Aria-Bella & Devan-Elina';
    let textMessage = `Kepada Yth. Bapak/Ibu/Saudara/i,

Dengan memohon rahmat dan ridho-Mu, kami sekeluarga mengundang Anda untuk menghadiri Acara Pernikahan Bersama (Joint Wedding) putra-putri kami:

1. Aria & Bella
2. Devan & Elina

Hari, Tanggal: ${weddingState.dateText || 'Minggu, 11 Oktober 2026'}
Lokasi: ${weddingState.commonVenue || 'Kediaman I Gede Julianto'}, Karangasem, Bali

Info detail jadwal, lokasi peta, galeri foto, & RSVP dapat diakses melalui link undangan berikut:
${finalUrl}

Merupakan kehormatan bagi kami jika Anda berkenan hadir dan memberikan doa restu. Terima kasih.`;

    if (selectedCouple === 'coupleA' && weddingState.coupleA) {
      shareTitle = `Undangan Pernikahan ${weddingState.coupleA.groom?.nickname} & ${weddingState.coupleA.bride?.nickname}`;
      textMessage = `Kepada Yth. Bapak/Ibu/Saudara/i,

Kami mengundang Anda untuk menghadiri Acara Pernikahan:
${weddingState.coupleA.groom?.fullName} & ${weddingState.coupleA.bride?.fullName}

Hari, Tanggal: ${weddingState.dateText}
Lokasi: ${weddingState.commonVenue}, Karangasem, Bali

Detail: ${finalUrl}

Merupakan kehormatan bagi kami jika Anda berkenan hadir. Terima kasih.`;
    } else if (selectedCouple === 'coupleB' && weddingState.coupleB) {
      shareTitle = `Undangan Pernikahan ${weddingState.coupleB.groom?.nickname} & ${weddingState.coupleB.bride?.nickname}`;
      textMessage = `Kepada Yth. Bapak/Ibu/Saudara/i,

Kami mengundang Anda untuk menghadiri Acara Pernikahan:
${weddingState.coupleB.groom?.fullName} & ${weddingState.coupleB.bride?.fullName}

Hari, Tanggal: ${weddingState.dateText}
Lokasi: ${weddingState.commonVenue}, Karangasem, Bali

Detail: ${finalUrl}

Merupakan kehormatan bagi kami jika Anda berkenan hadir. Terima kasih.`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: textMessage, url: finalUrl });
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(textMessage);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  const theme = getThemeAccents();
  const liveStatus = isLiveNow(weddingState, selectedCouple);
  // Honor the admin's streamingEnabled toggle (defaults to true when undefined
  // for backward compatibility with seeded data that doesn't have the field).
  const streamingEnabled = weddingState.streamingEnabled !== false;
  const streamingUrl = streamingEnabled ? weddingState.streamingUrl : '';

  // Maintenance mode → all guests see MaintenanceScreen in realtime
  if (weddingState.maintenanceMode && !isAdminLoggedIn) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MaintenanceScreen
          weddingState={weddingState}
          currentTheme={currentTheme}
          onAdminClick={() => setIsAdminOpen(true)}
        />
        <AnimatePresence>
          {isAdminOpen && (
            <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
          )}
        </AnimatePresence>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div id="wedding-app-root" className="min-h-screen relative overflow-x-hidden font-sans select-none antialiased selection:bg-[#C5A059]/20 selection:text-white">
        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="cover"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="fixed inset-0 z-50"
            >
              <Envelope onOpen={() => {
                setIsOpened(true);
                setIsPlaying(true);
              }} weddingData={weddingState} />
            </motion.div>
          ) : (
            <motion.div
              key="main-invitation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="min-h-screen theme-bg-gradient pb-24 relative"
            >
              {/* Falling Petals Canvas */}
              <PetalCanvas theme={currentTheme} />

              {/* Elegant Double Decorative Gold Borders */}
              <div className="fixed inset-3 md:inset-6 border border-gold/25 pointer-events-none z-40" />
              <div className="fixed inset-4.5 md:inset-8 border border-gold/10 pointer-events-none z-40" />

              {/* TOP-RIGHT: Live Guest Counter + Language Toggle */}
              <div className="fixed top-3 right-3 md:top-4 md:right-4 z-45 flex items-center space-x-2">
                {/* Live Guest Counter */}
                <div
                  className="flex items-center space-x-1.5 py-1.5 px-3 rounded-full bg-[#151515]/90 backdrop-blur-md border border-[#C5A059]/30 shadow-lg"
                  title={`${liveGuestCount} tamu sedang melihat undangan ini sekarang`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="font-mono text-[10px] font-bold text-[#F5F5F5]">{liveGuestCount}</span>
                  <span className="hidden sm:inline text-[9px] text-gray-400 font-mono uppercase">Live</span>
                </div>

                {/* Language Toggle */}
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                  className="flex items-center space-x-1 py-1.5 px-2.5 rounded-full bg-[#151515]/90 backdrop-blur-md border border-[#C5A059]/30 shadow-lg hover:bg-[#C5A059] hover:text-black transition-all cursor-pointer"
                  title="Switch language"
                >
                  <Languages className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="font-mono text-[10px] font-bold uppercase">{language === 'id' ? 'ID' : 'EN'}</span>
                </button>
              </div>

              {/* LIVE-NOW BANNER */}
              <AnimatePresence>
                {liveStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-45"
                  >
                    <a
                      href={streamingUrl || '#'}
                      target={streamingUrl ? '_blank' : undefined}
                      rel={streamingUrl ? 'noreferrer' : undefined}
                      className={`flex items-center space-x-2 py-2 px-4 rounded-full bg-gradient-to-r from-red-700 to-rose-600 text-white shadow-2xl border border-red-300/30 ${streamingUrl ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
                        LIVE NOW: {liveStatus.event} {liveStatus.couple === 'coupleA' ? 'Aria & Bella' : 'Devan & Elina'}
                      </span>
                      {streamingUrl && <span className="text-[10px] font-mono underline">Watch</span>}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HERO */}
              <header id="main-hero" className="relative pt-16 pb-12 px-4 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
                <AnimatedHeroBackground customBgUrl={weddingState.bgCoverUrl} />

                {/* Delicate top ribbon ornament */}
                <div className="flex items-center space-x-1 mb-6 text-[#C5A059]/60 relative z-10">
                  <Sparkles className="w-3 h-3" />
                  <span className="h-[1px] w-12 bg-[#C5A059]/30" />
                  <Heart className="w-4 h-4 fill-[#C5A059]/10 text-[#C5A059]/60" />
                  <span className="h-[1px] w-12 bg-[#C5A059]/30" />
                  <Sparkles className="w-3 h-3" />
                </div>

                <span className="font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-[#C5A059] font-semibold mb-3 relative z-10">
                  WALIMATUL 'URSY
                </span>

                {/* Monogram Badge — BALI-ICON with soft gold glow + ring animation */}
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-6 z-10"
                >
                  <div className="absolute -inset-3 rounded-full bg-[#C5A059]/20 blur-xl animate-pulse" />
                  <div className="absolute -inset-1 rounded-full border border-dashed border-[#C5A059]/40 animate-[spin_14s_linear_infinite]" />
                  <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#0A0A0A] border-2 border-[#C5A059]/60 flex items-center justify-center overflow-hidden shadow-2xl">
                    {weddingState.logoUrl ? (
                      <img
                        src={weddingState.logoUrl}
                        alt="Wedding Logo"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="font-display text-base font-bold text-[#C5A059] tracking-widest">
                        {weddingState.monogramText || "ABDE"}
                      </span>
                    )}
                  </div>
                </motion.div>

                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-widest text-[#F5F5F5] leading-tight relative z-10">
                  THE JOINT WEDDING
                </h1>

                <div className="my-6 space-y-2 relative z-10">
                  <h2 className="font-script text-5xl md:text-6xl text-[#C5A059] leading-none">
                    {weddingState.coupleA?.groom?.nickname || "Aria"} & {weddingState.coupleA?.bride?.nickname || "Bella"}
                  </h2>
                  <p className="font-serif text-xs text-gray-500 italic">dan</p>
                  <h2 className="font-script text-5xl md:text-6xl text-[#C5A059] leading-none">
                    {weddingState.coupleB?.groom?.nickname || "Devan"} & {weddingState.coupleB?.bride?.nickname || "Elina"}
                  </h2>
                </div>

                <div className="flex items-center justify-center space-x-1.5 py-1.5 px-4 rounded-full bg-[#151515] border border-[#C5A059]/30 shadow-xl relative z-10">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="font-serif text-xs text-[#F5F5F5] font-semibold">
                    {weddingState.dateText}
                  </span>
                </div>

                {/* Streaming Watch-Live button (only if URL set) */}
                {streamingUrl && (
                  <a
                    href={streamingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center space-x-2 py-2 px-5 rounded-full bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white text-xs font-bold tracking-wider shadow-xl hover:scale-105 transition-all relative z-10"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>TONTON LIVE STREAMING</span>
                  </a>
                )}
              </header>

              {/* DUAL COUNTDOWN — per couple akad & resepsi (the global Countdown
                  component has been removed by request; only the two per-couple
                  cards remain below) */}
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="py-8 px-4 max-w-5xl mx-auto"
              >
                <div className="text-center mb-6">
                  <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
                    {language === 'id' ? 'Hitung Mundur Per Pasangan' : 'Per-Couple Countdown'}
                  </span>
                  <h3 className="font-serif text-lg md:text-xl font-semibold text-[#F5F5F5]">
                    {language === 'id' ? 'Menuju Setiap Prosesi Suci' : 'Counting Down to Each Sacred Ceremony'}
                  </h3>
                </div>
                <div className={`grid grid-cols-1 ${selectedCouple === 'both' ? 'lg:grid-cols-2' : ''} gap-4`}>
                  {(selectedCouple === 'both' || selectedCouple === 'coupleA') && weddingState.coupleA && (
                    <CoupleCountdownCard
                      couple="coupleA"
                      coupleName="Aria & Bella"
                      targetDate={weddingState.coupleA.akad.date}
                      timeLabel={`Akad • ${weddingState.coupleA.akad.time}`}
                      eventType="akad"
                    />
                  )}
                  {(selectedCouple === 'both' || selectedCouple === 'coupleB') && weddingState.coupleB && (
                    <CoupleCountdownCard
                      couple="coupleB"
                      coupleName="Devan & Elina"
                      targetDate={weddingState.coupleB.akad.date}
                      timeLabel={`Akad • ${weddingState.coupleB.akad.time}`}
                      eventType="akad"
                    />
                  )}
                </div>
              </motion.section>

              {/* COUPLE SWITCHER */}
              <CoupleSwitcher
                selectedCouple={selectedCouple}
                setSelectedCouple={setSelectedCouple}
              />

              {/* MAIN SECTIONS */}
              <main className="space-y-16 max-w-6xl mx-auto px-4">

                {/* SECTION: INTRO & SUMPAH SUCI */}
                <motion.section
                  id="intro-quran-verse"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="py-6 text-center max-w-xl mx-auto space-y-4"
                >
                  <p className="text-xs md:text-sm text-[#E5E5E5]/90 leading-relaxed font-sans italic">
                    &ldquo;Maha suci Allah yang telah menciptakan mahluk-Nya berpasang-pasangan, baik apa yang ditumbuhkan oleh bumi, diri mereka sendiri, maupun apa yang mereka tidak ketahui.&rdquo;
                  </p>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-[#C5A059]">
                    — Q.S. Yasin: 36
                  </span>
                </motion.section>

                {/* SECTION: COUPLE PROFILES */}
                <section id="mempelai-profiles">
                  <CoupleSection selectedCouple={selectedCouple} weddingData={weddingState} />
                </section>

                {/* SECTION: EVENTS SCHEDULE & LOCATION */}
                <section id="jadwal-acara">
                  <ScheduleSection selectedCouple={selectedCouple} weddingData={weddingState} />
                </section>

                {/* NOTIFICATION PROMPT */}
                <section id="notifikasi-prompt">
                  <NotificationPrompt />
                </section>

                {/* TIMELINE RUNDOWN */}
                <section id="rundown-acara">
                  <TimelineRundown selectedCouple={selectedCouple} weddingData={weddingState} />
                </section>

                {/* GALERI FOTO */}
                <section id="galeri-wedding">
                  <GallerySection />
                </section>

                {/* AMPLOP DIGITAL */}
                <section id="amplop-digital">
                  <GiftSection selectedCouple={selectedCouple} weddingData={weddingState} />
                </section>

                {/* RSVP */}
                <section id="konfirmasi-rsvp" className="pt-4">
                  <RSVPForm />
                </section>

                {/* GUESTBOOK */}
                <section id="guestbook-ucapan">
                  <Guestbook />
                </section>

                {/* DRESS CODE / ADDITIONAL INFO */}
                <motion.section
                  id="additional-info"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-xl mx-auto p-6 rounded-2xl border bg-card/90 border-gold/20 text-center space-y-3.5 shadow-2xl"
                >
                  <h4 className="font-serif text-sm font-bold text-[#C5A059] uppercase tracking-wider">
                    Informasi Tambahan
                  </h4>
                  <p className="text-xs text-[#E5E5E5]/80 leading-relaxed">
                    Bagi para tamu undangan, dihimbau untuk mengenakan pakaian yang rapi, bersih, dan sesuai dengan anjuran <strong>Dress Code</strong> demi keindahan dokumentasi bersama.
                  </p>
                  <p className="text-[11px] text-[#C5A059]/70 font-mono italic">
                    Dress Code: Batik Modern / Pakaian Formal Sopan.
                  </p>
                </motion.section>
              </main>

              {/* FOOTER */}
              <footer id="wedding-footer" className="mt-20 pt-12 pb-6 border-t border-[#C5A059]/20 text-center space-y-6 relative">
                {/* Elegant gold hairline ornament (replaces the old Bali motif) */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 flex items-center justify-center" aria-hidden="true">
                  <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
                  <span className="mx-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]/70 shadow-[0_0_8px_rgba(197,160,89,0.6)]" />
                  <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
                </div>

                <div className="flex flex-col items-center justify-center space-y-2">
                  {weddingState.logoUrl ? (
                    <img
                      src={weddingState.logoUrl}
                      alt="Wedding Logo"
                      className="max-w-[100px] max-h-[50px] object-contain mb-1 bg-transparent"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="font-display text-lg tracking-wider text-[#C5A059] font-semibold">
                      {weddingState.monogramText || "ABDE"}
                    </span>
                  )}
                  <p className="text-xs text-[#E5E5E5]/80 max-w-xs leading-relaxed italic px-4">
                    {weddingState.footerThankYou || "Ungkapan terima kasih yang tulus dari lubuk hati kami atas kehadiran serta doa restu yang Anda berikan"}
                    <span
                      className="cursor-default hover:text-[#C5A059] transition-all"
                      onClick={() => setIsAdminOpen(true)}
                    >.</span>
                  </p>
                </div>

                <div className="text-[10px] text-gray-500 font-mono space-y-1">
                  <p>© 2026 {weddingState.coupleA?.groom?.nickname || "Aria"}, {weddingState.coupleA?.bride?.nickname || "Bella"}, {weddingState.coupleB?.groom?.nickname || "Devan"} & {weddingState.coupleB?.bride?.nickname || "Elina"}. All Rights Reserved.</p>
                  <p>Designed with love for our special joint celebration.</p>
                </div>

                {/* Admin Panel Trigger */}
                <div className="pt-4 flex justify-center">
                  <button
                    id="btn-trigger-admin-access"
                    onClick={() => setIsAdminOpen(true)}
                    className="inline-flex items-center space-x-1.5 py-1.5 px-3.5 rounded-full border border-[#C5A059]/20 bg-[#151515] hover:bg-[#C5A059] text-[#C5A059] hover:text-black text-[10px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-md hover:scale-105"
                    title="Akses Sistem Manajemen"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Akses Administrator</span>
                  </button>
                </div>
              </footer>

              {/* FLOATING DOCK */}
              <FloatingDock
                currentTheme={currentTheme}
                onChangeTheme={setCurrentTheme}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                bgMusicUrl={weddingState.bgMusicUrl}
                bgMusicTitle={weddingState.bgMusicTitle}
                selectedCouple={selectedCouple}
              />

              {/* PWA INSTALL PROMPT (deferred, Bali-themed) */}
              <PwaInstallPrompt />

              {/* ADMIN PANEL DRAWER */}
              <AnimatePresence>
                {isAdminOpen && (
                  <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
                )}
              </AnimatePresence>

              {/* REAL-TIME ANNOUNCEMENT TOAST */}
              <AnimatePresence>
                {activeNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.95 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-[120] w-[90%] max-w-md bg-[#151515]/95 border-2 border-[#C5A059] rounded-2xl shadow-[0_15px_60px_rgba(197,160,89,0.35)] p-4 flex items-start space-x-3.5"
                  >
                    <div className="p-2 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] animate-bounce flex-shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase font-bold">
                          {activeNotification.title}
                        </span>
                        <button
                          onClick={() => setActiveNotification(null)}
                          className="text-gray-500 hover:text-white transition-all text-[11px] font-bold p-0.5 cursor-pointer"
                          aria-label="Close announcement"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sender + audience badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40">
                          <User className="w-3 h-3" />
                          <span>{activeNotification.sender || 'Keluarga Besar'}</span>
                        </span>
                        {activeNotification.audience && activeNotification.audience !== 'all' && (
                          <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                            untuk {activeNotification.audience === 'coupleA' ? 'Couple A' : activeNotification.audience === 'coupleB' ? 'Couple B' : 'VIP'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#F5F5F5] font-sans leading-relaxed">
                        {activeNotification.message}
                      </p>
                      {activeNotification.link && (
                        <a
                          href={activeNotification.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[10px] text-[#C5A059] underline mt-1"
                        >
                          Buka tautan →
                        </a>
                      )}
                      <span className="block text-[9px] text-gray-500 font-mono pt-1">
                        Disiarkan oleh {activeNotification.sender || 'Keluarga Besar'} • Baru saja
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COPIED TOAST */}
              <AnimatePresence>
                {copiedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] py-2 px-4 rounded-full bg-[#C5A059] text-black text-xs font-bold tracking-wider shadow-2xl"
                  >
                    ✓ Tautan tersalin!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Suspense>
  );
}
